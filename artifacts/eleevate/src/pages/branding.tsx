import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Palette, Globe2, Building2, Save, Eye, CheckCircle2, Wand2 } from "lucide-react";

interface BrandingSettings {
  id?: string;
  consultantId: string;
  agencyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  subdomain?: string;
  tagline?: string;
}

const PRESET_PALETTES = [
  { name: "Ocean Blue", primary: "#2563eb", accent: "#8b5cf6" },
  { name: "Emerald", primary: "#059669", accent: "#0891b2" },
  { name: "Sunset", primary: "#dc2626", accent: "#d97706" },
  { name: "Royal Purple", primary: "#7c3aed", accent: "#db2777" },
  { name: "Slate", primary: "#475569", accent: "#0284c7" },
  { name: "Forest", primary: "#16a34a", accent: "#ca8a04" },
];

async function fetchBranding(): Promise<BrandingSettings> {
  const res = await fetch("/api/consultant/branding");
  if (!res.ok) throw new Error("Failed to fetch branding");
  return res.json();
}

async function saveBranding(data: Partial<BrandingSettings>): Promise<BrandingSettings> {
  const res = await fetch("/api/consultant/branding", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save branding");
  return res.json();
}

export default function BrandingPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/consultant/branding"],
    queryFn: fetchBranding,
  });

  const [form, setForm] = useState<Partial<BrandingSettings>>({
    agencyName: "",
    logoUrl: "",
    primaryColor: "#2563eb",
    accentColor: "#8b5cf6",
    subdomain: "",
    tagline: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        agencyName: data.agencyName ?? "",
        logoUrl: data.logoUrl ?? "",
        primaryColor: data.primaryColor ?? "#2563eb",
        accentColor: data.accentColor ?? "#8b5cf6",
        subdomain: data.subdomain ?? "",
        tagline: data.tagline ?? "",
      });
    }
  }, [JSON.stringify(data)]);

  const saveMut = useMutation({
    mutationFn: saveBranding,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/consultant/branding"] }); toast({ title: "Branding saved!", description: "Your brand settings have been updated." }); },
    onError: () => toast({ title: "Error", description: "Failed to save branding settings", variant: "destructive" }),
  });

  const applyPalette = (palette: typeof PRESET_PALETTES[0]) => {
    setForm(f => ({ ...f, primaryColor: palette.primary, accentColor: palette.accent }));
  };

  const previewUrl = form.subdomain ? `https://${form.subdomain}.eleevate.io` : null;

  return (
    <AppLayout>
      <div data-testid="branding-page">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground">Branding & White-label</h1>
            <p className="text-muted-foreground mt-1">Customise your agency's branded portal appearance.</p>
          </div>
          <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending} data-testid="btn-save-branding">
            <Save className="mr-2 h-4 w-4" />{saveMut.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border border-border p-6">
                <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />Agency Identity</h2>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-1.5">Agency name</Label>
                    <Input value={form.agencyName} onChange={e => setForm(f => ({ ...f, agencyName: e.target.value }))} placeholder="Global Study Advisors" data-testid="input-agency-name" />
                  </div>
                  <div>
                    <Label className="mb-1.5">Tagline</Label>
                    <Input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="Your gateway to global education" data-testid="input-tagline" />
                  </div>
                  <div>
                    <Label className="mb-1.5">Logo URL</Label>
                    <Input value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://yoursite.com/logo.png" data-testid="input-logo-url" />
                    {form.logoUrl && (
                      <div className="mt-2 p-3 border border-border rounded-lg bg-muted/30">
                        <img src={form.logoUrl} alt="Logo preview" className="h-12 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="border border-border p-6">
                <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2"><Palette className="h-4 w-4 text-primary" />Brand Colours</h2>

                <div className="mb-4">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Quick presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_PALETTES.map(palette => (
                      <button key={palette.name} onClick={() => applyPalette(palette)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:border-primary/50 transition-all text-sm"
                      >
                        <div className="flex gap-0.5">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: palette.primary }} />
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: palette.accent }} />
                        </div>
                        {palette.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5">Primary colour</Label>
                    <div className="flex gap-2">
                      <input type="color" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} className="h-10 w-12 rounded border border-input cursor-pointer" data-testid="input-primary-color" />
                      <Input value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} className="font-mono text-sm flex-1" />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1.5">Accent colour</Label>
                    <div className="flex gap-2">
                      <input type="color" value={form.accentColor} onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))} className="h-10 w-12 rounded border border-input cursor-pointer" data-testid="input-accent-color" />
                      <Input value={form.accentColor} onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))} className="font-mono text-sm flex-1" />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border border-border p-6">
                <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2"><Globe2 className="h-4 w-4 text-primary" />Custom Domain</h2>
                <div>
                  <Label className="mb-1.5">Subdomain</Label>
                  <div className="flex items-center gap-0">
                    <Input value={form.subdomain} onChange={e => setForm(f => ({ ...f, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} placeholder="myagency" className="rounded-r-none border-r-0" data-testid="input-subdomain" />
                    <span className="px-3 py-2 border border-l-0 border-input bg-muted text-sm text-muted-foreground rounded-r-md">.eleevate.io</span>
                  </div>
                  {previewUrl && <p className="text-xs text-muted-foreground mt-1.5">Your portal: <span className="text-primary font-medium">{previewUrl}</span></p>}
                  <p className="text-xs text-muted-foreground mt-1">Use lowercase letters, numbers, and hyphens only (3-30 characters).</p>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="border border-border p-4 overflow-hidden">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Eye className="h-4 w-4 text-primary" />Live Preview</h3>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="p-3 flex items-center gap-2" style={{ backgroundColor: form.primaryColor ?? "#2563eb" }}>
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      {form.logoUrl ? <img src={form.logoUrl} alt="Logo" className="h-5 w-5 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <Building2 className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <span className="text-white text-sm font-semibold truncate">{form.agencyName || "Your Agency"}</span>
                  </div>
                  <div className="p-3 bg-background">
                    <div className="h-2 rounded mb-2" style={{ backgroundColor: form.accentColor ?? "#8b5cf6", opacity: 0.3, width: "60%" }} />
                    <div className="h-1.5 rounded mb-1.5 bg-muted w-full" />
                    <div className="h-1.5 rounded mb-3 bg-muted w-4/5" />
                    <div className="h-6 rounded-lg" style={{ backgroundColor: form.primaryColor ?? "#2563eb", opacity: 0.9, width: "40%" }} />
                    {form.tagline && <p className="text-xs text-muted-foreground mt-2 italic truncate">{form.tagline}</p>}
                  </div>
                </div>
              </Card>

              <Card className="border border-border p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" />White-label features</h3>
                <ul className="space-y-2">
                  {[
                    "Custom agency subdomain",
                    "Branded portal colours",
                    "Custom logo in nav bar",
                    "Agency tagline display",
                    "Remove EleevateOverseas branding",
                    "Custom email templates",
                  ].map((feature, i) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      {i < 4 ? <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" /> : <div className="h-4 w-4 rounded-full border border-border flex-shrink-0" />}
                      <span className={i < 4 ? "text-foreground" : "text-muted-foreground"}>{feature}</span>
                      {i >= 4 && <Badge className="text-xs bg-muted text-muted-foreground ml-auto">Pro</Badge>}
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="border border-border p-4 bg-primary/5">
                <p className="text-sm text-foreground font-medium mb-1">Need a fully custom domain?</p>
                <p className="text-xs text-muted-foreground">Contact our team to set up <span className="font-medium">yoursite.com</span> pointing to your branded portal.</p>
                <Button variant="outline" size="sm" className="mt-3 w-full">Contact sales</Button>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
