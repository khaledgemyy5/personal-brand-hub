import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const resumeData = {
  name: "Ammar",
  title: "Software Engineer",
  email: "hello@example.com",
  location: "San Francisco, CA",
  summary: "Experienced software engineer with expertise in full-stack development, system design, and building scalable applications. Passionate about clean code, user experience, and solving complex problems.",
  experience: [
    {
      company: "Company Name",
      role: "Senior Software Engineer",
      period: "2022 – Present",
      location: "San Francisco, CA",
      bullets: [
        "Led development of core platform features serving 100k+ users",
        "Architected microservices infrastructure reducing latency by 40%",
        "Mentored junior engineers and established code review practices"
      ]
    },
    {
      company: "Previous Company",
      role: "Software Engineer",
      period: "2019 – 2022",
      location: "New York, NY",
      bullets: [
        "Built and maintained RESTful APIs handling 1M+ daily requests",
        "Implemented CI/CD pipelines reducing deployment time by 60%",
        "Collaborated with product team to ship 15+ features"
      ]
    }
  ],
  education: [
    {
      institution: "University Name",
      degree: "B.S. Computer Science",
      period: "2015 – 2019",
      location: "Boston, MA"
    }
  ],
  skills: [
    "TypeScript", "React", "Node.js", "Python", "PostgreSQL", 
    "AWS", "Docker", "Kubernetes", "GraphQL", "System Design"
  ]
};

function generatePlainText(): string {
  const lines: string[] = [];
  
  lines.push(resumeData.name.toUpperCase());
  lines.push(resumeData.title);
  lines.push(`${resumeData.email} | ${resumeData.location}`);
  lines.push("");
  lines.push("SUMMARY");
  lines.push(resumeData.summary);
  lines.push("");
  lines.push("EXPERIENCE");
  
  resumeData.experience.forEach(exp => {
    lines.push(`${exp.role} | ${exp.company}`);
    lines.push(`${exp.period} | ${exp.location}`);
    exp.bullets.forEach(bullet => lines.push(`• ${bullet}`));
    lines.push("");
  });
  
  lines.push("EDUCATION");
  resumeData.education.forEach(edu => {
    lines.push(`${edu.degree} | ${edu.institution}`);
    lines.push(`${edu.period} | ${edu.location}`);
  });
  lines.push("");
  
  lines.push("SKILLS");
  lines.push(resumeData.skills.join(", "));
  
  return lines.join("\n");
}

export default function Resume() {
  const { toast } = useToast();

  const handleCopyText = async () => {
    const plainText = generatePlainText();
    await navigator.clipboard.writeText(plainText);
    toast({
      title: "Copied to clipboard",
      description: "Resume text copied in ATS-friendly format.",
    });
  };

  const handleDownloadPDF = () => {
    // Placeholder - will integrate with actual PDF generation
    toast({
      title: "Coming soon",
      description: "PDF download will be available shortly.",
    });
  };

  return (
    <main className="container-narrow py-16 md:py-24">
      {/* Header Actions */}
      <div className="flex items-center justify-end gap-3 mb-12">
        <Button variant="outline" size="sm" onClick={handleCopyText}>
          <Copy className="w-4 h-4 mr-2" />
          Copy Text
        </Button>
        <Button size="sm" onClick={handleDownloadPDF}>
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Resume Content - Single Column, ATS-friendly */}
      <article className="space-y-12">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight">
            {resumeData.name}
          </h1>
          <p className="text-xl text-muted-foreground">{resumeData.title}</p>
          <p className="text-sm text-muted-foreground">
            {resumeData.email} · {resumeData.location}
          </p>
        </header>

        {/* Summary */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
            Summary
          </h2>
          <p className="text-foreground/90 leading-relaxed">
            {resumeData.summary}
          </p>
        </section>

        {/* Experience */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
            Experience
          </h2>
          <div className="space-y-8">
            {resumeData.experience.map((exp, index) => (
              <div key={index} className="space-y-3">
                <div>
                  <h3 className="font-medium text-lg">{exp.role}</h3>
                  <p className="text-muted-foreground">
                    {exp.company} · {exp.location}
                  </p>
                  <p className="text-sm text-muted-foreground">{exp.period}</p>
                </div>
                <ul className="space-y-2">
                  {exp.bullets.map((bullet, i) => (
                    <li key={i} className="text-foreground/90 pl-4 relative before:content-['–'] before:absolute before:left-0 before:text-muted-foreground">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
            Education
          </h2>
          <div className="space-y-4">
            {resumeData.education.map((edu, index) => (
              <div key={index}>
                <h3 className="font-medium">{edu.degree}</h3>
                <p className="text-muted-foreground">
                  {edu.institution} · {edu.location}
                </p>
                <p className="text-sm text-muted-foreground">{edu.period}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
            Skills
          </h2>
          <p className="text-foreground/90">
            {resumeData.skills.join(" · ")}
          </p>
        </section>
      </article>
    </main>
  );
}
