import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { adminListProjects, adminUpsertProject, adminDeleteProject, ExtendedProject } from "@/lib/db";
import type { ProjectStatus, DetailLevel, MediaItem, DecisionLogEntry, ProjectContent, ProjectSectionsConfig } from "@/lib/types";

// Default empty project
const defaultProject: Omit<ExtendedProject, "id" | "updated_at"> = {
  slug: "",
  title: "",
  summary: "",
  tags: [],
  status: "PUBLIC",
  detail_level: "STANDARD",
  featured: false,
  published: false,
  sections_config: {},
  content: {},
  media: [],
  metrics: [],
  decision_log: [],
};

export default function EditProject() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = slug === "new";

  // Fetch existing project if editing
  const { data: projects, isLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const result = await adminListProjects();
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !isNew,
  });

  const existingProject = projects?.find((p) => p.slug === slug);

  // Local form state
  const [form, setForm] = useState<Omit<ExtendedProject, "id" | "updated_at">>(defaultProject);
  const [projectId, setProjectId] = useState<string | undefined>();

  // Section toggles
  const [showOverview, setShowOverview] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [showProblem, setShowProblem] = useState(false);
  const [showYourRole, setShowYourRole] = useState(false);
  const [showConstraints, setShowConstraints] = useState(false);
  const [showApproach, setShowApproach] = useState(false);
  const [showExecution, setShowExecution] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [showLearnings, setShowLearnings] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showDecisionLog, setShowDecisionLog] = useState(false);
  const [showMedia, setShowMedia] = useState(false);

  // Load existing project data
  useEffect(() => {
    if (existingProject) {
      setProjectId(existingProject.id);
      setForm({
        slug: existingProject.slug,
        title: existingProject.title,
        summary: existingProject.summary,
        tags: existingProject.tags,
        status: existingProject.status,
        detail_level: existingProject.detail_level,
        featured: existingProject.featured,
        published: existingProject.published,
        sections_config: existingProject.sections_config,
        content: existingProject.content,
        media: existingProject.media,
        metrics: existingProject.metrics,
        decision_log: existingProject.decision_log,
      });

      // Set section toggles based on content
      const c = existingProject.content;
      setShowOverview(!!c.overview);
      setShowContext(!!c.context);
      setShowProblem(!!c.problem);
      setShowYourRole(!!c.your_role);
      setShowConstraints(!!c.constraints);
      setShowApproach(!!c.approach_decisions);
      setShowExecution(!!c.execution);
      setShowImpact(!!c.impact);
      setShowLearnings(!!c.learnings);
      setShowLinks(!!(c.links?.live || c.links?.github));
      setShowMetrics(existingProject.metrics.length > 0);
      setShowDecisionLog(existingProject.decision_log.length > 0);
      setShowMedia(existingProject.media.length > 0);
    }
  }, [existingProject]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const projectData = {
        ...(projectId ? { id: projectId } : {}),
        ...form,
      };
      const result = await adminUpsertProject(projectData);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      toast.success("Project saved");
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      if (isNew && data) {
        navigate(`/admin/projects/${data.slug}/edit`, { replace: true });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("No project ID");
      const result = await adminDeleteProject(projectId);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      toast.success("Project deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      navigate("/admin/projects");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Validation
  const validate = (): boolean => {
    if (!form.slug.trim()) {
      toast.error("Slug is required");
      return false;
    }
    if (!form.title.trim()) {
      toast.error("Title is required");
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (validate()) {
      saveMutation.mutate();
    }
  };

  // Update content helper
  const updateContent = (key: keyof ProjectContent, value: string) => {
    setForm((prev) => ({
      ...prev,
      content: { ...prev.content, [key]: value },
    }));
  };

  // Update links helper
  const updateLink = (key: "live" | "github", value: string) => {
    setForm((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        links: { ...prev.content.links, [key]: value || null },
      },
    }));
  };

  // Metrics helpers
  const addMetric = () => {
    setForm((prev) => ({ ...prev, metrics: [...prev.metrics, ""] }));
  };
  const updateMetric = (index: number, value: string) => {
    setForm((prev) => {
      const newMetrics = [...prev.metrics];
      newMetrics[index] = value;
      return { ...prev, metrics: newMetrics };
    });
  };
  const removeMetric = (index: number) => {
    setForm((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((_, i) => i !== index),
    }));
  };

  // Decision log helpers
  const addDecision = () => {
    setForm((prev) => ({
      ...prev,
      decision_log: [...prev.decision_log, { decision: "", tradeoff: "", outcome: "" }],
    }));
  };
  const updateDecision = (index: number, field: keyof DecisionLogEntry, value: string) => {
    setForm((prev) => {
      const newLog = [...prev.decision_log];
      newLog[index] = { ...newLog[index], [field]: value };
      return { ...prev, decision_log: newLog };
    });
  };
  const removeDecision = (index: number) => {
    setForm((prev) => ({
      ...prev,
      decision_log: prev.decision_log.filter((_, i) => i !== index),
    }));
  };

  // Media helpers
  const addMedia = () => {
    if (form.media.length >= 3) {
      toast.error("Maximum 3 media items allowed");
      return;
    }
    setForm((prev) => ({
      ...prev,
      media: [...prev.media, { type: "image", url: "", caption: "" }],
    }));
  };
  const updateMedia = (index: number, field: keyof MediaItem, value: string) => {
    setForm((prev) => {
      const newMedia = [...prev.media];
      newMedia[index] = { ...newMedia[index], [field]: value } as MediaItem;
      return { ...prev, media: newMedia };
    });
  };
  const removeMedia = (index: number) => {
    setForm((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  };

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isNew && !existingProject && !isLoading) {
    return (
      <div className="max-w-4xl">
        <p className="text-muted-foreground">Project not found.</p>
        <Link to="/admin/projects" className="text-primary underline mt-4 inline-block">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/admin/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-medium">
              {isNew ? "New Project" : "Edit Project"}
            </h1>
            {!isNew && (
              <p className="text-sm text-muted-foreground">Last updated: {existingProject?.updated_at}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && form.slug && (
            <Link to={`/projects/${form.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </Link>
          )}
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </Button>
        </div>
      </div>

      {/* A) Project Metadata */}
      <section className="border border-border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Project Metadata</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Project Title"
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
              placeholder="project-slug"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={form.summary}
              onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
              placeholder="Brief description of the project"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={form.tags.join(", ")}
              onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) }))}
              placeholder="react, typescript, design"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((p) => ({ ...p, status: v as ProjectStatus }))}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="CONFIDENTIAL">Confidential</SelectItem>
                <SelectItem value="CONCEPT">Concept</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="detail_level">Detail Level</Label>
            <Select
              value={form.detail_level}
              onValueChange={(v) => setForm((p) => ({ ...p, detail_level: v as DetailLevel }))}
            >
              <SelectTrigger id="detail_level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRIEF">Brief</SelectItem>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="DEEP">Deep Dive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="featured"
                checked={form.featured}
                onCheckedChange={(v) => setForm((p) => ({ ...p, featured: v }))}
              />
              <Label htmlFor="featured">Featured</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="published"
                checked={form.published}
                onCheckedChange={(v) => setForm((p) => ({ ...p, published: v }))}
              />
              <Label htmlFor="published">Published</Label>
            </div>
          </div>
        </div>
      </section>

      {/* B) Content Sections */}
      <section className="border border-border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Content Sections</h2>
        <p className="text-sm text-muted-foreground mb-4">Toggle sections to include in this project.</p>

        <div className="space-y-4">
          {/* Overview */}
          <ContentSection
            label="Overview"
            enabled={showOverview}
            onToggle={setShowOverview}
            value={form.content.overview || ""}
            onChange={(v) => updateContent("overview", v)}
          />

          {/* Context */}
          <ContentSection
            label="Context"
            enabled={showContext}
            onToggle={setShowContext}
            value={form.content.context || ""}
            onChange={(v) => updateContent("context", v)}
          />

          {/* Problem */}
          <ContentSection
            label="Problem"
            enabled={showProblem}
            onToggle={setShowProblem}
            value={form.content.problem || ""}
            onChange={(v) => updateContent("problem", v)}
          />

          {/* Your Role */}
          <ContentSection
            label="Your Role"
            enabled={showYourRole}
            onToggle={setShowYourRole}
            value={form.content.your_role || ""}
            onChange={(v) => updateContent("your_role", v)}
          />

          {/* Constraints */}
          <ContentSection
            label="Constraints"
            enabled={showConstraints}
            onToggle={setShowConstraints}
            value={form.content.constraints || ""}
            onChange={(v) => updateContent("constraints", v)}
          />

          {/* Approach & Decisions */}
          <ContentSection
            label="Approach & Decisions"
            enabled={showApproach}
            onToggle={setShowApproach}
            value={form.content.approach_decisions || ""}
            onChange={(v) => updateContent("approach_decisions", v)}
          />

          {/* Execution */}
          <ContentSection
            label="Execution"
            enabled={showExecution}
            onToggle={setShowExecution}
            value={form.content.execution || ""}
            onChange={(v) => updateContent("execution", v)}
          />

          {/* Impact */}
          <ContentSection
            label="Impact"
            enabled={showImpact}
            onToggle={setShowImpact}
            value={form.content.impact || ""}
            onChange={(v) => updateContent("impact", v)}
          />

          {/* Learnings */}
          <ContentSection
            label="Learnings"
            enabled={showLearnings}
            onToggle={setShowLearnings}
            value={form.content.learnings || ""}
            onChange={(v) => updateContent("learnings", v)}
          />

          {/* Links */}
          <div className="border border-border rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="font-medium">Links</Label>
              <Switch checked={showLinks} onCheckedChange={setShowLinks} />
            </div>
            {showLinks && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <Label htmlFor="link-live" className="text-sm">Live URL</Label>
                  <Input
                    id="link-live"
                    value={form.content.links?.live || ""}
                    onChange={(e) => updateLink("live", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="link-github" className="text-sm">GitHub URL</Label>
                  <Input
                    id="link-github"
                    value={form.content.links?.github || ""}
                    onChange={(e) => updateLink("github", e.target.value)}
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* C) Optional Blocks */}
      <section className="border border-border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Optional Blocks</h2>

        {/* Metrics */}
        <div className="border border-border rounded-md p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="font-medium">Metrics</Label>
            <Switch checked={showMetrics} onCheckedChange={setShowMetrics} />
          </div>
          {showMetrics && (
            <div className="space-y-2 mt-3">
              {form.metrics.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={m}
                    onChange={(e) => updateMetric(i, e.target.value)}
                    placeholder="e.g., 50% faster load time"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeMetric(i)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addMetric}>
                Add Metric
              </Button>
            </div>
          )}
        </div>

        {/* Decision Log */}
        <div className="border border-border rounded-md p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="font-medium">Decision Log</Label>
            <Switch checked={showDecisionLog} onCheckedChange={setShowDecisionLog} />
          </div>
          {showDecisionLog && (
            <div className="space-y-4 mt-3">
              {form.decision_log.map((entry, i) => (
                <div key={i} className="border border-border/50 rounded p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Entry {i + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeDecision(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    value={entry.decision}
                    onChange={(e) => updateDecision(i, "decision", e.target.value)}
                    placeholder="Decision"
                  />
                  <Input
                    value={entry.tradeoff}
                    onChange={(e) => updateDecision(i, "tradeoff", e.target.value)}
                    placeholder="Tradeoff"
                  />
                  <Input
                    value={entry.outcome}
                    onChange={(e) => updateDecision(i, "outcome", e.target.value)}
                    placeholder="Outcome"
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addDecision}>
                Add Entry
              </Button>
            </div>
          )}
        </div>

        {/* Media */}
        <div className="border border-border rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="font-medium">Media (max 3)</Label>
            <Switch checked={showMedia} onCheckedChange={setShowMedia} />
          </div>
          {showMedia && (
            <div className="space-y-4 mt-3">
              {form.media.map((item, i) => (
                <div key={i} className="border border-border/50 rounded p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <Select
                      value={item.type}
                      onValueChange={(v) => updateMedia(i, "type", v)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => removeMedia(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    value={item.url}
                    onChange={(e) => updateMedia(i, "url", e.target.value)}
                    placeholder="URL (external)"
                  />
                  <Input
                    value={item.caption || ""}
                    onChange={(e) => updateMedia(i, "caption", e.target.value)}
                    placeholder="Caption (required)"
                  />
                </div>
              ))}
              {form.media.length < 3 && (
                <Button variant="outline" size="sm" onClick={addMedia}>
                  Add Media
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Delete */}
      {!isNew && projectId && (
        <section className="border border-destructive/20 rounded-lg p-6">
          <h2 className="text-lg font-medium text-destructive mb-2">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Deleting this project is permanent and cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleteMutation.isPending}>
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete Project
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{form.title}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutation.mutate()}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      )}
    </div>
  );
}

// Reusable content section toggle
function ContentSection({
  label,
  enabled,
  onToggle,
  value,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="border border-border rounded-md p-4">
      <div className="flex items-center justify-between mb-2">
        <Label className="font-medium">{label}</Label>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
      {enabled && (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Write ${label.toLowerCase()} content...`}
          rows={4}
          className="mt-2"
        />
      )}
    </div>
  );
}
