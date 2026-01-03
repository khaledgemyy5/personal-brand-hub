import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { getSiteSettings, getPublishedProjects, getWritingItems } from "@/lib/db";
import type { NavConfig } from "@/lib/types";

export function PublicLayout() {
  const [navConfig, setNavConfig] = useState<NavConfig | null>(null);
  const [hasProjects, setHasProjects] = useState<boolean | null>(null);
  const [hasWriting, setHasWriting] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadNavData() {
      const [settingsRes, projectsRes, writingRes] = await Promise.all([
        getSiteSettings(),
        getPublishedProjects({ limit: 1 }),
        getWritingItems({ limit: 1 }),
      ]);

      if (settingsRes.data) {
        setNavConfig(settingsRes.data.nav_config);
      }
      setHasProjects((projectsRes.data?.length ?? 0) > 0);
      setHasWriting((writingRes.data?.length ?? 0) > 0);
    }

    loadNavData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav navConfig={navConfig} hasProjects={hasProjects} hasWriting={hasWriting} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
