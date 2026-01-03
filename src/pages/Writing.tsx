import { ExternalLink } from "lucide-react";

export default function Writing() {
  return (
    <>
      <title>Writing - Ammar</title>
      <meta name="description" content="Selected writing and articles by Ammar. Thoughts on software engineering, product development, and technology." />
      
      <div className="container-narrow section-spacing">
        <h1 className="mb-4">Writing</h1>
        <p className="text-muted-foreground mb-12">
          Selected articles and essays. All links point to external publications.
        </p>
        
        <div className="space-y-4">
          {/* Placeholder writing items - will be fetched from Supabase */}
          <WritingItem 
            title="Thoughts on Product Engineering"
            description="Exploring the intersection of product thinking and engineering excellence."
            publication="Medium"
            date="Dec 2024"
            href="https://medium.com"
          />
          <WritingItem 
            title="Building for the Long Term"
            description="Why sustainable architecture matters more than shipping fast."
            publication="Dev.to"
            date="Nov 2024"
            href="https://dev.to"
          />
          <WritingItem 
            title="The Art of Simplicity in Software"
            description="Lessons learned from years of over-engineering and the path to simplicity."
            publication="Personal"
            date="Oct 2024"
            href="https://example.com"
          />
        </div>
      </div>
    </>
  );
}

function WritingItem({
  title,
  description,
  publication,
  date,
  href,
}: {
  title: string;
  description: string;
  publication: string;
  date: string;
  href: string;
}) {
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-6 -mx-6 rounded-lg card-hover border border-transparent hover:border-border group"
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <h2 className="font-serif text-xl font-medium group-hover:text-accent transition-colors">
          {title}
        </h2>
        <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
      </div>
      
      <p className="text-muted-foreground mb-3">{description}</p>
      
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{publication}</span>
        <span>·</span>
        <span>{date}</span>
      </div>
    </a>
  );
}
