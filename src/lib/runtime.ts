// =============================================================================
// Runtime validators and safe JSON parsing utilities
// Minimal dependencies - no external validation libraries
// =============================================================================

import type {
  NavConfig,
  NavLink,
  HomeSectionConfig,
  ThemeConfig,
  SEOConfig,
  PagesConfig,
  ProjectSectionsConfig,
  ProjectContent,
} from './types';

// -----------------------------------------------------------------------------
// Safe JSON parsing
// -----------------------------------------------------------------------------

export function safeParseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

// -----------------------------------------------------------------------------
// Type guards and validators
// -----------------------------------------------------------------------------

export function isString(v: unknown): v is string {
  return typeof v === 'string';
}

export function isNumber(v: unknown): v is number {
  return typeof v === 'number' && !isNaN(v);
}

export function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}

export function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// -----------------------------------------------------------------------------
// NavConfig validation
// -----------------------------------------------------------------------------

function isNavLink(v: unknown): v is NavLink {
  if (!isObject(v)) return false;
  return isString(v.href) && isString(v.label) && isBoolean(v.visible);
}

export function parseNavConfig(raw: unknown): NavConfig {
  const fallback: NavConfig = { links: [] };
  const obj = safeParseJson(raw, fallback);
  
  if (!isObject(obj)) return fallback;
  
  const links = isArray(obj.links) 
    ? (obj.links as unknown[]).filter(isNavLink)
    : [];
  
  let ctaButton: NavConfig['ctaButton'] = undefined;
  if (isObject(obj.ctaButton)) {
    const cta = obj.ctaButton;
    if (isString(cta.href) && isString(cta.label) && isBoolean(cta.visible)) {
      ctaButton = { href: cta.href, label: cta.label, visible: cta.visible };
    }
  }
  
  return { links, ctaButton };
}

// -----------------------------------------------------------------------------
// HomeSections validation
// -----------------------------------------------------------------------------

function isHomeSectionConfig(v: unknown): v is HomeSectionConfig {
  if (!isObject(v)) return false;
  return isString(v.id) && isBoolean(v.visible) && isNumber(v.order);
}

export function parseHomeSections(raw: unknown): { sections: HomeSectionConfig[] } {
  const fallback = { sections: [] };
  const obj = safeParseJson(raw, fallback);
  
  if (!isObject(obj)) return fallback;
  
  const sections = isArray(obj.sections)
    ? (obj.sections as unknown[]).filter(isHomeSectionConfig).map(s => ({
        id: s.id,
        visible: s.visible,
        order: s.order,
        limit: isNumber((s as unknown as Record<string, unknown>).limit) ? (s as unknown as { limit: number }).limit : undefined
      }))
    : [];
  
  return { sections };
}

// -----------------------------------------------------------------------------
// ThemeConfig validation
// -----------------------------------------------------------------------------

export function parseThemeConfig(raw: unknown): ThemeConfig {
  const fallback: ThemeConfig = { mode: 'system' };
  const obj = safeParseJson(raw, fallback);
  
  if (!isObject(obj)) return fallback;
  
  const mode = obj.mode === 'light' || obj.mode === 'dark' || obj.mode === 'system' 
    ? obj.mode 
    : 'system';
  
  return {
    mode,
    accentColor: isString(obj.accentColor) ? obj.accentColor : undefined,
  };
}

// -----------------------------------------------------------------------------
// SEOConfig validation
// -----------------------------------------------------------------------------

export function parseSEOConfig(raw: unknown): SEOConfig {
  const fallback: SEOConfig = { title: '', description: '' };
  const obj = safeParseJson(raw, fallback);
  
  if (!isObject(obj)) return fallback;
  
  return {
    title: isString(obj.title) ? obj.title : '',
    description: isString(obj.description) ? obj.description : '',
    ogImage: isString(obj.ogImage) ? obj.ogImage : null,
    twitterHandle: isString(obj.twitterHandle) ? obj.twitterHandle : null,
    canonicalUrl: isString(obj.canonicalUrl) ? obj.canonicalUrl : null,
  };
}

// -----------------------------------------------------------------------------
// PagesConfig validation
// -----------------------------------------------------------------------------

export function parsePagesConfig(raw: unknown): PagesConfig {
  const fallback: PagesConfig = {};
  const obj = safeParseJson(raw, fallback);
  
  if (!isObject(obj)) return fallback;
  
  const pages: PagesConfig = {};
  
  if (isObject(obj.resume)) {
    pages.resume = {
      enabled: isBoolean(obj.resume.enabled) ? obj.resume.enabled : false,
      pdfUrl: isString(obj.resume.pdfUrl) ? obj.resume.pdfUrl : null,
      showCopyText: isBoolean(obj.resume.showCopyText) ? obj.resume.showCopyText : undefined,
      showDownload: isBoolean(obj.resume.showDownload) ? obj.resume.showDownload : undefined,
    };
  }
  
  if (isObject(obj.contact)) {
    pages.contact = {
      enabled: isBoolean(obj.contact.enabled) ? obj.contact.enabled : false,
      showForm: isBoolean(obj.contact.showForm) ? obj.contact.showForm : undefined,
      email: isString(obj.contact.email) ? obj.contact.email : undefined,
    };
  }
  
  return pages;
}

// -----------------------------------------------------------------------------
// ProjectSectionsConfig validation
// -----------------------------------------------------------------------------

export function parseProjectSectionsConfig(raw: unknown): ProjectSectionsConfig {
  const fallback: ProjectSectionsConfig = {};
  const obj = safeParseJson(raw, fallback);
  
  if (!isObject(obj)) return fallback;
  
  return {
    showOverview: isBoolean(obj.showOverview) ? obj.showOverview : undefined,
    showChallenge: isBoolean(obj.showChallenge) ? obj.showChallenge : undefined,
    showApproach: isBoolean(obj.showApproach) ? obj.showApproach : undefined,
    showOutcome: isBoolean(obj.showOutcome) ? obj.showOutcome : undefined,
    showImages: isBoolean(obj.showImages) ? obj.showImages : undefined,
    maxImages: isNumber(obj.maxImages) ? obj.maxImages : undefined,
  };
}

// -----------------------------------------------------------------------------
// ProjectContent validation
// -----------------------------------------------------------------------------

export function parseProjectContent(raw: unknown): ProjectContent {
  const fallback: ProjectContent = {};
  const obj = safeParseJson(raw, fallback);
  
  if (!isObject(obj)) return fallback;
  
  const content: ProjectContent = {
    overview: isString(obj.overview) ? obj.overview : undefined,
    challenge: isString(obj.challenge) ? obj.challenge : undefined,
    approach: isString(obj.approach) ? obj.approach : undefined,
    outcome: isString(obj.outcome) ? obj.outcome : undefined,
    note: isString(obj.note) ? obj.note : undefined,
  };
  
  if (isObject(obj.links)) {
    content.links = {
      live: isString(obj.links.live) ? obj.links.live : null,
      github: isString(obj.links.github) ? obj.links.github : null,
    };
  }
  
  return content;
}

// -----------------------------------------------------------------------------
// Media validation
// -----------------------------------------------------------------------------

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  caption?: string;
}

function isMediaItem(v: unknown): v is MediaItem {
  if (!isObject(v)) return false;
  if (v.type !== 'image' && v.type !== 'video') return false;
  return isString(v.url);
}

export function parseMedia(raw: unknown): MediaItem[] {
  const arr = safeParseJson(raw, []);
  if (!isArray(arr)) return [];
  return arr.filter(isMediaItem).map(m => ({
    type: m.type,
    url: m.url,
    caption: isString((m as unknown as Record<string, unknown>).caption) ? (m as unknown as { caption: string }).caption : undefined,
  }));
}

// -----------------------------------------------------------------------------
// Metrics validation (array of strings)
// -----------------------------------------------------------------------------

export function parseMetrics(raw: unknown): string[] {
  const arr = safeParseJson(raw, []);
  if (!isArray(arr)) return [];
  return arr.filter(isString);
}

// -----------------------------------------------------------------------------
// Decision log validation
// -----------------------------------------------------------------------------

export interface DecisionLogEntry {
  decision: string;
  tradeoff: string;
  outcome: string;
}

function isDecisionLogEntry(v: unknown): v is DecisionLogEntry {
  if (!isObject(v)) return false;
  return isString(v.decision) && isString(v.tradeoff) && isString(v.outcome);
}

export function parseDecisionLog(raw: unknown): DecisionLogEntry[] {
  const arr = safeParseJson(raw, []);
  if (!isArray(arr)) return [];
  return arr.filter(isDecisionLogEntry);
}

// -----------------------------------------------------------------------------
// String array validation (for tags)
// -----------------------------------------------------------------------------

export function parseStringArray(raw: unknown): string[] {
  if (!isArray(raw)) return [];
  return raw.filter(isString);
}
