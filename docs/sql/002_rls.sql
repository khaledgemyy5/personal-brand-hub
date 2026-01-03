-- =============================================================================
-- Migration 002: Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Helper function: Check if current user is admin
-- Uses SECURITY DEFINER to avoid RLS recursion
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM site_settings
    WHERE admin_user_id = auth.uid()
  )
$$;

-- -----------------------------------------------------------------------------
-- site_settings policies
-- -----------------------------------------------------------------------------

-- Public can read site settings (single row)
CREATE POLICY "site_settings_public_read"
  ON site_settings FOR SELECT TO anon, authenticated
  USING (true);

-- Admin can update site settings
CREATE POLICY "site_settings_admin_update"
  ON site_settings FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Admin can insert site settings (for initial setup)
CREATE POLICY "site_settings_admin_insert"
  ON site_settings FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- -----------------------------------------------------------------------------
-- projects policies
-- -----------------------------------------------------------------------------

-- Public can read published projects
CREATE POLICY "projects_public_read"
  ON projects FOR SELECT TO anon, authenticated
  USING (published = true);

-- Admin can read all projects (including unpublished)
CREATE POLICY "projects_admin_read_all"
  ON projects FOR SELECT TO authenticated
  USING (is_admin());

-- Admin can insert projects
CREATE POLICY "projects_admin_insert"
  ON projects FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- Admin can update projects
CREATE POLICY "projects_admin_update"
  ON projects FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Admin can delete projects
CREATE POLICY "projects_admin_delete"
  ON projects FOR DELETE TO authenticated
  USING (is_admin());

-- -----------------------------------------------------------------------------
-- writing_categories policies
-- -----------------------------------------------------------------------------

-- Public can read enabled categories
CREATE POLICY "writing_categories_public_read"
  ON writing_categories FOR SELECT TO anon, authenticated
  USING (enabled = true);

-- Admin can read all categories
CREATE POLICY "writing_categories_admin_read_all"
  ON writing_categories FOR SELECT TO authenticated
  USING (is_admin());

-- Admin can insert categories
CREATE POLICY "writing_categories_admin_insert"
  ON writing_categories FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- Admin can update categories
CREATE POLICY "writing_categories_admin_update"
  ON writing_categories FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Admin can delete categories
CREATE POLICY "writing_categories_admin_delete"
  ON writing_categories FOR DELETE TO authenticated
  USING (is_admin());

-- -----------------------------------------------------------------------------
-- writing_items policies
-- -----------------------------------------------------------------------------

-- Public can read enabled items
CREATE POLICY "writing_items_public_read"
  ON writing_items FOR SELECT TO anon, authenticated
  USING (enabled = true);

-- Admin can read all items
CREATE POLICY "writing_items_admin_read_all"
  ON writing_items FOR SELECT TO authenticated
  USING (is_admin());

-- Admin can insert items
CREATE POLICY "writing_items_admin_insert"
  ON writing_items FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- Admin can update items
CREATE POLICY "writing_items_admin_update"
  ON writing_items FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Admin can delete items
CREATE POLICY "writing_items_admin_delete"
  ON writing_items FOR DELETE TO authenticated
  USING (is_admin());

-- -----------------------------------------------------------------------------
-- analytics_events policies
-- -----------------------------------------------------------------------------

-- Public can insert analytics events (with event type constraint)
CREATE POLICY "analytics_events_public_insert"
  ON analytics_events FOR INSERT TO anon, authenticated
  WITH CHECK (
    event IN ('page_view', 'resume_download', 'contact_click', 'writing_click', 'project_view')
  );

-- Admin can read analytics
CREATE POLICY "analytics_events_admin_read"
  ON analytics_events FOR SELECT TO authenticated
  USING (is_admin());

-- Admin can delete analytics (for cleanup)
CREATE POLICY "analytics_events_admin_delete"
  ON analytics_events FOR DELETE TO authenticated
  USING (is_admin());
