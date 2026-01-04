import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { getSiteSettings, getPublishedProjects, getWritingItems } from "@/lib/db";
import type { NavConfig } from "@/lib/types";

// Default nav config for fallback
const defaultNavConfig: NavConfig = {
  links: [
    { href: '/', label: 'Home', visible: true },
    { href: '/projects', label: 'Projects', visible: true },
    { href: '/writing', label: 'Writing', visible: true },
    { href: '/contact', label: 'Contact', visible: true },
  ],
  ctaButton: { href: '/resume', label: 'Resume', visible: true },
};

export function PublicLayout() {
  const [navConfig, setNavConfig] = useState<NavConfig | null>(null);
  const [hasProjects, setHasProjects] = useState<boolean | null>(null);
  const [hasWriting, setHasWriting] = useState<boolean | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNavData() {
      const [settingsRes, projectsRes, writingRes] = await Promise.all([
        getSiteSettings(),
        getPublishedProjects({ limit: 1 }),
        getWritingItems({ limit: 1 }),
      ]);

      if (settingsRes.error) {
        // Show error but still render nav with defaults
        setSettingsError(settingsRes.error);
        setNavConfig(defaultNavConfig);
        setHasProjects(false);
        setHasWriting(false);
      } else {
        setNavConfig(settingsRes.data?.nav_config ?? defaultNavConfig);
        setHasProjects((projectsRes.data?.length ?? 0) > 0);
        setHasWriting((writingRes.data?.length ?? 0) > 0);
      }
    }

    loadNavData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav navConfig={navConfig} hasProjects={hasProjects} hasWriting={hasWriting} />
      {settingsError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm text-center">
          {settingsError}
        </div>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
