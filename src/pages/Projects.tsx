import { Link } from "react-router-dom";

export default function Projects() {
  return (
    <>
      <title>Projects - Ammar</title>
      <meta name="description" content="Selected projects by Ammar. Software engineering and product work showcasing technical skills and problem-solving." />
      
      <div className="container-narrow section-spacing">
        <h1 className="mb-4">Projects</h1>
        <p className="text-muted-foreground mb-12">
          A selection of projects I've worked on. More details available on each project page.
        </p>
        
        <div className="space-y-6">
          {/* Placeholder projects - will be fetched from Supabase */}
          <ProjectItem 
            title="Project Alpha"
            description="A comprehensive description of the project, the problem it solves, and the technologies used."
            tags={["React", "TypeScript", "Supabase"]}
            year="2024"
            slug="alpha"
          />
          <ProjectItem 
            title="Project Beta"
            description="Another project showcasing different skills and solving unique challenges."
            tags={["Node.js", "PostgreSQL", "AWS"]}
            year="2023"
            slug="beta"
          />
          <ProjectItem 
            title="Project Gamma"
            description="A third project with its own set of technologies and accomplishments."
            tags={["Python", "Machine Learning"]}
            year="2023"
            slug="gamma"
          />
        </div>
      </div>
    </>
  );
}

function ProjectItem({
  title,
  description,
  tags,
  year,
  slug,
}: {
  title: string;
  description: string;
  tags: string[];
  year: string;
  slug: string;
}) {
  return (
    <Link 
      to={`/projects/${slug}`}
      className="block p-6 -mx-6 rounded-lg card-hover border border-transparent hover:border-border"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <h2 className="font-serif text-xl font-medium">{title}</h2>
        <span className="text-sm text-muted-foreground shrink-0">{year}</span>
      </div>
      
      <p className="text-muted-foreground mb-4">{description}</p>
      
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
    </Link>
  );
}
