# Ammar Resume

A minimalist, text-first personal portfolio site. Supabase-only, no vendor lock-in, AWS deployable.

## Quick Start

### 1. Run SQL Script

In Supabase SQL Editor, run the complete setup script:

```sql
-- Copy and paste contents of:
docs/sql/000_all.sql
```

This creates:
- Tables: `site_settings`, `projects`, `writing_categories`, `writing_items`, `analytics_events`
- RLS policies for security
- RPC functions: `is_admin()`, `bootstrap_set_admin()`, `claim_admin()`
- Storage bucket: `assets` (for images/files)
- Seed data (sample projects and writing)

### 2. Set Bootstrap Token (IMPORTANT!)

Generate a secure random token:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or OpenSSL
openssl rand -hex 32
```

**Save this token** - you'll need it to become admin!

Then run this SQL (replace `YOUR_TOKEN` with your generated token):

```sql
UPDATE public.site_settings 
SET bootstrap_token_hash = encode(digest('YOUR_TOKEN', 'sha256'), 'hex')
WHERE id = 'a0000000-0000-0000-0000-000000000001';
```

### 3. Set Environment Variables

In your deployment (Lovable, Vercel, AWS, etc.):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

See `.env.example` for reference.

### 4. Create Auth User

In Supabase Dashboard → Authentication → Users → Add User (email/password).

**Tip:** Disable "Confirm email" in Authentication → Settings for faster testing.

### 5. Initialize Site

1. Visit `/admin`
2. Sign in with your Supabase Auth credentials
3. Enter your bootstrap token
4. Done! You're now the admin.

---

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Postgres + Auth + Storage)
- **Deployment:** AWS (S3/CloudFront) or any static host

## Features

- **Public Site:** Home, Projects, Writing, Resume, Contact
- **Admin Dashboard:** Full CRUD for projects/writing, settings management
- **Security:** RLS on all tables, secure bootstrap mechanism
- **Fallback:** Graceful defaults if Supabase unavailable
- **No Lock-in:** Works anywhere, deploy to AWS/Vercel/Netlify

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── AdminGuard.tsx   # Auth + bootstrap flow
│   ├── Nav.tsx, Footer.tsx, etc.
├── lib/
│   ├── db.ts            # Supabase queries
│   ├── supabaseClient.ts
│   ├── defaultSiteSettings.ts
│   ├── types.ts
├── pages/
│   ├── Home.tsx, Projects.tsx, etc.
│   └── admin/
│       ├── Dashboard.tsx
│       ├── AdminSettings.tsx
│       └── ...
docs/sql/
└── 000_all.sql          # Single idempotent setup script
```

## Database Schema

| Table | Description |
|-------|-------------|
| `site_settings` | Singleton config (nav, theme, SEO, pages) |
| `projects` | Portfolio items with content, metrics, media |
| `writing_categories` | Categories for external articles |
| `writing_items` | External article links with language badges |
| `analytics_events` | Page views and interactions |

| View | Description |
|------|-------------|
| `public_site_settings` | Safe public view (excludes admin_user_id) |

| Function | Description |
|----------|-------------|
| `is_admin()` | Returns true if current user is admin |
| `bootstrap_set_admin(token)` | Secure first-time admin setup |
| `claim_admin()` | Legacy/fallback admin claim (if no token set) |

## Security

- **RLS enforced** on all tables
- **Bootstrap token** required for first admin setup (SHA256 hashed in DB)
- **Token cleared** after successful bootstrap
- **No service_role key** in frontend code
- **Frontend checks are UX only** - RLS is the real security boundary

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Your Supabase anon/public key |

## Deployment

### AWS (S3 + CloudFront)

1. Build: `npm run build`
2. Upload `dist/` to S3 bucket
3. Configure CloudFront with SPA error page (index.html for 404s)
4. Set environment variables in build process

### Vercel/Netlify

1. Connect Git repository
2. Set environment variables in dashboard
3. Deploy

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

## Troubleshooting

### "Bootstrap token required" error
- Make sure you set the `bootstrap_token_hash` in the database (see step 2)
- Use the exact token you generated (case-sensitive)

### "Not authorized" after login
- Check if another user already claimed admin
- Query: `SELECT admin_user_id FROM site_settings;`

### Site shows default content
- Check if environment variables are set
- Check browser console for Supabase errors

## License

MIT
