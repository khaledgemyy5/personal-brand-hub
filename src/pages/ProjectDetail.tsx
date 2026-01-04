import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Github, ChevronDown } from "lucide-react";
import { getProjectBySlug, getPublishedProjects, trackEvent } from "@/lib/db";
import type { ExtendedProject } from "@/lib/db";
import type { ProjectListItem } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<ExtendedProject | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadProject() {
      if (!slug) return;

      setLoading(true);
      const res = await getProjectBySlug(slug);

      if (res.data) {
        setProject(res.data);
        trackEvent({ event: "project_view", path: `/projects/${slug}` });

        // Load related projects based on shared tags
        if (res.data.tags?.length > 0) {
          const allProjectsRes = await getPublishedProjects();
          if (allProjectsRes.data) {
            const related = allProjectsRes.data
              .filter(
                (p) =>
                  p.slug !== slug &&
                  p.tags?.some((t) => res.data!.tags.includes(t))
              )
              .slice(0, 3);
            setRelatedProjects(related);
          }
        }
      } else {
        setNotFound(true);
      }

      setLoading(false);
    }

    loadProject();
    trackEvent({ event: "page_view", path: `/projects/${slug}` });
  }, [slug]);

  // Determine visible sections based on detail_level and sections_config
  const visibleSections = useMemo(() => {
    if (!project) return {};

    const config = project.sections_config || {};
    const level = project.detail_level || "STANDARD";
    const isConfidential = project.status === "CONFIDENTIAL";

    // Default visibility based on detail level
    const defaults: Record<string, boolean> = {
      overview: true,
      context: level !== "BRIEF" && !isConfidential,
      problem: level !== "BRIEF" && !isConfidential,
      your_role: level !== "BRIEF" && !isConfidential,
      constraints: level === "DEEP" && !isConfidential,
      approach_decisions: level !== "BRIEF" && !isConfidential,
      execution: level === "DEEP" && !isConfidential,
      impact: true,
      learnings: level === "DEEP" && !isConfidential,
      metrics: level !== "BRIEF",
      decision_log: level === "DEEP",
      media: level !== "BRIEF",
    };

    // Merge with explicit config
    return {
      overview: config.showOverview ?? defaults.overview,
      context: defaults.context,
      problem: defaults.problem,
      your_role: defaults.your_role,
      constraints: defaults.constraints,
      approach_decisions: config.showApproach ?? defaults.approach_decisions,
      execution: defaults.execution,
      impact: config.showOutcome ?? defaults.impact,
      learnings: defaults.learnings,
      metrics: defaults.metrics,
      decision_log: defaults.decision_log,
      media: config.showImages ?? defaults.media,
    };
  }, [project]);

  if (loading) {
    return (
      <div className="container-narrow section-spacing">
        <Skeleton className="h-4 w-32 mb-8" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-2/3 mb-6" />
        <div className="flex gap-2 mb-8">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-14" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="container-narrow section-spacing">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </Link>
        <h1 className="mb-4">Project not found</h1>
        <p className="text-muted-foreground">
          The project you are looking for does not exist or is not published.
        </p>
      </div>
    );
  }

  const content = project.content || {};
  const links = content.links || {};
  const maxImages = project.sections_config?.maxImages ?? 3;

  return (
    <>
      <title>{project.title} - Ammar</title>
      <meta name="description" content={project.summary} />

      <div className="container-narrow section-spacing">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </Link>

        {/* Confidential banner */}
        {project.status === "CONFIDENTIAL" && (
          <div className="bg-secondary border border-border rounded-lg p-4 mb-8">
            <p className="text-sm text-muted-foreground">
              Details intentionally limited due to confidentiality.
            </p>
          </div>
        )}

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 dir="auto">{project.title}</h1>
            <div className="flex items-center gap-2 shrink-0">
              {project.featured && <Badge variant="secondary">Featured</Badge>}
              {project.status === "CONCEPT" && (
                <Badge variant="outline">Concept</Badge>
              )}
            </div>
          </div>

          <p className="text-lg text-muted-foreground mb-4" dir="auto">
            {project.summary}
          </p>

          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {(links.live || links.github) && (
            <div className="flex items-center gap-4">
              {links.live && (
                <a
                  href={links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm hover:text-accent transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Live site
                </a>
              )}
              {links.github && (
                <a
                  href={links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm hover:text-accent transition-colors"
                >
                  <Github className="w-4 h-4" />
                  Source code
                </a>
              )}
            </div>
          )}
        </header>

        {/* Content sections */}
        <article className="space-y-10">
          {visibleSections.overview && content.overview && (
            <ContentSection title="Overview" content={content.overview} />
          )}

          {visibleSections.context && content.context && (
            <ContentSection title="Context" content={content.context} />
          )}

          {visibleSections.problem && content.problem && (
            <ContentSection title="Problem" content={content.problem} />
          )}

          {visibleSections.your_role && content.your_role && (
            <ContentSection title="My Role" content={content.your_role} />
          )}

          {visibleSections.constraints && content.constraints && (
            <ContentSection title="Constraints" content={content.constraints} />
          )}

          {visibleSections.approach_decisions && content.approach_decisions && (
            <ContentSection
              title="Approach"
              content={content.approach_decisions}
            />
          )}

          {visibleSections.execution && content.execution && (
            <ContentSection title="Execution" content={content.execution} />
          )}

          {visibleSections.impact && content.impact && (
            <ContentSection title="Impact" content={content.impact} />
          )}

          {visibleSections.learnings && content.learnings && (
            <ContentSection title="Learnings" content={content.learnings} />
          )}

          {/* Metrics */}
          {visibleSections.metrics &&
            project.metrics &&
            project.metrics.length > 0 && (
              <CollapsibleSection title="Key Metrics" defaultOpen={false}>
                <ul className="space-y-2">
                  {project.metrics.map((metric, i) => (
                    <li
                      key={i}
                      className="text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-foreground">•</span>
                      <span dir="auto">{metric}</span>
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>
            )}

          {/* Decision Log */}
          {visibleSections.decision_log &&
            project.decision_log &&
            project.decision_log.length > 0 && (
              <CollapsibleSection title="Decision Log" defaultOpen={false}>
                <div className="space-y-6">
                  {project.decision_log.map((entry, i) => (
                    <div
                      key={i}
                      className="border-l-2 border-border pl-4 space-y-2"
                    >
                      <p className="font-medium" dir="auto">
                        {entry.decision}
                      </p>
                      <p className="text-sm text-muted-foreground" dir="auto">
                        <span className="font-medium">Trade-off:</span>{" "}
                        {entry.tradeoff}
                      </p>
                      <p className="text-sm text-muted-foreground" dir="auto">
                        <span className="font-medium">Outcome:</span>{" "}
                        {entry.outcome}
                      </p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

          {/* Media */}
          {visibleSections.media &&
            project.media &&
            project.media.length > 0 && (
              <section>
                <h2 className="text-lg font-medium mb-4">Media</h2>
                <div className="space-y-6">
                  {project.media.slice(0, maxImages).map((item, i) => (
                    <figure
                      key={i}
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      {item.type === "image" ? (
                        <img
                          src={item.url}
                          alt={item.caption || `Project image ${i + 1}`}
                          loading="lazy"
                          className="w-full aspect-video object-cover"
                        />
                      ) : item.type === "video" ? (
                        <div className="aspect-video">
                          <iframe
                            src={item.url}
                            title={item.caption || `Project video ${i + 1}`}
                            className="w-full h-full"
                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : null}
                      {item.caption && (
                        <figcaption
                          className="p-3 text-sm text-muted-foreground border-t border-border"
                          dir="auto"
                        >
                          {item.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </section>
            )}

          {/* Note */}
          {content.note && (
            <div className="bg-secondary/50 border border-border rounded-lg p-4 mt-8">
              <p className="text-sm text-muted-foreground" dir="auto">
                {content.note}
              </p>
            </div>
          )}
        </article>

        {/* Related Projects */}
        {relatedProjects.length > 0 && (
          <section className="mt-16 pt-8 border-t border-border">
            <h2 className="text-lg font-medium mb-6">Related Projects</h2>
            <div className="space-y-4">
              {relatedProjects.map((p) => (
                <Link
                  key={p.id}
                  to={`/projects/${p.slug}`}
                  className="block p-4 -mx-4 rounded-lg hover:bg-secondary/50 transition-colors"
                  onClick={() =>
                    trackEvent({
                      event: "project_view",
                      path: `/projects/${p.slug}`,
                    })
                  }
                >
                  <h3 className="font-medium mb-1" dir="auto">
                    {p.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2" dir="auto">
                    {p.summary}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function ContentSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <section>
      <h2 className="text-lg font-medium mb-3">{title}</h2>
      <p className="text-muted-foreground leading-relaxed whitespace-pre-line" dir="auto">
        {content}
      </p>
    </section>
  );
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-lg font-medium w-full text-left group">
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4 pl-6">{children}</CollapsibleContent>
    </Collapsible>
  );
}
