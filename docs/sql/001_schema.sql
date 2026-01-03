-- =============================================================================
-- Migration 001: Schema - ENUMs and Tables
-- Ammar Resume Site Database Schema
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) ENUM Types
-- -----------------------------------------------------------------------------

-- Project visibility status
CREATE TYPE project_status AS ENUM ('PUBLIC', 'CONFIDENTIAL', 'CONCEPT');

-- Level of detail for project pages
CREATE TYPE detail_level AS ENUM ('BRIEF', 'STANDARD', 'DEEP');

-- Writing item language (for display/filtering)
CREATE TYPE writing_language AS ENUM ('AUTO', 'AR', 'EN');

-- -----------------------------------------------------------------------------
-- B) Tables
-- -----------------------------------------------------------------------------

-- 1) site_settings (singleton row for site-wide configuration)
CREATE TABLE site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  nav_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  home_sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  pages jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE site_settings IS 'Singleton table for site-wide settings. Only one row should exist.';
COMMENT ON COLUMN site_settings.admin_user_id IS 'UUID of the admin user from auth.users. Required for RLS admin checks.';
COMMENT ON COLUMN site_settings.pages IS 'Page configs including resume PDF URL, contact visibility, etc.';

-- 2) projects
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  status project_status NOT NULL DEFAULT 'PUBLIC',
  detail_level detail_level NOT NULL DEFAULT 'STANDARD',
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  sections_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_projects_published ON projects(published) WHERE published = true;
CREATE INDEX idx_projects_featured ON projects(featured) WHERE featured = true;
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
  category_id uuid REFERENCES writing_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  platform_label text NOT NULL DEFAULT '',
  language writing_language NOT NULL DEFAULT 'AUTO',
  featured boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  order_index int NOT NULL DEFAULT 0,
  why_this_matters text NULL,
  show_why boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_writing_items_enabled ON writing_items(enabled, order_index);
CREATE INDEX idx_writing_items_category ON writing_items(category_id);
CREATE INDEX idx_writing_items_featured ON writing_items(featured) WHERE featured = true;

-- 5) analytics_events (optional)
CREATE TABLE analytics_events (
  id bigserial PRIMARY KEY,
  ts timestamptz DEFAULT now(),
  event text NOT NULL,
  path text NOT NULL,
  ref text NULL,
  sid text NOT NULL
);

CREATE INDEX idx_analytics_events_ts ON analytics_events(ts DESC);
CREATE INDEX idx_analytics_events_path ON analytics_events(path);

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
