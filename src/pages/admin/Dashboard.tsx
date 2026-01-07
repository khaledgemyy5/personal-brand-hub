import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderOpen, FileText, Eye, Settings, LogOut, Loader2, CheckCircle, XCircle, RefreshCw, Clock } from "lucide-react";
import { getSupabase } from "@/lib/supabaseClient";
import { signOut } from "@/lib/adminAuth";
import { adminListProjects, adminListWritingItems, adminHealthCheck, type HealthCheckResult } from "@/lib/db";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [writingCount, setWritingCount] = useState<number | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const loadHealthCheck = async () => {
    setHealthLoading(true);
    const result = await adminHealthCheck();
    setHealthCheck(result);
    setHealthLoading(false);
  };

  useEffect(() => {
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user);
      });
    }

    // Load counts
    Promise.all([adminListProjects(), adminListWritingItems()]).then(
      ([projectsRes, writingRes]) => {
        setProjectCount(projectsRes.data?.length ?? 0);
        setWritingCount(writingRes.data?.length ?? 0);
      }
    );

    // Load health check
    loadHealthCheck();
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
        <StatCard label="Status" value="Live" icon={Settings} />
      </div>

      {/* Supabase Connection Status */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Supabase Connection Status</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadHealthCheck}
            disabled={healthLoading}
            className="gap-2"
          >
            {healthLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
        </div>
        
        {healthCheck ? (
          <div className="border border-border rounded-lg bg-card p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatusItem label="Environment" ok={healthCheck.env.ok} message={healthCheck.env.message} />
              <StatusItem label="Schema" ok={healthCheck.schema.ok} message={healthCheck.schema.message} />
              <StatusItem label="Auth" ok={healthCheck.auth.ok} message={healthCheck.auth.email || healthCheck.auth.message} />
              <StatusItem label="RLS" ok={healthCheck.rls.ok} message={healthCheck.rls.message} />
            </div>
            
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground font-medium mb-2">Tables</p>
              <div className="grid grid-cols-3 gap-4">
                <StatusItem label="site_settings" ok={healthCheck.tables.site_settings.ok} message={healthCheck.tables.site_settings.message} compact />
                <StatusItem label="projects" ok={healthCheck.tables.projects.ok} message={healthCheck.tables.projects.message} compact />
                <StatusItem label="writing_items" ok={healthCheck.tables.writing_items.ok} message={healthCheck.tables.writing_items.message} compact />
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Last checked: {new Date(healthCheck.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-lg bg-card p-6 text-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
          </div>
        )}
      </section>

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

function StatusItem({ 
  label, 
  ok, 
  message,
  compact 
}: { 
  label: string; 
  ok: boolean; 
  message: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "flex items-center gap-2" : ""}>
      <div className="flex items-center gap-2 mb-1">
        {ok ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
        <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{label}</span>
      </div>
      {!compact && (
        <p className="text-xs text-muted-foreground truncate" title={message}>
          {message}
        </p>
      )}
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
