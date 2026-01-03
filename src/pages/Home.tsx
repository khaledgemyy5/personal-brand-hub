import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <>
      {/* SEO Meta */}
      <title>Ammar - Software Engineer & Product Builder</title>
      <meta name="description" content="Personal site of Ammar. Software engineer, product builder, and writer. View my projects, writing, and get in touch." />
      
      <div className="container-narrow section-spacing">
        {/* Hero */}
        <section className="mb-16">
          <h1 className="text-balance mb-6">
            Building products that matter.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-8">
            Software engineer focused on creating thoughtful, user-centered experiences. 
            Currently exploring the intersection of technology and human-centered design.
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

        {/* Selected Projects Preview */}
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
            {/* Placeholder project items */}
            <ProjectPreviewItem 
              title="Project Alpha"
              description="A brief description of this project and what it accomplishes."
              year="2024"
              href="/projects/alpha"
            />
            <ProjectPreviewItem 
              title="Project Beta"
              description="Another project with its own unique value proposition."
              year="2023"
              href="/projects/beta"
            />
          </div>
        </section>

        {/* Selected Writing Preview */}
        <section>
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
            {/* Placeholder writing items */}
            <WritingPreviewItem 
              title="Thoughts on Product Engineering"
              publication="Medium"
              href="https://medium.com"
            />
            <WritingPreviewItem 
              title="Building for the Long Term"
              publication="Personal Blog"
              href="https://example.com"
            />
          </div>
        </section>
      </div>
    </>
  );
}

function ProjectPreviewItem({ 
  title, 
  description, 
  year, 
  href 
}: { 
  title: string; 
  description: string; 
  year: string; 
  href: string;
}) {
  return (
    <Link 
      to={href} 
      className="block p-4 -mx-4 rounded-md card-hover"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-medium mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="text-sm text-muted-foreground shrink-0">{year}</span>
      </div>
    </Link>
  );
}

function WritingPreviewItem({ 
  title, 
  publication, 
  href 
}: { 
  title: string; 
  publication: string; 
  href: string;
}) {
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 -mx-4 rounded-md card-hover"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-serif text-lg font-medium">{title}</h3>
        <span className="text-sm text-muted-foreground shrink-0">{publication} ↗</span>
      </div>
    </a>
  );
}
