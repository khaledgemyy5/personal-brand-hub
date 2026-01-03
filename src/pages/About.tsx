export default function About() {
  return (
    <>
      <title>About - Ammar</title>
      <meta name="description" content="Learn more about Ammar - background, experience, and what drives my work in software engineering and product development." />
      
      <div className="container-narrow section-spacing">
        <h1 className="mb-8">About</h1>
        
        <div className="prose prose-neutral max-w-none">
          <p className="text-lg text-muted-foreground mb-6">
            This is a placeholder for the About page. Content will be managed through the admin dashboard.
          </p>
          
          <section className="mb-12">
            <h2 className="text-2xl mb-4">Background</h2>
            <p className="text-muted-foreground leading-relaxed">
              Placeholder content describing background, education, and career journey.
              This section will be editable from the admin panel.
            </p>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl mb-4">Experience</h2>
            <div className="space-y-6">
              <ExperienceItem 
                title="Senior Software Engineer"
                company="Company Name"
                period="2022 - Present"
                description="Brief description of role and responsibilities."
              />
              <ExperienceItem 
                title="Software Engineer"
                company="Previous Company"
                period="2020 - 2022"
                description="Brief description of role and responsibilities."
              />
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {["TypeScript", "React", "Node.js", "PostgreSQL", "AWS", "System Design"].map((skill) => (
                <span 
                  key={skill}
                  className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function ExperienceItem({
  title,
  company,
  period,
  description,
}: {
  title: string;
  company: string;
  period: string;
  description: string;
}) {
  return (
    <div className="border-l-2 border-border pl-4">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h3 className="font-serif font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{company}</p>
        </div>
        <span className="text-sm text-muted-foreground shrink-0">{period}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
    </div>
  );
}
