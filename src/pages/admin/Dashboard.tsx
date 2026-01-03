import { FolderOpen, FileText, Eye, Settings } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-serif font-medium mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Overview of your site content and quick actions.
      </p>
      
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          label="Projects"
          value="3"
          icon={FolderOpen}
        />
        <StatCard 
          label="Writing"
          value="5"
          icon={FileText}
        />
        <StatCard 
          label="Page Views (30d)"
          value="—"
          icon={Eye}
        />
        <StatCard 
          label="Status"
          value="Draft"
          icon={Settings}
        />
      </div>
      
      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <QuickActionButton label="Add Project" href="/admin/projects" />
          <QuickActionButton label="Add Writing" href="/admin/writing" />
          <QuickActionButton label="Edit About" href="/admin/settings" />
          <QuickActionButton label="View Site" href="/" external />
        </div>
      </section>
      
      {/* Recent Activity Placeholder */}
      <section>
        <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
        <div className="border border-border rounded-lg p-6 bg-card">
          <p className="text-sm text-muted-foreground text-center">
            Activity tracking will be implemented with Supabase.
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon: Icon 
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

function QuickActionButton({ 
  label, 
  href, 
  external 
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
