import type { SiteSettings } from './types';

/**
 * Default site settings used when:
 * - Supabase env vars are missing
 * - Database query fails
 * - No site_settings row exists
 * 
 * Public pages render normally with these defaults.
 * Admin pages show configuration warnings.
 */
export const defaultSiteSettings: SiteSettings = {
  id: 'default',
  admin_user_id: '',
  nav_config: {
    links: [
      { href: '/', label: 'Home', visible: true },
      { href: '/projects', label: 'Projects', visible: true },
      { href: '/writing', label: 'Writing', visible: true },
      { href: '/contact', label: 'Contact', visible: true },
    ],
    ctaButton: { href: '/resume', label: 'Resume', visible: true },
  },
  home_sections: {
    sections: [
      { id: 'hero', visible: true, order: 1 },
      { id: 'experience_snapshot', visible: true, order: 2 },
      { id: 'featured_projects', visible: true, order: 3, limit: 3 },
      { id: 'how_i_work', visible: true, order: 4 },
      { id: 'selected_writing_preview', visible: true, order: 5, limit: 3 },
      { id: 'contact_cta', visible: true, order: 6 },
    ],
  },
  theme: { mode: 'system', accentColor: '#135BEC', font: 'inter' },
  seo: {
    title: 'Ammar Jaber',
    description: 'Technical Product Manager (ex‑LLM / Software Engineer)',
  },
  pages: {
    resume: { enabled: true, pdfUrl: null, showCopyText: true, showDownload: true },
    contact: { enabled: true, email: 'hello@example.com', showForm: false },
  },
  updated_at: new Date().toISOString(),
};

/**
 * Default methodology bullets (stored in pages.methodology in DB but typed separately)
 */
export const defaultMethodology: string[] = [
  'Start with why: Every product decision ties back to user value.',
  'Ship fast, learn faster: Small iterations, measurable outcomes.',
  'Write it down: Decisions, trade-offs, and context matter.',
  'Build bridges: Great products need engineers, designers, and stakeholders aligned.',
];
