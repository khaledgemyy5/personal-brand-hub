import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getPublishedProjects, trackEvent } from "@/lib/db";
import type { ProjectListItem } from "@/lib/types";
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

  const handleProjectClick = (slug: string) => {
    trackEvent({ event: "project_view", path: `/projects/${slug}` });
  };

  return (
    <>
      <title>Projects - Ammar</title>
      <meta
        name="description"
        content="Selected projects by Ammar. Software engineering and product work showcasing technical skills and problem-solving."
      />

      <div className="container-narrow section-spacing">
        <h1 className="mb-4">Projects</h1>
        <p className="text-muted-foreground mb-8">
          A selection of projects I've worked on. More details available on each project page.
        </p>

        {/* Tag filter pills */}
        {!loading && allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
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
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
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

        {/* Projects list */}
        <div className="space-y-6">
          {loading ? (
            <>
              <ProjectSkeleton />
              <ProjectSkeleton />
              <ProjectSkeleton />
            </>
          ) : filteredProjects.length === 0 ? (
            <p className="text-muted-foreground py-8">No projects found.</p>
          ) : (
            filteredProjects.map((project) => (
              <ProjectItem
                key={project.id}
                title={project.title}
                summary={project.summary}
                tags={project.tags}
                featured={project.featured}
                slug={project.slug}
                onClick={() => handleProjectClick(project.slug)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

function ProjectItem({
  title,
  summary,
  tags,
  featured,
  slug,
  onClick,
}: {
  title: string;
  summary: string;
  tags: string[];
  featured: boolean;
  slug: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={`/projects/${slug}`}
      onClick={onClick}
      className="block p-6 -mx-6 rounded-lg card-hover border border-transparent hover:border-border"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <h2 className="font-serif text-xl font-medium">{title}</h2>
        {featured && (
          <Badge variant="secondary" className="shrink-0">
            Featured
          </Badge>
        )}
      </div>

      <p className="text-muted-foreground mb-4">{summary}</p>

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
}

function ProjectSkeleton() {
  return (
    <div className="p-6 -mx-6 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-14" />
      </div>
    </div>
  );
}
