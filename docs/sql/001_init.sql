-- =============================================================================
-- Migration 001: Schema - Tables and Indexes
-- Ammar Resume Site Database Schema
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

-- 1) site_settings (singleton row for site-wide configuration)
CREATE TABLE site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  nav_config jsonb NOT NULL DEFAULT '{"links":[],"ctaButton":{"visible":false,"href":"/resume","label":"Resume"}}'::jsonb,
  home_sections jsonb NOT NULL DEFAULT '{"sections":[]}'::jsonb,
  theme jsonb NOT NULL DEFAULT '{"mode":"system","accentColor":"#135BEC","font":"inter"}'::jsonb,
  seo jsonb NOT NULL DEFAULT '{"title":"Ammar Jaber","description":"Technical Product Manager (ex-LLM / Software Engineer)"}'::jsonb,
  pages jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE site_settings IS 'Singleton table for site-wide settings. Only one row should exist.';
COMMENT ON COLUMN site_settings.admin_user_id IS 'UUID of the admin user from auth.users. Required for RLS admin checks.';

-- 2) projects
CREATE TABLE projects (
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

COMMENT ON COLUMN projects.media IS 'Array of {type: "image"|"video", url: string, caption?: string}';
COMMENT ON COLUMN projects.metrics IS 'Array of metric strings for display';
COMMENT ON COLUMN projects.decision_log IS 'Array of {decision: string, tradeoff: string, outcome: string}';

CREATE INDEX idx_projects_list ON projects(published, featured, updated_at DESC);
CREATE INDEX idx_projects_slug ON projects(slug);

-- 3) writing_categories
CREATE TABLE writing_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true
);

CREATE INDEX idx_writing_categories_enabled ON writing_categories(enabled, order_index);

-- 4) writing_items
CREATE TABLE writing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NULL REFERENCES writing_categories(id) ON DELETE SET NULL,
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

CREATE INDEX idx_writing_items_list ON writing_items(enabled, featured, order_index);
CREATE INDEX idx_writing_items_category ON writing_items(category_id);

-- 5) analytics_events
CREATE TABLE analytics_events (
  id bigserial PRIMARY KEY,
  ts timestamptz DEFAULT now(),
  event text NOT NULL,
  path text NOT NULL,
  ref text NULL,
  sid text NOT NULL
);

CREATE INDEX idx_analytics_events_query ON analytics_events(event, ts DESC);

-- -----------------------------------------------------------------------------
-- Triggers for updated_at
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
