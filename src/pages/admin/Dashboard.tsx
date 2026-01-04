import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderOpen, FileText, Eye, Settings, LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { signOut } from "@/lib/adminAuth";
import { adminListProjects, adminListWritingItems } from "@/lib/db";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [writingCount, setWritingCount] = useState<number | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Load counts
    Promise.all([adminListProjects(), adminListWritingItems()]).then(
      ([projectsRes, writingRes]) => {
        setProjectCount(projectsRes.data?.length ?? 0);
        setWritingCount(writingRes.data?.length ?? 0);
      }
    );
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    <div className="max-w-4xl">
      {/* Header with user info */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your site content and quick actions.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user?.email}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            disabled={signingOut}
            className="gap-2"
          >
            {signingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          label="Projects"
          value={projectCount !== null ? String(projectCount) : "—"}
          icon={FolderOpen}
        />
        <StatCard
          label="Writing"
          value={writingCount !== null ? String(writingCount) : "—"}
          icon={FileText}
        />
        <StatCard label="Page Views (30d)" value="—" icon={Eye} />
        <StatCard label="Status" value="Draft" icon={Settings} />
      </div>

      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <QuickActionLink label="Add Project" to="/admin/projects" />
          <QuickActionLink label="Add Writing" to="/admin/writing" />
          <QuickActionLink label="Edit Settings" to="/admin/settings" />
          <QuickActionButton label="View Site" href="/" external />
        </div>
      </section>

      {/* Recent Activity Placeholder */}
      <section>
        <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
        <div className="border border-border rounded-lg p-6 bg-card">
          <p className="text-sm text-muted-foreground text-center">
            Activity tracking coming soon.
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <span className="text-2xl font-serif font-medium">{value}</span>
    </div>
  );
}

function QuickActionLink({ label, to }: { label: string; to: string }) {
  return (
    <Link
      to={to}
      className="px-4 py-2 text-sm border border-border rounded-md hover:bg-secondary transition-colors"
    >
      {label}
    </Link>
  );
}

function QuickActionButton({
  label,
  href,
  external,
}: {
  label: string;
  href: string;
  external?: boolean;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 text-sm border border-border rounded-md hover:bg-secondary transition-colors"
      >
        {label} ↗
      </a>
    );
  }

  return (
    <a
      href={href}
      className="px-4 py-2 text-sm border border-border rounded-md hover:bg-secondary transition-colors"
    >
      {label}
    </a>
  );
}
