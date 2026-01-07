# Ammar Resume

A minimalist, text-first personal site. Supabase-only, no vendor lock-in, AWS deployable.

## Quick Start

### 1. Run SQL Script

In Supabase SQL Editor, run:
```
docs/sql/000_all.sql
```

This creates tables, views, RLS policies, and seeds default data.

### 2. Set Environment Variables

In your deployment (Lovable, Vercel, etc.):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Create Auth User

In Supabase Dashboard → Authentication → Users → Add User (email/password).

### 4. Claim Admin

1. Visit `/admin` and login
2. Click "Claim Admin" button
3. Done! You now have admin access.

---

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Postgres + Auth + Storage)
- **Deployment:** AWS (S3/CloudFront) or any static host

## Features

- Minimalist public site (Home, Projects, Writing, Resume, Contact)
- Admin dashboard with CRUD for projects/writing
- SEO optimized, fast, responsive
- Graceful fallback to defaults if Supabase unavailable

## Project Structure

```
src/
├── components/ui/       # shadcn/ui
├── lib/
│   ├── db.ts            # Supabase queries
│   ├── supabaseClient.ts
│   └── defaultSiteSettings.ts
├── pages/
│   ├── Home.tsx, Projects.tsx, etc.
│   └── admin/
docs/sql/
└── 000_all.sql          # Single idempotent setup script
```

## Database Objects

| Object | Description |
|--------|-------------|
| `site_settings` | Singleton config (nav, theme, SEO) |
| `public_site_settings` | View excluding admin_user_id |
| `projects` | Portfolio items |
| `writing_categories/items` | External article links |
| `analytics_events` | Page views |

## Security

- RLS enforced on all tables
- `is_admin()` function checks auth.uid() against admin_user_id
- `claim_admin()` RPC for first-time setup (only works with placeholder UUID)
- Frontend checks are UX only - RLS is the security boundary

## License

MIT
