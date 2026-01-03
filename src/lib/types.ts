// =============================================================================
// Shared TypeScript types for the application
// Maps to Supabase database tables defined in docs/sql/
// =============================================================================

// -----------------------------------------------------------------------------
// ENUM Types (match PostgreSQL ENUMs)
// -----------------------------------------------------------------------------

export type ProjectStatus = 'PUBLIC' | 'CONFIDENTIAL' | 'CONCEPT';
export type DetailLevel = 'BRIEF' | 'STANDARD' | 'DEEP';
export type WritingLanguage = 'AUTO' | 'AR' | 'EN';

// -----------------------------------------------------------------------------
// Site Settings
// -----------------------------------------------------------------------------

export interface NavLink {
  href: string;
  label: string;
  visible: boolean;
}

export interface NavConfig {
  links: NavLink[];
  ctaButton?: {
    href: string;
    label: string;
    visible: boolean;
  };
}

export interface HomeSectionConfig {
  id: string;
  visible: boolean;
  order: number;
  limit?: number;
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  accentColor?: string;
}

export interface SEOConfig {
  title: string;
  description: string;
  ogImage?: string | null;
  twitterHandle?: string | null;
  canonicalUrl?: string | null;
}

export interface ResumePageConfig {
  enabled: boolean;
  pdfUrl?: string | null;
  showCopyText?: boolean;
  showDownload?: boolean;
}

export interface ContactPageConfig {
  enabled: boolean;
  showForm?: boolean;
  email?: string;
}

export interface PagesConfig {
  resume?: ResumePageConfig;
  contact?: ContactPageConfig;
}

export interface SiteSettings {
  id: string;
  admin_user_id: string;
  nav_config: NavConfig;
  home_sections: { sections: HomeSectionConfig[] };
  theme: ThemeConfig;
  seo: SEOConfig;
  pages: PagesConfig;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Projects
// -----------------------------------------------------------------------------

export interface ProjectSectionsConfig {
  showOverview?: boolean;
  showChallenge?: boolean;
  showApproach?: boolean;
  showOutcome?: boolean;
  showImages?: boolean;
  maxImages?: number;
}

export interface ProjectContent {
  overview?: string;
  challenge?: string;
  approach?: string;
  outcome?: string;
  note?: string;
  links?: {
    live?: string | null;
    github?: string | null;
  };
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  status: ProjectStatus;
  detail_level: DetailLevel;
  featured: boolean;
  published: boolean;
  sections_config: ProjectSectionsConfig;
  content: ProjectContent;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Writing
// -----------------------------------------------------------------------------

export interface WritingCategory {
  id: string;
  name: string;
  order_index: number;
  enabled: boolean;
}

export interface WritingItem {
  id: string;
  category_id: string | null;
  title: string;
  url: string;
  platform_label: string;
  language: WritingLanguage;
  featured: boolean;
  enabled: boolean;
  order_index: number;
  why_this_matters: string | null;
  show_why: boolean;
}

// With joined category
export interface WritingItemWithCategory extends WritingItem {
  category?: WritingCategory;
}

// -----------------------------------------------------------------------------
// Analytics
// -----------------------------------------------------------------------------

export interface AnalyticsEvent {
  id: number;
  ts: string;
  event: string;
  path: string;
  ref: string | null;
  sid: string;
}

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// For public project list (minimal fields)
export interface ProjectListItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  status: ProjectStatus;
  featured: boolean;
}

// For public writing list
export interface WritingListItem {
  id: string;
  title: string;
  url: string;
  platform_label: string;
  language: WritingLanguage;
  featured: boolean;
  why_this_matters: string | null;
  show_why: boolean;
  category_name?: string;
}
