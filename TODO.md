# Ammar Resume - TODO Checklist

A prioritized checklist for building a minimalist personal site with admin dashboard.

---

## Phase 1: Supabase Schema + RLS + Seed ✅ Priority: Critical

### 1.1 Enable Supabase / Lovable Cloud
- [x] Create Supabase client (src/lib/supabaseClient.ts)
- [x] Define TypeScript types (src/lib/types.ts)
- [ ] Connect Supabase to project
- [ ] Verify connection and credentials
- **Acceptance:** Supabase dashboard accessible, env vars configured

### 1.2 Create Database Schema
- [x] Create SQL migrations (docs/sql/001_schema.sql)
  - ENUMs: project_status, detail_level, writing_language
  - Tables: site_settings, projects, writing_categories, writing_items, analytics_events
- [x] Create RLS policies (docs/sql/002_rls.sql)
  - is_admin() security definer function
  - Public read for published/enabled content
  - Admin write via site_settings.admin_user_id check
- [x] Create seed data (docs/sql/003_seed.sql)
  - Demo site_settings, projects, writing categories/items
- [ ] Run migrations in Supabase SQL Editor
- [ ] Set admin_user_id after creating admin user
- **Acceptance:** All tables created, RLS enabled, seed data visible

### 1.3 Storage Setup
- [ ] Create `project-images` bucket
- [ ] Set bucket policy: public read, authenticated write
- [ ] Configure max file size (e.g., 2MB)
- [ ] Allowed types: image/jpeg, image/png, image/webp
- **Acceptance:** Images uploadable and publicly accessible via URL

---

## Phase 2: Public Pages ✅ Priority: High

### 2.1 Home Page
- [ ] Fetch profile data from Supabase
- [ ] Fetch latest 2-3 published projects
- [ ] Fetch latest 2-3 visible writing links
- [ ] SEO meta tags (title, description, OG image)
- **Acceptance:** Dynamic content loads, Lighthouse SEO > 90

### 2.2 Resume Page + ATS Support
- [ ] Single-column, text-first layout
- [ ] Copy plain text functionality (ATS-friendly format)
- [ ] Download PDF button (generate from data or upload)
- [ ] Fetch resume data from profile/settings or dedicated table
- [ ] Semantic HTML for screen readers
- **Acceptance:** Resume parseable by ATS systems, PDF download works

### 2.3 Projects List
- [ ] Fetch all published projects ordered by display_order
- [ ] No thumbnails on listing (per spec)
- [ ] Filter by tags (optional, future)
- **Acceptance:** Only published projects visible

### 2.4 Project Detail
- [ ] Fetch single project by slug
- [ ] Display up to 3 images with captions (lazy-loaded)
- [ ] 404 handling for invalid slugs
- [ ] Back navigation
- **Acceptance:** Images load lazily, captions required

### 2.5 Writing Hub
- [ ] Fetch all visible writing links
- [ ] External links only (no internal blog)
- [ ] Order by published_date or display_order
- **Acceptance:** All links open in new tab

### 2.6 Contact Page
- [ ] Display contact info from profile
- [ ] Contact form with validation
- [ ] Edge function for email sending
- **Acceptance:** Form submits, email received

---

## Phase 3: Admin Dashboard ✅ Priority: High

### 3.1 Authentication
- [ ] Login page with email/password
- [ ] Supabase Auth integration
- [ ] Protected admin routes
- [ ] Session persistence
- [ ] Logout functionality
- **Acceptance:** Only authenticated users access /admin/*

### 3.2 Dashboard Overview
- [ ] Stats: project count, writing count
- [ ] Quick action buttons
- [ ] Recent activity log (optional)
- **Acceptance:** Dashboard loads with live data

### 3.3 Projects CRUD
- [ ] List all projects (draft + published)
- [ ] Create new project form
- [ ] Edit existing project
- [ ] Delete with confirmation
- [ ] Image upload (max 3, caption required)
- [ ] Status toggle (draft/published)
- [ ] Reorder projects (display_order)
- **Acceptance:** Full CRUD works, RLS enforced

### 3.4 Writing CRUD
- [ ] List all writing links
- [ ] Add new external link
- [ ] Edit existing link
- [ ] Delete with confirmation
- [ ] Visibility toggle
- **Acceptance:** Full CRUD works, external URLs validated

### 3.5 Settings Page
- [ ] Edit profile (name, bio, socials)
- [ ] SEO settings (title, description, OG image)
- [ ] Theme toggle (if implemented)
- [ ] Site-wide toggles (contact form, etc.)
- **Acceptance:** Settings persist to database

---

## Phase 4: Analytics ✅ Priority: Medium

### 4.1 Page View Tracking
- [ ] Evaluate options: Plausible, Umami, or custom
- [ ] Choose privacy-friendly, self-hostable solution
- [ ] Integrate tracking script
- **Acceptance:** Page views tracked without cookies

### 4.2 Admin Analytics Dashboard
- [ ] Display page view counts
- [ ] Top pages report
- [ ] Time-based filtering
- **Acceptance:** Basic analytics visible in admin

---

## Phase 5: Security & Tests ✅ Priority: High

### 5.1 Security Audit
- [ ] Verify ALL RLS policies working
- [ ] Test unauthorized access attempts
- [ ] Validate input sanitization
- [ ] Check for SQL injection vectors
- [ ] Ensure no secrets in frontend code
- **Acceptance:** Penetration test passes

### 5.2 Input Validation
- [ ] Zod schemas for all forms
- [ ] Server-side validation in edge functions
- [ ] Sanitize HTML/markdown if used
- **Acceptance:** Invalid input rejected with clear errors

### 5.3 Testing
- [ ] Unit tests for utility functions
- [ ] Integration tests for API calls
- [ ] E2E tests for critical flows (login, CRUD)
- **Acceptance:** 80%+ test coverage on critical paths

### 5.4 Performance
- [ ] Run Lighthouse audit
- [ ] Optimize images (WebP, lazy loading)
- [ ] Code splitting for admin routes
- [ ] Minimize bundle size
- **Acceptance:** Lighthouse score >= 90 all categories

---

## Phase 6: Deployment ✅ Priority: High

### 6.1 GitHub Setup
- [ ] Initialize Git repository
- [ ] Create .gitignore (node_modules, .env, etc.)
- [ ] Push to GitHub
- [ ] Set up branch protection (optional)
- **Acceptance:** Code version-controlled

### 6.2 Environment Variables
- [ ] Document all required env vars
- [ ] Create .env.example template
- [ ] Configure production env vars
- **Acceptance:** No secrets in code or Git history

### 6.3 Docker Setup
- [ ] Create Dockerfile for production build
- [ ] Create docker-compose.yml (optional for local dev)
- [ ] Test Docker build locally
- **Acceptance:** `docker build` succeeds

### 6.4 AWS Deployment
- [ ] Choose deployment method:
  - Option A: S3 + CloudFront (static)
  - Option B: ECS/Fargate (containerized)
  - Option C: Amplify (managed)
- [ ] Configure domain/SSL
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Test deployment end-to-end
- **Acceptance:** Site live on custom domain with HTTPS

### 6.5 Monitoring
- [ ] Set up error tracking (Sentry or similar)
- [ ] Configure uptime monitoring
- [ ] Set up alerts for errors/downtime
- **Acceptance:** Errors captured and alerting works

---

## Post-Launch

- [ ] Monitor analytics and errors for first week
- [ ] Gather feedback and iterate
- [ ] Document common maintenance tasks
- [ ] Plan future enhancements

---

*Last updated: January 2026*
