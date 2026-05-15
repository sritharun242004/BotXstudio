# Hybrid Editorial — Image Generation Pipeline

**Model ID:** `hybrid-editorial`  
**Providers:** Google (Gemini 2.5 Flash Image) + OpenAI (GPT Image 2 via fal.ai)  
**Total API calls per full generation:** 3 (1 Gemini + 2 GPT in parallel)

---

## Overview

```
User uploads
 garment photo ──┐
 model photo   ──┤──► STEP 1: Gemini 2.5 Flash ──► Main Image
 pose photo    ──┤          (1 API call)                │
 background    ──┘                                      │
                                                        ▼
                                           ┌────────────────────────┐
                                           │   STEP 2: GPT Image 2  │
                                           │   (2 parallel calls)   │
                                           │                        │
                                           │  Back View  │  Detail  │
                                           └────────────────────────┘
```

---

## Step 1 — Primary Image (Gemini 2.5 Flash Image)

**Function:** `generateHybridPrimaryImage()` in `src/lib/hybrid-pipeline.ts`  
**Backend:** `POST /api/generate/image` → `server/src/services/gemini.service.ts`  
**API endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`

### What happens

1. User inputs are collected: garment photo, model photo (optional), pose photo (optional), background photo (optional).
2. A single composite prompt is built by `buildDirectCompositePrompt()` → routes to `buildFlashDirectCompositePrompt()` because `gemini-2.5-flash-image` is a Flash model.
3. The raw garment photo is sent directly as **IMAGE 1** — no intermediate garment-reference generation step. This preserves exact garment colors, prints, and design details without AI reinterpretation.
4. One `generateImage()` call is made to the backend with all images + prompt.

### Image order sent to Gemini

| Position | Image | Always sent |
|----------|-------|-------------|
| IMAGE 1 | Raw garment photo (source of truth) | Yes |
| IMAGE 2 | Pose reference photo | Only if uploaded |
| IMAGE 3 | Model reference photo | Only if uploaded |
| IMAGE 4 | Background reference photo | Only if uploaded |

> Flash has recency bias — the model photo is placed last among human-containing images so its face dominates the output identity.

### API payload

```json
{
  "contents": [{ "role": "user", "parts": [
    { "text": "<composite prompt>" },
    { "inlineData": { "mimeType": "image/jpeg", "data": "<garment base64>" } },
    { "inlineData": { "mimeType": "image/jpeg", "data": "<pose base64>" } },
    { "inlineData": { "mimeType": "image/jpeg", "data": "<model base64>" } },
    { "inlineData": { "mimeType": "image/jpeg", "data": "<background base64>" } }
  ]}],
  "generationConfig": {
    "temperature": 0.1,
    "responseModalities": ["IMAGE"],
    "imageConfig": { "aspectRatio": "3:4" }
  }
}
```

> `responseModalities: ["IMAGE"]` is required for Flash models. Adding `"TEXT"` causes `IMAGE_OTHER` finish reason.  
> `imageConfig.width` and `imageConfig.height` are NOT sent — they cause `IMAGE_OTHER` on the standard API. Only `aspectRatio` is valid.

### Retry logic

If Gemini returns `IMAGE_OTHER` (HTTP 200 but no image), the service retries up to **2 times** with delays of 3s and 6s before throwing. Other finish reasons (`SAFETY`, `MAX_TOKENS`) throw immediately.

### Output

- `compositeDataUrl` — the main fashion image (base64 data URL, 3:4 portrait)
- `compositeMimeType` — `image/png` or `image/jpeg`
- `garmentRefDataUrl` — set to the raw garment photo (used only for the multi-angle null-check; not re-sent to GPT)

---

## Step 2 — Multi-Angle Images (GPT Image 2)

**Function:** `generateHybridMultiAngleImages()` in `src/lib/hybrid-pipeline.ts`  
**Backend:** `POST /api/openai/image` → `server/src/services/openai/gpt-image.service.ts`  
**API:** `https://fal.run/openai/gpt-image-2` (via fal.ai)

### What happens

1. The Gemini composite output (Step 1 result) is passed as the **sole reference image** to GPT Image 2.
2. Two prompts are built by `buildGptMultiAnglePrompt()` — one for back view, one for detail shot.
3. Both GPT calls run **in parallel** via `Promise.allSettled` — if one fails, the other still completes.
4. GPT Image 2 never sees the raw garment, model, pose, or background photos. Only the already-rendered Gemini output is sent. This prevents concept blending and identity drift.

### Why only the Gemini output is sent to GPT

GPT Image 2 is a multimodal reasoning model. Sending raw garment/pose/model photos as additional inputs causes:
- Concept blending (mixing garment details from different images)
- Identity drift (face changes between shots)
- Outfit hallucination (inventing garment details not in the original)

By receiving only the fully-composed Gemini output, GPT's model identity, garment, and scene are already locked — GPT only transforms the viewing angle.

### Back view prompt structure

```
The provided reference image shows [model description] styled with [garment/styling],
photographed in a [background].
The garment and model identity in the reference are the SOURCE OF TRUTH —
reproduce them exactly: same colors, fabric texture, print, silhouette, and model appearance.
Generate the BACK VIEW of this exact scene — full body, head to toe, rear-facing.
Show the rear construction of the garment clearly: back panel, fabric texture, neckline back,
hemline, and any back-side design details.
Maintain the same [background] background and studio lighting as the reference.
Premium ecommerce fashion photography. Photorealistic. Sharp full-body framing.
```

### Detail shot prompt structure

```
The provided reference image shows [model description] styled with [garment/styling],
photographed in a [background].
The garment and model identity in the reference are the SOURCE OF TRUTH —
reproduce them exactly: same colors, fabric texture, print, silhouette, and model appearance.
Generate an upper-body DETAIL SHOT of this exact garment on the same model — chest-to-waist crop.
Emphasise fabric texture, print detail, neckline construction, seam quality, and pattern repeat.
Sharp garment focus throughout the frame.
Same [background] background and studio lighting as the reference.
Premium ecommerce fashion photography. Photorealistic.
```

### API payload (per call)

```json
{
  "promptText": "<back or detail prompt>",
  "images": [{ "mimeType": "image/png", "data": "<Gemini composite base64>" }],
  "quality": "medium",
  "size": "1024x1536"
}
```

### Output sizes by generation tier

| Tier | GPT quality | Output size |
|------|-------------|-------------|
| Fast Draft | `low` | `1024x1024` |
| Standard Studio | `medium` | `1024x1536` |
| Premium Editorial | `high` | `1024x1536` |

### Retry logic (fal.ai)

HTTP 429 and 503 errors retry up to **3 times** with exponential backoff (2s, 4s, 8s). Async queue responses (HTTP 202) are polled until complete.

---

## Data flow summary

```
STEP 1 — Gemini 2.5 Flash Image
─────────────────────────────────────────────────────────────────────
Input:   garment[0] + pose? + model? + background? + composite prompt
Config:  temperature=0.1, aspectRatio="3:4", responseModalities=["IMAGE"]
Output:  compositeDataUrl (3:4 portrait)
Cost:    ~₹2 (standard tier)
Time:    ~25–40s

         compositeDataUrl
              │
              ▼
STEP 2 — GPT Image 2 (parallel, 2 calls)
─────────────────────────────────────────────────────────────────────
Input:   compositeDataUrl (only) + back/detail prompt
Config:  quality=medium, size=1024x1536
Output:  backDataUrl + detailDataUrl (both 1024x1536 portrait)
Cost:    ~₹2 per image × 2 = ~₹4
Time:    ~30–60s (parallel)
```

---

## Key design decisions

| Decision | Reason |
|----------|--------|
| Single Gemini call (no garment-reference pre-pass) | Garment-reference pre-pass re-renders garment through AI, drifting colors and prints. Raw photo as IMAGE 1 preserves exact garment. |
| GPT receives only Gemini output, not raw inputs | Prevents concept blending and identity drift across angles. |
| `Promise.allSettled` for GPT parallel calls | Back view failure does not cancel detail shot. Both are attempted independently. |
| `responseModalities: ["IMAGE"]` only for Flash | Adding "TEXT" causes `IMAGE_OTHER` finish reason on Flash models. |
| No `width`/`height` in `imageConfig` | Standard Gemini API only supports `aspectRatio`. Sending pixel dimensions causes `IMAGE_OTHER`. |

---

## Files involved

| File | Role |
|------|------|
| `src/lib/hybrid-pipeline.ts` | Orchestration — primary + multi-angle functions |
| `src/lib/pipeline.ts` | `buildDirectCompositePrompt()` / `buildFlashDirectCompositePrompt()` |
| `src/lib/gpt-pipeline.ts` | `buildGptMultiAnglePrompt()` / `generateGptMultiAngleImages()` |
| `src/lib/gemini.ts` | Client-side proxy → `POST /api/generate/image` |
| `src/lib/gpt-image.ts` | Client-side proxy → `POST /api/openai/image` |
| `server/src/services/gemini.service.ts` | Gemini API call, IMAGE_OTHER retry logic |
| `server/src/services/openai/gpt-image.service.ts` | GPT Image 2 via fal.ai, CDN upload, queue polling |
| `server/src/controllers/openai.controller.ts` | Credit deduction, logging for GPT calls |
| `src/lib/generationTiers.ts` | Quality/size config per tier (fast_draft / standard_studio / premium_editorial) |
| `src/App.tsx` | Calls `generateHybridPrimaryImage()` then `generateHybridMultiAngleImages()` |
