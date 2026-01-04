import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Loader2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Pencil,
  X,
  Check,
  Settings,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  adminListWritingCategories,
  adminUpsertWritingCategory,
  adminDeleteWritingCategory,
  adminListWritingItems,
  adminUpsertWritingItem,
  adminDeleteWritingItem,
  adminGetSiteSettings,
  adminUpdateSiteSettings,
} from "@/lib/db";
import type { WritingCategory, WritingItemWithCategory, WritingLanguage, WritingPageConfig } from "@/lib/types";

export default function AdminWriting() {
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);

  // Fetch categories
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["admin-writing-categories"],
    queryFn: async () => {
      const result = await adminListWritingCategories();
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
  });

  // Fetch items
  const { data: items, isLoading: loadingItems } = useQuery({
    queryKey: ["admin-writing-items"],
    queryFn: async () => {
      const result = await adminListWritingItems();
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
  });

  // Fetch site settings for page config
  const { data: siteSettings } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      const result = await adminGetSiteSettings();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });

  const sortedCategories = [...(categories || [])].sort((a, b) => a.order_index - b.order_index);
  const sortedItems = [...(items || [])].sort((a, b) => a.order_index - b.order_index);

  const isLoading = loadingCategories || loadingItems;

  return (
    <div className="max-w-5xl pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-2">Writing</h1>
          <p className="text-muted-foreground">Manage categories and writing links.</p>
        </div>
        <Button variant="outline" onClick={() => setShowSettings(true)}>
          <Settings className="w-4 h-4 mr-2" />
          Page Settings
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Categories Section */}
          <CategoriesSection categories={sortedCategories} />

          {/* Items Section */}
          <ItemsSection items={sortedItems} categories={sortedCategories} />
        </>
      )}

      {/* Page Settings Dialog */}
      <PageSettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        config={siteSettings?.pages?.writing}
      />
    </div>
  );
}

// =============================================================================
// Categories Section
// =============================================================================

function CategoriesSection({ categories }: { categories: WritingCategory[] }) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Upsert mutation
  const upsertMutation = useMutation({
    mutationFn: async (data: Partial<WritingCategory> & { name: string }) => {
      const result = await adminUpsertWritingCategory(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-writing-categories"] });
      setNewName("");
      setEditingId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await adminDeleteWritingCategory(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-writing-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-writing-items"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Reorder
  const handleReorder = (id: string, direction: "up" | "down") => {
    const index = categories.findIndex((c) => c.id === id);
    if (index < 0) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const cat = categories[index];
    const swapCat = categories[newIndex];

    // Swap order_index values
    upsertMutation.mutate({ id: cat.id, name: cat.name, order_index: swapCat.order_index });
    upsertMutation.mutate({ id: swapCat.id, name: swapCat.name, order_index: cat.order_index });
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const maxOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.order_index)) : -1;
    upsertMutation.mutate({ name: newName.trim(), order_index: maxOrder + 1, enabled: true });
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    const cat = categories.find((c) => c.id === editingId);
    if (cat) {
      upsertMutation.mutate({ id: cat.id, name: editName.trim(), order_index: cat.order_index, enabled: cat.enabled });
    }
  };

  return (
    <Collapsible defaultOpen className="border border-border rounded-lg p-4 mb-6">
      <CollapsibleTrigger className="flex items-center justify-between w-full">
        <h2 className="text-lg font-medium">Categories</h2>
        <ChevronDown className="w-4 h-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4">
        {/* Add new */}
        <div className="flex gap-2 mb-4">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            className="max-w-xs"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={!newName.trim() || upsertMutation.isPending}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        {/* List */}
        <div className="space-y-2">
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          )}
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              className="flex items-center gap-2 p-2 border border-border rounded-md bg-muted/30"
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleReorder(cat.id, "up")}
                  disabled={index === 0}
                  className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleReorder(cat.id, "down")}
                  disabled={index === categories.length - 1}
                  className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Name */}
              {editingId === cat.id ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 h-8"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                />
              ) : (
                <span className="flex-1 font-medium">{cat.name}</span>
              )}

              {/* Enabled toggle */}
              <Switch
                checked={cat.enabled}
                onCheckedChange={(v) =>
                  upsertMutation.mutate({ id: cat.id, name: cat.name, order_index: cat.order_index, enabled: v })
                }
              />

              {/* Edit / Save */}
              {editingId === cat.id ? (
                <>
                  <Button variant="ghost" size="icon" onClick={handleSaveEdit}>
                    <Check className="w-4 h-4 text-success" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingId(cat.id);
                    setEditName(cat.name);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}

              {/* Delete */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will unlink all items in "{cat.name}". This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate(cat.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// =============================================================================
// Items Section
// =============================================================================

interface ItemFormData {
  id?: string;
  title: string;
  url: string;
  platform_label: string;
  category_id: string | null;
  language: WritingLanguage;
  featured: boolean;
  enabled: boolean;
  order_index: number;
  why_this_matters: string;
  show_why: boolean;
}

const defaultItemForm: ItemFormData = {
  title: "",
  url: "",
  platform_label: "",
  category_id: null,
  language: "AUTO",
  featured: false,
  enabled: true,
  order_index: 0,
  why_this_matters: "",
  show_why: false,
};

function ItemsSection({
  items,
  categories,
}: {
  items: WritingItemWithCategory[];
  categories: WritingCategory[];
}) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ItemFormData>(defaultItemForm);
  const isEditing = !!form.id;

  // Upsert mutation
  const upsertMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      const result = await adminUpsertWritingItem({
        id: data.id,
        title: data.title,
        url: data.url,
        platform_label: data.platform_label,
        category_id: data.category_id || null,
        language: data.language,
        featured: data.featured,
        enabled: data.enabled,
        order_index: data.order_index,
        why_this_matters: data.why_this_matters || null,
        show_why: data.show_why,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-writing-items"] });
      setDialogOpen(false);
      setForm(defaultItemForm);
      toast.success(isEditing ? "Item updated" : "Item added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await adminDeleteWritingItem(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-writing-items"] });
      toast.success("Item deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Reorder
  const handleReorder = (id: string, direction: "up" | "down") => {
    const index = items.findIndex((i) => i.id === id);
    if (index < 0) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const item = items[index];
    const swapItem = items[newIndex];

    // Swap order_index values
    upsertMutation.mutate({
      id: item.id,
      title: item.title,
      url: item.url,
      platform_label: item.platform_label,
      category_id: item.category_id,
      language: item.language,
      featured: item.featured,
      enabled: item.enabled,
      order_index: swapItem.order_index,
      why_this_matters: item.why_this_matters || "",
      show_why: item.show_why,
    });
    upsertMutation.mutate({
      id: swapItem.id,
      title: swapItem.title,
      url: swapItem.url,
      platform_label: swapItem.platform_label,
      category_id: swapItem.category_id,
      language: swapItem.language,
      featured: swapItem.featured,
      enabled: swapItem.enabled,
      order_index: item.order_index,
      why_this_matters: swapItem.why_this_matters || "",
      show_why: swapItem.show_why,
    });
  };

  const openAdd = () => {
    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.order_index)) : -1;
    setForm({ ...defaultItemForm, order_index: maxOrder + 1 });
    setDialogOpen(true);
  };

  const openEdit = (item: WritingItemWithCategory) => {
    setForm({
      id: item.id,
      title: item.title,
      url: item.url,
      platform_label: item.platform_label,
      category_id: item.category_id,
      language: item.language,
      featured: item.featured,
      enabled: item.enabled,
      order_index: item.order_index,
      why_this_matters: item.why_this_matters || "",
      show_why: item.show_why,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.url.trim()) {
      toast.error("Title and URL are required");
      return;
    }
    upsertMutation.mutate(form);
  };

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Writing Items</h2>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Add Item
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No items yet.</p>
      )}

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 border border-border rounded-md bg-muted/20"
          >
            {/* Reorder */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => handleReorder(item.id, "up")}
                disabled={index === 0}
                className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleReorder(item.id, "down")}
                disabled={index === items.length - 1}
                className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {item.platform_label} • {item.category?.name || "Uncategorized"}
              </p>
            </div>

            {/* Featured badge */}
            {item.featured && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                Featured
              </span>
            )}

            {/* Enabled toggle */}
            <Switch
              checked={item.enabled}
              onCheckedChange={(v) =>
                upsertMutation.mutate({
                  id: item.id,
                  title: item.title,
                  url: item.url,
                  platform_label: item.platform_label,
                  category_id: item.category_id,
                  language: item.language,
                  featured: item.featured,
                  enabled: v,
                  order_index: item.order_index,
                  why_this_matters: item.why_this_matters || "",
                  show_why: item.show_why,
                })
              }
            />

            {/* Edit */}
            <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
              <Pencil className="w-4 h-4" />
            </Button>

            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Delete "{item.title}"? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteMutation.mutate(item.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>

      {/* Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Item" : "Add Item"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Article title"
              />
            </div>

            <div>
              <Label>URL *</Label>
              <Input
                value={form.url}
                onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label>Platform Label</Label>
              <Input
                value={form.platform_label}
                onChange={(e) => setForm((p) => ({ ...p, platform_label: e.target.value }))}
                placeholder="Medium, Dev.to, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={form.category_id || "none"}
                  onValueChange={(v) => setForm((p) => ({ ...p, category_id: v === "none" ? null : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Language</Label>
                <Select
                  value={form.language}
                  onValueChange={(v) => setForm((p) => ({ ...p, language: v as WritingLanguage }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">Auto</SelectItem>
                    <SelectItem value="EN">English</SelectItem>
                    <SelectItem value="AR">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  id="enabled"
                  checked={form.enabled}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, enabled: v }))}
                />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <Label>Why This Matters</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="show_why" className="text-xs text-muted-foreground">
                    Show
                  </Label>
                  <Switch
                    id="show_why"
                    checked={form.show_why}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, show_why: v }))}
                  />
                </div>
              </div>
              <Textarea
                value={form.why_this_matters}
                onChange={(e) => setForm((p) => ({ ...p, why_this_matters: e.target.value }))}
                placeholder="Brief note about why this piece matters..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =============================================================================
// Page Settings Dialog
// =============================================================================

function PageSettingsDialog({
  open,
  onClose,
  config,
}: {
  open: boolean;
  onClose: () => void;
  config?: WritingPageConfig;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<WritingPageConfig>({
    enabled: true,
    title: "",
    intro: "",
    autoHideIfEmpty: false,
  });

  useEffect(() => {
    if (config) {
      setForm({
        enabled: config.enabled ?? true,
        title: config.title || "",
        intro: config.intro || "",
        autoHideIfEmpty: config.autoHideIfEmpty ?? false,
      });
    }
  }, [config]);

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await adminUpdateSiteSettings({
        pages: {
          writing: form,
        },
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      toast.success("Settings saved");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Writing Page Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex items-center justify-between">
            <Label>Page Enabled</Label>
            <Switch
              checked={form.enabled}
              onCheckedChange={(v) => setForm((p) => ({ ...p, enabled: v }))}
            />
          </div>

          <div>
            <Label>Page Title</Label>
            <Input
              value={form.title || ""}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Writing (default)"
            />
          </div>

          <div>
            <Label>Intro Text</Label>
            <Textarea
              value={form.intro || ""}
              onChange={(e) => setForm((p) => ({ ...p, intro: e.target.value }))}
              placeholder="Optional introduction for the writing page..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-hide if empty</Label>
              <p className="text-xs text-muted-foreground">Hide from nav when no items</p>
            </div>
            <Switch
              checked={form.autoHideIfEmpty}
              onCheckedChange={(v) => setForm((p) => ({ ...p, autoHideIfEmpty: v }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
