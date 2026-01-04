-- =============================================================================
-- Ammar Resume Site - Complete Database Setup
-- Single re-runnable script with correct dependency ordering
-- =============================================================================

-- =============================================================================
-- PHASE 1: CLEANUP (Safe drops for re-runnability)
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
DROP FUNCTION IF EXISTS public.set_updated_at();

-- Drop triggers (before dropping tables)
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;

-- =============================================================================
-- PHASE 2: CREATE TABLES (No dependencies)
-- =============================================================================

-- 1) site_settings (singleton row for site-wide configuration)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  nav_config jsonb NOT NULL DEFAULT '{"links":[],"ctaButton":{"visible":false,"href":"/resume","label":"Resume"}}'::jsonb,
  home_sections jsonb NOT NULL DEFAULT '{"sections":[]}'::jsonb,
  theme jsonb NOT NULL DEFAULT '{"mode":"system","accentColor":"#135BEC","font":"inter"}'::jsonb,
  seo jsonb NOT NULL DEFAULT '{"title":"Ammar Jaber","description":"Technical Product Manager (ex-LLM / Software Engineer)"}'::jsonb,
  pages jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.site_settings IS 'Singleton table for site-wide settings. Only one row should exist.';
COMMENT ON COLUMN public.site_settings.admin_user_id IS 'UUID of the admin user from auth.users. Required for RLS admin checks.';

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

COMMENT ON COLUMN public.projects.media IS 'Array of {type: "image"|"video", url: string, caption?: string}';
COMMENT ON COLUMN public.projects.metrics IS 'Array of metric strings for display';
COMMENT ON COLUMN public.projects.decision_log IS 'Array of {decision: string, tradeoff: string, outcome: string}';

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
-- PHASE 3: CREATE INDEXES (Tables exist)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_list ON public.projects(published, featured, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_writing_categories_enabled ON public.writing_categories(enabled, order_index);
CREATE INDEX IF NOT EXISTS idx_writing_items_list ON public.writing_items(enabled, featured, order_index);
CREATE INDEX IF NOT EXISTS idx_writing_items_category ON public.writing_items(category_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_query ON public.analytics_events(event, ts DESC);

-- =============================================================================
-- PHASE 4: CREATE HELPER FUNCTIONS (Tables exist, needed by triggers/policies)
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
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.site_settings
    WHERE admin_user_id = auth.uid()
  )
$$;

-- Set admin user helper (run after creating admin account)
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

-- =============================================================================
-- PHASE 5: CREATE TRIGGERS (Functions exist)
-- =============================================================================

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- PHASE 6: CREATE VIEW (Table exists)
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

-- Grant read access
GRANT SELECT ON public.public_site_settings TO anon;
GRANT SELECT ON public.public_site_settings TO authenticated;

-- =============================================================================
-- PHASE 7: ENABLE RLS (Tables exist)
-- =============================================================================

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PHASE 8: CREATE RLS POLICIES (Tables + is_admin function exist)
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
-- DONE! Next steps:
-- 1. Run 003_seed.sql to insert initial data
-- 2. Create admin user in Supabase Auth
-- 3. Run: SELECT public.set_admin_user('your-admin-uuid');
-- =============================================================================
