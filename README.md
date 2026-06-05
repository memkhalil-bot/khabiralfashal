# خبير الفشل — Khabir Al Fashal

A cinematic, dark-themed website for a "Startup Failure Intelligence" practice. Includes a forensic landing page, an in-site psychological founder assessment ("Valley of Death"), a founder-to-founder testimonials rotator, and a Supabase-backed backend (managed via Lovable Cloud).

> **Stack:** React 18 · Vite 5 · TypeScript 5 · Tailwind CSS v3 · shadcn/ui · framer-motion · Supabase (Auth, Postgres, RLS) · React Router v6 · TanStack Query

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:8080 (or whatever Vite picks)
npm run build        # production build → dist/
npm run preview      # preview the production build
npm run lint         # eslint
```

Node 18+ recommended. The project also works with `bun install` / `bun run dev`.

---

## Environment variables

A `.env` file at the project root with the **three Supabase publishable values** is required. These are safe to commit-equivalent (they are public keys protected by RLS), but standard practice is to keep them out of git.

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon/publishable key>
VITE_SUPABASE_PROJECT_ID=<project-ref>
```

Copy the values from the Supabase project dashboard (**Settings → API**) into a local `.env` file. The `.env` file is git-ignored — do not commit it.

> If you migrate to a different Supabase project, re-run the SQL migrations in `supabase/migrations/` against it and update your `.env` accordingly.

No server-side secrets are needed for local dev — there are no edge functions in this project (yet).

---

## Project structure

```
src/
├── App.tsx                          # Router, providers, error boundary
├── main.tsx                         # Vite entry
├── index.css                        # Tailwind layers + design tokens (HSL)
├── pages/
│   ├── Home.tsx                     # Cinematic landing
│   ├── About.tsx
│   ├── Portfolio.tsx
│   ├── ProjectDetail.tsx
│   ├── Contact.tsx
│   ├── ValleyOfDeath.tsx            # Hero + curve diagram + assessment + testimonials
│   ├── Index.tsx
│   └── NotFound.tsx
├── components/
│   ├── layout/                      # Header, Footer, Layout, ThemeToggle
│   ├── seo/SEOHead.tsx
│   ├── valley/
│   │   ├── ValleyCurve.tsx          # Animated SVG valley-of-death curve
│   │   ├── ValleyQuizArabic.tsx     # (legacy Arabic quiz, kept for reference)
│   │   └── FounderAssessment.tsx    # 10-question psychological diagnostic
│   ├── testimonials/
│   │   └── FounderTestimonials.tsx  # Rotating cinematic quote slider
│   ├── portfolio/                   # Grid, cards, lightbox, filters
│   ├── forms/ContactForm.tsx
│   └── ui/                          # shadcn primitives
├── integrations/supabase/
│   ├── client.ts                    # ⚠ AUTO-GENERATED — do not edit
│   └── types.ts                     # ⚠ AUTO-GENERATED — DB types
├── hooks/                           # use-mobile, use-toast, useMediaQuery, useScrollPosition
├── data/                            # static photographer/projects seed
├── types/                           # shared TS types
└── lib/utils.ts                     # cn() helper

supabase/
├── config.toml                      # Supabase project id only
└── migrations/                      # Forward-only SQL — run in order
    ├── 20260527100531_...sql        # founder_assessments table + RLS
    └── 20260527103008_...sql        # testimonials table + seed rows
```

---

## Routes

| Path                  | Page                | Notes                                                                 |
| --------------------- | ------------------- | --------------------------------------------------------------------- |
| `/`                   | `Home`              | Hero, manifesto, pattern intel, testimonials, closing CTA             |
| `/about`              | `About`             |                                                                       |
| `/portfolio`          | `Portfolio`         |                                                                       |
| `/portfolio/:slug`    | `ProjectDetail`     |                                                                       |
| `/contact`            | `Contact`           |                                                                       |
| `/valley-of-death`    | `ValleyOfDeath`     | Hero → `ValleyCurve` → `FounderAssessment` → `FounderTestimonials`    |
| `*`                   | `NotFound`          |                                                                       |

> **There is no `/admin` route.** See [Admin access](#admin-access--viewing-submissions) below.

---

## Backend / database schema

Two Postgres tables in the `public` schema. Both have RLS enabled and explicit GRANTs.

### `founder_assessments` — submissions from the Valley of Death diagnostic

| Column        | Type        | Notes                                          |
| ------------- | ----------- | ---------------------------------------------- |
| `id`          | uuid PK     | `gen_random_uuid()`                            |
| `email`       | text NOT NULL |                                              |
| `name`        | text        |                                                |
| `company`     | text        |                                                |
| `stage`       | text        | e.g. Pre-Seed, Seed, Series A                  |
| `sector`      | text        |                                                |
| `country`     | text        |                                                |
| `answers`     | jsonb NOT NULL | Map of `questionId → 1..5`                  |
| `risk_score`  | int NOT NULL | 0–100, computed client-side                    |
| `risk_level`  | text        | STABLE / EXPOSED / INSIDE THE VALLEY / COLLAPSE PROXIMITY |
| `blind_spots` | text[]      | Derived list of weak-signal flags              |
| `insight`     | text        | Personalized closing line                      |
| `user_agent`  | text        |                                                |
| `created_at`  | timestamptz | `now()`                                        |

**RLS:** `INSERT` allowed for `anon` + `authenticated` (so anyone can submit). **No SELECT/UPDATE/DELETE policies** — only the `service_role` (Cloud dashboard) can read submissions. This is intentional.

### `testimonials` — founder feedback rotator

| Column        | Type        | Notes                                |
| ------------- | ----------- | ------------------------------------ |
| `id`          | uuid PK     |                                      |
| `quote`       | text NOT NULL |                                    |
| `author_name` | text NOT NULL |                                    |
| `author_role` | text        |                                      |
| `company`     | text        |                                      |
| `order_index` | int NOT NULL DEFAULT 0 | Lower = shown first       |
| `published`   | bool NOT NULL DEFAULT true | Set false to hide      |
| `created_at`  | timestamptz |                                      |
| `updated_at`  | timestamptz | Auto-updated by trigger              |

**RLS:** public `SELECT` where `published = true`. Editing happens via the Cloud dashboard (service role).

Seeded with 5 founder-tone placeholder quotes — replace these any time from the dashboard.

---

## Admin access / viewing submissions

This project **does not ship an in-app admin dashboard**. All admin tasks are performed in the Supabase / Lovable Cloud dashboard for the linked project.

### To view assessment submissions

1. Open the Supabase dashboard for project `jdbydwyzydjuyjhgepvz` (in Lovable: **Cloud → Open backend**; in Claude Code: log in at <https://supabase.com/dashboard>).
2. Go to **Table Editor → `founder_assessments`** to browse rows.
3. Or **SQL Editor** for queries / CSV export, e.g.:
   ```sql
   select created_at, name, email, stage, risk_score, risk_level
   from founder_assessments
   order by created_at desc;
   ```

### To edit testimonials

1. **Table Editor → `testimonials`**.
2. Add a row, or toggle `published` to hide/show, or change `order_index` to reorder.
3. Changes are picked up on the next page load (no rebuild needed).

### If you later want a real `/admin` page

Recommended approach when you build it in Claude Code:

1. Enable email/password auth in Supabase.
2. Create a separate `user_roles` table + `has_role()` security-definer function (never store roles on the profiles table).
3. Add SELECT policies on `founder_assessments` that use `public.has_role(auth.uid(), 'admin')`.
4. Build a protected `/admin` route that lists submissions and lets you edit testimonials.

There's a fuller pattern for this in the original Lovable system prompt; happy to scaffold it on request.

---

## Key flows

### Valley of Death assessment (`src/components/valley/FounderAssessment.tsx`)

- 10-step cinematic, single-question-at-a-time form.
- Keyboard nav (1–5 to answer, arrows for prev/next).
- On submit: computes `risk_score` (0–100), maps to `risk_level`, derives `blind_spots`, builds a personalized `insight` line, and `INSERT`s a row into `founder_assessments` via the Supabase JS client.
- Then renders a verdict screen with 3 CTAs (Emergency Session / Startup Autopsy / Founder Call).

### Founder testimonials (`src/components/testimonials/FounderTestimonials.tsx`)

- Fetches published rows from `testimonials` ordered by `order_index`.
- Auto-rotates every 7s, pauses on hover, click indicators to jump.
- Oversized serif quote mark, ember accent, dark cinematic backdrop. Used on both `Home` and `ValleyOfDeath`.

### Design tokens

All colors live in `src/index.css` as HSL CSS variables and are mapped through `tailwind.config.ts`. Notable custom token: `ember` (the orange accent). Never hardcode colors in components — use the tokens.

---

## Migrating the database to a new Supabase project

If you're moving to a brand-new Supabase project under your own account:

1. Create the project at <https://supabase.com/dashboard>.
2. In **SQL Editor**, run the migration files from `supabase/migrations/` in chronological order (they're forward-only and idempotent enough for a fresh DB).
3. Grab the new project's URL + anon key from **Project Settings → API**.
4. Update `.env` with the new `VITE_SUPABASE_*` values.
5. Regenerate `src/integrations/supabase/types.ts` if you change the schema:
   ```bash
   npx supabase gen types typescript --project-id <new-ref> > src/integrations/supabase/types.ts
   ```

---

## Deployment

Vite produces a fully static `dist/` folder — deploy it anywhere.

### Recommended hosts

- **Vercel** — `vercel --prod` from the project root. Set the three `VITE_SUPABASE_*` env vars in the Vercel project settings. Framework preset: **Vite**.
- **Netlify** — build command `npm run build`, publish directory `dist`, set the same env vars.
- **Cloudflare Pages** — build command `npm run build`, output `dist`.

### SPA routing

`react-router` uses client-side routing. Make sure your host rewrites all unknown paths to `/index.html`:

- **Vercel:** automatic with the Vite preset.
- **Netlify:** add a `public/_redirects` file with `/* /index.html 200`.
- **Cloudflare Pages:** add `public/_redirects` with `/* /index.html 200`.

### Lovable

If you want to keep deploying via Lovable instead, just hit **Publish** in the Lovable UI — it handles everything (build, host, custom domain).

---

## Handing the project to GitHub / Claude Code

From the Lovable UI (top-right): **GitHub → Connect to GitHub → Create Repository**. This pushes the full source — every file in this README's tree, including `supabase/migrations/`, `src/integrations/supabase/*` (auto-generated but committed), `.env` is **not** synced (Lovable manages it; you'll create your own locally).

Then in Claude Code:

```bash
git clone git@github.com:<you>/<repo>.git
cd <repo>
cp .env.example .env   # if you create one; otherwise paste the values above
npm install
npm run dev
```

That's it — the app will boot, hit the same Supabase backend, and you can keep building.

---

## Conventions for future work

- Semantic Tailwind tokens only; no raw hex/RGB in components.
- New tables: always `GRANT` + `ALTER TABLE ... ENABLE RLS` + explicit `CREATE POLICY` in the same migration.
- Never edit `src/integrations/supabase/client.ts` or `types.ts` by hand — they are regenerated.
- Roles, if you add them, go in a separate `user_roles` table with a security-definer `has_role()` function. Never on profiles.

---

See `HANDOFF.md` for a condensed checklist if you're handing this off to another developer.
