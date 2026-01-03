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

CREATE POLICY "site_settings_public_read"
  ON site_settings FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "site_settings_admin_update"
  ON site_settings FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "site_settings_admin_insert"
  ON site_settings FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- -----------------------------------------------------------------------------
-- projects policies
-- -----------------------------------------------------------------------------

CREATE POLICY "projects_public_read"
  ON projects FOR SELECT TO anon, authenticated
  USING (published = true);

CREATE POLICY "projects_admin_read_all"
  ON projects FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "projects_admin_insert"
  ON projects FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "projects_admin_update"
  ON projects FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "projects_admin_delete"
  ON projects FOR DELETE TO authenticated
  USING (is_admin());

-- -----------------------------------------------------------------------------
-- writing_categories policies
-- -----------------------------------------------------------------------------

CREATE POLICY "writing_categories_public_read"
  ON writing_categories FOR SELECT TO anon, authenticated
  USING (enabled = true);

CREATE POLICY "writing_categories_admin_read_all"
  ON writing_categories FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "writing_categories_admin_insert"
  ON writing_categories FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "writing_categories_admin_update"
  ON writing_categories FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "writing_categories_admin_delete"
  ON writing_categories FOR DELETE TO authenticated
  USING (is_admin());

-- -----------------------------------------------------------------------------
-- writing_items policies
-- -----------------------------------------------------------------------------

CREATE POLICY "writing_items_public_read"
  ON writing_items FOR SELECT TO anon, authenticated
  USING (
    enabled = true
    AND EXISTS (
      SELECT 1 FROM writing_categories
      WHERE writing_categories.id = writing_items.category_id
      AND writing_categories.enabled = true
    )
  );

CREATE POLICY "writing_items_admin_read_all"
  ON writing_items FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "writing_items_admin_insert"
  ON writing_items FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "writing_items_admin_update"
  ON writing_items FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "writing_items_admin_delete"
  ON writing_items FOR DELETE TO authenticated
  USING (is_admin());

-- -----------------------------------------------------------------------------
-- analytics_events policies
-- -----------------------------------------------------------------------------

CREATE POLICY "analytics_events_public_insert"
  ON analytics_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "analytics_events_admin_read"
  ON analytics_events FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "analytics_events_admin_delete"
  ON analytics_events FOR DELETE TO authenticated
  USING (is_admin());
