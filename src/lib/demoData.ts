// =============================================================================
// Demo data for public pages when Supabase is not configured
// This allows the site to display realistic content as a fallback
// =============================================================================

import type {
  SiteSettings,
  ProjectListItem,
  WritingListItem,
  WritingCategory,
} from './types';
import type { ExtendedProject } from './db';

// -----------------------------------------------------------------------------
// Demo Site Settings
// -----------------------------------------------------------------------------

export const demoSiteSettings: SiteSettings = {
  id: 'demo',
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
    description: 'Technical Product Manager with a background in software engineering and LLM development. Building products that solve real problems.',
  },
  pages: {
    resume: { enabled: true, pdfUrl: null, showCopyText: true, showDownload: true },
    contact: { 
      enabled: true, 
      email: 'hello@ammar.dev', 
      linkedin: 'https://linkedin.com/in/ammarjaber',
      calendar: 'https://calendly.com/ammar',
      showForm: false,
    },
  },
  updated_at: new Date().toISOString(),
};

// Demo methodology for "How I Work" section
export const demoMethodology: string[] = [
  'Start with why: Every product decision ties back to user value.',
  'Ship fast, learn faster: Small iterations, measurable outcomes.',
  'Write it down: Decisions, trade-offs, and context matter.',
  'Build bridges: Great products need engineers, designers, and stakeholders aligned.',
];

// -----------------------------------------------------------------------------
// Demo Projects
// -----------------------------------------------------------------------------

export const demoProjects: ProjectListItem[] = [
  {
    id: 'demo-1',
    slug: 'ai-content-platform',
    title: 'AI-Powered Content Platform',
    summary: 'Led product strategy for an enterprise content generation platform using LLMs. Reduced content creation time by 60% while maintaining brand voice consistency.',
    tags: ['AI/LLM', 'Product', 'Enterprise'],
    status: 'PUBLIC',
    featured: true,
  },
  {
    id: 'demo-2',
    slug: 'fintech-infrastructure',
    title: 'Fintech Infrastructure Redesign',
    summary: 'Architected a modern payment processing system handling 100K+ daily transactions. Details limited due to client confidentiality.',
    tags: ['Engineering', 'Platform', 'Fintech'],
    status: 'CONFIDENTIAL',
    featured: true,
  },
  {
    id: 'demo-3',
    slug: 'developer-tools-concept',
    title: 'Developer Experience Framework',
    summary: 'A concept for improving developer onboarding and tooling. Exploring how great DX can reduce time-to-first-commit by 80%.',
    tags: ['Startups', 'Product', 'DevTools'],
    status: 'CONCEPT',
    featured: false,
  },
];

// Extended demo project for ProjectDetail page
export const demoProjectDetails: Record<string, ExtendedProject> = {
  'ai-content-platform': {
    id: 'demo-1',
    slug: 'ai-content-platform',
    title: 'AI-Powered Content Platform',
    summary: 'Led product strategy for an enterprise content generation platform using LLMs. Reduced content creation time by 60% while maintaining brand voice consistency.',
    tags: ['AI/LLM', 'Product', 'Enterprise'],
    status: 'PUBLIC',
    detail_level: 'STANDARD',
    featured: true,
    published: true,
    sections_config: {
      showOverview: true,
      showChallenge: true,
      showApproach: true,
      showOutcome: true,
      showImages: false,
      maxImages: 3,
    },
    content: {
      overview: 'Built a platform that leverages large language models to help enterprise marketing teams create on-brand content at scale. The system learns from existing content to maintain voice consistency while dramatically speeding up the creation process.',
      context: 'Enterprise marketing teams often struggle with content bottlenecks. Writers are expensive, turnaround times are slow, and maintaining brand consistency across channels is challenging.',
      problem: 'Content creation was the primary bottleneck for our client\'s marketing operations. The average blog post took 2 weeks from ideation to publication.',
      your_role: 'As Technical PM, I led the product strategy, worked closely with ML engineers on model fine-tuning, and coordinated with enterprise clients on integration requirements.',
      approach_decisions: 'We chose a hybrid approach: fine-tuned models for brand voice, combined with human-in-the-loop editing. This balanced quality with speed.',
      impact: 'Reduced average content creation time from 2 weeks to 3 days. The platform now powers content for 50+ enterprise clients.',
      links: {},
    },
    media: [],
    metrics: [
      '60% reduction in content creation time',
      '50+ enterprise clients onboarded',
      '98% brand voice consistency score',
    ],
    decision_log: [
      {
        decision: 'Use fine-tuned models instead of prompt-only approach',
        tradeoff: 'Higher initial setup cost but better long-term quality',
        outcome: 'Achieved 98% brand voice consistency vs 72% with prompts alone',
      },
    ],
    updated_at: new Date().toISOString(),
  },
  'fintech-infrastructure': {
    id: 'demo-2',
    slug: 'fintech-infrastructure',
    title: 'Fintech Infrastructure Redesign',
    summary: 'Architected a modern payment processing system handling 100K+ daily transactions. Details limited due to client confidentiality.',
    tags: ['Engineering', 'Platform', 'Fintech'],
    status: 'CONFIDENTIAL',
    detail_level: 'BRIEF',
    featured: true,
    published: true,
    sections_config: {
      showOverview: true,
      showChallenge: false,
      showApproach: false,
      showOutcome: true,
      showImages: false,
      maxImages: 0,
    },
    content: {
      overview: 'Led the technical redesign of a legacy payment processing system for a major fintech company. The new architecture improved reliability and reduced processing costs.',
      impact: 'System now handles 100K+ daily transactions with 99.99% uptime.',
      note: 'Additional details are under NDA. Happy to discuss high-level architecture in private conversations.',
    },
    media: [],
    metrics: ['100K+ daily transactions', '99.99% uptime'],
    decision_log: [],
    updated_at: new Date().toISOString(),
  },
  'developer-tools-concept': {
    id: 'demo-3',
    slug: 'developer-tools-concept',
    title: 'Developer Experience Framework',
    summary: 'A concept for improving developer onboarding and tooling. Exploring how great DX can reduce time-to-first-commit by 80%.',
    tags: ['Startups', 'Product', 'DevTools'],
    status: 'CONCEPT',
    detail_level: 'STANDARD',
    featured: false,
    published: true,
    sections_config: {
      showOverview: true,
      showChallenge: true,
      showApproach: true,
      showOutcome: true,
      showImages: false,
      maxImages: 3,
    },
    content: {
      overview: 'This is a concept project exploring how we might dramatically improve developer onboarding experiences. The goal is to reduce time-to-first-commit from days to hours.',
      context: 'Most companies lose significant productivity in the first weeks of a new developer hire. Complex setup processes, outdated documentation, and tribal knowledge create friction.',
      approach_decisions: 'Exploring a combination of automated environment setup, AI-assisted documentation, and interactive tutorials that adapt to each developer\'s background.',
      impact: 'Early prototypes suggest an 80% reduction in onboarding time is achievable. Seeking collaborators to validate this further.',
    },
    media: [],
    metrics: [],
    decision_log: [],
    updated_at: new Date().toISOString(),
  },
};

// -----------------------------------------------------------------------------
// Demo Writing
// -----------------------------------------------------------------------------

export const demoWritingCategories: WritingCategory[] = [
  { id: 'cat-1', name: 'Product & Strategy', order_index: 1, enabled: true },
  { id: 'cat-2', name: 'Technical', order_index: 2, enabled: true },
];

export const demoWritingItems: WritingListItem[] = [
  {
    id: 'writing-1',
    title: 'Building AI Products That Actually Ship',
    url: 'https://medium.com/@example/ai-products',
    platform_label: 'Medium',
    language: 'EN',
    featured: true,
    why_this_matters: 'Many AI projects fail not because of technical limitations, but product decisions. This piece explores the patterns that separate successful AI products from demos.',
    show_why: true,
    category_name: 'Product & Strategy',
  },
  {
    id: 'writing-2',
    title: 'كيف تبني منتجات تقنية في المنطقة العربية',
    url: 'https://linkedin.com/pulse/example',
    platform_label: 'LinkedIn',
    language: 'AR',
    featured: true,
    why_this_matters: null,
    show_why: false,
    category_name: 'Product & Strategy',
  },
  {
    id: 'writing-3',
    title: 'Practical Guide to LLM Fine-tuning',
    url: 'https://github.com/example/llm-finetuning',
    platform_label: 'GitHub',
    language: 'EN',
    featured: false,
    why_this_matters: 'A hands-on guide covering the entire fine-tuning pipeline from data preparation to deployment.',
    show_why: true,
    category_name: 'Technical',
  },
];

// -----------------------------------------------------------------------------
// Demo Experience for timeline
// -----------------------------------------------------------------------------

export const demoExperience = [
  {
    role: 'Technical Product Manager',
    company: 'AI Startup',
    period: '2022 – Present',
    description: 'Leading product for LLM-powered enterprise tools',
  },
  {
    role: 'Senior Software Engineer',
    company: 'Tech Company',
    period: '2019 – 2022',
    description: 'Built scalable backend systems and APIs',
  },
  {
    role: 'Software Engineer',
    company: 'Early Stage Startup',
    period: '2017 – 2019',
    description: 'Full-stack development and founding team member',
  },
];
