# Botzudio

AI-powered fashion image generation SaaS for Indian e-commerce sellers. Upload a garment photo, configure your model, pose, and background — Botzudio generates studio-quality product photos in seconds, without photographers or studios.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [App Features](#app-features)
4. [Architecture Overview](#architecture-overview)
5. [Backend API Reference](#backend-api-reference)
6. [AI Pipeline Details](#ai-pipeline-details)
7. [Credit System](#credit-system)
8. [Auth Flow](#auth-flow)
9. [Database Models](#database-models)
10. [Environment Variables](#environment-variables)
11. [Local Development Setup](#local-development-setup)
12. [Deployment](#deployment)

---

## Project Overview

Botzudio is a full-stack SaaS application that lets Indian D2C brands, marketplace sellers, boutiques, and ethnic wear labels generate photorealistic e-commerce product images using AI — replacing expensive photographers and studio shoots.

**How it works:**

1. Upload a flat-lay or hanger garment photo (front + optional back).
2. Configure model identity (preset or reference photo), pose, background theme, occasion, and styling.
3. Select an AI pipeline (Flash for speed, Pro/ProMax for quality, Plus for editorial multi-angle sets).
4. Generate studio-quality images in 15–60 seconds for a fraction of the cost of a real shoot.

**Target users:** Indian D2C fashion brands, Meesho/Myntra/Amazon marketplace sellers, boutique designers, saree and ethnic wear brands.

**Live app:** [botzudio.com](https://botzudio.com) | Admin: [admin.botzudio.com](https://admin.botzudio.com)

---

## Tech Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion v12, GSAP 3 |
| 3D / Camera | Three.js |
| UI components | Ark UI, Lucide React |
| Auth client | amazon-cognito-identity-js |
| State | React Context + localStorage + IndexedDB |

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express 4 |
| Language | TypeScript (compiled to ESM) |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Object storage | AWS S3 |
| Auth | AWS Cognito (PKCE + HttpOnly cookies) + aws-jwt-verify |
| Process manager | PM2 |
| Security | Helmet, express-rate-limit, CORS |
| Validation | Zod |

### AI APIs

| Provider | Model | Used for |
|---|---|---|
| Google | Gemini 2.5 Flash Image | Fast catalogue shots (Flash pipeline) |
| Google | Gemini 3 Pro Image Preview | High-quality editorial (ProMax pipeline) |
| fal.ai | flux-pro/kontext/multi | Multi-angle images (FLUX + Hybrid pipelines) |
| OpenAI (via fal.ai) | gpt-image-2 | Premium cinematic photos (GPT pipeline) |
| fal.ai | qwen-image-edit-2511-multiple-angles | 3D camera angle manipulation (MultiAngle tab) |

---

## App Features

### Core Generation (Generate Tab)

- **Mood Board (Storyboard) management** — Create, duplicate, delete, and switch between named Mood Boards. Each board stores its own garment config and generation history.
- **Garment upload** — Upload front and optional back views of a garment; images are cached in IndexedDB by content hash to avoid repeat processing.
- **Model configuration** — Choose from ethnicity/gender presets or upload a reference photo for identity-locked generation.
- **Pose, background, and styling** — Preset catalogs or custom photo uploads for pose, background, occasion, footwear, accessories, and bottom wear.
- **Multi-pipeline selection** — Flash (fast/free), ProMax (highest quality), Plus (editorial multi-angle), Pro (GPT cinematic).
- **Back view and detail shots** — Generate side, back, and close-up detail images from the primary result in a single click.
- **Auto-save** — All generated images are automatically saved to IndexedDB and uploaded to S3/library.

### Prints Tab

- Upload white garment templates (front/back/side views).
- Apply print designs (image overlay) or solid color fills via canvas BFS flood-fill + multiply blend mode.
- AI composites the print onto the garment for use in generation.

### Try-On Tab

- Upload or select a garment from saved library.
- Upload or select a model photo from assets.
- Choose garment category (upper body, lower body, full body).
- AI virtually dresses the model using the Gemini Flash try-on pipeline.

### Multi-Angle Tab

- Upload a source product image.
- Drag interactive orbit/dolly camera controls.
- Generate a re-angled version using the Qwen multi-angle model via fal.ai.

### Assets Tab

- Centralized library of uploaded reference images categorized as: Garment, Background, Model, Pose.
- Reuse assets across Mood Boards.
- Assets are stored in S3 with presigned CDN URLs.

### Saved Images Tab

- Filterable grid of all generated images (Generated Looks, Prints).
- Grouped by storyboard session in 60-second windows.
- Lightbox viewer with keyboard navigation.
- Batch delete and authenticated download via server `/raw?dl=1` endpoint.

### Credits Tab

- Real-time credit balance display.
- Per-model pricing table.
- Transaction history (last 50 entries).
- Buy-credits modal (mailto-based purchase flow with credit pack options).
- Developer self-top-up (10,000 credits when balance hits zero).

### Dashboard Tab

- Storyboard count, images generated, assets uploaded.
- Daily image generation chart (last 30 days).
- Per-model API call logs with token counts and latency.

### Admin Portal (admin.botzudio.com)

- User management: search users, view credit balances, top up or deduct credits, delete accounts.
- Credit config: update per-image API cost (INR), override per-model credit prices.
- Affiliate system: create/manage affiliates, view click/conversion activity, manage promo codes, track commissions, manage payouts.
- API health checks.

### Landing Page

- Animated hero with rotating headline and parallax floating fashion images.
- "How It Works" full-screen scroll-snap walkthrough (4 steps).
- Output gallery with real generated samples.
- Business impact section (90% cost savings, publish in hours).
- Credit pricing slider (300–10,000 credits) with live cost calculator.
- Competitor comparison pages (`/compare/:slug`).
- Referral/affiliate tracking (`/r/:code`).
- Blog (`/blog`).

---

## Architecture Overview

```
Browser (botzudio.com)
│
├── React SPA (Vite, TypeScript)
│   ├── Auth: AWS Cognito Hosted UI (PKCE)
│   │   ├── Access token: in-memory only (never persisted)
│   │   └── Refresh token: HttpOnly cookie (server-managed)
│   ├── API calls: apiFetch() → Bearer token injection → auto 401 refresh
│   ├── Image cache: IndexedDB (garment reference cutouts, SHA-256 key)
│   └── Assets: presigned S3 URLs (browser caches for 1 hour)
│
│   Tabs: Generate | Prints | Try-On | Multi-Angle | Assets | Saved | Credits | Dashboard
│
└── HTTPS → Express Server (Node.js, EC2)
        │
        ├── Middleware stack:
        │   Helmet → CORS → JSON (25 MB limit) → cookieParser → Routes → errorHandler
        │
        ├── Auth middleware: Cognito JWT verify (aws-jwt-verify) → req.user
        │
        ├── PostgreSQL via Prisma ORM
        │   Models: User, Storyboard, Image, Asset, CreditTransaction,
        │           ModelPricing, CreditConfig, ApiLog,
        │           Affiliate, AffiliateClick, UserAffiliation
        │
        ├── AWS S3 (botstudiox-uploads)
        │   ├── Client-direct upload via presigned PUT URLs
        │   ├── Presigned GET URLs with ResponseCacheControl (1-hour browser cache)
        │   └── Server-proxied raw download: GET /api/images/:id/raw?dl=1
        │
        └── External AI APIs
            ├── Google Gemini API  ──→  /api/generate/image, /api/generate/plan
            ├── fal.ai FLUX Pro    ──→  /api/flux/image
            ├── fal.ai GPT-Image-2 ──→  /api/openai/image
            ├── fal.ai Qwen Angles ──→  /api/qwen/angles
            └── Google Gemini      ──→  /api/tryon

Browser (admin.botzudio.com)
│
└── Same Express server
    Admin routes gated by: authenticate middleware + ADMIN_EMAILS env var
    Subdomain enforcement: AdminOnlyHost / MainOnlyHost React guards
```

---

## Backend API Reference

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Server liveness check. Returns `{ status: "ok", timestamp }`. |

---

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/auth/me` | Bearer | Returns authenticated user profile from DB. |
| POST | `/api/auth/me` | Bearer | Upserts user in DB from Cognito identity. Fetches email from Cognito userInfo for Google SSO users. |
| POST | `/api/auth/logout` | None | Returns `{ ok: true }`. |
| POST | `/api/auth/cognito/exchange` | None | Exchanges PKCE authorization code for tokens. Sets HttpOnly refresh cookie. Returns `accessToken` + `idToken`. |
| POST | `/api/auth/cognito/refresh` | HttpOnly cookie | Reads `bsx_refresh` cookie, returns fresh tokens. |
| POST | `/api/auth/cognito/logout` | None | Clears `bsx_refresh` HttpOnly cookie. |

---

### Storyboards — `/api/storyboards`

All routes require Bearer token.

| Method | Path | Description |
|---|---|---|
| POST | `/api/storyboards` | Create a new storyboard. |
| GET | `/api/storyboards` | List all user storyboards. |
| GET | `/api/storyboards/:id` | Fetch one storyboard (ownership enforced). |
| PATCH | `/api/storyboards/:id` | Update storyboard fields. |
| DELETE | `/api/storyboards/:id` | Delete storyboard. |
| POST | `/api/storyboards/:id/duplicate` | Duplicate storyboard. |
| PATCH | `/api/storyboards/:id/set-active` | Mark as active storyboard. |

---

### Images — `/api/images`

All routes require Bearer token.

| Method | Path | Description |
|---|---|---|
| POST | `/api/images` | Register generated image in DB and upload to S3. |
| GET | `/api/images` | List images. Supports `?kind=` and `?storyboardId=` filters. |
| GET | `/api/images/:id` | Get image metadata + presigned download URL. |
| GET | `/api/images/:id/raw` | Stream raw bytes from S3. Add `?dl=1` for `Content-Disposition: attachment`. |
| DELETE | `/api/images/:id` | Delete from S3 + DB. |
| POST | `/api/images/batch-delete` | Delete multiple images by ID array. |

---

### Generation — `/api/generate`

All routes require Bearer token + rate limiter.

| Method | Path | Description |
|---|---|---|
| POST | `/api/generate/plan` | Text prompt → Gemini → returns plan text + token usage. Logs to api_logs. |
| POST | `/api/generate/image` | Generate image via Gemini. Handles free quota, atomic credit deduction, auto-refund on failure. Returns base64 image + `balanceAfter` + `freeImagesRemaining`. |

---

### Assets — `/api/assets`

All routes require Bearer token.

| Method | Path | Description |
|---|---|---|
| POST | `/api/assets/upload` | Returns presigned S3 PUT URL for direct client upload. |
| POST | `/api/assets` | Register asset in DB after S3 upload. |
| GET | `/api/assets` | List user assets with presigned download URLs. |
| DELETE | `/api/assets/:id` | Delete from S3 + DB. |

---

### Usage — `/api/usage`

| Method | Path | Description |
|---|---|---|
| GET | `/api/usage` | Dashboard stats: storyboard/image/asset counts, daily generation chart (30 days), API logs (last 50), user profile. |

---

### Credits — `/api/credits`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/credits/model-pricing` | Public | Current credit prices per model (cached 60s). |
| GET | `/api/credits/balance` | Bearer | Balance, free images used/remaining, `isDeveloper` flag. |
| GET | `/api/credits/transactions` | Bearer | Last 50 credit transactions. |
| POST | `/api/credits/self-topup` | Bearer | Self-service 10,000 credit refill (developer only). |
| GET | `/api/credits/admin/users` | Admin | All users with balances and image counts. |
| POST | `/api/credits/admin/users/:id/topup` | Admin | Add or deduct credits for a user. |
| DELETE | `/api/credits/admin/users/:id` | Admin | Hard-delete user and all cascade records. |
| GET | `/api/credits/admin/model-pricing` | Admin | All model pricing rows. |
| PUT | `/api/credits/admin/model-pricing` | Admin | Bulk-update credit prices per model. |

---

### FLUX — `/api/flux`

| Method | Path | Description |
|---|---|---|
| POST | `/api/flux/image` | Generate via fal-ai/flux-pro/kontext/multi. Reserves credits → calls fal.ai → records transaction + API log. Returns base64 + `balanceAfter`. |

---

### GPT Image — `/api/openai`

| Method | Path | Description |
|---|---|---|
| POST | `/api/openai/image` | Generate via GPT Image 2 (fal.ai). Cost varies by `quality` + `size`. Returns base64 + `balanceAfter`. |

---

### Multi-Angle — `/api/qwen`

| Method | Path | Description |
|---|---|---|
| POST | `/api/qwen/angles` | Generate rotated product view. Accepts base64 image + horizontal/vertical angle + zoom. Returns image + `balanceAfter`. |

---

### Try-On — `/api/tryon`

| Method | Path | Description |
|---|---|---|
| POST | `/api/tryon` | Virtual try-on via Gemini Flash. Accepts `garmentImage`, `humanImage`, `category`. Fixed cost: 5 credits. |

---

### Affiliates — `/api/affiliates`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/affiliates/r/:code` | Public | Look up affiliate, record click, return `bonusCredits`. |
| POST | `/api/affiliates/attribute` | Bearer | Attribute user to affiliate (one-time, post-signup). |
| POST | `/api/affiliates/redeem` | Bearer | Redeem promo/affiliate code for credits. |
| GET | `/api/affiliates/admin/overview` | Admin | Aggregate stats + 30-day signups. |
| GET | `/api/affiliates/admin` | Admin | Paginated affiliate list with search + status filter. |
| POST | `/api/affiliates/admin` | Admin | Create affiliate with auto-generated code. |
| PUT | `/api/affiliates/admin/:id` | Admin | Update affiliate. |
| DELETE | `/api/affiliates/admin/:id` | Admin | Delete affiliate. |
| GET | `/api/affiliates/admin/:id/activity` | Admin | Click/conversion activity for affiliate. |
| GET | `/api/affiliates/admin/:id/users` | Admin | Users attributed to affiliate. |

---

## AI Pipeline Details

### 1. Flash — Gemini 2.5 Flash Image

- **Cost:** 5 credits · **Free quota:** First 30 images
- Two-step: garment reference cutout → composite scene with model/pose/background.
- Results cached by garment SHA-256 hash in IndexedDB — saves credits on repeat runs.
- Multi-angle (back + detail) generated with primary result as reference.

### 2. ProMax — Gemini 3 Pro Image Preview

- **Cost:** 20 credits · **Free quota:** First 30 images
- Highest Gemini quality. Optional two-pass flow. Concise prose prompting.
- Best for: garments where texture, drape, and color accuracy are critical.

### 3. Pro (GPT) — GPT Image 2 via fal.ai

- **Cost:** 6–25 credits (paid-only)

  | Quality | Size | Credits |
  |---|---|---|
  | Medium | 1024×768 | 6 |
  | Medium | 1024×1024 | 9 |
  | High | 1024×768 | 17 |
  | High | 1024×1024 | 25 |

- Edit-anchor prompt approach ("EDIT THE PROVIDED IMAGE") forces in-painting mode.
- Only garment image + optional model photo sent as API references; all styling is text-only.

### 4. FLUX — fal-ai FLUX Pro Kontext Multi

- **Cost:** 5 credits (paid-only)
- Instruction-following image editing. Takes garment IMAGE 1 + optional model IMAGE 2.
- Used standalone and as the multi-angle engine inside the Hybrid pipeline.

### 5. Plus (Hybrid) — Gemini Flash + FLUX Kontext

- **Cost:** Paid-only. ~₹3.25 (primary) + ~₹7.66 (back + detail FLUX calls) per full set.
- **Primary:** Single Gemini 2.5 Flash call, raw garment as IMAGE 1.
- **Multi-angle:** Back + detail generated in parallel by FLUX using the Gemini primary result — raw garment inputs never reach FLUX, preventing identity drift.
- Best for: brands needing front, back, and detail in one consistent workflow.

---

## Credit System

### How Credits Work

1 credit ≈ ₹1 INR. Credits deducted atomically at generation time. Auto-refunded on API failure. All transactions logged with `balanceAfter` snapshot.

### Free Quota

30 free images per account — Flash and ProMax (Gemini) only. All other pipelines are paid-only.

### Credit Prices

| Pipeline | Credits per Image | Free |
|---|---|---|
| Flash (Gemini 2.5 Flash) | 5 | Yes |
| ProMax (Gemini 3 Pro) | 20 | Yes |
| FLUX Pro Kontext | 5 | No |
| GPT Medium 1024×768 | 6 | No |
| GPT Medium 1024×1024 | 9 | No |
| GPT High 1024×768 | 17 | No |
| GPT High 1024×1024 | 25 | No |

### Credit Packs

| Pack | Price | Credits |
|---|---|---|
| Starter | ₹499 | 300 |
| Standard | ₹1,660 | 1,000 |
| Custom | Slider | 300–10,000 at ₹1.66/credit |

---

## Auth Flow

**Provider:** AWS Cognito Hosted UI with PKCE (SHA-256 code challenge).  
**Sign-in:** Email/password, Google SSO, Apple SSO.

1. Client generates PKCE verifier/challenge → redirects to Cognito.
2. Cognito redirects to `/auth/callback` with authorization code.
3. Client POSTs code + PKCE verifier to `POST /api/auth/cognito/exchange`.
4. Server exchanges with Cognito → **refresh token set as HttpOnly cookie** (`bsx_refresh`), access token returned to client.
5. Access token stored **in-memory only**. Id token stored in `localStorage`.
6. On 401: `refreshTokenOnce()` (mutex-protected) reads HttpOnly cookie → returns fresh tokens.
7. All API calls via `apiFetch()` → injects `Authorization: Bearer <token>` + `credentials: "include"`.

**Admin auth:** Standalone email/password login (24-hour localStorage session). Server gates admin routes via `ADMIN_EMAILS` env var.

---

## Database Models

### User
`id` · `email` (unique) · `name` · `cognitoSub` · `creditsBalance` · `freeImagesUsed` · `createdAt` · `updatedAt`

### Storyboard
`id` · `userId` (FK) · `title` · `garmentType` · `isActive` · `previewUrl` · 22 generation config columns (occasion, accessories, background, model, pose, styling, footwear, print) · `createdAt` · `updatedAt`

### Image
`id` · `userId` (FK) · `storyboardId` (FK, SetNull) · `title` · `kind` (`main`/`back`/`detail`/`print`) · `mimeType` · `fileName` · `s3Key` · `s3Bucket` · `fileSizeBytes` · `storyboardTitle` · `createdAt`

### Asset
`id` · `userId` (FK) · `kind` (`garment`/`background`/`model`/`pose`) · `title` · `mimeType` · `s3Key` · `s3Bucket` · `fileSizeBytes` · `createdAt`

### CreditTransaction
`id` · `userId` (FK) · `amountInr` · `type` · `description` · `balanceAfter` · `createdAt`

### ModelPricing
`modelKey` (PK) · `credits` · `updatedAt`

### CreditConfig
`id` (singleton) · `perImageCostInr` · `updatedAt`

### ApiLog
`id` · `userId` (FK) · `type` · `model` · `promptTokens` · `outputTokens` · `totalTokens` · `latencyMs` · `status` · `errorMessage` · `createdAt`

### Affiliate
`id` · `name` · `email` (unique) · `affiliateCode` (unique) · `commissionPercentage` · `bonusCredits` · `promoBonusCredits` · `promoValidUntil` · `status` · `totalClicks` · `totalUsers` · `totalRevenue` · `totalCommission`

### AffiliateClick
`id` · `affiliateId` (FK) · `sessionId` · `ipAddress` · `device` · `browser` · `utmSource` · `timestamp`

### UserAffiliation
`id` · `userId` · `affiliateId` (FK) · `signupDate` · `purchaseAmount` · `commissionGenerated` — unique `[userId, affiliateId]`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `COGNITO_USER_POOL_ID` | Yes | AWS Cognito user pool ID |
| `COGNITO_CLIENT_ID` | Yes | AWS Cognito app client ID |
| `COGNITO_DOMAIN` | Yes | Cognito hosted UI domain |
| `GEMINI_API_KEY` | Yes | Google Generative Language API key |
| `AWS_ACCESS_KEY_ID` | Yes | AWS IAM access key (S3 read/write) |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS IAM secret key |
| `FAL_API_KEY` | Yes | fal.ai API key (FLUX, GPT-Image, Qwen, Hybrid) |
| `PORT` | No | Express port (default: `4000`) |
| `NODE_ENV` | No | `production` in production |
| `CORS_ORIGIN` | No | Comma-separated allowed origins |
| `GPT_IMAGE_API_KEY` | No | Separate GPT Image key; falls back to `FAL_API_KEY` |
| `DEVELOPER_EMAIL` | No | Emails with developer self-top-up privileges |
| `ADMIN_EMAILS` | No | Emails with admin dashboard access |
| `AWS_REGION` | No | AWS region (default: `us-east-1`) |
| `S3_BUCKET` | No | S3 bucket name (default: `botstudiox-uploads`) |
| `APP_URL` | No | Public app URL for affiliate link generation |

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- AWS account (S3 bucket + Cognito user pool)
- fal.ai API key
- Google Generative Language API key

### Steps

```bash
# 1. Clone
git clone https://github.com/sritharun242004/BotXstudio.git
cd BotXstudio

# 2. Install frontend deps
npm install

# 3. Install backend deps
cd server && npm install

# 4. Configure env
cp server/.env.example server/.env
# Fill in all required variables

# 5. Set up database
cd server
npx prisma migrate dev
npx prisma generate

# 6. Start backend (Terminal 1)
cd server && npm run dev
# → http://localhost:4000

# 7. Start frontend (Terminal 2)
npm run dev
# → http://localhost:5173
```

**Verify:**
- `http://localhost:5173` — landing page
- `http://localhost:5173/login` — Google SSO
- `http://localhost:5173/app` — main app (post-login)
- `http://localhost:5173/admin/login` — admin panel

---

## Deployment

### Infrastructure

| Component | Technology |
|---|---|
| Compute | AWS EC2 (Node.js + Express serves built React SPA) |
| Database | PostgreSQL (RDS or self-hosted) |
| Storage | AWS S3 (`botstudiox-uploads`) |
| Process manager | PM2 (`botstudiox` process) |
| Reverse proxy | Nginx (in front of Express) |
| Domains | `botzudio.com` + `admin.botzudio.com` → same EC2, routed by Nginx `Host` header |

### CI/CD (GitHub Actions)

Triggered on push to `main`. Deploys via SSH to EC2.

**Required secrets:** `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`

```bash
# Steps run on EC2:
git pull origin main

# Build frontend
npm ci && npx vite build

# Build backend
cd server && npm ci
npx prisma generate && npx tsc

# Restart
pm2 restart botstudiox && pm2 save
```

### PM2 Setup (first time)

```bash
npm install -g pm2

cd /var/www/botstudiox/server
pm2 start dist/index.js --name botstudiox
pm2 save && pm2 startup
```

### Manual Deploy

```bash
ssh -i your-key.pem ubuntu@your-ec2-host
cd /var/www/botstudiox

git pull origin main
npm ci && npx vite build
cd server && npm ci && npx prisma generate && npx tsc

pm2 restart botstudiox && pm2 save
```
