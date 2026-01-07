import { useEffect, useState } from "react";
import { Mail, Linkedin, Calendar } from "lucide-react";
import { getSiteSettings, trackEvent } from "@/lib/db";
import type { ContactPageConfig } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface ExtendedContactConfig extends ContactPageConfig {
  linkedin?: string;
  calendar?: string;
}

export default function Contact() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ExtendedContactConfig | null>(null);
  const [pageDisabled, setPageDisabled] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const res = await getSiteSettings();
      if (res.data?.pages?.contact) {
        const contactConfig = res.data.pages.contact as ExtendedContactConfig;
        setConfig(contactConfig);
        // Check if page is explicitly disabled
        if (contactConfig.enabled === false) {
          setPageDisabled(true);
        }
      }
      setLoading(false);
    }

    loadSettings();
    trackEvent({ event: "page_view", path: "/contact" });
  }, []);

  const handleContactClick = (method: string) => {
    trackEvent({ event: "contact_click", path: `/contact/${method}` });
  };

  if (loading) {
    return (
      <div className="container-narrow section-spacing">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-5 w-96 mb-12" />
        <div className="space-y-6">
          <Skeleton className="h-16 w-full max-w-md" />
          <Skeleton className="h-16 w-full max-w-md" />
        </div>
      </div>
    );
  }

  // Show polite message if page is disabled
  if (pageDisabled) {
    return (
      <>
        <title>Contact - Ammar</title>
        <div className="container-narrow section-spacing">
          <h1 className="mb-4">Contact</h1>
          <p className="text-muted-foreground">
            This page is currently unavailable. Please check back later.
          </p>
        </div>
      </>
    );
  }

  const email = config?.email;
  const linkedin = config?.linkedin;
  const calendar = config?.calendar;

  const hasAnyContact = email || linkedin || calendar;

  return (
    <>
      <title>Contact - Ammar</title>
      <meta
        name="description"
        content="Get in touch with Ammar. Available for consulting, collaboration, and opportunities."
      />

      <div className="container-narrow section-spacing">
        <h1 className="mb-4">Contact</h1>
        <p className="text-muted-foreground mb-12">
          Have a project in mind or want to chat? Feel free to reach out.
        </p>

        {!hasAnyContact ? (
          <p className="text-muted-foreground">
            Contact information coming soon.
          </p>
        ) : (
          <div className="space-y-6 max-w-md">
            {email && (
              <a
                href={`mailto:${email}`}
                onClick={() => handleContactClick("email")}
                className="flex items-center gap-4 p-4 -mx-4 rounded-lg hover:bg-secondary/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div>
                  <h3 className="font-medium mb-0.5">Email</h3>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {email}
                  </p>
                </div>
              </a>
            )}

            {linkedin && (
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleContactClick("linkedin")}
                className="flex items-center gap-4 p-4 -mx-4 rounded-lg hover:bg-secondary/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Linkedin className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div>
                  <h3 className="font-medium mb-0.5">LinkedIn</h3>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Connect on LinkedIn
                  </p>
                </div>
              </a>
            )}

            {calendar && (
              <a
                href={calendar}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleContactClick("calendar")}
                className="flex items-center gap-4 p-4 -mx-4 rounded-lg hover:bg-secondary/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div>
                  <h3 className="font-medium mb-0.5">Schedule a call</h3>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Book time on my calendar
                  </p>
                </div>
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );
}
