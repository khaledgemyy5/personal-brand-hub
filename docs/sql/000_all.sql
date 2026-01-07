-- =============================================================================
-- Ammar Resume Site - Complete Database Setup (Single Idempotent Script)
-- Run this once in Supabase SQL Editor. Safe to re-run.
-- =============================================================================

-- =============================================================================
-- PHASE 1: EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- PHASE 2: CLEANUP (Safe drops for re-runnability)
-- =============================================================================

-- Drop policies first (they depend on functions and tables)
DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_admin_update" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_admin_insert" ON public.site_settings;

DROP POLICY IF EXISTS "projects_public_read" ON public.projects;
DROP POLICY IF EXISTS "projects_admin_read_all" ON public.projects;
DROP POLICY IF EXISTS "projects_admin_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_admin_update" ON public.projects;
DROP POLICY IF EXISTS "projects_admin_delete" ON public.projects;

DROP POLICY IF EXISTS "writing_categories_public_read" ON public.writing_categories;
DROP POLICY IF EXISTS "writing_categories_admin_read_all" ON public.writing_categories;
DROP POLICY IF EXISTS "writing_categories_admin_insert" ON public.writing_categories;
DROP POLICY IF EXISTS "writing_categories_admin_update" ON public.writing_categories;
DROP POLICY IF EXISTS "writing_categories_admin_delete" ON public.writing_categories;

DROP POLICY IF EXISTS "writing_items_public_read" ON public.writing_items;
DROP POLICY IF EXISTS "writing_items_admin_read_all" ON public.writing_items;
DROP POLICY IF EXISTS "writing_items_admin_insert" ON public.writing_items;
DROP POLICY IF EXISTS "writing_items_admin_update" ON public.writing_items;
DROP POLICY IF EXISTS "writing_items_admin_delete" ON public.writing_items;

DROP POLICY IF EXISTS "analytics_events_public_insert" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_events_admin_read" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_events_admin_delete" ON public.analytics_events;

-- Drop view (depends on table)
DROP VIEW IF EXISTS public.public_site_settings;

-- Drop functions
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.set_admin_user(uuid);
DROP FUNCTION IF EXISTS public.claim_admin();
DROP FUNCTION IF EXISTS public.set_updated_at();

-- Drop triggers (before modifying tables)
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;

-- =============================================================================
-- PHASE 3: CREATE TABLES
-- =============================================================================

-- 1) site_settings (singleton row for site-wide configuration)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  nav_config jsonb NOT NULL DEFAULT '{"links":[],"ctaButton":{"visible":false,"href":"/resume","label":"Resume"}}'::jsonb,
  home_sections jsonb NOT NULL DEFAULT '{"sections":[]}'::jsonb,
  theme jsonb NOT NULL DEFAULT '{"mode":"system","accentColor":"#135BEC","font":"inter"}'::jsonb,
  seo jsonb NOT NULL DEFAULT '{"title":"Ammar Jaber","description":"Technical Product Manager"}'::jsonb,
  pages jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.site_settings IS 'Singleton table for site-wide settings. Only one row should exist.';
COMMENT ON COLUMN public.site_settings.admin_user_id IS 'UUID of the admin. Set to all-zeros initially, claim_admin() sets it to first claimer.';

-- 2) projects
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL CHECK (status IN ('PUBLIC', 'CONFIDENTIAL', 'CONCEPT')) DEFAULT 'PUBLIC',
  detail_level text NOT NULL CHECK (detail_level IN ('BRIEF', 'STANDARD', 'DEEP')) DEFAULT 'STANDARD',
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  sections_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  metrics jsonb NOT NULL DEFAULT '[]'::jsonb,
  decision_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- 3) writing_categories
CREATE TABLE IF NOT EXISTS public.writing_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true
);

-- 4) writing_items
CREATE TABLE IF NOT EXISTS public.writing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NULL REFERENCES public.writing_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  url text NOT NULL,
  platform_label text NOT NULL DEFAULT '',
  language text NOT NULL CHECK (language IN ('AUTO', 'AR', 'EN')) DEFAULT 'AUTO',
  featured boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  order_index int NOT NULL DEFAULT 0,
  why_this_matters text NULL,
  show_why boolean NOT NULL DEFAULT false
);

-- 5) analytics_events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id bigserial PRIMARY KEY,
  ts timestamptz DEFAULT now(),
  event text NOT NULL,
  path text NOT NULL,
  ref text NULL,
  sid text NOT NULL
);

-- =============================================================================
-- PHASE 4: CREATE INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_list ON public.projects(published, featured, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_writing_categories_enabled ON public.writing_categories(enabled, order_index);
CREATE INDEX IF NOT EXISTS idx_writing_items_list ON public.writing_items(enabled, featured, order_index);
CREATE INDEX IF NOT EXISTS idx_writing_items_category ON public.writing_items(category_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_query ON public.analytics_events(event, ts DESC);

-- =============================================================================
-- PHASE 5: CREATE HELPER FUNCTIONS (Tables exist now)
-- =============================================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if current user is admin (SECURITY DEFINER to avoid RLS recursion)
-- Safe: returns false if table doesn't exist or no row
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id uuid;
BEGIN
  -- Check if table exists
  IF to_regclass('public.site_settings') IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get admin_user_id
  SELECT admin_user_id INTO _admin_id FROM public.site_settings LIMIT 1;
  
  -- No row or unset admin
  IF _admin_id IS NULL OR _admin_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RETURN false;
  END IF;
  
  -- Check if current user matches
  RETURN auth.uid() = _admin_id;
END;
$$;

-- Set admin user helper (manual override)
CREATE OR REPLACE FUNCTION public.set_admin_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.site_settings SET admin_user_id = _user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No site_settings row exists. Insert seed data first.';
  END IF;
END;
$$;

-- Claim admin: first authenticated user to call this becomes admin
-- Only works if admin_user_id is the placeholder (all zeros)
CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_admin uuid;
  _caller uuid;
BEGIN
  _caller := auth.uid();
  
  IF _caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  SELECT admin_user_id INTO _current_admin FROM public.site_settings LIMIT 1;
  
  IF _current_admin IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No site_settings row. Run seed SQL first.');
  END IF;
  
  IF _current_admin != '00000000-0000-0000-0000-000000000000'::uuid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin already claimed');
  END IF;
  
  UPDATE public.site_settings SET admin_user_id = _caller;
  
  RETURN jsonb_build_object('success', true, 'admin_user_id', _caller::text);
END;
$$;

-- =============================================================================
-- PHASE 6: CREATE TRIGGERS
-- =============================================================================

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- PHASE 7: CREATE VIEW (Table exists, excludes admin_user_id)
-- =============================================================================

CREATE OR REPLACE VIEW public.public_site_settings AS
SELECT
  id,
  nav_config,
  home_sections,
  theme,
  seo,
  pages,
  updated_at
FROM public.site_settings;

GRANT SELECT ON public.public_site_settings TO anon;
GRANT SELECT ON public.public_site_settings TO authenticated;

-- =============================================================================
-- PHASE 8: ENABLE RLS
-- =============================================================================

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PHASE 9: CREATE RLS POLICIES (Tables + is_admin function exist)
-- =============================================================================

-- site_settings policies
CREATE POLICY "site_settings_public_read"
  ON public.site_settings FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "site_settings_admin_update"
  ON public.site_settings FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "site_settings_admin_insert"
  ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- projects policies
CREATE POLICY "projects_public_read"
  ON public.projects FOR SELECT TO anon, authenticated
  USING (published = true);

CREATE POLICY "projects_admin_read_all"
  ON public.projects FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "projects_admin_insert"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "projects_admin_update"
  ON public.projects FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "projects_admin_delete"
  ON public.projects FOR DELETE TO authenticated
  USING (public.is_admin());

-- writing_categories policies
CREATE POLICY "writing_categories_public_read"
  ON public.writing_categories FOR SELECT TO anon, authenticated
  USING (enabled = true);

CREATE POLICY "writing_categories_admin_read_all"
  ON public.writing_categories FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "writing_categories_admin_insert"
  ON public.writing_categories FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "writing_categories_admin_update"
  ON public.writing_categories FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "writing_categories_admin_delete"
  ON public.writing_categories FOR DELETE TO authenticated
  USING (public.is_admin());

-- writing_items policies
CREATE POLICY "writing_items_public_read"
  ON public.writing_items FOR SELECT TO anon, authenticated
  USING (enabled = true);

CREATE POLICY "writing_items_admin_read_all"
  ON public.writing_items FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "writing_items_admin_insert"
  ON public.writing_items FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "writing_items_admin_update"
  ON public.writing_items FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "writing_items_admin_delete"
  ON public.writing_items FOR DELETE TO authenticated
  USING (public.is_admin());

-- analytics_events policies
CREATE POLICY "analytics_events_public_insert"
  ON public.analytics_events FOR INSERT TO anon, authenticated
  WITH CHECK (
    event IN ('page_view', 'resume_download', 'contact_click', 'writing_click', 'project_view')
  );

CREATE POLICY "analytics_events_admin_read"
  ON public.analytics_events FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "analytics_events_admin_delete"
  ON public.analytics_events FOR DELETE TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- PHASE 10: SEED DATA (ON CONFLICT for idempotency)
-- =============================================================================

-- Site Settings (singleton row with placeholder admin)
INSERT INTO public.site_settings (
  id, admin_user_id, nav_config, home_sections, theme, seo, pages
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000', -- Placeholder: claim_admin() sets this
  '{
    "links": [
      {"href": "/", "label": "Home", "visible": true},
      {"href": "/projects", "label": "Projects", "visible": true},
      {"href": "/writing", "label": "Writing", "visible": true},
      {"href": "/contact", "label": "Contact", "visible": true}
    ],
    "ctaButton": {"href": "/resume", "label": "Resume", "visible": true}
  }'::jsonb,
  '{
    "sections": [
      {"id": "hero", "visible": true, "order": 1},
      {"id": "experience_snapshot", "visible": true, "order": 2},
      {"id": "featured_projects", "visible": true, "order": 3, "limit": 3},
      {"id": "how_i_work", "visible": true, "order": 4},
      {"id": "selected_writing_preview", "visible": true, "order": 5, "limit": 3},
      {"id": "contact_cta", "visible": true, "order": 6}
    ]
  }'::jsonb,
  '{"mode": "system", "accentColor": "#135BEC", "font": "inter"}'::jsonb,
  '{"title": "Ammar Jaber", "description": "Technical Product Manager (ex-LLM / Software Engineer)"}'::jsonb,
  '{
    "resume": {"enabled": true, "pdfUrl": null},
    "contact": {"enabled": true, "email": "hello@example.com", "linkedin": "https://linkedin.com/in/example", "calendly": "https://calendly.com/example"},
    "methodology": [
      "Start with why: Every product decision ties back to user value.",
      "Ship fast, learn faster: Small iterations, measurable outcomes.",
      "Write it down: Decisions, trade-offs, and context matter.",
      "Build bridges: Great products need engineers, designers, and stakeholders aligned."
    ]
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Demo Writing Category
INSERT INTO public.writing_categories (id, name, order_index, enabled) VALUES
('b0000000-0000-0000-0000-000000000001', 'Technical Articles', 1, true)
ON CONFLICT (id) DO NOTHING;

-- Demo Writing Items
INSERT INTO public.writing_items (id, category_id, title, url, platform_label, language, featured, enabled, order_index, why_this_matters, show_why) VALUES
(
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'Building Resilient Distributed Systems: Lessons from Production',
  'https://medium.com/example/distributed-systems-lessons',
  'Medium',
  'EN',
  true,
  true,
  1,
  'This piece synthesizes 5 years of experience running large-scale systems.',
  true
),
(
  'c0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000001',
  'مقدمة في هندسة البرمجيات للمبتدئين',
  'https://example.com/arabic-tech-intro',
  'Personal Blog',
  'AR',
  false,
  true,
  2,
  'Written to address the lack of quality Arabic resources for aspiring software engineers.',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Demo Projects
INSERT INTO public.projects (id, slug, title, summary, tags, status, detail_level, featured, published, sections_config, content, media, metrics, decision_log) VALUES
(
  'd0000000-0000-0000-0000-000000000001',
  'distributed-task-scheduler',
  'Distributed Task Scheduler',
  'A high-performance distributed task scheduling system built for processing millions of jobs daily.',
  ARRAY['Go', 'Redis', 'Kubernetes', 'gRPC'],
  'PUBLIC',
  'DEEP',
  true,
  true,
  '{"showOverview": true, "showChallenge": true, "showApproach": true, "showOutcome": true}'::jsonb,
  '{"overview": "Designed and implemented a distributed task scheduling system capable of handling 5M+ daily jobs.", "challenge": "The existing monolithic job queue was hitting performance limits.", "approach": "Built a new architecture using Go for the core scheduler, Redis for distributed locking.", "outcome": "Reduced job processing latency by 60%, achieved 99.99% uptime."}'::jsonb,
  '[]'::jsonb,
  '["5M+ daily jobs processed", "60% latency reduction", "99.99% uptime"]'::jsonb,
  '[{"decision": "Chose Redis over Kafka for job queue", "tradeoff": "Simpler ops vs. guaranteed delivery", "outcome": "Redis persistence + retry logic achieved reliability goals"}]'::jsonb
),
(
  'd0000000-0000-0000-0000-000000000002',
  'fintech-payment-platform',
  'Enterprise Payment Platform',
  'Led development of a PCI-compliant payment processing platform handling $2B+ in annual transactions.',
  ARRAY['Java', 'Spring Boot', 'PostgreSQL', 'AWS'],
  'CONFIDENTIAL',
  'BRIEF',
  false,
  true,
  '{"showOverview": true, "showOutcome": true}'::jsonb,
  '{"overview": "Architected and led a team of 8 engineers to rebuild the core payment processing infrastructure.", "outcome": "Successfully migrated 100% of transaction volume with zero downtime.", "note": "Due to confidentiality agreements, technical details cannot be disclosed."}'::jsonb,
  '[]'::jsonb,
  '["$2B+ annual transactions", "Zero downtime migration", "PCI-DSS compliant"]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- DONE!
-- 
-- Next steps:
-- 1. Set env vars: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
-- 2. Create a user in Supabase Auth (email/password)
-- 3. Login to /admin and click "Claim Admin"
-- 4. Now you have full admin access
-- =============================================================================
