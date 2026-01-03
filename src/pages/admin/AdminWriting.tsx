import { Plus } from "lucide-react";

export default function AdminWriting() {
  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-2">Writing</h1>
          <p className="text-muted-foreground">
            Manage your external writing links.
          </p>
        </div>
        
        <button 
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          disabled
        >
          <Plus className="w-4 h-4" />
          Add Link
        </button>
      </div>
      
      {/* Writing Table Placeholder */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Title</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Publication</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Date</th>
              <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <WritingRow 
              title="Thoughts on Product Engineering"
              publication="Medium"
              date="Dec 2024"
            />
            <WritingRow 
              title="Building for the Long Term"
              publication="Dev.to"
              date="Nov 2024"
            />
            <WritingRow 
              title="The Art of Simplicity"
              publication="Personal"
              date="Oct 2024"
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

function WritingRow({ 
  title, 
  publication, 
  date 
}: { 
  title: string; 
  publication: string; 
  date: string;
}) {
  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <span className="font-medium">{title}</span>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{publication}</td>
      <td className="px-4 py-3 text-muted-foreground">{date}</td>
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
