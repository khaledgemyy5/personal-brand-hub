import { useEffect, useState, useMemo, memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Lock, Lightbulb } from "lucide-react";
import { getPublishedProjects, trackEvent } from "@/lib/db";
import type { ProjectListItem, ProjectStatus } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Projects() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      const res = await getPublishedProjects();
      if (res.data) {
        // Sort: featured first, then by title
        const sorted = [...res.data].sort((a, b) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return a.title.localeCompare(b.title);
        });
        setProjects(sorted);
      }
      setLoading(false);
    }

    loadProjects();
    trackEvent({ event: "page_view", path: "/projects" });
  }, []);

  // Memoize unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    projects.forEach((p) => p.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [projects]);

  // Filter projects by selected tag
  const filteredProjects = useMemo(() => {
    if (!selectedTag) return projects;
    return projects.filter((p) => p.tags?.includes(selectedTag));
  }, [projects, selectedTag]);

  const handleProjectClick = useCallback((slug: string) => {
    trackEvent({ event: "project_view", path: `/projects/${slug}` });
  }, []);

  return (
    <>
      <title>Projects - Ammar</title>
      <meta
        name="description"
        content="Selected projects by Ammar. Software engineering and product work showcasing technical skills and problem-solving."
      />

      <div className="container-narrow py-16 md:py-24">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-4">Projects</h1>
          <p className="text-lg text-muted-foreground max-w-lg">
            A selection of projects I've worked on. Click through for details on approach, challenges, and outcomes.
          </p>
        </header>

        {/* Tag filter pills */}
        {!loading && allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-4 py-2 text-sm rounded-full border transition-all ${
                selectedTag === null
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2 text-sm rounded-full border transition-all ${
                  selectedTag === tag
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Projects grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <ProjectSkeleton />
            <ProjectSkeleton />
            <ProjectSkeleton />
          </div>
        ) : filteredProjects.length === 0 && selectedTag ? (
          <p className="text-muted-foreground py-8">No projects found with tag "{selectedTag}".</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredProjects.map((project) => (
              <ProjectItem
                key={project.id}
                title={project.title}
                summary={project.summary}
                tags={project.tags}
                featured={project.featured}
                status={project.status}
                slug={project.slug}
                onClick={() => handleProjectClick(project.slug)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const ProjectItem = memo(function ProjectItem({
  title,
  summary,
  tags,
  featured,
  status,
  slug,
  onClick,
}: {
  title: string;
  summary: string;
  tags: string[];
  featured: boolean;
  status: ProjectStatus;
  slug: string;
  onClick: () => void;
}) {
  const isConfidential = status === "CONFIDENTIAL";
  const isConcept = status === "CONCEPT";

  return (
    <Link
      to={`/projects/${slug}`}
      onClick={onClick}
      className="group block p-6 rounded-lg border border-border hover:border-foreground/20 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {isConfidential && (
            <Lock className="w-4 h-4 text-muted-foreground shrink-0" aria-label="Confidential" />
          )}
          <h2 className="font-serif text-xl font-medium group-hover:text-accent transition-colors truncate" dir="auto">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {featured && !isConfidential && !isConcept && (
            <Badge className="bg-accent text-accent-foreground text-xs">Featured</Badge>
          )}
          {isConcept && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Lightbulb className="w-3 h-3" />
              Concept
            </Badge>
          )}
          {isConfidential && (
            <Badge variant="secondary" className="text-xs">Confidential</Badge>
          )}
        </div>
      </div>

      <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2" dir="auto">
        {isConfidential ? summary.slice(0, 120) + (summary.length > 120 ? '…' : '') : summary}
      </p>

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
});

function ProjectSkeleton() {
  return (
    <div className="p-6 rounded-lg border border-border space-y-3">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}
