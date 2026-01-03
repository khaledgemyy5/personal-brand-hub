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

### Required Tables
- `profiles` - Site owner info
- `projects` - Portfolio projects
- `project_images` - Project images with captions
- `writing` - External article links
- `settings` - Site configuration

### Row Level Security
All tables have RLS enabled:
- Public: Read published/visible content
- Admin: Full CRUD for authenticated admin

### Storage Buckets
- `project-images` - Project screenshots (public read, auth write)

## Performance Targets

- Lighthouse Performance: >= 90
- Lighthouse Accessibility: >= 90
- Lighthouse Best Practices: >= 90
- Lighthouse SEO: >= 90

## Security Considerations

- All permissions enforced via Supabase RLS
- Frontend checks are for UX only, not security
- No secrets in frontend code
- Input validation with Zod
- Sanitized user content

## License

MIT

---

See `TODO.md` for the complete implementation checklist.
