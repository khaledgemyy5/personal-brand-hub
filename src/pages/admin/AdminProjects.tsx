import { Plus } from "lucide-react";

export default function AdminProjects() {
  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-2">Projects</h1>
          <p className="text-muted-foreground">
            Manage your portfolio projects.
          </p>
        </div>
        
        <button 
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          disabled
        >
          <Plus className="w-4 h-4" />
          Add Project
        </button>
      </div>
      
      {/* Projects Table Placeholder */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Title</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Year</th>
              <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <ProjectRow 
              title="Project Alpha"
              status="Published"
              year="2024"
            />
            <ProjectRow 
              title="Project Beta"
              status="Draft"
              year="2023"
            />
            <ProjectRow 
              title="Project Gamma"
              status="Published"
              year="2023"
            />
          </tbody>
        </table>
      </div>
      
      <p className="text-sm text-muted-foreground mt-4 text-center">
        CRUD operations will be implemented with Supabase.
      </p>
    </div>
  );
}

function ProjectRow({ 
  title, 
  status, 
  year 
}: { 
  title: string; 
  status: string; 
  year: string;
}) {
  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <span className="font-medium">{title}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 text-xs rounded ${
          status === "Published" 
            ? "bg-success/10 text-success" 
            : "bg-warning/10 text-warning"
        }`}>
          {status}
        </span>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{year}</td>
      <td className="px-4 py-3 text-right">
        <button className="text-sm text-muted-foreground hover:text-foreground mr-3">
          Edit
        </button>
        <button className="text-sm text-destructive hover:text-destructive/80">
          Delete
        </button>
      </td>
    </tr>
  );
}
