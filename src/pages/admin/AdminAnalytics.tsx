import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, Eye, FileDown, MousePointer, BookOpen, FolderOpen } from "lucide-react";
import { format, subDays } from "date-fns";

import { supabase } from "@/lib/supabaseClient";

interface AnalyticsData {
  totalVisitors: number;
  pageViews: number;
  resumeDownloads: number;
  contactClicks: number;
  writingClicks: number;
  topProjects: { path: string; count: number }[];
  topPages: { path: string; count: number }[];
}

export default function AdminAnalytics() {
  const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-analytics", thirtyDaysAgo],
    queryFn: async (): Promise<AnalyticsData> => {
      // Fetch all events from last 30 days
      const { data: events, error } = await supabase
        .from("analytics_events")
        .select("event, path, ref, sid, ts")
        .gte("ts", thirtyDaysAgo);

      if (error) throw new Error(error.message);
      if (!events) return getEmptyData();

      // Calculate metrics
      const uniqueSids = new Set(events.map((e) => e.sid));
      const pageViews = events.filter((e) => e.event === "page_view");
      const resumeDownloads = events.filter((e) => e.event === "resume_download");
      const contactClicks = events.filter((e) => e.event === "contact_click");
      const writingClicks = events.filter((e) => e.event === "writing_click");
      const projectViews = events.filter((e) => e.event === "project_view");

      // Top projects by path
      const projectCounts: Record<string, number> = {};
      projectViews.forEach((e) => {
        const key = e.path || "unknown";
        projectCounts[key] = (projectCounts[key] || 0) + 1;
      });
      const topProjects = Object.entries(projectCounts)
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top pages
      const pageCounts: Record<string, number> = {};
      pageViews.forEach((e) => {
        const key = e.path || "/";
        pageCounts[key] = (pageCounts[key] || 0) + 1;
      });
      const topPages = Object.entries(pageCounts)
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalVisitors: uniqueSids.size,
        pageViews: pageViews.length,
        resumeDownloads: resumeDownloads.length,
        contactClicks: contactClicks.length,
        writingClicks: writingClicks.length,
        topProjects,
        topPages,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-serif font-medium mb-4">Analytics</h1>
        <p className="text-destructive">Failed to load analytics: {(error as Error).message}</p>
      </div>
    );
  }

  const stats = data || getEmptyData();

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-medium mb-2">Analytics</h1>
        <p className="text-muted-foreground">Last 30 days overview</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard
          icon={Users}
          label="Visitors"
          value={stats.totalVisitors}
        />
        <MetricCard
          icon={Eye}
          label="Page Views"
          value={stats.pageViews}
        />
        <MetricCard
          icon={FileDown}
          label="Resume DLs"
          value={stats.resumeDownloads}
        />
        <MetricCard
          icon={MousePointer}
          label="Contact"
          value={stats.contactClicks}
        />
        <MetricCard
          icon={BookOpen}
          label="Writing"
          value={stats.writingClicks}
        />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="border border-border rounded-lg p-4">
          <h2 className="font-medium mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            Top Pages
          </h2>
          {stats.topPages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2">Path</th>
                  <th className="pb-2 text-right">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.topPages.map((p) => (
                  <tr key={p.path}>
                    <td className="py-2 truncate max-w-[200px]">{p.path}</td>
                    <td className="py-2 text-right font-medium">{p.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top Projects */}
        <div className="border border-border rounded-lg p-4">
          <h2 className="font-medium mb-3 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
            Top Projects
          </h2>
          {stats.topProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2">Project</th>
                  <th className="pb-2 text-right">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.topProjects.map((p) => (
                  <tr key={p.path}>
                    <td className="py-2 truncate max-w-[200px]">
                      {p.path.replace("/projects/", "")}
                    </td>
                    <td className="py-2 text-right font-medium">{p.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Data from analytics_events table • Showing last 30 days
      </p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="border border-border rounded-lg p-4 text-center">
      <Icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
      <p className="text-2xl font-medium">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function getEmptyData(): AnalyticsData {
  return {
    totalVisitors: 0,
    pageViews: 0,
    resumeDownloads: 0,
    contactClicks: 0,
    writingClicks: 0,
    topProjects: [],
    topPages: [],
  };
}
