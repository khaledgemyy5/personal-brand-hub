// =============================================================================
// Database query helpers for Supabase
// All functions return { data, error } pattern
// =============================================================================

import { supabase } from './supabaseClient';
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
// -----------------------------------------------------------------------------

function transformSiteSettings(row: Record<string, unknown>): SiteSettings {
  return {
    id: row.id as string,
    admin_user_id: row.admin_user_id as string,
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

interface ExtendedProject extends Project {
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
// PUBLIC READ FUNCTIONS
// =============================================================================

/**
 * Fetch site settings (singleton row)
 */
export async function getSiteSettings(): Promise<ApiResponse<SiteSettings>> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: 'Site settings not found' };
    }

    return { data: transformSiteSettings(data), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Fetch published projects with optional filters
 */
export async function getPublishedProjects(options?: {
  limit?: number;
  tag?: string;
}): Promise<ApiResponse<ProjectListItem[]>> {
  try {
    let query = supabase
      .from('projects')
      .select('id, slug, title, summary, tags, status, featured')
      .eq('published', true)
      .order('featured', { ascending: false })
      .order('updated_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
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

    // Filter by tag if specified
    if (options?.tag) {
      projects = projects.filter(p => 
        p.tags.some(t => t.toLowerCase() === options.tag!.toLowerCase())
      );
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
 * Fetch enabled writing categories
 */
export async function getWritingCategories(): Promise<ApiResponse<WritingCategory[]>> {
  try {
    const { data, error } = await supabase
      .from('writing_categories')
      .select('*')
      .eq('enabled', true)
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
 * Fetch writing items with optional filters
 */
export async function getWritingItems(options?: {
  featuredOnly?: boolean;
  limit?: number;
}): Promise<ApiResponse<WritingListItem[]>> {
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
 * Admin: Get site settings (same as public but may include more fields later)
 */
export async function adminGetSiteSettings(): Promise<ApiResponse<SiteSettings>> {
  return getSiteSettings();
}

/**
 * Admin: Update site settings
 */
export async function adminUpdateSiteSettings(
  partial: Partial<Omit<SiteSettings, 'id' | 'admin_user_id' | 'updated_at'>>
): Promise<ApiResponse<SiteSettings>> {
  try {
    // Get current settings to get the ID
    const { data: current, error: fetchError } = await getSiteSettings();
    if (fetchError || !current) {
      return { data: null, error: fetchError || 'Settings not found' };
    }

    const updateData: Record<string, unknown> = {};
    if (partial.nav_config) updateData.nav_config = partial.nav_config;
    if (partial.home_sections) updateData.home_sections = partial.home_sections;
    if (partial.theme) updateData.theme = partial.theme;
    if (partial.seo) updateData.seo = partial.seo;
    if (partial.pages) updateData.pages = partial.pages;

    const { data, error } = await supabase
      .from('site_settings')
      .update(updateData)
      .eq('id', current.id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: transformSiteSettings(data), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: List all projects (including unpublished)
 */
export async function adminListProjects(): Promise<ApiResponse<ExtendedProject[]>> {
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
 * Admin: Insert or update a project
 */
export async function adminUpsertProject(
  project: Partial<ExtendedProject> & { slug: string; title: string; summary: string }
): Promise<ApiResponse<ExtendedProject>> {
  try {
    const upsertData: Record<string, unknown> = {
      slug: project.slug,
      title: project.title,
      summary: project.summary,
      tags: project.tags || [],
      status: project.status || 'PUBLIC',
      detail_level: project.detail_level || 'STANDARD',
      featured: project.featured ?? false,
      published: project.published ?? false,
      sections_config: project.sections_config || {},
      content: project.content || {},
      media: project.media || [],
      metrics: project.metrics || [],
      decision_log: project.decision_log || [],
    };

    if (project.id) {
      upsertData.id = project.id;
    }

    const { data, error } = await supabase
      .from('projects')
      .upsert(upsertData, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: transformProject(data), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: Delete a project
 */
export async function adminDeleteProject(id: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: List all writing categories
 */
export async function adminListWritingCategories(): Promise<ApiResponse<WritingCategory[]>> {
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
 * Admin: Insert or update a writing category
 */
export async function adminUpsertWritingCategory(
  category: Partial<WritingCategory> & { name: string }
): Promise<ApiResponse<WritingCategory>> {
  try {
    const upsertData: Record<string, unknown> = {
      name: category.name,
      order_index: category.order_index ?? 0,
      enabled: category.enabled ?? true,
    };

    if (category.id) {
      upsertData.id = category.id;
    }

    const { data, error } = await supabase
      .from('writing_categories')
      .upsert(upsertData)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as WritingCategory, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: Delete a writing category
 */
export async function adminDeleteWritingCategory(id: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('writing_categories')
      .delete()
      .eq('id', id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: List all writing items
 */
export async function adminListWritingItems(): Promise<ApiResponse<WritingItemWithCategory[]>> {
  try {
    const { data, error } = await supabase
      .from('writing_items')
      .select(`
        *,
        writing_categories(*)
      `)
      .order('order_index');

    if (error) {
      return { data: null, error: error.message };
    }

    const items: WritingItemWithCategory[] = (data || []).map(row => ({
      id: row.id,
      category_id: row.category_id,
      title: row.title,
      url: row.url,
      platform_label: row.platform_label,
      language: row.language as WritingLanguage,
      featured: row.featured,
      enabled: row.enabled,
      order_index: row.order_index,
      why_this_matters: row.why_this_matters,
      show_why: row.show_why,
      category: row.writing_categories as WritingCategory | undefined,
    }));

    return { data: items, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Admin: Insert or update a writing item
 */
export async function adminUpsertWritingItem(
  item: Partial<WritingItem> & { title: string; url: string }
): Promise<ApiResponse<WritingItem>> {
  try {
    const upsertData: Record<string, unknown> = {
      title: item.title,
      url: item.url,
      category_id: item.category_id || null,
      platform_label: item.platform_label || '',
      language: item.language || 'AUTO',
      featured: item.featured ?? false,
      enabled: item.enabled ?? true,
      order_index: item.order_index ?? 0,
      why_this_matters: item.why_this_matters || null,
      show_why: item.show_why ?? false,
    };

    if (item.id) {
      upsertData.id = item.id;
    }

    const { data, error } = await supabase
      .from('writing_items')
      .upsert(upsertData)
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
export async function adminDeleteWritingItem(id: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('writing_items')
      .delete()
      .eq('id', id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
