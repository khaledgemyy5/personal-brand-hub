# Ammar Resume

A minimalist, text-first personal site for hiring and personal branding, with a simple admin dashboard.

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **Deployment:** AWS (S3/CloudFront or ECS) + GitHub Actions

## Features

### Public Site
- Minimalist, fast, responsive design
- Home, Resume (ATS-friendly), Projects, Writing (external links), Contact pages
- SEO optimized with meta tags
- No internal blog - writing section links to external publications
- Project images only on detail pages (max 3, captioned, lazy-loaded)

### Admin Dashboard
- Protected routes with Supabase Auth
- CRUD for Projects and Writing
- Profile and SEO settings management
- Theme and visibility toggles

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── Nav.tsx          # Site navigation
│   ├── Footer.tsx       # Site footer
│   ├── PublicLayout.tsx # Layout wrapper for public pages
│   └── AdminLayout.tsx  # Layout wrapper for admin pages
├── pages/
│   ├── Home.tsx
│   ├── Resume.tsx         # ATS-friendly resume
│   ├── Projects.tsx
│   ├── ProjectDetail.tsx
│   ├── Writing.tsx
│   ├── Contact.tsx
│   ├── NotFound.tsx
│   └── admin/
│       ├── Dashboard.tsx
│       ├── AdminProjects.tsx
│       ├── AdminWriting.tsx
│       └── AdminSettings.tsx
├── hooks/               # Custom React hooks
├── lib/
│   ├── utils.ts         # Utility functions
│   ├── types.ts         # Shared TypeScript types
│   ├── security.ts      # Input sanitization and validation
│   └── supabaseClient.ts # Supabase browser client
├── App.tsx              # Router configuration
├── main.tsx             # Entry point
└── index.css            # Design system tokens
```

## Routes

### Public Routes
| Path | Page | Description |
|------|------|-------------|
| `/` | Home | Landing page with hero and previews |
| `/resume` | Resume | ATS-friendly resume with PDF download |
| `/projects` | Projects | List of published projects |
| `/projects/:slug` | ProjectDetail | Individual project page |
| `/writing` | Writing | External article links |
| `/contact` | Contact | Contact info and form |

### Admin Routes
| Path | Page | Description |
|------|------|-------------|
| `/admin` | Dashboard | Overview and quick actions |
| `/admin/analytics` | Analytics | Page views and event tracking |
| `/admin/projects` | AdminProjects | Manage projects |
| `/admin/writing` | AdminWriting | Manage writing links |
| `/admin/settings` | AdminSettings | Profile, SEO, theme |

## Local Development

### Prerequisites
- Node.js 18+
- npm or bun

### Setup

1. Clone the repository:
```bash
git clone https://github.com/username/ammar-resume.git
cd ammar-resume
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file with required variables:
```bash
# .env (create in project root)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start development server:
```bash
npm run dev
```

Visit `http://localhost:5173`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (public) | Yes |

> **Note:** This project is fully portable with no platform lock-in. It can be deployed to AWS (S3/CloudFront, ECS, Amplify), Vercel, Netlify, or any static hosting platform.

## Deployment

### Option A: Static Hosting (S3 + CloudFront)

1. Build the project:
```bash
npm run build
```

2. Upload `dist/` to S3 bucket

3. Configure CloudFront distribution with:
   - Origin: S3 bucket
   - SSL certificate
   - Custom domain

### Option B: Docker

1. Build Docker image:
```bash
docker build -t ammar-resume .
```

2. Run container:
```bash
docker run -p 80:80 ammar-resume
```

### Option C: GitHub Actions CI/CD

See `.github/workflows/deploy.yml` for automated deployment pipeline.

## Supabase Setup

### Complete Setup Steps

1. **Create Supabase project** at [supabase.com](https://supabase.com)

2. **Run SQL migrations** in order via Supabase SQL Editor:
   - `docs/sql/001_init.sql` - Creates tables, indexes, and `public_site_settings` view
   - `docs/sql/002_rls.sql` - Enables RLS and creates policies
   - `docs/sql/003_seed.sql` - Inserts default site settings and demo data

3. **Create admin user**:
   - Go to Dashboard → Authentication → Users → Add User
   - Create user with email/password
   - Copy the user's UUID

4. **Link admin user to settings**:
   ```sql
   SELECT set_admin_user('your-user-uuid-here');
   ```
   Or manually:
   ```sql
   UPDATE site_settings 
   SET admin_user_id = 'your-user-uuid-here' 
   WHERE id = 'a0000000-0000-0000-0000-000000000001';
   ```

5. **Set environment variables**:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

6. **Verify setup**:
   - Site should load without "Site settings not configured" error
   - Admin login should work at `/admin`

### Tables & Views

| Object | Type | Description |
|--------|------|-------------|
| `site_settings` | Table | Singleton row for nav, theme, SEO config |
| `public_site_settings` | View | Public view excluding `admin_user_id` |
| `projects` | Table | Portfolio projects with content, media, metrics |
| `writing_categories` | Table | Categories for writing items |
| `writing_items` | Table | External article links |
| `analytics_events` | Table | Simple page view tracking |

### Row Level Security

All tables have RLS enabled:
- **Public**: Read `public_site_settings` view, published projects, enabled writing
- **Public**: Insert analytics events (restricted event types)
- **Admin**: Full CRUD (authenticated user matching `admin_user_id`)

## Performance Targets

- Lighthouse Performance: >= 90
- Lighthouse Accessibility: >= 90
- Lighthouse Best Practices: >= 90
- Lighthouse SEO: >= 90

---

## Security

### Important: RLS is the Real Security Boundary

**Frontend checks are for UX only - never for security.**

All actual security is enforced via Supabase Row Level Security (RLS) policies. The frontend performs validation to improve user experience, but malicious users can bypass frontend code entirely. Always assume:

1. Any data exposed without RLS can be read by anyone
2. Any mutation without RLS can be performed by anyone
3. Frontend authentication checks prevent accidental access, not attacks

### Rotating the Anon Key

If your `VITE_SUPABASE_ANON_KEY` is compromised:

1. Go to Supabase Dashboard → Settings → API
2. Click "Rotate" next to the anon key
3. Update `VITE_SUPABASE_ANON_KEY` in your environment/deployment
4. Redeploy your application
5. The old key will stop working immediately

**Note:** The anon key is public by design - it only grants access to what RLS policies allow. Rotating is only necessary if you've accidentally exposed data via misconfigured RLS.

### Storage Bucket Security

#### Public Bucket (e.g., `assets`)
For publicly accessible files like images, favicons, PDFs:

```sql
-- Create public bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true);

-- Allow public read
CREATE POLICY "Public read assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'assets');

-- Only admin can upload/delete
CREATE POLICY "Admin upload assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assets' 
  AND auth.uid() = (SELECT admin_user_id FROM site_settings LIMIT 1)
);

CREATE POLICY "Admin delete assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assets' 
  AND auth.uid() = (SELECT admin_user_id FROM site_settings LIMIT 1)
);
```

#### Private Bucket (e.g., `private-docs`)
For sensitive files only the admin should access:

```sql
-- Create private bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('private-docs', 'private-docs', false);

-- Only admin can read/write
CREATE POLICY "Admin only private-docs"
ON storage.objects
TO authenticated
USING (
  bucket_id = 'private-docs' 
  AND auth.uid() = (SELECT admin_user_id FROM site_settings LIMIT 1)
)
WITH CHECK (
  bucket_id = 'private-docs' 
  AND auth.uid() = (SELECT admin_user_id FROM site_settings LIMIT 1)
);
```

### Input Validation

All admin forms include:
- Required field validation
- Length limits (see `src/lib/security.ts` for `INPUT_LIMITS`)
- URL format validation
- Error message sanitization (prevents leaking secrets)

### External Links

All external links use `rel="noopener noreferrer"` to prevent:
- Tab-nabbing attacks
- Referrer leakage

### Content Security

- No `dangerouslySetInnerHTML` with user content
- All text content is rendered as text nodes (auto-escaped)
- URLs are validated before use

---

## License

MIT

---

See `TODO.md` for the complete implementation checklist.
