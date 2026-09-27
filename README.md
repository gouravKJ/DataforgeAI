# DataForge AI — Data Intelligence Platform

**Describe the Data. We Build the Intelligence.**

DataForge AI turns a natural-language data requirement into a verified, source-backed dataset.
It plans the pipeline, discovers sources, collects, extracts, cleans, validates, resolves entities,
deduplicates, routes conflicts to human review, scores quality, and delivers an interactive dataset —
with per-field source traceability on every record.

```
USER REQUEST → AI UNDERSTANDING → SCHEMA → WORKFLOW PLAN → SOURCE DISCOVERY → COLLECTION
→ EXTRACTION → CLEANING → VALIDATION → ENTITY RESOLUTION → DEDUPLICATION
→ QUALITY SCORING → DATASET → DASHBOARD → EXPORT / API / HISTORY
```

## Quick start (zero config — no database server required)

```bash
npm install
npm run db:push     # creates prisma/dev.db (SQLite twin of the Postgres schema)
npm run db:seed     # demo org, users, sources, a completed dataset with real conflicts
npm run dev         # http://localhost:3000
```

**Demo logins** (all password `demo1234`):

| Role | Email |
| --- | --- |
| Admin | `admin@demo.dataforge.ai` |
| Analyst | `analyst@demo.dataforge.ai` |
| Viewer | `viewer@demo.dataforge.ai` |

Optionally add `GROQ_API_KEY` to `.env` for live LLM parsing, planning, insights, and copilot.
Without a key the platform degrades to a deterministic local engine — every feature still works.

## Switching to PostgreSQL (production)

```bash
npm run db:use:postgres      # activates prisma/schema.postgres.prisma
# set DATABASE_URL in .env, then:
npx prisma generate && npx prisma db push && npm run db:seed
```
`npm run db:use:sqlite` switches back. Both schemas are kept in sync and validate cleanly.

## 3-minute demo walkthrough

1. **`/build`** — enter *"Find Indian SaaS companies founded after 2021 that are hiring Node.js developers."*
2. AI extracts intent, entities, filters, and output fields; edit the schema inline before running.
3. **Generate Workflow Plan** — an N-stage pipeline with domain-specific nodes.
4. **Run Pipeline** — live node-by-node progress over SSE: records processed, duration, errors, sources.
5. Watch duplicate collapse and conflicts get flagged — *not* silently resolved.
6. **`/datasets/:id`** — filter, then click a record for field-level provenance, confidence, and history.
7. **AI Insight** on the dataset, or **`/copilot`** → *"Which companies have the highest quality records?"*
8. **`/reviews`** — approve, correct, or reject conflicting values; corrections are marked HUMAN-VERIFIED.
9. **CSV / JSON export** for the final dataset, with a provenance manifest in the JSON.
10. **`/quality`** — quality distribution, provenance mix, validation and conflict rates.

## Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide, TanStack Query, Zod
- **Backend**: Next.js Route Handlers (25 REST endpoints) + service layer in `src/lib`
- **Database**: Prisma ORM — PostgreSQL (production) and SQLite (zero-config local) twins
- **Jobs**: durable DB-backed queue with SSE live progress (single-flight worker, stuck-job recovery)
- **AI**: provider-independent layer — Groq (OpenAI-compatible, model fallbacks) with a deterministic local fallback
- **Search**: hashed-embedding vectors + cosine similarity blended with keyword matching

## Architecture

```
src/app        pages + REST API routes (real HTTP boundaries)
src/lib/ai     provider abstraction, requirement parser, workflow planner, copilot, insights, embeddings
src/lib/pipeline  engine (9 stages) · queue/SSE · demo factory · source registry
src/components    design system, landing, app shell, feature UI
prisma         schema twins + seed
```

## Product principles (enforced in code)

- **Never fabricates collected data** — synthetic records are labeled `DEMO` on every field.
- **Never claims a source was accessed when it wasn't** — source registry distinguishes demo, file, and connector types.
- **Never silently resolves conflicts** — disagreements keep the higher-confidence value and open a review item naming both sources.
- **Never hides uncertainty** — confidence is stored and displayed per field; AI-enriched fields carry low confidence and an `AI-GENERATED` label.
- **Labels everything** — `SOURCE-DERIVED`, `AI-GENERATED`, `USER-PROVIDED`, `HUMAN-VERIFIED`, `DEMO DATA`.
- **Organization isolation** — every query is scoped by `orgId`; roles (Admin / Analyst / Viewer) are enforced server-side.
