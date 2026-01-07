import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, Linkedin, Calendar, Download, Briefcase, Lightbulb, Users } from "lucide-react";
import { getSiteSettings, getPublishedProjects, getWritingItems, trackEvent } from "@/lib/db";
import { demoExperience, demoMethodology } from "@/lib/demoData";
import type { SiteSettings, ProjectListItem, WritingListItem, HomeSectionConfig } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Default home sections for fallback
const defaultHomeSections: HomeSectionConfig[] = [
  { id: 'hero', visible: true, order: 1 },
  { id: 'experience_snapshot', visible: true, order: 2 },
  { id: 'featured_projects', visible: true, order: 3, limit: 3 },
  { id: 'how_i_work', visible: true, order: 4 },
  { id: 'selected_writing_preview', visible: true, order: 5, limit: 3 },
  { id: 'contact_cta', visible: true, order: 6 },
];

export default function Home() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [writing, setWriting] = useState<WritingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Sorted visible sections
  const visibleSections = useMemo(() => {
    const sections = settings?.home_sections.sections ?? defaultHomeSections;
    return sections
      .filter(s => s.visible)
      .sort((a, b) => a.order - b.order);
  }, [settings]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      const [settingsRes, projectsRes, writingRes] = await Promise.all([
        getSiteSettings(),
        getPublishedProjects({ limit: 3 }),
        getWritingItems({ featuredOnly: true, limit: 3 }),
      ]);

      const loadedSettings = settingsRes.data;
      setSettings(loadedSettings);

      if (projectsRes.data) {
        setProjects(projectsRes.data.filter(p => p.featured));
      }
      if (writingRes.data) {
        setWriting(writingRes.data);
      }

      setLoading(false);
      trackEvent({ event: "page_view", path: "/" });
    }

    loadData();
  }, []);

  const seoTitle = settings?.seo.title || 'Ammar Jaber';
  const seoDescription = settings?.seo.description || 'Technical Product Manager (ex‑LLM / Software Engineer)';

  const renderSection = (section: HomeSectionConfig) => {
    switch (section.id) {
      case "hero":
        return <HeroSection key="hero" settings={settings} />;
      case "experience_snapshot":
        return <ExperienceSnapshotSection key="experience_snapshot" />;
      case "featured_projects":
        if (projects.length === 0) return null;
        return <FeaturedProjectsSection key="featured_projects" projects={projects} />;
      case "how_i_work":
        return <HowIWorkSection key="how_i_work" settings={settings} />;
      case "selected_writing_preview":
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
      <div className="container-narrow py-16 md:py-24">
        <div className="animate-pulse space-y-8">
          <div className="h-16 bg-muted rounded w-3/4" />
          <div className="h-6 bg-muted rounded w-1/2" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      
      <div className="container-narrow py-16 md:py-24">
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
  const resumeEnabled = settings?.pages?.resume?.enabled !== false;
  
  return (
    <section className="mb-20 md:mb-28">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium tracking-tight mb-6">
        {seo?.title || "Ammar Jaber"}
      </h1>
      <p className="text-xl md:text-2xl text-muted-foreground mb-4">
        Technical Product Manager
      </p>
      <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-10">
        {seo?.description || "Building products that solve real problems. Previously software engineer and LLM developer."}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        {resumeEnabled && (
          <Button asChild size="lg" className="gap-2">
            <Link to="/resume">
              <Download className="w-4 h-4" />
              Download Resume
            </Link>
          </Button>
        )}
        <Button asChild variant="outline" size="lg" className="gap-2">
          <Link to="/projects">
            View Projects
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function ExperienceSnapshotSection() {
  return (
    <section className="mb-20 md:mb-28">
      <h2 className="text-2xl font-serif font-medium mb-8">Experience</h2>
      <div className="space-y-8">
        {demoExperience.map((exp, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-8">
            <span className="text-sm text-muted-foreground shrink-0 w-32">
              {exp.period}
            </span>
            <div>
              <h3 className="font-medium">{exp.role}</h3>
              <p className="text-muted-foreground">{exp.company}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedProjectsSection({ projects }: { projects: ProjectListItem[] }) {
  const handleProjectClick = (slug: string) => {
    trackEvent({ event: "project_view", path: `/projects/${slug}` });
  };

  return (
    <section className="mb-20 md:mb-28">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-serif font-medium">Featured Projects</h2>
        <Link 
          to="/projects" 
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map(project => (
          <Link 
            key={project.id}
            to={`/projects/${project.slug}`}
            onClick={() => handleProjectClick(project.slug)}
            className="group block p-6 rounded-lg border border-border hover:border-foreground/20 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-serif text-lg font-medium group-hover:text-accent transition-colors">
                {project.title}
              </h3>
              {project.status === "CONFIDENTIAL" && (
                <Badge variant="secondary" className="shrink-0 text-xs">Confidential</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {project.summary}
            </p>
            {project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
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
  const methodology = (settings?.pages as { methodology?: string[] })?.methodology ?? demoMethodology;
  
  const principles = [
    { icon: Briefcase, title: 'Start with why', description: methodology[0] || 'Every product decision ties back to user value.' },
    { icon: Lightbulb, title: 'Ship fast, learn faster', description: methodology[1] || 'Small iterations, measurable outcomes.' },
    { icon: Users, title: 'Build bridges', description: methodology[3] || 'Great products need engineers, designers, and stakeholders aligned.' },
  ];

  return (
    <section className="mb-20 md:mb-28">
      <h2 className="text-2xl font-serif font-medium mb-8">How I Work</h2>
      <div className="grid gap-8 md:grid-cols-3">
        {principles.map((item, i) => (
          <div key={i}>
            <item.icon className="w-6 h-6 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SelectedWritingSection({ items }: { items: WritingListItem[] }) {
  const handleWritingClick = (url: string) => {
    trackEvent({ event: "writing_click", path: url });
  };

  return (
    <section className="mb-20 md:mb-28">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-serif font-medium">Selected Writing</h2>
        <Link 
          to="/writing" 
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      
      <div className="space-y-1">
        {items.map(item => (
          <a 
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleWritingClick(item.url)}
            className="flex items-center justify-between gap-4 py-4 border-b border-border last:border-0 group hover:bg-secondary/30 -mx-4 px-4 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span 
                className="font-medium group-hover:text-accent transition-colors truncate" 
                dir="auto"
              >
                {item.title}
              </span>
              {item.language === 'AR' && (
                <Badge variant="outline" className="shrink-0 text-xs">AR</Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground shrink-0">
              {item.platform_label} ↗
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function ContactCtaSection({ settings }: { settings: SiteSettings | null }) {
  const contactConfig = settings?.pages.contact as { 
    enabled?: boolean;
    email?: string; 
    linkedin?: string; 
    calendar?: string;
  } | undefined;

  const email = contactConfig?.email;
  const linkedin = contactConfig?.linkedin;
  const calendar = contactConfig?.calendar;

  const handleContactClick = (type: string) => {
    trackEvent({ event: "contact_click", path: `/${type}` });
  };

  return (
    <section className="pt-8 border-t border-border">
      <h2 className="text-2xl md:text-3xl font-serif font-medium mb-4">
        Ready to build something impactful?
      </h2>
      <p className="text-muted-foreground mb-8 max-w-lg">
        Whether you have a project in mind or just want to chat about product and engineering, I'd love to hear from you.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        {email && (
          <Button asChild variant="default" size="lg" className="gap-2">
            <a href={`mailto:${email}`} onClick={() => handleContactClick("email")}>
              <Mail className="w-4 h-4" />
              Email me
            </a>
          </Button>
        )}
        {linkedin && (
          <Button asChild variant="outline" size="lg" className="gap-2">
            <a 
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleContactClick("linkedin")}
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </a>
          </Button>
        )}
        {calendar && (
          <Button asChild variant="outline" size="lg" className="gap-2">
            <a 
              href={calendar}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleContactClick("calendar")}
            >
              <Calendar className="w-4 h-4" />
              Book a chat
            </a>
          </Button>
        )}
      </div>
    </section>
  );
}
