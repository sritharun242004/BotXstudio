# BotStudioX — AI Fashion Imagery Platform

> Generate studio-quality product photos in minutes. No photographer. No model. No studio.

BotStudioX is an AI-powered platform that lets fashion brands and e-commerce sellers produce professional garment imagery at a fraction of the cost of traditional photoshoots. Upload a garment photo, pick a model and setting, and get a polished product image — front, side, back, and detail views — ready to publish.

---

## What It Does

| Workflow | What You Get |
|---|---|
| **Generate** | Composite image of a model wearing your garment, styled automatically by AI |
| **Prints** | Apply custom patterns or recolor garments (hex color control) |
| **Multi-Angle** | Side view, back view, and zoomed detail shots from a single composite |
| **Assets Library** | Save and reuse models, poses, and backgrounds across projects |
| **Storyboards** | Organize campaigns — create, rename, duplicate, delete |
| **Gallery** | Download and manage all generated outputs |
| **API Usage** | Per-user analytics: calls, tokens consumed, latency |

---

## Tech Stack

**Frontend:** React 18 + TypeScript, Vite, React Router v7, AWS Cognito (auth)

**Backend:** Node.js, Express + TypeScript, PostgreSQL (Neon) via Prisma ORM, AWS S3 (asset/image storage), AWS Cognito (JWT verification)

**AI:** Google Gemini 2.0 Flash — text (look planning, prompt generation) and image generation (composite, prints, multi-angle)

**Infrastructure:** Docker + Docker Compose, Neon PostgreSQL, AWS S3 + Cognito, rate limiting, CORS/Helmet security

---

## Project Structure

```
BotXstudio/
├── src/                    # React frontend
│   ├── App.tsx             # Root component (all workflows, state)
│   ├── lib/
│   │   ├── pipeline.ts     # Core image generation pipeline (~2,300 lines)
│   │   └── storyboards.ts  # Storyboard CRUD + localStorage sync
│   └── components/         # UI components
├── server/
│   ├── src/
│   │   ├── controllers/    # Express route handlers
│   │   ├── services/
│   │   │   └── gemini.service.ts   # Gemini API client + retry logic
│   │   └── middleware/
│   │       └── authenticate.ts     # Cognito JWT verification
│   └── prisma/
│       └── schema.prisma   # DB schema (User, Storyboard, Image, Asset, ApiLog)
├── model-templates/        # Reference model/pose images
├── docker-compose.yml
└── README.md
```

---

## Key Capabilities

- **AI Look Planning** — Analyzes garment and generates a full styling plan (occasion, color scheme, accessories) before generating the image
- **Role-Based Prompting** — Each input image is assigned an explicit role (clothing, identity, structure, environment) to prevent visual conflicts
- **Saree Specialist Pipeline** — Dedicated flow for Indian traditional wear with draping rules and pallu positioning
- **Retry / Correction System** — Refine outputs with targeted feedback comments; the pipeline corrects and regenerates
- **Identity Preservation** — Maintains face and body consistency across multi-angle generations
- **Multi-Tenant Auth** — Per-user Cognito authentication with token tracking and API logging

---

## Database Schema

Five tables managed via Prisma:

- `User` — Cognito-linked user accounts
- `Storyboard` — Campaign configurations (22 fields: occasion, style, model preset, pose preset, background theme, print details, etc.)
- `Image` — Generated image records with S3 URLs
- `Asset` — Saved model/pose/background images with S3 URLs
- `ApiLog` — Per-user API call logs (type, model, tokens, latency, status)

---

## Environment Variables

### Frontend (`/.env`)
```
VITE_API_BASE_URL=
VITE_AWS_REGION=
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
```

### Backend (`/server/.env`)
```
DATABASE_URL=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
GEMINI_API_KEY=
PORT=3001
```

---

## Running Locally

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install

# Run frontend (port 5173)
npm run dev

# Run backend (port 3001)
cd server && npm run dev
```

Or with Docker:

```bash
docker-compose up --build
```

---

## Deployment

Multi-stage Docker build produces a single image containing both the Vite-compiled frontend (served as static files) and the Express backend. The `docker-compose.yml` wires up environment variables and exposes port 3001.

---

## Company

Built by **The Bot Company** — [thebotcompany.in](https://thebotcompany.in)

Version 2.0 — Production
