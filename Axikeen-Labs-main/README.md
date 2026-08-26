# SaneSpace

SaneSpace is the space that is there for you — a personal AI companion for school, work, relationships, and everyday life.

## What it does

SaneSpace combines culturally aware conversation, personal memory, and responsible safety support:

- **Adaptive chat** — listener, coach, companion, and care modes shaped around user emotion, context, and intent
- **Language profiles** — Nigerian Pidgin, Lagos English, Student English, Nigerian Home English, Neutral/International
- **Personal memory** — user-controlled context and emotional memory to make the experience feel familiar and supportive
- **Crisis tier system** — safe / monitor / escalate / stop, with humane escalation resources and clear boundaries
- **Reasoning transparency** — AI responses can show how context, risk, and language are being interpreted
- **Mood check-ins** — quick daily logging, trends, and reflection on what helps the user feel steadier
- **Voice-first direction** — a path toward natural voice interaction and ambient presence without losing the personal relationship layer

See [PRD_ADDENDUM_AI_READINESS.md](./PRD_ADDENDUM_AI_READINESS.md) for the full AI reasoning pipeline, risk thresholds, and evaluation metrics.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS with a CSS-variable dark mode system (`next-themes`)
- Framer Motion for animation, React Three Fiber/Drei for the landing page 3D hero
- Google OAuth / OpenID Connect for the initial sign-in flow, with a SaneSpace-owned session layer
- Groq for LLM inference

## Local development

```bash
npm install
cp .env.example .env.local   # fill in Google + Groq keys
npm run dev
```

## Deploying to Vercel

1. Import this repo in Vercel.
2. Add the environment variables from `.env.example` in the Vercel project settings.
3. Deploy — no build configuration needed, Vercel auto-detects Next.js.
