# Image Generation Pipeline

BotXstudio fashion image generation — three fully isolated providers, each with distinct reference-handling logic, prompt architecture, and API routing.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [User Flow — Step by Step](#2-user-flow--step-by-step)
3. [Reference Role System](#3-reference-role-system)
4. [Quality Tier System](#4-quality-tier-system)
5. [Pipeline A — Gemini](#5-pipeline-a--gemini)
6. [Pipeline B — FLUX Kontext Pro](#6-pipeline-b--flux-kontext-pro)
7. [Pipeline C — GPT Image 2](#7-pipeline-c--gpt-image-2)
8. [Multi-Angle Generation](#8-multi-angle-generation)
9. [Retry Flow](#9-retry-flow)
10. [API Route Map](#10-api-route-map)

---

## 1. Architecture Overview

```
User uploads references
        │
        ▼
┌───────────────────────────────────────────────┐
│              Storyboard Config                │
│  imageModel · generationTier · occasion       │
│  model gender/ethnicity/age · pose · styling  │
│  bottomWear · footwear · accessories · bg     │
└───────────────────────────────────────────────┘
        │
        ├─── imageModel = "gemini-*"          → Pipeline A: Gemini
        ├─── imageModel = "fal-ai/flux-pro/kontext" → Pipeline B: FLUX Kontext Pro
        └─── imageModel = "gpt-image-2"       → Pipeline C: GPT Image 2
```

All three pipelines share the same **input surface** (storyboard config + uploaded images) and produce the same **output shape** (compositeDataUrl, multi-angle DataUrls). They are completely isolated — no shared service calls, no shared prompt builders.

---

## 2. User Flow — Step by Step

### Step 1 — Create / select mood board
User opens the mood board editor. Each mood board stores a `StoryboardConfig` (model settings, style settings, tier choice, selected model ID).

### Step 2 — Upload reference images

| Slot | Field | Max count | Required |
|------|-------|-----------|----------|
| Garment | `garmentDataUrls` | 3 | **Yes** |
| Model | `modelDataUrls` | 1 | No |
| Pose | `poseDataUrls` | 1 | No |
| Background | `backgroundDataUrls` | 1 | No |

> Garment images should be front / back / side views of the same item.
> Multiple garment angles help Gemini's garment-ref step; FLUX and GPT use only the first.

### Step 3 — Configure settings

**Model tab** — gender, ethnicity, age range, custom prompt  
**Style tab** — occasion, style keywords, bottom wear, footwear, accessories  
**Background tab** — background theme preset or custom  
**Pose tab** — pose preset or custom text  
**Advanced Settings** — generation quality tier (Fast Draft / Standard Studio / Premium Editorial)

### Step 4 — Select provider

Choose the image generation model card:
- **Gemini 2.5 Flash** — fast, eco, template-based
- **Gemini 3 Pro** — high quality, full custom controls
- **FLUX Kontext Pro** — fashion-optimised, consistent angles
- **GPT Image 2** — luxury editorial, premium

### Step 5 — Generate

Click **Generate Scene**. Progress shows:
1. Validating inputs
2. Building garment reference *(Gemini only)*
3. Compositing look
4. Done

### Step 6 — Multi-angle (optional)

Click **Generate Multi-Angle** to produce back-view + detail shot from the primary result.

### Step 7 — Retry (optional)

If the output has issues, type a correction comment (e.g. "wrong neckline, make it round neck") and click Retry. The correction is prepended to the prompt.

### Step 8 — Save / export

Images auto-save to the library. Download individual images or the full lookbook.

---

## 3. Reference Role System

Each provider assigns uploaded images strictly different roles:

| Reference | Gemini | FLUX Kontext Pro | GPT Image 2 |
|-----------|--------|------------------|-------------|
| Garment image | API image (garment-ref step + composite) | API `image_url` (sole input) | API image (sole input — 1st only) |
| Model image | API image (composite only) | Text description only | Text description only |
| Pose image | API image (composite only) | Text description only | Excluded entirely |
| Background image | API image (composite only) | Text description only | Text description only |
| Detail images | — | — | **Excluded entirely** |

**Critical rules:**
- FLUX Kontext accepts only **one** `image_url` → garment always takes that slot
- GPT Image 2 sends **only the primary garment image** — additional references cause concept blending in multimodal models
- For multi-angle, all three providers use **only the rendered primary result** as reference, not the original uploads

---

## 4. Quality Tier System

Three tiers configurable per mood board. Each tier maps to provider-native parameters.

### Fast Draft (~₹0.5 / ~20s)
Quick previews, draft iterations.

| Provider | Setting |
|----------|---------|
| Gemini | 1024×768, temp 0.3, no quality boost |
| FLUX | aspect 4:3, no quality boost |
| GPT Image 2 | quality `low`, size `square_hd` (1024×1024) |

### Standard Studio (~₹4 / ~45s) *(default)*
Ecommerce fashion, lookbooks.

| Provider | Setting |
|----------|---------|
| Gemini | 1024×1536, temp 0.1, quality boost: "high quality ecommerce photography, sharp focus" |
| FLUX | aspect 3:4, no quality boost |
| GPT Image 2 | quality `medium`, size `portrait_4_3` (1024×1536) |

### Premium Editorial (~₹16 / ~90s)
Luxury campaigns, maximum detail.

| Provider | Setting |
|----------|---------|
| Gemini | 1024×1536, temp 0, quality boost: "ultra high quality, maximum sharpness, professional editorial photography, pristine fabric detail" |
| FLUX | aspect 3:4, quality boost: "ultra-sharp detail, pristine fabric texture, luxury editorial photography, flawless professional studio lighting, maximum photorealism" |
| GPT Image 2 | quality `high`, size `portrait_4_3` (1024×1536) |

---

## 5. Pipeline A — Gemini

### Overview

Two-step pipeline with a dedicated garment-reference generation step.

```
garmentImages (1–3)
      │
      ▼  [Step 1 — garment-ref]
  generateImage(garment_ref_prompt, garmentImages)
      │
      ▼  garmentRefImage (normalised garment render)
      │
      + modelImage (optional)
      + poseImages (optional)
      + backgroundImage (optional)
      ▼  [Step 2 — composite]
  generateImage(composite_prompt, [garmentRef, model?, pose?, background?])
      │
      ▼  compositeDataUrl
```

### Step 1 — Garment Reference Prompt

**File:** `src/lib/pipeline.ts` → `buildGarmentReferencePrompt()`

**Purpose:** Normalise the raw garment photo(s) into a clean, front-facing product render that removes background noise and shooting inconsistencies.

**Gemini Flash prompt:**
```
You are a professional garment-reference image creator for ecommerce.
Input: 1–3 photos of the SAME garment item (different angles/views).
Task: Generate a clean, flat-lay-style or ghost-mannequin-style reference image.

RULES (non-negotiable):
1. GARMENT ONLY — no model body, no background objects, no props.
2. Preserve EXACTLY: colour(s), print/pattern, all graphic elements, logos, embroidery, neckline, sleeve length/style, hem length/shape, pockets, buttons, zips, seams, fabric texture/weight.
3. Front-facing, slightly angled if needed to show depth — full garment visible from collar to hem.
4. Clean white or very light neutral background.
5. Sharp, well-lit, product-photography quality.
6. Do NOT alter the garment design in any way.
7. REJECT any output that crops the garment, shows a body, or changes the design.
```

**Gemini Pro prompt:** Same structure with additional reinforcement for style-guide violations.

### Step 2 — Composite Prompt

**File:** `src/lib/pipeline.ts` → `buildDirectCompositePrompt()`

**Assembles these blocks in order:**

```
[HARD FRAMING RULE]
Full-body head-to-toe · 3:4 portrait · 1080×1440px · model fills 80-85% frame height

[GARMENT FIDELITY RULE]
Match garment reference exactly: silhouette, neckline, sleeves, hem, print/pattern,
logos/graphics, seams, fabric texture. Do not add extra fabric or layers.

[MODEL BLOCK]
If modelImage uploaded:
  → "matching the MODEL PHOTO identity exactly"
Else:
  → "{ethnicity} female/male professional fashion model, age {range}"

[GARMENT INSTRUCTION]
"Wearing EXACTLY the garment from the GARMENT REFERENCE"

[STYLING BLOCK — only non-empty fields]
occasion: {value}
footwear: {value}
accessories: {list}
style: {keywords}
bottom: {value}

[POSE]
If config.modelPose set:
  → "Pose: {modelPose}"
Elif poseImages uploaded:
  → "Pose: {pose description from config or default ecommerce pose}"
Else:
  → "front-facing hero pose, relaxed natural stance"

[STYLING NOTES]
{modelStylingNotes if set}

[BACKGROUND]
If backgroundImage uploaded:
  → "Background: use BACKGROUND PHOTO as-is"
Elif config.backgroundTheme set:
  → "Background: {backgroundTheme}"
Else:
  → "clean neutral studio background, soft diffused daylight"

[QUALITY BOOST]
{tier.gemini.qualityBoost if non-empty}

[GLOBAL AVOID]
"cropped head, cropped feet, cut off shoes, out-of-frame limbs, close-up portrait,
half-body, extra people, deformed hands, blur, text overlay, watermark, extra fabric,
added clothing layers, jacket, coat, cardigan, CGI/cartoon look, child, minor"
```

**Flash-specific additions:**
- Numbered section headers (`## 1. SUBJECT`, `## 2. GARMENT`, etc.)
- `REJECT IF:` conditions after each critical block
- Repeated critical constraints at the end

### Example Composite Prompt (Gemini Flash, Standard Studio)

```
## MANDATORY OUTPUT RULES
Full-body head-to-toe portrait, 3:4 aspect ratio, 1080×1440 px target.
Model must fill approximately 80-85% of the frame height.
HARD RULE: do not crop any body part — entire head and both feet must be visible.
REJECT any output where head or feet are cut off.

## 1. SUBJECT
Indian female professional fashion model, age 20-22.

## 2. GARMENT (SOURCE OF TRUTH)
The model is wearing EXACTLY the garment from the GARMENT REFERENCE photo.
Preserve without exception: colour, print/pattern, silhouette, neckline, sleeve style,
hem length, logos/graphics, seams, fabric texture, and every visible construction detail.
REJECT any output where the garment differs from the reference.

## 3. STYLING
occasion: everyday casual daytime street style; modern ecommerce look; clean natural daylight
footwear: white_sneakers
accessories: studs
style: minimal clean modern styling; premium basics; crisp lines

## 4. POSE
front-facing hero pose, relaxed natural stance

## 5. BACKGROUND
clean neutral studio background, soft diffused daylight

## 6. QUALITY
high quality ecommerce photography, sharp focus

## 7. AVOID
cropped head, cropped feet, cut off shoes, extra people, deformed hands, blur,
watermark, text overlay, extra fabric, added layers, CGI look
```

### Images sent to Gemini composite call

```
[garmentRefImage]                 // always — normalised garment render from step 1
[modelImage]                      // if uploaded
[poseImages[0]]                   // first pose only (to reduce token cost)
[backgroundImage]                 // if uploaded
```

---

## 6. Pipeline B — FLUX Kontext Pro

### Overview

Single-step pipeline. Garment photo is the **only** API image input. Everything else is text.

```
garmentImages[0..n]
      │  (uploaded to fal.ai CDN → image_url, or data URI fallback)
      ▼
  fal.run/fal-ai/flux-pro/kontext
  { prompt, image_url, aspect_ratio, n:1, output_format:"jpeg" }
      │
      ▼  returns: images[0].url
      │  (downloaded as base64)
      ▼
  compositeDataUrl
```

### Why only one image

fal.ai FLUX Kontext Pro accepts a single `image_url` field. It edits that reference image toward the prompt. The garment photo always fills this slot. Model identity, pose, and background are described via text.

### Primary Prompt Structure

**File:** `src/lib/flux-pipeline.ts` → `buildFluxCompositePrompt()`

Comma-separated clause list (FLUX performs best with concise token-dense prompts):

```
[RETRY CORRECTION — if retry]
CORRECTION: {retryComment}

[MODEL SUBJECT]
{ethnicity} {gender} professional fashion model age {range}

[GARMENT ANCHOR]
wearing the exact garment shown in the reference image — preserve every design detail:
color, print, pattern, silhouette, neckline, hem, sleeves, fabric texture, logos

[OUTFIT DETAILS — only non-empty]
bottom: {value}, footwear: {value}, accessories: {list},
style: {keywords}, occasion: {value}

[POSE]
If config.modelPose:     "pose: {value}"
Elif poseRef uploaded:   "confident ecommerce pose, natural weight-shift, slight 3/4 turn toward camera, front view"
Else:                    "confident ecommerce pose, front view"

[STYLING NOTES]
{modelStylingNotes}

[BACKGROUND]
If config.backgroundTheme:    "background: {value}"
Elif backgroundRef uploaded:  "lifestyle editorial background, natural daylight, soft shadows"
Else:                         "clean neutral studio background, soft diffused daylight"

[FRAMING]
full body head to toe, small margin above head and below feet, no cropping

[QUALITY]
luxury fashion photography, cinematic studio lighting, ultra-sharp detail,
photorealistic fabric texture, premium ecommerce lookbook quality
{qualityBoost if set}

[AVOID]
avoid: cropped head, cropped feet, extra people, deformed hands, blur, watermark,
text overlay, extra garment layers, wrong garment design
```

### Example Primary Prompt (FLUX, Standard Studio)

```
Indian female professional fashion model age 20-25,
wearing the exact garment shown in the reference image — preserve every design detail:
color, print, pattern, silhouette, neckline, hem, sleeves, fabric texture, logos,
occasion: everyday casual daytime street style,
footwear: white_sneakers,
accessories: studs,
style: minimal clean modern styling; premium basics,
confident ecommerce pose, front view,
clean neutral studio background, soft diffused daylight,
full body head to toe, small margin above head and below feet, no cropping,
luxury fashion photography, cinematic studio lighting, ultra-sharp detail,
photorealistic fabric texture, premium ecommerce lookbook quality,
avoid: cropped head, cropped feet, extra people, deformed hands, blur, watermark,
text overlay, extra garment layers, wrong garment design
```

### API payload

```json
{
  "prompt": "...",
  "image_url": "https://cdn.fal.ai/... (or data:image/jpeg;base64,...)",
  "aspect_ratio": "3:4",
  "num_images": 1,
  "output_format": "jpeg",
  "safety_tolerance": "2"
}
```

**CDN upload strategy:**
1. Attempt `POST https://fal.run/files/upload` with `Authorization: Key {FAL_API_KEY}`
2. On failure → fall back to inline `data:{mime};base64,{b64}` in `image_url`
3. Never proceed without `image_url` (API returns 422 if absent)

---

## 7. Pipeline C — GPT Image 2

### Overview

Single-step pipeline via fal.ai's hosted GPT Image 2. **Strict reference filtering** — only one garment image is sent to prevent concept blending.

```
garmentImages[0]   (first image only — strict)
      │  (uploaded to fal.ai CDN → image_url, or data URI fallback)
      ▼
  fal.run/openai/gpt-image-2
  { prompt, image_url, image_size, quality, n:1, output_format:"png" }
      │
      ▼  returns: images[0].url
      │  (downloaded as base64)
      ▼
  compositeDataUrl
```

### Why strict reference filtering

GPT Image 2 is a **multimodal reasoning model**, not a latent-conditioning pipeline. When multiple images are sent:
- The model semantically averages all visual concepts
- Garment details from one image contaminate another
- Model identity drifts across shots
- Outfit hallucination and print blending occurs

**Solution:** Send exactly one image (the primary garment). All other references (model, pose, background) become text-only prompt guidance.

### Primary Prompt Structure

**File:** `src/lib/gpt-pipeline.ts` → `buildGptCompositePrompt()`

Newline-separated directives (GPT attends to each line as a discrete instruction):

```
[RETRY CORRECTION — line 1 if retry]
CORRECTION: {retryComment}.

[GARMENT ANCHOR — first and highest priority]
The reference image is the GARMENT SOURCE OF TRUTH.
Reproduce the garment exactly: identical colors, print, pattern, fabric texture,
sleeve style, neckline, silhouette, hem length, and all garment construction details.
Do not alter the garment in any way.

[MODEL]
Model: {ethnicity} {gender} professional fashion model, age {range}.

[SHOT TYPE]
Full body, head to toe, front-facing ecommerce portrait.

[POSE]
If config.modelPose:  "Pose: {value}."
Else:                 "Pose: confident neutral stance, weight slightly shifted, looking at camera."

[STYLING — only non-empty]
Styling: {modelStylingNotes}.
Bottom: {value}.
Footwear: {value}.
Accessories: {value}.
Style: {styleKeywords}.
Occasion: {value}.
{modelCustomPrompt}.

[BACKGROUND]
If config.backgroundTheme:  "Background: {value}."
Else:                       "Background: minimal white seamless studio. Soft luxury studio lighting."

[QUALITY]
Premium ecommerce fashion photography.
Photorealistic fabric detail.
Sharp full-body framing with small margin above head and below feet.
{qualityBoost if set}.
```

### Example Primary Prompt (GPT Image 2, Standard Studio)

```
The reference image is the GARMENT SOURCE OF TRUTH.
Reproduce the garment exactly: identical colors, print, pattern, fabric texture,
sleeve style, neckline, silhouette, hem length, and all garment construction details.
Do not alter the garment in any way.
Model: Indian female professional fashion model, age 20–25.
Full body, head to toe, front-facing ecommerce portrait.
Pose: confident neutral stance, weight slightly shifted, looking at camera.
Styling: natural glam makeup, fresh dewy skin.
Footwear: white_sneakers.
Style: minimal clean modern styling; premium basics; crisp lines.
Occasion: everyday casual daytime street style.
Background: minimal white seamless studio. Soft luxury studio lighting.
Premium ecommerce fashion photography.
Photorealistic fabric detail.
Sharp full-body framing with small margin above head and below feet.
```

### API payload (via fal.ai)

```json
{
  "prompt": "...",
  "image_url": "https://cdn.fal.ai/... (or data:image/jpeg;base64,...)",
  "image_size": "portrait_4_3",
  "quality": "medium",
  "n": 1,
  "output_format": "png"
}
```

**Size mapping** (pixel strings → fal.ai named sizes):

| Config size | fal.ai `image_size` |
|-------------|---------------------|
| `1024x1024` | `square_hd` |
| `1024x1536` | `portrait_4_3` |
| `1536x1024` | `landscape_4_3` |
| `auto` / unknown | `portrait_4_3` |

**Auth:** `Authorization: Key {GPT_IMAGE_API_KEY}` (falls back to `FAL_API_KEY`)

---

## 8. Multi-Angle Generation

Produces back-view and detail-shot from the **primary result image** (not the original uploads).

### Why use the primary result as reference

The primary result already contains:
- Rendered model identity (locked)
- Rendered garment (locked)
- Scene lighting and background (locked)

Using it as the reference for back/detail shots produces far stronger consistency than re-running from the raw garment photo.

### Angle Prompts by Provider

#### Gemini — Back View
```
[garmentRef, model?, background?]  (no raw garment re-upload)
prompt: "Same model from MODEL PHOTO (if uploaded), wearing the exact same garment,
         back view, full body. Show back panel of garment, preserve all back design
         details. Same background and lighting. [GLOBAL_AVOID]"
```

#### Gemini — Detail Shot
```
[garmentRef, model?, background?]
prompt: "Close-up upper-body shot, same model, same garment.
         Show fabric texture, print, seams, and garment construction.
         Sharp focus on garment. Same lighting."
```

#### FLUX Kontext Pro — Back View
```
image_url: mainResultImage (rendered primary result)
prompt: "same model, preserve identical face and identity,
         same outfit, show back of garment clearly, preserve all back design details,
         colors, prints, back view, full body head to toe,
         same studio background and lighting,
         luxury fashion photography, cinematic studio lighting, ultra-sharp detail,
         photorealistic fabric texture, premium ecommerce lookbook quality,
         avoid: different person, different outfit, front view, cropped head, cropped feet"
```

#### FLUX Kontext Pro — Detail Shot
```
image_url: mainResultImage
prompt: "same model, preserve identical face and outfit,
         close-up upper body detail shot,
         show garment fabric texture, seams, print, and construction clearly,
         sharp focus on garment details, same studio lighting,
         luxury fashion photography, ...,
         avoid: full body shot, different outfit"
```

#### GPT Image 2 — Back View
```
image_url: mainResultImage   (sole reference — strict)
prompt: "Using the reference image as the IDENTITY AND OUTFIT SOURCE OF TRUTH,
         generate the same model wearing the exact same garment — back view,
         full body, head to toe.
         Show the rear of the garment clearly: back panel, fabric texture,
         and all back-side construction details.
         Same studio background and lighting as the reference.
         Premium ecommerce fashion photography. Photorealistic."
```

#### GPT Image 2 — Detail Shot
```
image_url: mainResultImage   (sole reference — strict)
prompt: "Using the reference image as the IDENTITY AND OUTFIT SOURCE OF TRUTH,
         generate an upper-body close-up detail shot of the same model
         wearing the exact same garment.
         Focus: garment fabric texture, print detail, seams, neckline,
         and construction quality.
         Chest-to-waist framing. Sharp garment focus.
         Same studio lighting as the reference.
         Premium ecommerce fashion photography. Photorealistic."
```

---

## 9. Retry Flow

When the user provides a correction comment:

1. Correction is prepended as `CORRECTION: {text}` at the start of the prompt
2. The same reference images from the original run are reused (no re-upload)
3. For Gemini: uses cached garment ref from the first run (skips step 1)
4. For FLUX / GPT: rebuilds prompt with correction prefix, same garment images

**Example retry prompt prefix:**
```
CORRECTION: neckline should be round neck, not V-neck. Keep everything else the same.
```

---

## 10. API Route Map

### Frontend → Backend

| Action | Frontend call | Backend route |
|--------|---------------|---------------|
| Gemini generation | `generateImage()` in `gemini.ts` | proxied via Gemini API (frontend direct) |
| FLUX generation | `generateFluxImage()` in `flux.ts` | `POST /api/flux/image` |
| GPT Image 2 generation | `generateGptImage()` in `gpt-image.ts` | `POST /api/openai/image` |

### Backend → Provider

| Route | Service | Provider API |
|-------|---------|--------------|
| `POST /api/flux/image` | `kontext.service.ts` | `POST https://fal.run/fal-ai/flux-pro/kontext` |
| `POST /api/openai/image` | `gpt-image.service.ts` | `POST https://fal.run/openai/gpt-image-2` |

### Auth headers

| Provider | Header |
|----------|--------|
| fal.ai (FLUX) | `Authorization: Key {FAL_API_KEY}` |
| fal.ai (GPT Image 2) | `Authorization: Key {GPT_IMAGE_API_KEY}` (fallback: `FAL_API_KEY`) |
| Gemini | `x-goog-api-key: {GEMINI_API_KEY}` (frontend) |

### Credit deduction

Every generation deducts from the user's credit balance before the API call completes, logged in `ApiLog` and `CreditTransaction`. Developer email (`DEVELOPER_EMAIL`) bypasses deduction but still logs usage.

---

## Environment Variables (server)

```env
GEMINI_API_KEY=         # Google Gemini API key (frontend — in Vite env)
FAL_API_KEY=            # fal.ai key for FLUX Kontext Pro
GPT_IMAGE_API_KEY=      # fal.ai / nvapi key for GPT Image 2 (fallback: FAL_API_KEY)
OPENAI_API_KEY=         # Not used (GPT Image 2 goes through fal.ai, not OpenAI direct)
```

---

*Last updated: 2026-05-12*
