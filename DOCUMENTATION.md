# BotStudioX — AI Virtual Try-On Platform
### Professional Product & Technical Documentation

**Author:** Mohan, Siva  
**Version:** 2.0 (Production)  
**Last Updated:** April 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [System Input & Output Specification](#3-system-input--output-specification)
4. [Development Journey](#4-development-journey)
5. [Production Architecture](#5-production-architecture)
6. [Image Generation Pipeline — Step-by-Step Flow](#6-image-generation-pipeline--step-by-step-flow)
7. [Prints Pipeline — Step-by-Step Flow](#7-prints-pipeline--step-by-step-flow)
8. [Backend API Pipeline — Step-by-Step Flow](#8-backend-api-pipeline--step-by-step-flow)
9. [Feature Modules](#9-feature-modules)
10. [Technical Stack](#10-technical-stack)
11. [Console / Logging Reference](#11-console--logging-reference)
12. [Performance Benchmarks](#12-performance-benchmarks)
13. [Known Limitations](#13-known-limitations)
14. [Glossary](#14-glossary)

---

## 1. Executive Summary

BotStudioX is an AI-powered virtual try-on and fashion image generation platform designed for e-commerce. It allows fashion brands and sellers to generate high-quality product imagery — showing a model wearing a specific garment, in a specific pose, against a specific background — without a physical photoshoot.

The system evolved from a simple 4-input prototype to a production-grade multi-stage AI pipeline powered by Google's Gemini models, with a full React-based web UI, storyboard management, print-on-garment compositing, multi-angle generation, saree specialist pipeline, and a cloud asset library backed by AWS S3 and PostgreSQL.

**Core Value Proposition:**  
Replace expensive fashion photoshoots with AI-generated imagery that is consistent, customizable, and production-ready.

---

## 2. Product Overview

### What BotStudioX Does

BotStudioX takes a set of user-provided inputs (garment, model, pose, background) and produces a photorealistic composite image of a model wearing that garment in the given pose, placed in the given background environment.

### Key Capabilities

| Capability | Description |
|---|---|
| Virtual Try-On | Model wearing any uploaded garment |
| AI Look Planning | Auto-generates styling plan (LookPlan) from garment image |
| Pose Control | Reference pose images or preset poses |
| Background Placement | Custom background images or themed presets |
| Print-on-Garment | Apply design prints + hex recolor onto garment templates (front / back / side) |
| Multi-Angle Views | Side view, back view, and zoomed detail shots from a front composite |
| Saree Specialist Pipeline | Dedicated saree analysis + prompt generation for Indian traditional wear |
| Storyboard System | Manage multiple garment shoots as named storyboards (PostgreSQL-backed) |
| Asset Library | Reusable model, pose, and background assets stored in S3 |
| Retry / Correction | Regenerate with user feedback and targeted retry comments |
| API Usage Tracking | Per-user token usage, latency, and API call logs |

---

## 3. System Input & Output Specification

### Inputs

| Input | Type | Required | Max Count | Notes |
|---|---|---|---|---|
| Garment Image | Image file (JPG/PNG) | Yes | 4 | The garment to be worn |
| Model Image | Image file (JPG/PNG) | Yes | 4 | Identity reference (face, body) |
| Pose Image | Image file (JPG/PNG) | No | 4 | Body pose reference |
| Background Image | Image file (JPG/PNG) | No | 4 | Scene/environment background |
| Occasion | Preset or text | No | 1 | e.g. Casual, Date Night, Festival |
| Style | Preset or text | No | 1 | e.g. Minimal, Streetwear, Luxe |
| Model Ethnicity | Preset or text | No | 1 | e.g. White/European, South Asian |
| Footwear | Preset or text | No | 1 | e.g. Sneakers, Heels, Sandals |
| Accessories | Free text | No | — | e.g. gold earrings, minimal watch |
| Model Styling Notes | Free text | No | — | e.g. sleek hair, natural glam makeup |

**Storage:**  
Storyboard configs and metadata are stored in PostgreSQL via Prisma ORM. Generated and uploaded images are stored in AWS S3 (`users/{userId}/images/{imageId}.{ext}`). Assets are stored in S3 with metadata in PostgreSQL.

### Outputs

| Output | Format | Dimensions | Notes |
|---|---|---|---|
| Primary Composite | Image (PNG/JPEG) | 1080 × 1440 px (3:4) | Full-body, head-to-toe |
| Garment Reference | Image (PNG/JPEG) | Variable | Intermediate clean garment cutout |
| Multi-Angle — Side | Image (PNG/JPEG) | 1080 × 1440 px | 60–80° body rotation |
| Multi-Angle — Back | Image (PNG/JPEG) | 1080 × 1440 px | Back-facing view |
| Multi-Angle — Detail | Image (PNG/JPEG) | Variable | Zoomed garment region |
| Print Composite — Front | Image (PNG/JPEG) | Variable | Design applied to garment front |
| Print Composite — Back | Image (PNG/JPEG) | Variable | Design applied to garment back |
| Print Composite — Side | Image (PNG/JPEG) | Variable | Design applied to garment side |

All outputs are available for immediate download or saved to S3 via the images API.

---

## 4. Development Journey

The system was built iteratively over 9 phases, each solving specific technical problems.

### Phase 1 — Initial Concept
**Goal:** Prove the idea — can Gemini generate a model wearing a garment?  
**Stack:** Streamlit + Gemini API  
**Result:** Basic output generated. Pose was inaccurate; clothing alignment was inconsistent.

### Phase 2 — Problem Analysis
**Identified 3 core requirements:**
1. Pose Control — model must follow the reference pose
2. Identity Preservation — model face/body must not change
3. Garment Transfer — garment must be rendered faithfully on the model

**Key Realization:** Gemini is a generative model, not a conditioned diffusion model. Controlling it requires careful prompt engineering, not model fine-tuning.

### Phase 3 — First Working Pipeline
- Integrated Gemini API with multi-image prompting
- Built basic Streamlit UI for 4-input upload
- **Result:** ~50% pose accuracy; unstable across runs

### Phase 4 — Pose Signal Improvement (OpenCV + MediaPipe)
- Introduced OpenCV and MediaPipe for skeleton extraction
- Skeleton (black background + white joints) provided a cleaner pose signal
- **Result:** Pose accuracy improved to ~60–70%

### Phase 5 — Prompt Engineering Optimization
Two critical improvements:
1. **STRICT RULES** in prompt — repeated pose constraints, explicit negative rules
2. **Input ordering fix:**
   - Before: `[prompt, model, garment, pose, bg]`
   - After: `[prompt, pose, model, garment, bg]`
   - Placing pose first significantly improved Gemini's adherence to it

### Phase 6 — Dual-Mode System
Built two generation modes:
- **Advanced Mode** — uses OpenCV skeleton; higher pose accuracy
- **Gemini Only Mode** — uses raw pose image; faster but less precise

### Phase 7 — Critical Identity Bug
**Problem:** When preset pose images were used, the output showed the person from the pose image wearing the garment instead of the target model.  
**Root Cause:** Gemini treated the pose image as an identity reference rather than a structural guide.

### Phase 8 — Role-Based Prompting (Key Breakthrough)
**Solution:** Strict role assignment for every input image.

| Input | Assigned Role |
|---|---|
| Garment Reference | Clothing — match exactly |
| Model Image | Identity — face and body |
| Pose Image | Structure only — do NOT copy identity |
| Background Image | Environment only |

Added explicit instruction: *"DO NOT use the person from the pose image."*  
**Result:** Identity bug resolved. Pose accuracy reached ~75–85%.

### Phase 9 — Production Pipeline
Full architectural rebuild into a modular, multi-stage pipeline with:
- React 18 + TypeScript + Vite frontend
- Express.js + TypeScript backend server
- AWS Cognito authentication, PostgreSQL database, S3 storage
- Storyboard management, asset library, prints, multi-angle, saree pipeline
- API usage tracking and per-user analytics

---

## 5. Production Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      BotStudioX UI (React 18)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ ┌────────┐  │
│  │ Generate │ │  Prints  │ │  Multi   │ │Assets│ │ Saved  │  │
│  │   Tab    │ │   Tab    │ │  Angle   │ │ Tab  │ │  Tab   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────┘ └────────┘  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Storyboard Library                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
         │ HTTPS + Bearer token (AWS Cognito JWT)
         ▼
┌────────────────────────────────────────────────────────────────┐
│                   Express.js Backend Server                    │
│                                                                │
│  Routes:  /api/generate/plan                                   │
│           /api/generate/image                                  │
│           /api/images  /api/storyboards                        │
│           /api/assets  /api/usage  /api/auth                   │
│                                                                │
│  Middleware:  authenticate (Cognito JWT)                       │
│               rate-limit (10 req/min)                          │
│               validate (Zod schema)                            │
│               errorHandler                                      │
│                                                                │
│  Services:  gemini.service.ts → Gemini API (key server-side)   │
│             image.service.ts  → S3 + Prisma                    │
│             s3.service.ts     → AWS S3                         │
│             auth.service.ts   → Prisma (user lookup)           │
└────────────────────────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
┌─────────────────┐      ┌──────────────────────┐
│  Gemini API     │      │  AWS Services         │
│  (Google)       │      │  ┌────────────────┐   │
│  generateText   │      │  │ S3  (images,   │   │
│  generateImage  │      │  │     assets)    │   │
└─────────────────┘      │  └────────────────┘   │
                         │  ┌────────────────┐   │
                         │  │ Cognito        │   │
                         │  │ (JWT verify)   │   │
                         │  └────────────────┘   │
                         └──────────────────────┘
                                   │
                         ┌─────────────────────┐
                         │  PostgreSQL          │
                         │  (Prisma ORM)        │
                         │  Tables:             │
                         │  User, Storyboard,   │
                         │  Image, Asset,       │
                         │  ApiLog              │
                         └─────────────────────┘
```

### Frontend Pipeline Layer (`src/lib/pipeline.ts`)

All pipeline logic lives in `pipeline.ts`. It calls `generateText()` and `generateImage()` from `src/lib/gemini.ts`, which are thin proxy functions that POST to the backend API (never calling Gemini directly — the API key stays server-side).

### Runtime State per Storyboard

Each active storyboard maintains a `StoryboardRuntime` object in memory:

```typescript
type StoryboardRuntime = {
  garmentDataUrls: string[];       // uploaded garment images
  modelDataUrls: string[];         // uploaded model images
  poseDataUrls: string[];          // uploaded pose images
  backgroundDataUrls: string[];    // uploaded background images
  lastPlan: LookPlan | null;       // AI-generated styling plan
  lastFinalPrompt: string | null;  // assembled generation prompt
  resultDataUrl: string | null;    // last output image
  timingsMs: PipelineTimings | null;
};
```

---

## 6. Image Generation Pipeline — Step-by-Step Flow

This is the full pipeline executed when a user runs the main "Generate" workflow.

```
User Inputs (garment, model, pose, background, config)
    │
    ▼
[Step 1] AI Look Planning ────────────────── planLookFromGarment()
         File: src/lib/pipeline.ts (line 99)
         Calls: generateText() → POST /api/generate/plan
         Model: gemini-2.0-flash-preview (text model)
         Input: 1–4 garment images + LookOverrides (user config)
         Output: LookPlan {
           occasion, color_scheme, print_style,
           style_keywords[], background_theme,
           footwear, accessories[], negative_prompt,
           model_ethnicity, model_pose, model_styling_notes
         }
         Note: User overrides always win over AI suggestions
    │
    ▼
[Step 2] Asset Selection (local, instant) ── chooseBackground() / chooseModel()
         File: src/lib/pipeline.ts (lines 223, 242)
         Logic: Match background by theme string; match model by ethnicity
         Falls back to random pick from available assets if no exact match
    │
    ▼
[Step 3] Final Prompt Generation ─────────── generateFinalPrompt()
         File: src/lib/pipeline.ts (line 252)
         Calls: generateText() → POST /api/generate/plan
         Model: gemini-2.0-flash-preview (text model)
         Input: LookPlan + selected background/model metadata
         Output: 4–5 sentence photorealistic ecommerce prompt string
         Fallback: if LLM call fails, builds a hardcoded fallback prompt
    │
    ▼
[Step 4] Garment Reference Prompt Build ─── buildGarmentReferencePrompt()
         File: src/lib/pipeline.ts (line 337)
         Pure function — no API call, returns a fixed prompt string
         Purpose: "clean catalog cutout of the garment on plain background"
         Rules: preserve design exactly, remove mannequin, no cropping
    │
    ▼
[Step 5] Garment Reference Generation ────── POST /api/generate/image
         File: src/lib/gemini.ts (line 166) → backend gemini.service.ts
         Model: gemini-2.0-flash-preview-image-generation
         Input: Garment Reference Prompt + 1–4 garment photos
         Output: Clean garment cutout image (base64)
         Timeout: 180 seconds
    │
    ▼
[Step 6] Composite Prompt Build ────────────buildCompositePrompt()
         File: src/lib/pipeline.ts (line 563)
         Pure function — assembles structured prompt from plan + flags
         Image order in prompt (CRITICAL for Gemini fidelity):
           IMAGE 1: GARMENT REFERENCE → clothing source of truth
           IMAGE 2: MODEL PHOTO       → identity lock (face/body)
           IMAGE 3+: ORIGINAL GARMENT PHOTOS (secondary design reference)
           IMAGE N: POSE REFERENCE    → body structure only, NOT identity
           IMAGE N+1: BACKGROUND PHOTO → environment lock
         Hard rules injected:
           - Full-body 3:4 head-to-toe framing, 1080×1440 px
           - Model age 18–23, clearly adult
           - Garment fidelity (silhouette, print, seams, logos)
           - Face identity lock (exact person from MODEL PHOTO)
           - Background fidelity if reference provided
           - Single GLOBAL_AVOID clause (no crops, extra people, deformed hands, etc.)
    │
    ▼
[Step 7] Final Composite Generation ─────── POST /api/generate/image
         File: src/lib/gemini.ts (line 166) → backend gemini.service.ts
         Model: gemini-2.0-flash-preview-image-generation
         Input: buildCompositePrompt() output + ordered images
         Output: 1080×1440 px composite image (base64)
         Timeout: 180 seconds
    │
    ├─ [Optional] Multi-Angle Generation ─── buildMultiAnglePrompt()
    │  File: src/lib/pipeline.ts (line 741)
    │  Generates: side view / back view / detail shot
    │  Input: garment ref + garment photos + main result + optional model + bg
    │  Detail shot: zooms into garment-rich region (chest for tops, waist for bottoms, pallu for sarees)
    │  Each angle → POST /api/generate/image
    │
    └─ [Optional] Retry / Correction ─────── buildRetryCompositePrompt()
       File: src/lib/pipeline.ts (line 700)
       Wraps buildCompositePrompt() with retry header containing:
         - RETRY PASS declaration
         - User's retry comment (targeted correction)
         - All current plan fields (occasion, color, model, pose, etc.)
       Same image call: POST /api/generate/image
```

### Hard Rules Applied in Every Composite Prompt

These constants are injected into every composite prompt call:

| Constant | Value (from pipeline.ts) |
|---|---|
| `FULL_BODY_RULE` | Full-body head-to-toe, 3:4 portrait, 1080×1440 px, no cropping at any edge |
| `MODEL_AGE_RULE` | Young adult 18–23, must appear clearly adult |
| `GARMENT_FIDELITY_RULE` | Match silhouette, neckline, sleeves, hem, print/pattern, logos, seams exactly |
| `BACKGROUND_LOCK_RULE` | If background photo provided, match it closely — do not switch scenes |
| `GLOBAL_AVOID` | cropped head/feet, extra people, extra limbs, deformed hands, blur, text overlay, watermark, extra fabric, CGI look, minors |

### Saree Specialist Sub-Pipeline

For Indian traditional wear (sarees), a dedicated sub-pipeline runs before Step 5:

```
[Saree Step A] Saree Analysis ────────── analyzeSaree()
               File: src/lib/pipeline.ts (line 905)
               Calls: generateText() → POST /api/generate/plan
               Returns: SareeAnalysis {
                 pallu_position, pallu_design, border_width,
                 border_design, body_pattern, body_color,
                 fabric, drape_style, embellishments[], occasion,
                 confidence_notes
               }

[Saree Step B] Saree Prompt Generation ─ generateSareePrompt()
               File: src/lib/pipeline.ts (line 964)
               Calls: generateText() → POST /api/generate/plan
               Returns: { prompt, negativePrompt }

[Saree Step C] Saree Composite Prompt ── buildSareeCompositePrompt()
               File: src/lib/pipeline.ts (line 1032)
               Pure function — builds full composite prompt with saree-specific
               draping rules (front pleats, pallu over left shoulder, blouse color)
               Replaces buildCompositePrompt() in main flow
```

---

## 7. Prints Pipeline — Step-by-Step Flow

The Prints pipeline is invoked from the Prints tab. It applies design patterns and/or color recoloring onto a garment template image.

```
User Inputs:
  - Garment template images (front / back / side) — mannequin photos
  - [Optional] Print design image
  - [Optional] Target color (hex string, e.g. #FF5733)
  - Garment type + gender
  - Additional prompt notes
    │
    ▼
[Print Step 1] Prompt Build ─────────── buildPrintApplicationPrompt()
               File: src/lib/pipeline.ts (line 353)
               Pure function. Routes to one of 3 branches:
```

### Branch A — Design + Color (both provided)

```
   Inputs: design image (IMAGE 1) + garment template (IMAGE 2)
   Two-step task injected into Gemini:
     STEP 1 — GARMENT RECOLOR:
       Recolor garment fabric to exact hex color
       Preserve shading/highlights/wrinkles (looks dyed, not painted)
       Do NOT change background, mannequin, or shadows
     STEP 2 — DESIGN OVERLAY:
       Map design from IMAGE 1 onto recolored fabric
       Fabric blending (multiply/overlay equivalent) — not a flat sticker
       Pattern follows garment contours, wrinkles, folds, perspective
       Confined strictly within garment seams/neckline/hem/cuffs
   Multi-view consistency rules enforced between front/back/side
```

### Branch B — Color Only (no design)

```
   Input: garment template image only
   Task: recolor garment fabric to hex color
   Preserve original composition exactly (same mannequin/framing/shadows)
   Color must look dyed into fabric, not painted over
   Hard rule: entire garment fully visible (collar, sleeves, hem — no crop)
```

### Branch C — Design Only (no color)

```
   Inputs: design image (IMAGE 1) + garment template (IMAGE 2)
   Task: apply design pattern as fabric texture onto garment
   Scale rules: relative to garment bounding box (NOT canvas size)
   Texture integration: follows contours/folds/perspective (not flat)
   Base fabric color preserved exactly (no bleaching or recoloring)
   Pattern confined strictly within garment boundary
```

```
    │ (all branches)
    ▼
[Print Step 2] Image Generation ────────── POST /api/generate/image
               File: src/lib/gemini.ts → backend gemini.service.ts
               Model: gemini-2.0-flash-preview-image-generation
               Called per view: front → back → side (each is a separate call)
               Timeout: 180 seconds per call
               Front view is established as REFERENCE VIEW
               Back/side explicitly told to match front view's color/pattern/scale
    │
    ▼
[Print Step 3] Result Display + Download
               Each view result returned as base64 → displayed as data URL
               User can download or save to gallery
```

### Print Retry Flow

If user submits retry with a correction comment, `buildPrintApplicationPrompt()` is called with `retryComment` set. A **RETRY PASS** header is prepended:

```
RETRY PASS (prints): re-generate for the SAME inputs.
Apply user's retry comments as targeted improvements.
Do not introduce new garment design elements or extra fabric.
User retry comments: <comment>
```

---

## 8. Backend API Pipeline — Step-by-Step Flow

Every call from `src/lib/gemini.ts` (`generateText` or `generateImage`) goes through this backend pipeline.

### Request Entry

```
[Backend Step 1] Frontend sends request
  File: src/lib/gemini.ts — proxyFetch() (line 99)
  Method: POST with JSON body
  Auth header: Bearer <Cognito access token>
  Auto-refresh: on 401, calls refreshTokenOnce() then retries
  Timeouts: 120s (text), 180s (image)
```

### Route + Middleware Chain

```
[Backend Step 2] Route handler — POST /api/generate/image
  File: server/src/routes/generate.routes.ts (line 1)
  Middleware chain (applied in order):
    1. authenticate     → verify Cognito JWT, load user into req.user
    2. generateLimiter  → 10 requests/minute per IP (express-rate-limit)
    3. validate(schema) → Zod schema validation of request body
    → controller.image()
```

### Authentication Middleware

```
[Backend Step 3] authenticate — server/src/middleware/authenticate.ts
  Extracts Bearer token from Authorization header
  Verifies with AWS Cognito JwtVerifier (COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID)
  Looks up user by Cognito sub in PostgreSQL via auth.service.ts
  Sets req.user = { userId, email }
  Returns 401 on invalid/expired token
```

### Rate Limiting

```
[Backend Step 4] generateLimiter — server/src/middleware/rateLimiter.ts (line 21)
  10 requests per 60 seconds per client
  Returns HTTP 429 with standard rate-limit headers if exceeded
```

### Schema Validation

```
[Backend Step 5] validate(generateImageSchema) — server/src/middleware/validate.ts
  Zod parse of req.body against generateImageSchema
  Checks: promptText (required), images[] with mimeType + data (base64 string)
  Optional: model, temperature (0–2), aspectRatio, width, height
  Returns 400 BadRequestError on validation failure
```

### Controller

```
[Backend Step 6] generate.controller.ts — image() (line 64)
  Extracts: userId from req.user, model (default: "gemini-3-pro-image-preview")
  Starts latency timer: const startMs = Date.now()
  Calls: geminiService.generateImage(input)
  On success:
    latencyMs = Date.now() - startMs
    Fire-and-forget ApiLog to PostgreSQL (no await, .catch logs error)
    Returns HTTP 200 JSON: { mimeType, imageBase64, raw, tokens, latencyMs }
  On error:
    latencyMs = Date.now() - startMs
    Fire-and-forget error ApiLog to PostgreSQL
    Passes error to next() → errorHandler middleware
```

### Gemini Service — Image Generation

```
[Backend Step 7] gemini.service.ts — generateImage() (line 195)

  7a. Model name normalization — normalizeModelName() (line 13)
      Input "gemini-2.0-flash" → "models/gemini-2.0-flash"
      Already prefixed names passed through unchanged

  7b. Prompt enhancement — enhanceImagePrompt() (line 133)
      If prompt has no "Photo quality requirements:" block:
        Appends standard quality block:
          - 1080×1440 px resolution
          - Photorealistic, ultra-sharp, crisp focus
          - Studio-grade lighting, clean color, high dynamic range
          - Accurate textures, natural shadows, realistic depth
          - High-end camera/lens, clean natural bokeh
          - Subject large and fully in frame
          - Balanced exposure, natural skin tones
          - No low-res, blur, noise, CGI/cartoon look

  7c. Payload construction
      parts[0] = { text: enhancedPrompt }
      parts[1..N] = { inlineData: { mimeType, data: base64 } } per image
      generationConfig:
        temperature: 0.2 (default)
        responseModalities: ["IMAGE"]
        imageConfig (if aspectRatio/width/height provided):
          { aspectRatio, width, height }

  7d. POST to Gemini API — fetchWithRetry() (line 79)
      URL: https://generativelanguage.googleapis.com/v1beta/{modelName}:generateContent?key=...
      Timeout: 180 seconds (fetchWithTimeout with AbortController)
      Retry logic:
        Max retries: 3
        Retryable status codes: 429, 503
        Delays: 2s → 4s → 8s (exponential) + up to 500ms random jitter
        Timeout errors (AbortError): NOT retried, thrown immediately
      PRINT: console.log("[Gemini] Retry N/3 after Xms...")  on each retry
      PRINT: console.warn("[Gemini] Got 429/503, will retry...")  on retryable status
      PRINT: console.warn("[Gemini] Fetch error, will retry...")  on network error

  7e. Response handling
      Parse JSON response
      Try with imageConfig first; if "Unknown name"/"unknown field" error → retry without imageConfig
      pickResponseInlineImage(): search candidates[0].content.parts for inlineData/inline_data
      extractTokenUsage(): extract usageMetadata { promptTokenCount, candidatesTokenCount, totalTokenCount }
      Throws GeminiError if no image found in response

  7f. Return value:
      { mimeType, imageBase64, raw, tokens: { promptTokens, outputTokens, totalTokens } }
```

### API Logging

```
[Backend Step 8] ApiLog write — generate.controller.ts (lines 83–95)
  Async fire-and-forget (not awaited):
  prisma.apiLog.create({
    userId, type: "image", model,
    promptTokens, outputTokens, totalTokens,
    latencyMs, status: "success"
  })
  On DB failure: console.error("[ApiLog] Failed to save:", err)

  On error path (lines 105–115):
  prisma.apiLog.create({
    userId, type: "image", model,
    latencyMs, status: "error",
    errorMessage: truncated to 500 chars
  })
  On DB failure: console.error("[ApiLog] Failed to save error log:", logErr)
```

### Error Handler

```
[Backend Step 9] errorHandler — server/src/middleware/errorHandler.ts
  AppError instances: return res.status(err.statusCode).json({ error: err.message })
  Other errors: console.error("Unhandled error:", err)
                return res.status(500).json({ error: "Internal server error" })
```

### Text Generation (plan) — Same Pipeline, Different Endpoint

`POST /api/generate/plan` follows the same middleware chain. Controller calls `geminiService.generateText()` instead of `generateImage()`. No image in response — returns `{ text, raw, tokens, latencyMs }`.

---

## 9. Feature Modules

### 9.1 Generate Tab
The primary workflow. Users configure a storyboard, upload assets, and run the full pipeline:
- Storyboard config form (occasion, style, model, pose, background presets + free-text overrides)
- Run / Retry controls with user correction comments
- Output preview with download
- Performance timing display (plan time, image gen time, total)

### 9.2 Prints Tab
Apply custom design prints and/or hex color recoloring onto garment template images:
- Upload base garment template (front / back / side views)
- Upload print design image and/or specify hex color
- Select garment type and gender
- Output: composite print images for each uploaded view
- Method: Gemini API with fabric-blending prompts (multiply/overlay simulation)
- Supports 3 modes: Design only, Color only, Design + Color combined

### 9.3 Multi-Angle Tab
Generate additional views from a front composite:
- Input: existing front composite + garment reference + optional pose references
- Outputs: side view (60–80° rotation), back view (model facing away), detail shot (zoomed garment region)
- Detail shot region auto-detected by garment type (tops → chest area; bottoms → waist/thigh; sarees → pallu area)

### 9.4 Assets Tab
Manage reusable assets across storyboards:
- Model images (with ethnicity and theme metadata)
- Pose images
- Background images
- Stored in AWS S3 with metadata in PostgreSQL
- Accessible via `GET /api/assets`

### 9.5 Saved Images Gallery
All generated outputs can be saved to PostgreSQL + S3 via `POST /api/images`:
- Thumbnail grid view
- Full-size image modal
- Download and delete controls
- Filtered by storyboard or all images

### 9.6 Storyboard Library
Manage multiple garment campaigns as separate storyboards:
- Create, rename, delete storyboards
- Each storyboard stores 22 config fields in PostgreSQL (occasion, model preset, pose preset, background theme, print details, style keywords, footwear, accessories, etc.)
- Storyboard CRUD via `/api/storyboards`

### 9.7 API Usage Tab
Per-user API metrics from `GET /api/usage`:
- Last 50 API call logs (type, model, tokens, latency, status)
- Totals: API calls, total tokens, prompt tokens, output tokens
- Average latency

---

## 10. Technical Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Custom CSS (design system in `/design-system`) |
| Auth Client | AWS Cognito (Amplify-compatible token management) |
| API Communication | Fetch API with Bearer token, auto-refresh on 401 |

### Backend

| Layer | Technology |
|---|---|
| Server | Express.js + TypeScript |
| Runtime | Node.js |
| Auth | AWS Cognito JwtVerifier (`aws-jwt-verify`) |
| Database ORM | Prisma (PostgreSQL) |
| Storage | AWS S3 SDK |
| Validation | Zod schemas |
| Rate Limiting | `express-rate-limit` (10 req/min for generation) |

### AI / External APIs

| Service | Usage |
|---|---|
| Google Gemini (text) | Look planning, final prompt generation, saree analysis |
| Google Gemini (image) | Garment reference, composite, prints, multi-angle |
| Default text model | `gemini-2.0-flash-preview` |
| Default image model | `gemini-2.0-flash-preview-image-generation` |

### Key Source Files

| File | Responsibility |
|---|---|
| `src/lib/pipeline.ts` | Full frontend pipeline: planning, prompt building, composite, retry, multi-angle, prints, saree |
| `src/lib/gemini.ts` | Frontend Gemini client — proxy to backend API, token management, base64 utils |
| `src/lib/presets.ts` | All preset definitions (occasion, style, pose, model, footwear) |
| `src/lib/backgroundLibrary.ts` | Background template library |
| `src/App.tsx` | Root component — state orchestration, pipeline execution |
| `src/components/PrintsTab.tsx` | Prints pipeline UI |
| `src/components/MultiAngleTab.tsx` | Multi-angle generation UI |
| `src/components/AssetsTab.tsx` | Asset library UI |
| `src/components/SavedImagesPane.tsx` | Saved gallery UI |
| `server/src/services/gemini.service.ts` | Backend Gemini API client (key management, retry, prompt enhancement) |
| `server/src/controllers/generate.controller.ts` | API controller: latency tracking, ApiLog writes, error handling |
| `server/src/middleware/authenticate.ts` | Cognito JWT verification, user lookup |
| `server/src/middleware/rateLimiter.ts` | Rate limiting per endpoint |
| `server/src/services/image.service.ts` | S3 upload + Prisma image record |
| `server/src/services/s3.service.ts` | Raw AWS S3 operations |
| `server/prisma/schema.prisma` | PostgreSQL schema (User, Storyboard, Image, Asset, ApiLog) |

---

## 11. Console / Logging Reference

All console output comes from the backend server. No logging on the success path of frontend pipeline.ts functions.

| File | Line | Level | Statement | Trigger |
|---|---|---|---|---|
| `server/src/index.ts` | 7 | INFO | `console.log("Server running on port...")` | Server startup |
| `server/src/services/gemini.service.ts` | 90 | INFO | `[Gemini] Retry N/3 after Xms...` | Retry attempt (429 or 503) |
| `server/src/services/gemini.service.ts` | 99 | WARN | `[Gemini] Got 429/503, will retry. Body: ...` | Retryable HTTP status received |
| `server/src/services/gemini.service.ts` | 110 | WARN | `[Gemini] Fetch error, will retry: ...` | Network error during request |
| `server/src/controllers/generate.controller.ts` | 37 | ERROR | `[ApiLog] Failed to save: ...` | DB write failure (text/plan success log) |
| `server/src/controllers/generate.controller.ts` | 57 | ERROR | `[ApiLog] Failed to save error log: ...` | DB write failure (text/plan error log) |
| `server/src/controllers/generate.controller.ts` | 95 | ERROR | `[ApiLog] Failed to save: ...` | DB write failure (image success log) |
| `server/src/controllers/generate.controller.ts` | 115 | ERROR | `[ApiLog] Failed to save error log: ...` | DB write failure (image error log) |
| `server/src/middleware/errorHandler.ts` | 11 | ERROR | `Unhandled error: ...` | Unhandled exception |

**Notes:**
- Retry logs (`[Gemini]`) are the most common output during Gemini API rate-limiting events
- `[ApiLog]` errors are non-blocking — the response to the user is still sent successfully
- No success-path logging after image generation completes

---

## 12. Performance Benchmarks

Timings tracked per pipeline stage (approximate, depends on Gemini API response time):

| Stage | Typical Time |
|---|---|
| AI Look Planning | 3–6 seconds |
| Final Prompt Assembly (LLM) | 3–6 seconds |
| Garment Reference Generation | 8–15 seconds |
| Final Composite Generation | 10–20 seconds |
| Multi-Angle — Side or Back | 10–20 seconds each |
| Multi-Angle — Detail Shot | 8–15 seconds |
| Print Application (per view) | 10–20 seconds |
| Saree Analysis | 3–6 seconds |
| **Total (full standard pipeline)** | **25–50 seconds** |

### Quality Benchmarks (Current Production System)

| Metric | Status | Score |
|---|---|---|
| Pose Accuracy | Strong | ~80–85% |
| Identity Preservation | Strong | Consistent |
| Garment Transfer Fidelity | Good | Reliable |
| Background Matching | Good | Reliable |
| Print Pattern Accuracy | Good | Reliable for standard prints |
| Output Stability (run-to-run) | High | Improved significantly |
| Overall UX | Advanced | Multi-tab, storyboard system |

---

## 13. Known Limitations

| Limitation | Root Cause | Workaround |
|---|---|---|
| Pose accuracy not 100% | Gemini is generative, not a controlled diffusion model | Use retry with pose correction comment |
| Finger / hand artifacts | Hand generation is a known challenge for image models | Crop or select outputs with clean hands |
| Cloth physics imperfect | No physics simulation; Gemini infers drape | Use high-quality garment reference images |
| Output variability | Gemini has inherent stochasticity | Use Retry feature; run multiple times |
| No real-time preview | Generation takes 25–50 seconds | Not applicable for real-time use cases |
| Garment type constraints | Works best for standard apparel | Provide clear multi-angle garment references |
| Print scale consistency | Gemini may vary pattern scale between views | Use front view as reference; retry if inconsistent |
| Saree draping accuracy | Complex traditional draping has many style variations | Provide clear reference images; use saree pipeline |
| No background queue | All generation is synchronous within HTTP request | Long Gemini calls are held open (180s timeout) |

---

## 14. Glossary

| Term | Definition |
|---|---|
| Composite Image | Final output image with model, garment, pose, and background combined |
| Garment Reference | Intermediate clean cutout image of the garment generated before the final composite |
| LookPlan | AI-generated JSON object describing occasion, color scheme, style keywords, background theme, accessories, footwear, pose, and styling notes for a garment |
| Role-Based Prompting | Technique of assigning explicit roles (identity, structure, clothing, environment) to each input image in the Gemini prompt |
| Storyboard | A named project unit in PostgreSQL containing 22 config fields for one garment campaign |
| StoryboardRuntime | In-memory state object tracking current uploaded assets and generation results for an active storyboard session |
| Input Ordering | The sequence in which images are passed to Gemini — critical for controlling how the model interprets each image (garment ref first, model second) |
| Prompt Enhancement | Server-side quality block appended to every image generation prompt by `enhanceImagePrompt()` in `gemini.service.ts` |
| ImageConfig | Optional Gemini API `generationConfig.imageConfig` field for width/height/aspectRatio; gracefully removed on unsupported models |
| Retry Backoff | Exponential retry with delays 2s → 4s → 8s + jitter for Gemini 429/503 responses; max 3 retries |
| Fire-and-Forget | Pattern used for ApiLog database writes — not awaited, so DB failures do not block API responses |
| ApiLog | PostgreSQL table recording each Gemini API call with userId, type, model, token counts, latency, and status |
| Bearer Token | AWS Cognito JWT attached to all API requests; verified server-side by `authenticate` middleware |
| Token Refresh | Automatic 401 → token refresh → retry logic in `proxyFetch()` (`src/lib/gemini.ts`) |
| GLOBAL_AVOID | Hard-coded negative prompt clause injected into every composite prompt in `pipeline.ts` |
| Saree Pipeline | Dedicated sub-pipeline for Indian sarees: `analyzeSaree()` → `generateSareePrompt()` → `buildSareeCompositePrompt()` |
| Detail Shot | Multi-angle view type that zooms into a garment-specific region (chest for tops, waist for bottoms, pallu for sarees) |

---

*BotStudioX — Built by Mohan. From prototype to production AI fashion platform.*
