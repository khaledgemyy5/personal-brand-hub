import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { getSiteSettings, getPublishedProjects, getWritingItems } from "@/lib/db";
import type { NavConfig } from "@/lib/types";
import { defaultSiteSettings } from "@/lib/defaultSiteSettings";

export function PublicLayout() {
  const [navConfig, setNavConfig] = useState<NavConfig | null>(null);
  const [hasProjects, setHasProjects] = useState<boolean | null>(null);
  const [hasWriting, setHasWriting] = useState<boolean | null>(null);
  const [resumeEnabled, setResumeEnabled] = useState(true);
  const [contactEnabled, setContactEnabled] = useState(true);

  useEffect(() => {
    async function loadNavData() {
      const [settingsRes, projectsRes, writingRes] = await Promise.all([
        getSiteSettings(),
        getPublishedProjects({ limit: 1 }),
        getWritingItems({ limit: 1 }),
      ]);

      // getSiteSettings now always returns data (defaults on error)
      const settings = settingsRes.data;
      setNavConfig(settings?.nav_config ?? defaultSiteSettings.nav_config);
      setHasProjects((projectsRes.data?.length ?? 0) > 0);
      setHasWriting((writingRes.data?.length ?? 0) > 0);
      
      // Check if resume/contact pages are enabled
      setResumeEnabled(settings?.pages?.resume?.enabled !== false);
      setContactEnabled(settings?.pages?.contact?.enabled !== false);
    }

    loadNavData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav 
        navConfig={navConfig} 
        hasProjects={hasProjects} 
        hasWriting={hasWriting}
        resumeEnabled={resumeEnabled}
        contactEnabled={contactEnabled}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
