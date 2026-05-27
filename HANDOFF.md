# Handoff Checklist

Condensed pointer doc. Full detail is in [`README.md`](./README.md).

## 1. Codebase

- Frontend: `src/` (React 18 + Vite 5 + TS + Tailwind v3 + shadcn/ui)
- Routing: `src/App.tsx` (React Router v6)
- Pages: `src/pages/`
- Cinematic features:
  - Landing → `src/pages/Home.tsx`
  - Founder diagnostic → `src/pages/ValleyOfDeath.tsx`
    - Curve diagram: `src/components/valley/ValleyCurve.tsx`
    - Assessment: `src/components/valley/FounderAssessment.tsx`
  - Testimonials: `src/components/testimonials/FounderTestimonials.tsx` (used on Home + Valley)

## 2. Backend (Supabase via Lovable Cloud)

- Project ref: `jdbydwyzydjuyjhgepvz`
- Migrations: `supabase/migrations/` (run in order on any fresh DB)
- Tables:
  - `founder_assessments` — diagnostic submissions, anon `INSERT` only, no public read
  - `testimonials` — public `SELECT` where `published = true`
- No edge functions yet.
- No runtime secrets required by the frontend beyond the three `VITE_SUPABASE_*` values.

## 3. Environment variables

Create `.env` at project root:

```env
VITE_SUPABASE_URL=https://jdbydwyzydjuyjhgepvz.supabase.co
VITE_SUPABASE_PROJECT_ID=jdbydwyzydjuyjhgepvz
VITE_SUPABASE_PUBLISHABLE_KEY=<paste the publishable key from README.md>
```

## 4. Run locally

```bash
npm install
npm run dev
```

## 5. Admin / viewing submissions

**No in-app `/admin` route exists.** Submissions are viewed in the Supabase dashboard:

- Table editor → `founder_assessments` (read) and `testimonials` (read/write).
- SQL editor for CSV exports and ad-hoc queries.

If a real admin UI is needed, scaffold it using a `user_roles` table + `has_role()` security-definer function (see README → "If you later want a real `/admin` page").

## 6. Deploy

Static build (`npm run build` → `dist/`) deploys to Vercel / Netlify / Cloudflare Pages. SPA fallback to `/index.html` required. Set the three `VITE_SUPABASE_*` env vars in the host.

## 7. Sync to GitHub

In the Lovable UI: top-right **GitHub → Connect to GitHub → Create Repository**. Then `git clone` in Claude Code and continue.
