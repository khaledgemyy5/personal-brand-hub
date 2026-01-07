import { useEffect, useState } from "react";
import { Mail, Linkedin, Calendar, ArrowUpRight } from "lucide-react";
import { getSiteSettings, trackEvent } from "@/lib/db";
import type { ContactPageConfig } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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
      <div className="container-narrow py-16 md:py-24">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-5 w-96 mb-12" />
        <div className="space-y-6">
          <Skeleton className="h-24 w-full max-w-md" />
          <div className="grid gap-4 md:grid-cols-2 max-w-lg">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  if (pageDisabled) {
    return (
      <>
        <title>Contact - Ammar</title>
        <div className="container-narrow py-16 md:py-24">
          <h1 className="text-3xl md:text-4xl font-serif font-medium mb-4">Contact</h1>
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

      <div className="container-narrow py-16 md:py-24">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-medium mb-4">
            Let's get in touch
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg">
            Have a project in mind or want to chat? I'm always open to discussing product, engineering, or new opportunities.
          </p>
        </header>

        {!hasAnyContact ? (
          <p className="text-muted-foreground">
            Contact information coming soon.
          </p>
        ) : (
          <div className="space-y-8">
            {/* Primary: Email */}
            {email && (
              <div className="max-w-md">
                <a
                  href={`mailto:${email}`}
                  onClick={() => handleContactClick("email")}
                  className="block p-6 rounded-lg border border-border hover:border-foreground/20 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Mail className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <h3 className="font-medium mb-1">Email</h3>
                  <p className="text-muted-foreground group-hover:text-foreground transition-colors">
                    {email}
                  </p>
                </a>
              </div>
            )}

            {/* Secondary: LinkedIn & Calendar */}
            {(linkedin || calendar) && (
              <div className="grid gap-4 md:grid-cols-2 max-w-md">
                {linkedin && (
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleContactClick("linkedin")}
                    className="block p-6 rounded-lg border border-border hover:border-foreground/20 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Linkedin className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <h3 className="font-medium mb-1">LinkedIn</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect on LinkedIn
                    </p>
                  </a>
                )}

                {calendar && (
                  <a
                    href={calendar}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleContactClick("calendar")}
                    className="block p-6 rounded-lg border border-border hover:border-foreground/20 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Calendar className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <h3 className="font-medium mb-1">Book a chat</h3>
                    <p className="text-sm text-muted-foreground">
                      30 min intro call
                    </p>
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
