import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown, Save, Upload, CheckCircle, XCircle, AlertTriangle, Database } from "lucide-react";
import { adminGetSiteSettings, adminUpdateSiteSettings, supabaseReady } from "@/lib/db";
import { getSupabase } from "@/lib/supabaseClient";
import type {
  SiteSettings,
  NavLink,
  NavConfig,
  HomeSectionConfig,
  ThemeConfig,
  SEOConfig,
  PagesConfig,
  FontOption,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { isValidUrl, sanitizeErrorMessage } from "@/lib/security";

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Setup status
  const [setupStatus, setSetupStatus] = useState({
    envReady: supabaseReady,
    dbReachable: false,
    settingsExist: false,
    isAdmin: false,
    checking: true,
  });

  // Local editable state
  const [navConfig, setNavConfig] = useState<NavConfig>({ links: [] });
  const [homeSections, setHomeSections] = useState<HomeSectionConfig[]>([]);
  const [theme, setTheme] = useState<ThemeConfig>({ mode: "system" });
  const [seo, setSeo] = useState<SEOConfig>({ title: "", description: "" });
  const [pages, setPages] = useState<PagesConfig>({});

  const checkSetup = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setSetupStatus(s => ({ ...s, checking: false }));
      return;
    }

    // Check DB reachable
    const { data: viewData, error: viewError } = await supabase
      .from('public_site_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    const dbReachable = !viewError;
    const settingsExist = !!viewData;

    // Check admin status via RPC
    let isAdmin = false;
    if (settingsExist) {
      const { data: adminCheck } = await supabase.rpc('is_admin');
      isAdmin = adminCheck === true;
    }

    setSetupStatus({ envReady: true, dbReachable, settingsExist, isAdmin, checking: false });
  }, []);

  useEffect(() => {
    checkSetup();
  }, [checkSetup]);

  useEffect(() => {
    async function load() {
      const res = await adminGetSiteSettings();
      if (res.error) {
        setSettingsError(res.error);
      } else if (res.data) {
        setSettings(res.data);
        setNavConfig(res.data.nav_config || { links: [] });
        setHomeSections(res.data.home_sections?.sections || []);
        setTheme(res.data.theme || { mode: "system" });
        setSeo(res.data.seo || { title: "", description: "" });
        setPages(res.data.pages || {});
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const res = await adminUpdateSiteSettings({
      nav_config: navConfig,
      home_sections: { sections: homeSections },
      theme,
      seo,
      pages,
    });

    if (res.error) {
      toast({
        title: "Error saving settings",
        description: sanitizeErrorMessage(res.error),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Settings saved",
        description: "Your changes have been saved successfully.",
      });
      // Apply font to body
      applyFont(theme.font);
    }
    setSaving(false);
  }, [navConfig, homeSections, theme, seo, pages, toast]);

  const applyFont = (font?: FontOption) => {
    document.body.classList.remove("font-inter", "font-ibm-plex-serif", "font-system");
    if (font) {
      document.body.classList.add(`font-${font}`);
    }
  };

  // Favicon upload handler
  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = getSupabase();
    if (!supabase) {
      toast({ title: "Supabase not configured", variant: "destructive" });
      return;
    }

    if (!file.type.includes("png") && !file.type.includes("ico") && !file.type.includes("icon")) {
      toast({ title: "Invalid file type", description: "Please upload a PNG or ICO file.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const fileName = `favicon-${Date.now()}.${file.name.split(".").pop()}`;

    const { data, error } = await supabase.storage.from("assets").upload(fileName, file, { upsert: true });

    if (error) {
      toast({ title: "Upload failed", description: sanitizeErrorMessage(error), variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("assets").getPublicUrl(data.path);
    setSeo((prev) => ({ ...prev, faviconUrl: urlData.publicUrl }));
    toast({ title: "Favicon uploaded", description: "Remember to save changes." });
    setUploading(false);
  };

  const handleClaimAdmin = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data, error } = await supabase.rpc('claim_admin');
    if (error) {
      toast({ title: "Claim failed", description: error.message, variant: "destructive" });
    } else if (data?.success) {
      toast({ title: "Admin claimed!", description: "You now have admin access." });
      checkSetup();
      window.location.reload();
    } else {
      toast({ title: "Claim failed", description: data?.error || "Unknown error", variant: "destructive" });
    }
  };

  const handleSeedDemo = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      toast({ title: "Supabase not configured", variant: "destructive" });
      return;
    }

    setSeeding(true);
    try {
      const { data, error } = await supabase.rpc('admin_seed_demo');
      
      if (error) {
        toast({ 
          title: "Seed failed", 
          description: error.message.includes('does not exist') 
            ? "Run docs/sql/003_seed.sql first to create the seed function."
            : sanitizeErrorMessage(error),
          variant: "destructive" 
        });
      } else if (data?.success) {
        const msg = [
          data.projects_inserted > 0 ? `${data.projects_inserted} projects` : null,
          data.categories_inserted > 0 ? `${data.categories_inserted} categories` : null,
          data.items_inserted > 0 ? `${data.items_inserted} writing items` : null,
        ].filter(Boolean).join(', ');
        
        toast({ 
          title: "Demo content seeded!", 
          description: msg || "Content already exists (no duplicates created).",
        });
      } else {
        toast({ 
          title: "Seed failed", 
          description: data?.error || "Unknown error", 
          variant: "destructive" 
        });
      }
    } catch (e) {
      toast({ 
        title: "Seed failed", 
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive" 
      });
    }
    setSeeding(false);
  };

  const StatusIcon = ({ ok }: { ok: boolean }) => 
    ok ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />;

  const canEdit = setupStatus.envReady && setupStatus.dbReachable && setupStatus.isAdmin;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Setup Wizard Card */}
      {(!setupStatus.isAdmin || settingsError) && (
        <div className="mb-6 p-4 border border-border rounded-lg bg-muted/50">
          <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Setup Status
          </h2>
          <ul className="space-y-2 text-sm mb-4">
            <li className="flex items-center gap-2">
              <StatusIcon ok={setupStatus.envReady} />
              Env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
            </li>
            <li className="flex items-center gap-2">
              <StatusIcon ok={setupStatus.dbReachable} />
              Supabase reachable
            </li>
            <li className="flex items-center gap-2">
              <StatusIcon ok={setupStatus.settingsExist} />
              site_settings row exists
            </li>
            <li className="flex items-center gap-2">
              <StatusIcon ok={setupStatus.isAdmin} />
              Admin claimed
            </li>
          </ul>
          {setupStatus.envReady && setupStatus.settingsExist && !setupStatus.isAdmin && (
            <Button onClick={handleClaimAdmin} className="gap-2">
              <CheckCircle className="w-4 h-4" /> Claim Admin
            </Button>
          )}
          {!setupStatus.envReady && (
            <p className="text-muted-foreground text-sm">Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.</p>
          )}
          {setupStatus.envReady && !setupStatus.settingsExist && (
            <p className="text-muted-foreground text-sm">Run docs/sql/000_all.sql in Supabase SQL Editor.</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-medium mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage site configuration.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleSeedDemo} 
            disabled={seeding || !canEdit} 
            className="gap-2"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Seed Demo
          </Button>
          <Button onClick={handleSave} disabled={saving || !canEdit} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["navigation"]} className="space-y-4">
        {/* Navigation */}
        <AccordionItem value="navigation" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-lg font-medium">Navigation</AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            {/* Nav Links */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Nav Links</Label>
              <div className="space-y-3">
                {navConfig.links.map((link, i) => (
                  <NavLinkEditor
                    key={i}
                    link={link}
                    onChange={(updated) => {
                      const newLinks = [...navConfig.links];
                      newLinks[i] = updated;
                      setNavConfig({ ...navConfig, links: newLinks });
                    }}
                    onRemove={() => {
                      const newLinks = navConfig.links.filter((_, idx) => idx !== i);
                      setNavConfig({ ...navConfig, links: newLinks });
                    }}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-2"
                onClick={() =>
                  setNavConfig({
                    ...navConfig,
                    links: [...navConfig.links, { href: "/", label: "New Link", visible: true }],
                  })
                }
              >
                <Plus className="w-4 h-4" /> Add Link
              </Button>
            </div>

            {/* CTA Button */}
            <div className="border-t border-border pt-4">
              <Label className="text-sm font-medium mb-3 block">CTA Button</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={navConfig.ctaButton?.visible ?? false}
                    onCheckedChange={(checked) =>
                      setNavConfig({
                        ...navConfig,
                        ctaButton: { ...navConfig.ctaButton, visible: checked, href: navConfig.ctaButton?.href || "", label: navConfig.ctaButton?.label || "" },
                      })
                    }
                  />
                  <span className="text-sm">Visible</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Label"
                    value={navConfig.ctaButton?.label || ""}
                    onChange={(e) =>
                      setNavConfig({
                        ...navConfig,
                        ctaButton: { ...navConfig.ctaButton, label: e.target.value, href: navConfig.ctaButton?.href || "", visible: navConfig.ctaButton?.visible ?? false },
                      })
                    }
                  />
                  <Input
                    placeholder="/resume"
                    value={navConfig.ctaButton?.href || ""}
                    onChange={(e) =>
                      setNavConfig({
                        ...navConfig,
                        ctaButton: { ...navConfig.ctaButton, href: e.target.value, label: navConfig.ctaButton?.label || "", visible: navConfig.ctaButton?.visible ?? false },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Home Layout */}
        <AccordionItem value="home-layout" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-lg font-medium">Home Layout</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            {homeSections
              .sort((a, b) => a.order - b.order)
              .map((section, i) => (
                <HomeSectionEditor
                  key={section.id}
                  section={section}
                  isFirst={i === 0}
                  isLast={i === homeSections.length - 1}
                  onChange={(updated) => {
                    setHomeSections((prev) =>
                      prev.map((s) => (s.id === section.id ? updated : s))
                    );
                  }}
                  onMoveUp={() => {
                    if (i === 0) return;
                    const sorted = [...homeSections].sort((a, b) => a.order - b.order);
                    const prevOrder = sorted[i - 1].order;
                    const currentOrder = sorted[i].order;
                    setHomeSections((prev) =>
                      prev.map((s) => {
                        if (s.id === section.id) return { ...s, order: prevOrder };
                        if (s.id === sorted[i - 1].id) return { ...s, order: currentOrder };
                        return s;
                      })
                    );
                  }}
                  onMoveDown={() => {
                    if (i === homeSections.length - 1) return;
                    const sorted = [...homeSections].sort((a, b) => a.order - b.order);
                    const nextOrder = sorted[i + 1].order;
                    const currentOrder = sorted[i].order;
                    setHomeSections((prev) =>
                      prev.map((s) => {
                        if (s.id === section.id) return { ...s, order: nextOrder };
                        if (s.id === sorted[i + 1].id) return { ...s, order: currentOrder };
                        return s;
                      })
                    );
                  }}
                />
              ))}
          </AccordionContent>
        </AccordionItem>

        {/* Theme */}
        <AccordionItem value="theme" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-lg font-medium">Theme</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-2 block">Mode</Label>
                <Select
                  value={theme.mode}
                  onValueChange={(v) => setTheme({ ...theme, mode: v as ThemeConfig["mode"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-2 block">Font</Label>
                <Select
                  value={theme.font || "inter"}
                  onValueChange={(v) => setTheme({ ...theme, font: v as FontOption })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter</SelectItem>
                    <SelectItem value="ibm-plex-serif">IBM Plex Serif</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Accent Color (HSL)</Label>
              <Input
                placeholder="18 60% 50%"
                value={theme.accentColor || ""}
                onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: hue saturation% lightness% (e.g., 18 60% 50%)
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SEO */}
        <AccordionItem value="seo" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-lg font-medium">SEO</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div>
              <Label className="text-sm mb-2 block">Site Title</Label>
              <Input
                value={seo.title}
                onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                placeholder="Your Name - Title"
              />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Meta Description</Label>
              <Textarea
                value={seo.description}
                onChange={(e) => setSeo({ ...seo, description: e.target.value })}
                placeholder="Brief description of your site..."
                rows={3}
              />
            </div>
            <div>
              <Label className="text-sm mb-2 block">OG Image URL</Label>
              <Input
                value={seo.ogImage || ""}
                onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
                placeholder="https://example.com/og.png"
              />
              {seo.ogImage && !isValidUrl(seo.ogImage) && (
                <p className="text-xs text-destructive mt-1">Invalid URL format</p>
              )}
            </div>
            <div>
              <Label className="text-sm mb-2 block">Canonical URL</Label>
              <Input
                value={seo.canonicalUrl || ""}
                onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })}
                placeholder="https://yoursite.com"
              />
              {seo.canonicalUrl && !isValidUrl(seo.canonicalUrl) && (
                <p className="text-xs text-destructive mt-1">Invalid URL format</p>
              )}
            </div>
            <div>
              <Label className="text-sm mb-2 block">Favicon</Label>
              <div className="flex items-center gap-3">
                <Input
                  value={seo.faviconUrl || ""}
                  onChange={(e) => setSeo({ ...seo, faviconUrl: e.target.value })}
                  placeholder="https://example.com/favicon.ico"
                  className="flex-1"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".png,.ico"
                    className="hidden"
                    onChange={handleFaviconUpload}
                    disabled={uploading}
                  />
                  <Button variant="outline" size="sm" asChild disabled={uploading}>
                    <span className="gap-2">
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Pages */}
        <AccordionItem value="pages" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-lg font-medium">Pages</AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            {/* Resume */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Switch
                  checked={pages.resume?.enabled ?? true}
                  onCheckedChange={(checked) =>
                    setPages({ ...pages, resume: { ...pages.resume, enabled: checked } })
                  }
                />
                <Label className="text-sm font-medium">Resume Page</Label>
              </div>
              <Input
                placeholder="PDF URL"
                value={pages.resume?.pdfUrl || ""}
                onChange={(e) =>
                  setPages({
                    ...pages,
                    resume: { ...pages.resume, enabled: pages.resume?.enabled ?? true, pdfUrl: e.target.value },
                  })
                }
              />
              {pages.resume?.pdfUrl && !isValidUrl(pages.resume.pdfUrl) && (
                <p className="text-xs text-destructive mt-1">Invalid URL format</p>
              )}
            </div>

            {/* Contact */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-3 mb-3">
                <Switch
                  checked={pages.contact?.enabled ?? true}
                  onCheckedChange={(checked) =>
                    setPages({ ...pages, contact: { ...pages.contact, enabled: checked } })
                  }
                />
                <Label className="text-sm font-medium">Contact Page</Label>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="Email"
                  value={(pages.contact as { email?: string })?.email || ""}
                  onChange={(e) =>
                    setPages({
                      ...pages,
                      contact: { ...pages.contact, enabled: pages.contact?.enabled ?? true, email: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="LinkedIn URL"
                  value={(pages.contact as { linkedin?: string })?.linkedin || ""}
                  onChange={(e) =>
                    setPages({
                      ...pages,
                      contact: { ...pages.contact, enabled: pages.contact?.enabled ?? true, linkedin: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="Calendar URL (e.g., Calendly)"
                  value={(pages.contact as { calendar?: string })?.calendar || ""}
                  onChange={(e) =>
                    setPages({
                      ...pages,
                      contact: { ...pages.contact, enabled: pages.contact?.enabled ?? true, calendar: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// Nav Link Editor Component
function NavLinkEditor({
  link,
  onChange,
  onRemove,
}: {
  link: NavLink;
  onChange: (updated: NavLink) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={link.visible}
        onCheckedChange={(checked) => onChange({ ...link, visible: checked })}
      />
      <Input
        placeholder="Label"
        value={link.label}
        onChange={(e) => onChange({ ...link, label: e.target.value })}
        className="flex-1"
      />
      <Input
        placeholder="/path"
        value={link.href}
        onChange={(e) => onChange({ ...link, href: e.target.value })}
        className="flex-1"
      />
      <Button variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 className="w-4 h-4 text-muted-foreground" />
      </Button>
    </div>
  );
}

// Home Section Editor Component
function HomeSectionEditor({
  section,
  isFirst,
  isLast,
  onChange,
  onMoveUp,
  onMoveDown,
}: {
  section: HomeSectionConfig;
  isFirst: boolean;
  isLast: boolean;
  onChange: (updated: HomeSectionConfig) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
      <Switch
        checked={section.visible}
        onCheckedChange={(checked) => onChange({ ...section, visible: checked })}
      />
      <div className="flex-1">
        <p className="text-sm font-medium">{section.id.replace(/_/g, " ")}</p>
        <Input
          placeholder="Title override (optional)"
          value={section.title || ""}
          onChange={(e) => onChange({ ...section, title: e.target.value || undefined })}
          className="mt-2 h-8 text-sm"
        />
      </div>
      {(section.id === "featured_projects" || section.id === "selected_writing_preview") && (
        <Input
          type="number"
          min={1}
          max={10}
          placeholder="Limit"
          value={section.limit || ""}
          onChange={(e) =>
            onChange({ ...section, limit: e.target.value ? parseInt(e.target.value) : undefined })
          }
          className="w-16 h-8 text-sm"
        />
      )}
      <div className="flex flex-col gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp} disabled={isFirst}>
          <ChevronUp className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown} disabled={isLast}>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
