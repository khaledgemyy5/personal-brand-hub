import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSiteSettings, trackEvent } from "@/lib/db";
import type { ResumePageConfig } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

// Placeholder resume data - will be replaced by site_settings.pages.resume.content
const defaultResumeData = {
  name: "Your Name",
  title: "Your Title",
  email: "email@example.com",
  location: "City, Country",
  summary: "This is placeholder resume content. Update your resume content in the admin settings.",
  experience: [
    {
      company: "Company Name",
      role: "Role Title",
      period: "2022 – Present",
      location: "Location",
      bullets: [
        "Accomplishment or responsibility",
        "Another key achievement"
      ]
    }
  ],
  education: [
    {
      institution: "University Name",
      degree: "Degree Title",
      period: "2018 – 2022",
      location: "Location"
    }
  ],
  skills: ["Skill 1", "Skill 2", "Skill 3"]
};

interface ResumeData {
  name: string;
  title: string;
  email: string;
  location: string;
  summary: string;
  experience: {
    company: string;
    role: string;
    period: string;
    location: string;
    bullets: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    period: string;
    location: string;
  }[];
  skills: string[];
}

interface ExtendedResumeConfig extends ResumePageConfig {
  content?: ResumeData;
}

function generatePlainText(data: ResumeData): string {
  const lines: string[] = [];
  
  lines.push(data.name.toUpperCase());
  lines.push(data.title);
  lines.push(`${data.email} | ${data.location}`);
  lines.push("");
  lines.push("SUMMARY");
  lines.push(data.summary);
  lines.push("");
  lines.push("EXPERIENCE");
  
  data.experience.forEach(exp => {
    lines.push(`${exp.role} | ${exp.company}`);
    lines.push(`${exp.period} | ${exp.location}`);
    exp.bullets.forEach(bullet => lines.push(`• ${bullet}`));
    lines.push("");
  });
  
  lines.push("EDUCATION");
  data.education.forEach(edu => {
    lines.push(`${edu.degree} | ${edu.institution}`);
    lines.push(`${edu.period} | ${edu.location}`);
  });
  lines.push("");
  
  lines.push("SKILLS");
  lines.push(data.skills.join(", "));
  
  return lines.join("\n");
}

export default function Resume() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [resumeConfig, setResumeConfig] = useState<ExtendedResumeConfig | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [pageDisabled, setPageDisabled] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const res = await getSiteSettings();
      if (res.data?.pages?.resume) {
        const config = res.data.pages.resume as ExtendedResumeConfig;
        setResumeConfig(config);
        
        // Check if page is explicitly disabled
        if (config.enabled === false) {
          setPageDisabled(true);
        }
        
        // If content exists in settings, use it
        if (config.content) {
          setResumeData(config.content);
        }
      }
      setLoading(false);
    }

    loadSettings();
    trackEvent({ event: "page_view", path: "/resume" });
  }, []);

  const handleCopyText = async () => {
    const plainText = generatePlainText(resumeData);
    await navigator.clipboard.writeText(plainText);
    toast({
      title: "Copied to clipboard",
      description: "Resume text copied in ATS-friendly format.",
    });
  };

  const handleDownloadPDF = () => {
    if (resumeConfig?.pdfUrl) {
      trackEvent({ event: "resume_download", path: "/resume" });
      window.open(resumeConfig.pdfUrl, "_blank");
    }
  };

  const showCopyButton = resumeConfig?.showCopyText !== false;
  const showDownloadButton = resumeConfig?.showDownload !== false && resumeConfig?.pdfUrl;

  if (loading) {
    return (
      <main className="container-narrow py-16 md:py-24">
        <div className="flex items-center justify-end gap-3 mb-12">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-12 w-64 mb-2" />
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-56 mb-12" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </main>
    );
  }

  // Show polite message if page is disabled
  if (pageDisabled) {
    return (
      <>
        <title>Resume - Ammar</title>
        <main className="container-narrow py-16 md:py-24">
          <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight mb-4">
            Resume
          </h1>
          <p className="text-muted-foreground">
            This page is currently unavailable. Please check back later.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <title>Resume - Ammar</title>
      <meta name="description" content="Professional resume and work experience." />

      <main className="container-narrow py-16 md:py-24">
        {/* Header Actions */}
        <div className="flex items-center justify-end gap-3 mb-12">
          {showCopyButton && (
            <Button variant="outline" size="sm" onClick={handleCopyText}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Text
            </Button>
          )}
          {showDownloadButton && (
            <Button size="sm" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          )}
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
          {resumeData.experience.length > 0 && (
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
          )}

          {/* Education */}
          {resumeData.education.length > 0 && (
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
          )}

          {/* Skills */}
          {resumeData.skills.length > 0 && (
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
                Skills
              </h2>
              <p className="text-foreground/90">
                {resumeData.skills.join(" · ")}
              </p>
            </section>
          )}
        </article>
      </main>
    </>
  );
}
