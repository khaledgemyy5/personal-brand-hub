// =============================================================================
// Shared TypeScript types for the application
// These will map to Supabase database tables once schema is created
// =============================================================================

// -----------------------------------------------------------------------------
// Site Settings
// -----------------------------------------------------------------------------

export interface NavConfig {
  links: Array<{
    href: string;
    label: string;
    visible: boolean;
  }>;
  ctaButton?: {
    href: string;
    label: string;
    visible: boolean;
  };
}

export interface HomeSectionConfig {
  id: string;
  type: "hero" | "projects" | "writing" | "contact";
  visible: boolean;
  order: number;
  settings?: Record<string, unknown>;
}

export interface ThemeConfig {
  mode: "light" | "dark" | "system";
  accentColor?: string;
}

export interface SEOConfig {
  title: string;
  description: string;
  ogImage?: string;
  twitterHandle?: string;
  canonicalUrl?: string;
}

export interface PageConfig {
  slug: string;
  title: string;
  enabled: boolean;
  seo?: Partial<SEOConfig>;
}

export interface SiteSettings {
  id: string;
  navConfig: NavConfig;
  homeSections: HomeSectionConfig[];
  theme: ThemeConfig;
  seo: SEOConfig;
  pages: PageConfig[];
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Profile / Resume
// -----------------------------------------------------------------------------

export interface SocialLink {
  platform: string;
  url: string;
  visible: boolean;
}

export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  location: string;
  bullets: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  period: string;
  location: string;
}

export interface Profile {
  id: string;
  name: string;
  title: string;
  email: string;
  location: string;
  bio: string;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  socialLinks: SocialLink[];
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Projects
// -----------------------------------------------------------------------------

export type ProjectStatus = "draft" | "published";

export interface ProjectSection {
  id: string;
  type: "text" | "image" | "gallery" | "quote";
  content: unknown;
  order: number;
}

export interface ProjectImage {
  id: string;
  url: string;
  caption: string; // Required per spec
  order: number;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription?: string;
  tags: string[];
  year: number;
  status: ProjectStatus;
  liveUrl?: string;
  githubUrl?: string;
  displayOrder: number;
  sectionsConfig?: ProjectSection[];
  images: ProjectImage[]; // Max 3 per spec
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Writing
// -----------------------------------------------------------------------------

export interface WritingCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
}

export interface WritingItem {
  id: string;
  title: string;
  description: string;
  publication?: string;
  externalUrl: string;
  categoryId?: string;
  publishedDate: string;
  displayOrder: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Database row types (snake_case for Supabase)
// -----------------------------------------------------------------------------

export interface DbProject {
  id: string;
  title: string;
  slug: string;
  description: string;
  long_description?: string;
  tags: string[];
  year: number;
  status: ProjectStatus;
  live_url?: string;
  github_url?: string;
  display_order: number;
  sections_config?: ProjectSection[];
  created_at: string;
  updated_at: string;
}

export interface DbProjectImage {
  id: string;
  project_id: string;
  image_url: string;
  caption: string;
  display_order: number;
}

export interface DbWritingItem {
  id: string;
  title: string;
  description: string;
  publication?: string;
  external_url: string;
  category_id?: string;
  published_date: string;
  display_order: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbProfile {
  id: string;
  name: string;
  title: string;
  email: string;
  location: string;
  bio: string;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  social_links: SocialLink[];
  created_at: string;
  updated_at: string;
}

export interface DbSiteSettings {
  id: string;
  nav_config: NavConfig;
  home_sections: HomeSectionConfig[];
  theme: ThemeConfig;
  seo: SEOConfig;
  pages: PageConfig[];
  created_at: string;
  updated_at: string;
}
