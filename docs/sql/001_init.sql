-- =============================================================================
-- Migration 001: Schema - Tables, Functions, and Indexes
-- Ammar Resume Site Database Schema
-- Re-runnable: safe drops at top
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Safe Drops (for re-runnability)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.set_admin_user(uuid);
DROP FUNCTION IF EXISTS public.set_updated_at();
DROP VIEW IF EXISTS public.public_site_settings;

-- -----------------------------------------------------------------------------
-- Helper Function (no table dependencies)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

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

CREATE INDEX IF NOT EXISTS idx_projects_list ON public.projects(published, featured, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);

-- 3) writing_categories
CREATE TABLE IF NOT EXISTS public.writing_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_writing_categories_enabled ON public.writing_categories(enabled, order_index);

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

CREATE INDEX IF NOT EXISTS idx_writing_items_list ON public.writing_items(enabled, featured, order_index);
CREATE INDEX IF NOT EXISTS idx_writing_items_category ON public.writing_items(category_id);

-- 5) analytics_events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id bigserial PRIMARY KEY,
  ts timestamptz DEFAULT now(),
  event text NOT NULL,
  path text NOT NULL,
  ref text NULL,
  sid text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_query ON public.analytics_events(event, ts DESC);

-- -----------------------------------------------------------------------------
-- Triggers for updated_at
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Admin Functions (AFTER site_settings exists)
-- -----------------------------------------------------------------------------

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

-- Set admin user (run once after creating admin account)
CREATE OR REPLACE FUNCTION public.set_admin_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.site_settings SET admin_user_id = _user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No site_settings row exists. Run seed SQL first.';
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- Public View (excludes admin_user_id for anonymous access)
-- -----------------------------------------------------------------------------
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

-- Grant read access to anonymous users
GRANT SELECT ON public.public_site_settings TO anon;
GRANT SELECT ON public.public_site_settings TO authenticated;
