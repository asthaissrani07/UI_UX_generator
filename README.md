# UI/UX Mock — AI Mockup Generator

Full-stack SaaS app matching the [TubeGuruji tutorial](https://youtu.be/c9qA-uhysIY): generate website and mobile UI/UX mockups from prompts, with a draggable canvas, themes, downloads, and Clerk subscriptions.

## Features

- Landing page with prompt input, device type (website / mobile), and prompt suggestions
- Clerk authentication (Google / email)
- AI layout config then per-screen HTML + Tailwind mockups (OpenRouter)
- Draggable, resizable canvas with zoom/pan
- Theme switching without regenerating screens
- View source code, download PNG, edit with AI, delete screens
- Add new screens (paid plan)
- Project list with thumbnails
- Pricing via Clerk `PricingTable` (free: 2 projects; unlimited plan)

## Stack

- **Next.js 15** + React 19 + TypeScript
- **Tailwind CSS** + shadcn-style UI
- **Neon** PostgreSQL + **Drizzle ORM**
- **Clerk** auth + billing
- **OpenRouter** AI
- `react-zoom-pan-pinch`, `react-rnd`, `html-to-image`

## Setup

1. **Install dependencies**

```bash
npm install
```

2. **Environment** — copy `.env.example` to `.env.local` and fill in:

- `DATABASE_URL` — [Neon](https://neon.tech) connection string
- Clerk keys from [Clerk Dashboard](https://dashboard.clerk.com)
- `OPENROUTER_API_KEY` from [OpenRouter](https://openrouter.ai/)

3. **Database**

```bash
npm run db:push
```

4. **Clerk billing (optional)**

In Clerk Dashboard → **Billing** → enable billing → create plans:

- **Free** (default): limit features in app
- **unlimited** — plan key must be `unlimited` for `has({ plan: "unlimited" })`

5. **Run**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

| Path | Purpose |
|------|---------|
| `app/api/project` | CRUD projects + list |
| `app/api/generate-config` | AI screen layout JSON |
| `app/api/generate-screen-ui` | AI HTML per screen |
| `app/api/screen` | Add/delete screens |
| `app/project/[projectId]` | Canvas playground |
| `components/shared/` | Hero, canvas, settings, etc. |
| `config/schema.ts` | Drizzle tables |
| `data/themes.ts` | Theme presets |
| `data/prompts.ts` | AI system prompts |

## Deploy

Deploy to Vercel; set the same env vars. Run `npm run db:push` against production Neon before go-live.

## Video reference

Tutorial: [Build a Full-Stack AI UI/UX Generator](https://youtu.be/c9qA-uhysIY) — TubeGuruji (6h).
