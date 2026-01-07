// =============================================================================
// Database query helpers for Supabase
// All functions return { data, error } pattern
// NO DEMO DATA - Supabase is the single source of truth
// =============================================================================

import { getSupabase, hasSupabaseEnv } from './supabaseClient';
import { defaultSiteSettings } from './defaultSiteSettings';
import type {
  ApiResponse,
  SiteSettings,
  Project,
  ProjectListItem,
  WritingCategory,
  WritingItem,
  WritingItemWithCategory,
  WritingListItem,
  ProjectStatus,
  DetailLevel,
  WritingLanguage,
} from './types';
import {
  parseNavConfig,
  parseHomeSections,
  parseThemeConfig,
  parseSEOConfig,
  parsePagesConfig,
  parseProjectSectionsConfig,
  parseProjectContent,
  parseMedia,
  parseMetrics,
  parseDecisionLog,
  parseStringArray,
  type MediaItem,
  type DecisionLogEntry,
} from './runtime';

// Re-export for convenience
export { supabaseReady, hasSupabaseEnv } from './supabaseClient';

// -----------------------------------------------------------------------------
// Simple in-memory cache
// -----------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 60 * 1000; // 60 seconds

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
  cache.set(key, { data, expiry: Date.now() + ttl });
}

export function invalidateCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) {
      cache.delete(key);
    }
  }
}

// -----------------------------------------------------------------------------
// Helper to generate session ID for analytics
// -----------------------------------------------------------------------------

function getSessionId(): string {
  const key = 'analytics_sid';
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

// -----------------------------------------------------------------------------
// Transform raw DB row to typed SiteSettings
// Works with public_site_settings view (no admin_user_id)
// -----------------------------------------------------------------------------

function transformSiteSettings(row: Record<string, unknown>): SiteSettings {
  return {
    id: row.id as string,
    admin_user_id: (row.admin_user_id as string) ?? '',
    nav_config: parseNavConfig(row.nav_config),
    home_sections: parseHomeSections(row.home_sections),
    theme: parseThemeConfig(row.theme),
    seo: parseSEOConfig(row.seo),
    pages: parsePagesConfig(row.pages),
    updated_at: row.updated_at as string,
  };
}

// -----------------------------------------------------------------------------
// Transform raw DB row to typed Project
// -----------------------------------------------------------------------------

export interface ExtendedProject extends Project {
  media: MediaItem[];
  metrics: string[];
  decision_log: DecisionLogEntry[];
}

function transformProject(row: Record<string, unknown>): ExtendedProject {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    summary: row.summary as string,
    tags: parseStringArray(row.tags),
    status: row.status as ProjectStatus,
    detail_level: row.detail_level as DetailLevel,
    featured: row.featured as boolean,
    published: row.published as boolean,
    sections_config: parseProjectSectionsConfig(row.sections_config),
    content: parseProjectContent(row.content),
    media: parseMedia(row.media),
    metrics: parseMetrics(row.metrics),
    decision_log: parseDecisionLog(row.decision_log),
    updated_at: row.updated_at as string,
  };
}

// =============================================================================
// ADMIN HEALTH CHECK
// =============================================================================

export interface HealthCheckResult {
  timestamp: string;
  env: { ok: boolean; message: string };
  schema: { ok: boolean; message: string };
  auth: { ok: boolean; message: string; email?: string };
  rls: { ok: boolean; message: string };
  tables: {
    site_settings: { ok: boolean; message: string };
    projects: { ok: boolean; message: string };
    writing_items: { ok: boolean; message: string };
  };
}

export async function adminHealthCheck(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    timestamp: new Date().toISOString(),
    env: { ok: false, message: 'Checking...' },
    schema: { ok: false, message: 'Checking...' },
    auth: { ok: false, message: 'Checking...' },
    rls: { ok: false, message: 'Checking...' },
    tables: {
      site_settings: { ok: false, message: 'Checking...' },
      projects: { ok: false, message: 'Checking...' },
      writing_items: { ok: false, message: 'Checking...' },
    },
  };

  // Check env
  if (!hasSupabaseEnv) {
    result.env = { ok: false, message: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY' };
    return result;
  }
  result.env = { ok: true, message: 'Environment variables configured' };

  const supabase = getSupabase();
  if (!supabase) {
    result.schema = { ok: false, message: 'Supabase client not initialized' };
    return result;
  }

  // Check auth
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      result.auth = { ok: true, message: 'Authenticated', email: user.email };
    } else {
      result.auth = { ok: false, message: 'Not authenticated' };
    }
  } catch (e) {
    result.auth = { ok: false, message: e instanceof Error ? e.message : 'Auth check failed' };
  }

  // Check site_settings table
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        result.schema = { ok: false, message: 'Schema not initialized - run docs/sql/000_all.sql' };
        result.tables.site_settings = { ok: false, message: 'Table does not exist' };
      } else if (error.code === '42501' || error.message.includes('permission denied')) {
        result.schema = { ok: true, message: 'Schema exists' };
        result.tables.site_settings = { ok: false, message: 'RLS denied access' };
        result.rls = { ok: false, message: 'RLS blocking access - check admin role' };
      } else {
        result.tables.site_settings = { ok: false, message: error.message };
      }
    } else {
      result.schema = { ok: true, message: 'Schema initialized' };
      result.tables.site_settings = { ok: true, message: `Found ${data?.length ?? 0} row(s)` };
      result.rls = { ok: true, message: 'RLS passed' };
    }
  } catch (e) {
    result.tables.site_settings = { ok: false, message: e instanceof Error ? e.message : 'Query failed' };
  }

  // Check projects table
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
    
    if (error) {
      result.tables.projects = { ok: false, message: error.message };
    } else {
      result.tables.projects = { ok: true, message: `Found ${data?.length ?? 0} row(s)` };
    }
  } catch (e) {
    result.tables.projects = { ok: false, message: e instanceof Error ? e.message : 'Query failed' };
  }

  // Check writing_items table
  try {
    const { data, error } = await supabase
      .from('writing_items')
      .select('id')
      .limit(1);
    
    if (error) {
      result.tables.writing_items = { ok: false, message: error.message };
    } else {
      result.tables.writing_items = { ok: true, message: `Found ${data?.length ?? 0} row(s)` };
    }
  } catch (e) {
    result.tables.writing_items = { ok: false, message: e instanceof Error ? e.message : 'Query failed' };
  }

  return result;
}

// =============================================================================
// PUBLIC READ FUNCTIONS (Supabase-only, no fallbacks)
// =============================================================================

/**
 * Fetch site settings from public_site_settings view - cached for 60s
 * Returns error if Supabase not configured or query fails
 */
export async function getSiteSettings(): Promise<ApiResponse<SiteSettings>> {
  const cacheKey = 'site_settings';
  const cached = getCached<SiteSettings>(cacheKey);
  if (cached) {
    return { data: cached, error: null };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
  }

  try {
    const { data, error } = await supabase
      .from('public_site_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      if (error.message.includes('does not exist')) {
        return { data: null, error: 'Database schema not initialized. Run docs/sql/000_all.sql in Supabase.' };
      }
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: 'Site settings not found. Run docs/sql/000_all.sql in Supabase.' };
    }

    const settings = transformSiteSettings(data);
    setCache(cacheKey, settings);
    return { data: settings, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error fetching settings' };
  }
}

/**
 * Strict version for admin pages - returns actual errors
 */
export async function getSiteSettingsStrict(): Promise<ApiResponse<SiteSettings>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
  }

  try {
    const { data, error } = await supabase
      .from('public_site_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[getSiteSettingsStrict] Query failed:', error.message);
      if (error.message.includes('does not exist')) {
        return { data: null, error: 'Database schema not initialized. Run docs/sql/000_all.sql in Supabase.' };
      }
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: 'No site_settings row found. Run docs/sql/000_all.sql in Supabase.' };
    }

    return { data: transformSiteSettings(data), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Fetch published projects with optional filters - cached for 30s
 */
export async function getPublishedProjects(options?: {
  limit?: number;
  tag?: string;
}): Promise<ApiResponse<ProjectListItem[]>> {
  const supabase = getSupabase();
  
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  // Cache key includes limit (tag filtering is done post-fetch)
  const cacheKey = `published_projects_${options?.limit || 'all'}`;
  const cached = getCached<ProjectListItem[]>(cacheKey);
  
  if (cached && !options?.tag) {
    return { data: options?.limit ? cached.slice(0, options.limit) : cached, error: null };
  }

  try {
    let query = supabase
      .from('projects')
      .select('id, slug, title, summary, tags, status, featured')
      .eq('published', true)
      .order('featured', { ascending: false })
      .order('updated_at', { ascending: false });

    if (options?.limit && !options?.tag) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      if (error.message.includes('does not exist')) {
        return { data: null, error: 'Database schema not initialized. Run docs/sql/000_all.sql in Supabase.' };
      }
      return { data: null, error: error.message };
    }

    let projects = (data || []).map(row => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      tags: parseStringArray(row.tags),
      status: row.status as ProjectStatus,
      featured: row.featured,
    }));

    // Cache before filtering
    setCache(cacheKey, projects, 30 * 1000);

    // Filter by tag if specified
    if (options?.tag) {
      projects = projects.filter(p => 
        p.tags.some(t => t.toLowerCase() === options.tag!.toLowerCase())
      );
    }

    // Apply limit after tag filter
    if (options?.limit && options?.tag) {
      projects = projects.slice(0, options.limit);
    }

    return { data: projects, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Fetch a single project by slug
 */
export async function getProjectBySlug(slug: string): Promise<ApiResponse<ExtendedProject>> {
  const supabase = getSupabase();
  
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: 'Project not found' };
    }

    return { data: transformProject(data), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Fetch enabled writing categories - cached for 60s
 */
export async function getWritingCategories(): Promise<ApiResponse<WritingCategory[]>> {
  const supabase = getSupabase();
  
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  const cacheKey = 'writing_categories';
  const cached = getCached<WritingCategory[]>(cacheKey);
  if (cached) {
    return { data: cached, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('writing_categories')
      .select('*')
      .eq('enabled', true)
      .order('order_index');

    if (error) {
      if (error.message.includes('does not exist')) {
        return { data: null, error: 'Database schema not initialized. Run docs/sql/000_all.sql in Supabase.' };
      }
      return { data: null, error: error.message };
    }

    const categories = data || [];
    setCache(cacheKey, categories);
    return { data: categories, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Fetch writing items with optional filters
 */
export async function getWritingItems(options?: {
  featuredOnly?: boolean;
  limit?: number;
}): Promise<ApiResponse<WritingListItem[]>> {
  const supabase = getSupabase();
  
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    let query = supabase
      .from('writing_items')
      .select(`
        id, title, url, platform_label, language, featured, 
        why_this_matters, show_why, category_id,
        writing_categories(name)
      `)
      .eq('enabled', true)
      .order('featured', { ascending: false })
      .order('order_index');

    if (options?.featuredOnly) {
      query = query.eq('featured', true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      if (error.message.includes('does not exist')) {
        return { data: null, error: 'Database schema not initialized. Run docs/sql/000_all.sql in Supabase.' };
      }
      return { data: null, error: error.message };
    }

    const items: WritingListItem[] = (data || []).map(row => {
      const category = row.writing_categories as { name: string } | { name: string }[] | null;
      const categoryName = Array.isArray(category) ? category[0]?.name : category?.name;
      
      return {
        id: row.id,
        title: row.title,
        url: row.url,
        platform_label: row.platform_label,
        language: row.language as WritingLanguage,
        featured: row.featured,
        why_this_matters: row.why_this_matters,
        show_why: row.show_why,
        category_name: categoryName,
      };
    });

    return { data: items, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Track an analytics event
 */
export async function trackEvent(params: {
  event: 'page_view' | 'resume_download' | 'contact_click' | 'writing_click' | 'project_view';
  path: string;
  ref?: string;
}): Promise<ApiResponse<null>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: null }; // Silent fail for analytics
  }

  try {
    const { error } = await supabase.from('analytics_events').insert({
      event: params.event,
      path: params.path,
      ref: params.ref || null,
      sid: getSessionId(),
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

// =============================================================================
// ADMIN FUNCTIONS
// =============================================================================

/**
 * Admin: Get site settings - uses strict version that returns errors
 */
export async function adminGetSiteSettings(): Promise<ApiResponse<SiteSettings>> {
  return getSiteSettingsStrict();
}

/**
 * Admin: Update site settings
 */
export async function adminUpdateSiteSettings(
  partial: Partial<Omit<SiteSettings, 'id' | 'admin_user_id' | 'updated_at'>>
): Promise<ApiResponse<SiteSettings>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    // Get current settings to get the ID
    const { data: current, error: fetchError } = await getSiteSettingsStrict();
    if (fetchError || !current) {
      return { data: null, error: fetchError || 'Settings not found' };
    }

    const { data, error } = await supabase
      .from('site_settings')
      .update({
        nav_config: partial.nav_config,
        home_sections: partial.home_sections,
        theme: partial.theme,
        seo: partial.seo,
        pages: partial.pages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', current.id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    invalidateCache('site_settings');
    return { data: transformSiteSettings(data), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: List all projects (including unpublished)
 */
export async function adminListProjects(): Promise<ApiResponse<ExtendedProject[]>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data || []).map(transformProject), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: Get a single project by ID
 */
export async function adminGetProject(id: string): Promise<ApiResponse<ExtendedProject>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: 'Project not found' };
    }

    return { data: transformProject(data), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: Create a new project
 */
export async function adminCreateProject(
  project: Omit<ExtendedProject, 'id' | 'updated_at'>
): Promise<ApiResponse<ExtendedProject>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        slug: project.slug,
        title: project.title,
        summary: project.summary,
        tags: project.tags,
        status: project.status,
        detail_level: project.detail_level,
        featured: project.featured,
        published: project.published,
        sections_config: project.sections_config,
        content: project.content,
        media: project.media,
        metrics: project.metrics,
        decision_log: project.decision_log,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    invalidateCache('published_projects');
    return { data: transformProject(data), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: Update a project
 */
export async function adminUpdateProject(
  id: string,
  partial: Partial<Omit<ExtendedProject, 'id' | 'updated_at'>>
): Promise<ApiResponse<ExtendedProject>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...partial,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    invalidateCache('published_projects');
    return { data: transformProject(data), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: Delete a project
 */
export async function adminDeleteProject(id: string): Promise<ApiResponse<null>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      return { data: null, error: error.message };
    }

    invalidateCache('published_projects');
    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: List all writing items
 */
export async function adminListWritingItems(): Promise<ApiResponse<WritingItemWithCategory[]>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('writing_items')
      .select(`*, writing_categories(name)`)
      .order('order_index');

    if (error) {
      return { data: null, error: error.message };
    }

    const items = (data || []).map(row => {
      const category = row.writing_categories as { name: string } | null;
      return {
        ...row,
        language: row.language as WritingLanguage,
        category_name: category?.name,
      };
    });

    return { data: items, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: List writing categories
 */
export async function adminListWritingCategories(): Promise<ApiResponse<WritingCategory[]>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('writing_categories')
      .select('*')
      .order('order_index');

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: Create a writing item
 */
export async function adminCreateWritingItem(
  item: Omit<WritingItem, 'id'>
): Promise<ApiResponse<WritingItem>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('writing_items')
      .insert(item)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as WritingItem, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: Update a writing item
 */
export async function adminUpdateWritingItem(
  id: string,
  partial: Partial<Omit<WritingItem, 'id'>>
): Promise<ApiResponse<WritingItem>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('writing_items')
      .update(partial)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as WritingItem, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: Delete a writing item
 */
/**
 * Admin: Upsert a project (create or update)
 */
export async function adminUpsertProject(
  project: Partial<ExtendedProject> & { slug: string; title: string }
): Promise<ApiResponse<ExtendedProject>> {
  if (project.id) {
    return adminUpdateProject(project.id, project);
  }
  return adminCreateProject(project as Omit<ExtendedProject, 'id' | 'updated_at'>);
}

/**
 * Admin: Upsert a writing category
 */
export async function adminUpsertWritingCategory(
  category: Partial<WritingCategory> & { name: string }
): Promise<ApiResponse<WritingCategory>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    if (category.id) {
      const { data, error } = await supabase
        .from('writing_categories')
        .update(category)
        .eq('id', category.id)
        .select()
        .single();
      if (error) return { data: null, error: error.message };
      return { data: data as WritingCategory, error: null };
    } else {
      const { data, error } = await supabase
        .from('writing_categories')
        .insert(category)
        .select()
        .single();
      if (error) return { data: null, error: error.message };
      return { data: data as WritingCategory, error: null };
    }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: Delete a writing category
 */
export async function adminDeleteWritingCategory(id: string): Promise<ApiResponse<null>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase.from('writing_categories').delete().eq('id', id);
    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: Upsert a writing item
 */
export async function adminUpsertWritingItem(
  item: Partial<WritingItem> & { title: string; url: string }
): Promise<ApiResponse<WritingItem>> {
  if (item.id) {
    return adminUpdateWritingItem(item.id, item);
  }
  return adminCreateWritingItem(item as Omit<WritingItem, 'id'>);
}

export async function adminDeleteWritingItem(id: string): Promise<ApiResponse<null>> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase.from('writing_items').delete().eq('id', id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
