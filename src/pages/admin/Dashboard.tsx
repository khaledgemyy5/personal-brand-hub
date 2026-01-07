import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderOpen, FileText, Eye, Settings, LogOut, Loader2, CheckCircle, XCircle, RefreshCw, Clock, Database, Server, Shield, User } from "lucide-react";
import { getSupabase, getEnvStatus, checkSupabaseConnection } from "@/lib/supabaseClient";
import { signOut } from "@/lib/adminAuth";
import { adminListProjects, adminListWritingItems, adminHealthCheck, type HealthCheckResult } from "@/lib/db";
import { Button } from "@/components/ui/button";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface QuickDiagnostics {
  envReady: boolean;
  connected: boolean;
  schemaReady: boolean;
  authWorking: boolean;
  userEmail?: string;
  error?: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [writingCount, setWritingCount] = useState<number | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [quickDiag, setQuickDiag] = useState<QuickDiagnostics | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const loadQuickDiagnostics = async () => {
    const envStatus = getEnvStatus();
    const connectionResult = await checkSupabaseConnection();
    
    const supabase = getSupabase();
    let userEmail: string | undefined;
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      userEmail = data.user?.email;
    }

    setQuickDiag({
      envReady: envStatus.ready,
      connected: connectionResult.connected,
      schemaReady: connectionResult.schemaReady,
      authWorking: connectionResult.authWorking,
      userEmail,
      error: connectionResult.error,
      timestamp: new Date().toISOString(),
    });
  };

  const loadHealthCheck = async () => {
    setHealthLoading(true);
    await loadQuickDiagnostics();
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

    // Load diagnostics
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

      {/* Quick Connection Status */}
      {quickDiag && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Database className="w-5 h-5" />
              Supabase Connection
            </h2>
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
          
          <div className="border border-border rounded-lg bg-card p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <QuickStatusItem 
                icon={Server} 
                label="Environment" 
                ok={quickDiag.envReady} 
                status={quickDiag.envReady ? "Configured" : "Missing vars"} 
              />
              <QuickStatusItem 
                icon={Database} 
                label="Connection" 
                ok={quickDiag.connected} 
                status={quickDiag.connected ? "Connected" : "Failed"} 
              />
              <QuickStatusItem 
                icon={Shield} 
                label="Schema" 
                ok={quickDiag.schemaReady} 
                status={quickDiag.schemaReady ? "Ready" : "Not initialized"} 
              />
              <QuickStatusItem 
                icon={User} 
                label="Auth" 
                ok={quickDiag.authWorking} 
                status={quickDiag.userEmail || (quickDiag.authWorking ? "Working" : "Failed")} 
              />
            </div>

            {quickDiag.error && (
              <div className="p-3 rounded bg-destructive/10 border border-destructive/20 mb-4">
                <p className="text-xs text-destructive font-mono">{quickDiag.error}</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border">
              <Clock className="w-3 h-3" />
              Last checked: {new Date(quickDiag.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </section>
      )}

      {/* Detailed Health Check */}
      {healthCheck && (
        <section className="mb-8">
          <details className="group">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-2">
              <span>Detailed table status</span>
              <span className="text-xs">(click to expand)</span>
            </summary>
            <div className="border border-border rounded-lg bg-card p-4 mt-2">
              <div className="grid grid-cols-3 gap-4">
                <StatusItem label="site_settings" ok={healthCheck.tables.site_settings.ok} message={healthCheck.tables.site_settings.message} compact />
                <StatusItem label="projects" ok={healthCheck.tables.projects.ok} message={healthCheck.tables.projects.message} compact />
                <StatusItem label="writing_items" ok={healthCheck.tables.writing_items.ok} message={healthCheck.tables.writing_items.message} compact />
              </div>
            </div>
          </details>
        </section>
      )}

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

function QuickStatusItem({ 
  icon: Icon, 
  label, 
  ok, 
  status 
}: { 
  icon: React.ElementType;
  label: string; 
  ok: boolean; 
  status: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
        <span className={`text-sm font-medium truncate ${ok ? 'text-foreground' : 'text-red-500'}`} title={status}>
          {status}
        </span>
      </div>
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
