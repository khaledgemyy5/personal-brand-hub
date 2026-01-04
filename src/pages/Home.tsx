import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, Linkedin, Calendar } from "lucide-react";
import { getSiteSettings, getPublishedProjects, getWritingItems, trackEvent } from "@/lib/db";
import type { SiteSettings, ProjectListItem, WritingListItem, HomeSectionConfig } from "@/lib/types";

// Default home sections for fallback
const defaultHomeSections: HomeSectionConfig[] = [
  { id: 'hero', visible: true, order: 1 },
  { id: 'experience_snapshot', visible: true, order: 2 },
  { id: 'featured_projects', visible: true, order: 3 },
  { id: 'how_i_work', visible: true, order: 4 },
  { id: 'selected_writing_preview', visible: true, order: 5 },
  { id: 'contact_cta', visible: true, order: 6 },
];

// Default SEO for fallback
const defaultSeo = {
  title: 'Ammar Jaber',
  description: 'Technical Product Manager (ex‑LLM / Software Engineer)',
};

export default function Home() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [writing, setWriting] = useState<WritingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Sorted visible sections - use defaults if settings is null
  const visibleSections = useMemo(() => {
    const sections = settings?.home_sections.sections ?? defaultHomeSections;
    return sections
      .filter(s => s.visible)
      .sort((a, b) => a.order - b.order);
  }, [settings]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      // Load settings, projects, and writing in parallel
      const [settingsRes, projectsRes, writingRes] = await Promise.all([
        getSiteSettings(),
        getPublishedProjects({ limit: 3 }),
        getWritingItems({ featuredOnly: true, limit: 3 }),
      ]);

      // Settings will always have data now (defaults returned on error)
      const loadedSettings = settingsRes.data;
      setSettings(loadedSettings);

      // Filter to featured projects only
      if (projectsRes.data) {
        setProjects(projectsRes.data.filter(p => p.featured));
      }
      if (writingRes.data) {
        setWriting(writingRes.data);
      }

      setLoading(false);
      
      // Track page view
      trackEvent({ event: "page_view", path: "/" });
    }

    loadData();
  }, []);

  // SEO data with fallbacks
  const seoTitle = settings?.seo.title || defaultSeo.title;
  const seoDescription = settings?.seo.description || defaultSeo.description;

  // Render section by ID
  const renderSection = (section: HomeSectionConfig) => {
    switch (section.id) {
      case "hero":
        return <HeroSection key="hero" settings={settings} />;
      
      case "experience_snapshot":
        return <ExperienceSnapshotSection key="experience_snapshot" settings={settings} />;
      
      case "featured_projects":
        // Auto-hide if no projects
        if (projects.length === 0) return null;
        return <FeaturedProjectsSection key="featured_projects" projects={projects} />;
      
      case "how_i_work":
        return <HowIWorkSection key="how_i_work" settings={settings} />;
      
      case "selected_writing_preview":
        // Auto-hide if no writing items
        if (writing.length === 0) return null;
        return <SelectedWritingSection key="selected_writing_preview" items={writing} />;
      
      case "contact_cta":
        return <ContactCtaSection key="contact_cta" settings={settings} />;
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container-narrow section-spacing">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-muted rounded w-3/4" />
          <div className="h-6 bg-muted rounded w-1/2" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO Meta */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      
      <div className="container-narrow section-spacing">
        {visibleSections.map(section => renderSection(section))}
      </div>
    </>
  );
}

// =============================================================================
// Section Components
// =============================================================================

function HeroSection({ settings }: { settings: SiteSettings | null }) {
  const seo = settings?.seo;
  
  return (
    <section className="mb-16">
      <h1 className="text-balance mb-6">
        {seo?.title || "Building products that matter."}
      </h1>
      <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-8">
        {seo?.description || "Software engineer focused on creating thoughtful, user-centered experiences."}
      </p>
      <div className="flex items-center gap-4">
        <Link 
          to="/projects" 
          className="inline-flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors"
        >
          View projects
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link 
          to="/contact" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Get in touch
        </Link>
      </div>
    </section>
  );
}

function ExperienceSnapshotSection({ settings }: { settings: SiteSettings | null }) {
  // Could be extended to read from settings.pages.experience or similar
  // For now, show a simple static snapshot
  const hasContent = true; // Placeholder - check settings for real data
  
  if (!hasContent) return null;
  
  return (
    <section className="mb-16">
      <h2 className="text-xl mb-6">Experience</h2>
      <p className="text-muted-foreground leading-relaxed">
        Technical Product Manager with a background in software engineering and LLM development.
        Focused on building products that solve real problems.
      </p>
    </section>
  );
}

function FeaturedProjectsSection({ projects }: { projects: ProjectListItem[] }) {
  const handleProjectClick = (slug: string) => {
    trackEvent({ event: "project_view", path: `/projects/${slug}` });
  };

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl">Selected Projects</h2>
        <Link 
          to="/projects" 
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all →
        </Link>
      </div>
      
      <div className="space-y-4">
        {projects.map(project => (
          <Link 
            key={project.id}
            to={`/projects/${project.slug}`}
            onClick={() => handleProjectClick(project.slug)}
            className="block p-4 -mx-4 rounded-md card-hover"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-medium mb-1">{project.title}</h3>
                <p className="text-sm text-muted-foreground">{project.summary}</p>
              </div>
              {project.status === "CONFIDENTIAL" && (
                <span className="text-xs text-muted-foreground shrink-0 uppercase tracking-wide">
                  Confidential
                </span>
              )}
            </div>
            {project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {project.tags.slice(0, 4).map(tag => (
                  <span key={tag} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

function HowIWorkSection({ settings }: { settings: SiteSettings | null }) {
  // Check for methodology in pages config
  const methodology = (settings?.pages as { methodology?: string[] })?.methodology;
  
  // Hide if no methodology defined
  if (!methodology || methodology.length === 0) return null;
  
  return (
    <section className="mb-16">
      <h2 className="text-xl mb-6">How I Work</h2>
      <ul className="space-y-3">
        {methodology.map((item, i) => (
          <li key={i} className="text-muted-foreground flex items-start gap-3">
            <span className="text-accent">•</span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SelectedWritingSection({ items }: { items: WritingListItem[] }) {
  const handleWritingClick = (url: string) => {
    trackEvent({ event: "writing_click", path: url });
  };

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl">Selected Writing</h2>
        <Link 
          to="/writing" 
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all →
        </Link>
      </div>
      
      <div className="space-y-4">
        {items.map(item => (
          <a 
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleWritingClick(item.url)}
            className="block p-4 -mx-4 rounded-md card-hover"
            dir="auto"
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-serif text-lg font-medium" dir="auto">{item.title}</h3>
              <span className="text-sm text-muted-foreground shrink-0">
                {item.platform_label || item.category_name} ↗
              </span>
            </div>
            {item.show_why && item.why_this_matters && (
              <p className="text-sm text-muted-foreground mt-2" dir="auto">
                {item.why_this_matters}
              </p>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}

function ContactCtaSection({ settings }: { settings: SiteSettings | null }) {
  const contactConfig = settings?.pages.contact;
  const email = contactConfig?.email;
  
  // Extended contact info (could be in pages config)
  const pagesExtended = settings?.pages as { 
    contact?: { 
      enabled?: boolean;
      email?: string; 
      linkedin?: string; 
      calendly?: string;
    } 
  };
  const linkedin = pagesExtended?.contact?.linkedin;
  const calendly = pagesExtended?.contact?.calendly;

  // Hide if contact is disabled or no contact methods
  if (!contactConfig?.enabled && !email) return null;

  const handleContactClick = (type: string) => {
    trackEvent({ event: "contact_click", path: `/${type}` });
  };

  return (
    <section className="mb-16">
      <h2 className="text-xl mb-6">Get in Touch</h2>
      <p className="text-muted-foreground mb-6">
        Interested in working together or just want to say hello? Feel free to reach out.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        {email && (
          <a 
            href={`mailto:${email}`}
            onClick={() => handleContactClick("email")}
            className="inline-flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
        )}
        {linkedin && (
          <a 
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleContactClick("linkedin")}
            className="inline-flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors"
          >
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </a>
        )}
        {calendly && (
          <a 
            href={calendly}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleContactClick("calendly")}
            className="inline-flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Book a call
          </a>
        )}
        <Link 
          to="/contact" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Contact page →
        </Link>
      </div>
    </section>
  );
}
