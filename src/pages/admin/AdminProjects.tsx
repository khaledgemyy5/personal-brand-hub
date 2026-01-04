import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { adminListProjects, adminUpsertProject, ExtendedProject } from "@/lib/db";
import type { ProjectStatus } from "@/lib/types";

export default function AdminProjects() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">("ALL");

  // Fetch projects
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const result = await adminListProjects();
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
  });

  // Toggle mutations
  const toggleMutation = useMutation({
    mutationFn: async ({ project, field, value }: { project: ExtendedProject; field: "featured" | "published"; value: boolean }) => {
      const result = await adminUpsertProject({
        id: project.id,
        slug: project.slug,
        title: project.title,
        summary: project.summary,
        [field]: value,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Filter projects
  const filteredProjects = projects?.filter((p) => {
    if (statusFilter === "ALL") return true;
    return p.status === statusFilter;
  }) || [];

  const statusBadge = (status: ProjectStatus) => {
    const variants: Record<ProjectStatus, { className: string; label: string }> = {
      PUBLIC: { className: "bg-success/10 text-success border-success/20", label: "Public" },
      CONFIDENTIAL: { className: "bg-warning/10 text-warning border-warning/20", label: "Confidential" },
      CONCEPT: { className: "bg-muted text-muted-foreground border-border", label: "Concept" },
    };
    const v = variants[status];
    return <Badge variant="outline" className={v.className}>{v.label}</Badge>;
  };

  const detailLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      BRIEF: "Brief",
      STANDARD: "Standard",
      DEEP: "Deep",
    };
    return labels[level] || level;
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-2">Projects</h1>
          <p className="text-muted-foreground">Manage your portfolio projects.</p>
        </div>

        <Link to="/admin/projects/new/edit">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </Link>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm text-muted-foreground">Filter by status:</span>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProjectStatus | "ALL")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="PUBLIC">Public</SelectItem>
            <SelectItem value="CONFIDENTIAL">Confidential</SelectItem>
            <SelectItem value="CONCEPT">Concept</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-destructive text-sm py-4">
          Failed to load projects: {(error as Error).message}
        </p>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead className="text-center">Featured</TableHead>
                <TableHead className="text-center">Published</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No projects found.
                  </TableCell>
                </TableRow>
              )}
              {filteredProjects.map((project) => (
                <TableRow
                  key={project.id}
                  className="cursor-pointer"
                  onClick={() => {
                    window.location.href = `/admin/projects/${project.slug}/edit`;
                  }}
                >
                  <TableCell>
                    <span className="font-medium">{project.title}</span>
                    <span className="block text-xs text-muted-foreground">/{project.slug}</span>
                  </TableCell>
                  <TableCell>{statusBadge(project.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {detailLevelLabel(project.detail_level)}
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={project.featured}
                      onCheckedChange={(v) =>
                        toggleMutation.mutate({ project, field: "featured", value: v })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={project.published}
                      onCheckedChange={(v) =>
                        toggleMutation.mutate({ project, field: "published", value: v })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {project.updated_at ? format(new Date(project.updated_at), "MMM d, yyyy") : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && filteredProjects.length > 0 && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
