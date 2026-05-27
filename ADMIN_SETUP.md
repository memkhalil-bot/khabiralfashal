# Admin Dashboard Setup Guide

The admin dashboard lives at `/admin` and is fully built — it just needs the
database migration applied and your user account granted the `admin` role.

---

## Step 1 — Apply the database migration

Open the Supabase SQL Editor for project `jdbydwyzydjuyjhgepvz`:

> https://supabase.com/dashboard/project/jdbydwyzydjuyjhgepvz/sql/new

Paste and run the entire contents of:

```
supabase/migrations/20260527120000_admin_roles_and_policies.sql
```

This creates:
- `public.user_roles` table (with RLS)
- `public.has_role()` security-definer function
- SELECT policy on `founder_assessments` for admin users
- INSERT / UPDATE / DELETE policies on `testimonials` for admin users

---

## Step 2 — Create your admin user

In the Supabase Dashboard:

1. Go to **Authentication → Users → Invite User** (or use **Add User → Create New User**).
2. Enter your email and a strong password.
3. Copy the generated **User UUID** (shown in the Users table).

Then in the **SQL Editor**, run:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<paste-your-uuid-here>', 'admin');
```

---

## Step 3 — Enable email/password auth (if not already on)

1. Supabase Dashboard → **Authentication → Providers → Email**
2. Make sure **Enable Email Provider** is toggled ON.
3. For a private admin panel, turn **OFF** "Allow new users to sign up" so only
   manually-created users can log in.

---

## Step 4 — Sign in

Navigate to `/admin/login` on your deployed site (or `http://localhost:8080/admin/login`
during local dev) and sign in with the credentials you created in Step 2.

---

## Dashboard routes

| Path                   | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `/admin/login`         | Login page (public, no auth required)          |
| `/admin`               | Overview — stats + recent submissions          |
| `/admin/submissions`   | All founder assessment submissions with detail |
| `/admin/testimonials`  | Add / edit / delete / publish testimonials     |

---

## Security model

- Supabase Auth (email + password) provides authentication.
- `public.user_roles` table stores which users have the `admin` role.
- `public.has_role()` is a `SECURITY DEFINER` function called inside RLS
  policies — this pattern prevents users from gaining access by manipulating
  their own JWT or profile data.
- `founder_assessments` has an admin-only SELECT policy; anon users still
  cannot read submissions.
- `testimonials` has admin-only INSERT / UPDATE / DELETE; the public SELECT
  (published rows only) is unchanged.

---

## Adding a second admin

```sql
-- Find their UUID after they sign in
SELECT id, email FROM auth.users;

-- Grant admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('<uuid>', 'admin');
```

## Revoking admin access

```sql
DELETE FROM public.user_roles
WHERE user_id = '<uuid>' AND role = 'admin';
```
