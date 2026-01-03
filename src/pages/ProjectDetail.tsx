import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();

  // Placeholder data - will be fetched from Supabase
  const project = {
    title: `Project ${slug?.charAt(0).toUpperCase()}${slug?.slice(1)}`,
    description: "A comprehensive description of the project, explaining the problem it solves and the approach taken.",
    longDescription: `
      This is placeholder content for the project detail page. In the full implementation, 
      this content will be fetched from Supabase based on the project slug.
      
      The admin dashboard will allow editing this content, adding images (max 3 with captions), 
      and managing project metadata.
    `,
    tags: ["React", "TypeScript", "Supabase"],
    year: "2024",
    links: {
      live: "https://example.com",
      github: "https://github.com",
    },
  };

  return (
    <>
      <title>{project.title} - Ammar</title>
      <meta name="description" content={project.description} />
      
      <div className="container-narrow section-spacing">
        <Link 
          to="/projects" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </Link>
        
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1>{project.title}</h1>
            <span className="text-muted-foreground">{project.year}</span>
          </div>
          
          <p className="text-lg text-muted-foreground mb-4">
            {project.description}
          </p>
          
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
          
          <div className="flex items-center gap-4">
            {project.links.live && (
              <a 
                href={project.links.live}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm hover:text-accent transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Live site
              </a>
            )}
            {project.links.github && (
              <a 
                href={project.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm hover:text-accent transition-colors"
              >
                <Github className="w-4 h-4" />
                Source code
              </a>
            )}
          </div>
        </header>
        
        <article className="prose prose-neutral max-w-none">
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {project.longDescription}
          </p>
          
          {/* Image placeholder - max 3 images with captions */}
          <div className="my-8 space-y-6">
            <figure className="border border-border rounded-lg overflow-hidden">
              <div className="aspect-video bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Image placeholder (lazy-loaded)</span>
              </div>
              <figcaption className="p-3 text-sm text-muted-foreground border-t border-border">
                Caption describing the image - required for all project images.
              </figcaption>
            </figure>
          </div>
        </article>
      </div>
    </>
  );
}
