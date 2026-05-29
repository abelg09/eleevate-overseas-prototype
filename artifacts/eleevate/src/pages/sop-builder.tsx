import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText, PlusCircle, Wand2, Save, Trash2, ChevronRight,
  Clock, CheckCircle2, Eye, Download, BookOpen
} from "lucide-react";
import { isDemoMode } from "@/lib/demo-mode";

type SopType = "sop" | "lor" | "resume";
type SopStatus = "draft" | "review" | "final";

interface SopDocument {
  id: string;
  type: SopType;
  title: string;
  content: string;
  targetUniversity?: string;
  targetProgram?: string;
  version: number;
  status: SopStatus;
  createdAt: string;
  updatedAt: string;
}

const TYPE_CONFIG: Record<SopType, { label: string; color: string; icon: typeof FileText; description: string }> = {
  sop: { label: "Statement of Purpose", color: "bg-blue-100 text-blue-700", icon: FileText, description: "Articulate your goals and motivation" },
  lor: { label: "Letter of Recommendation", color: "bg-purple-100 text-purple-700", icon: BookOpen, description: "Recommendation letter template" },
  resume: { label: "Resume / CV", color: "bg-green-100 text-green-700", icon: CheckCircle2, description: "Academic and professional CV" },
};

const STATUS_CONFIG: Record<SopStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-yellow-100 text-yellow-700" },
  review: { label: "In Review", color: "bg-blue-100 text-blue-700" },
  final: { label: "Final", color: "bg-green-100 text-green-700" },
};

const DEMO_SOP_DOCS: SopDocument[] = [
  {
    id: "demo-sop-1",
    type: "sop",
    title: "SOP - University of Toronto MSc Computer Science",
    targetUniversity: "University of Toronto",
    targetProgram: "MSc Computer Science",
    content: "My academic and professional journey has consistently moved toward building responsible, useful AI systems. Through undergraduate work in computer science, applied projects in data analytics, and product-focused internships, I have learned that strong technical work becomes meaningful only when it is tied to real user problems.\n\nThe MSc Computer Science pathway at the University of Toronto is a strong fit because of its research depth, international environment, and proximity to Canada's technology ecosystem. I am especially interested in machine learning systems, human-computer interaction, and applied data products.\n\nAfter graduation, my goal is to work as a machine learning engineer or data product lead, then build products that improve access to education and career mobility.",
    version: 2,
    status: "review",
    createdAt: "2026-05-18T10:00:00.000Z",
    updatedAt: "2026-05-21T09:00:00.000Z",
  },
  {
    id: "demo-resume-1",
    type: "resume",
    title: "Graduate Resume - Data/Product Track",
    targetUniversity: "University of Leeds",
    targetProgram: "MSc International Business",
    content: "Aarav Mehta\nData Analyst and Product Intern\n\nEducation\nBSc Computer Science, GPA 3.72\n\nExperience\nProduct Analytics Intern - built dashboards, improved onboarding funnel insights, and documented weekly product metrics.\n\nProjects\nAI course recommender, finance readiness calculator, and student document tracker.\n\nSkills\nPython, SQL, Power BI, React, stakeholder communication.",
    version: 1,
    status: "final",
    createdAt: "2026-05-17T10:00:00.000Z",
    updatedAt: "2026-05-20T12:00:00.000Z",
  },
];

async function fetchDocs(): Promise<{ data: SopDocument[]; total: number }> {
  const res = await fetch("/api/consultant/sop");
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

async function createDoc(data: Partial<SopDocument>): Promise<SopDocument> {
  const res = await fetch("/api/consultant/sop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create document");
  return res.json();
}

async function updateDoc(id: string, data: Partial<SopDocument>): Promise<SopDocument> {
  const res = await fetch(`/api/consultant/sop/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update document");
  return res.json();
}

async function generateContent(id: string, data: Record<string, string>): Promise<SopDocument> {
  const res = await fetch(`/api/consultant/sop/${id}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to generate content");
  return res.json();
}

async function deleteDoc(id: string): Promise<void> {
  const res = await fetch(`/api/consultant/sop/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete document");
}

function NewDocDialog({ onCreated, demoMode }: { onCreated: (doc: SopDocument) => void; demoMode?: boolean }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "sop" as SopType, title: "", targetUniversity: "", targetProgram: "" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: createDoc,
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ["/api/consultant/sop"] });
      setOpen(false);
      setForm({ type: "sop", title: "", targetUniversity: "", targetProgram: "" });
      onCreated(doc);
    },
    onError: () => toast({ title: "Error", description: "Failed to create document", variant: "destructive" }),
  });

  const defaultTitle = form.type === "sop" ? "Statement of Purpose" : form.type === "lor" ? "Letter of Recommendation" : "Resume / CV";
  const handleCreate = () => {
    if (demoMode) {
      const doc: SopDocument = {
        id: `demo-sop-${Date.now()}`,
        type: form.type,
        title: form.title || defaultTitle,
        targetUniversity: form.targetUniversity || undefined,
        targetProgram: form.targetProgram || undefined,
        content: "",
        version: 1,
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setOpen(false);
      setForm({ type: "sop", title: "", targetUniversity: "", targetProgram: "" });
      onCreated(doc);
      return;
    }

    mut.mutate({ ...form, title: form.title || defaultTitle });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="btn-new-doc"><PlusCircle className="mr-2 h-4 w-4" /> New document</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Create new document</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="mb-2 block">Document type</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(TYPE_CONFIG) as [SopType, typeof TYPE_CONFIG[SopType]][]).map(([k, v]) => {
                const Icon = v.icon;
                return (
                  <button key={k} onClick={() => setForm(f => ({ ...f, type: k }))}
                    className={`p-3 rounded-lg border text-center transition-all ${form.type === k ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                  >
                    <Icon className={`h-5 w-5 mx-auto mb-1 ${form.type === k ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium">{k.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label className="mb-1.5">Title</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={defaultTitle} data-testid="input-doc-title" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Target university</Label>
              <Input value={form.targetUniversity} onChange={e => setForm(f => ({ ...f, targetUniversity: e.target.value }))} placeholder="Oxford" />
            </div>
            <div>
              <Label className="mb-1.5">Target program</Label>
              <Input value={form.targetProgram} onChange={e => setForm(f => ({ ...f, targetProgram: e.target.value }))} placeholder="MSc AI" />
            </div>
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={mut.isPending} data-testid="btn-create-doc">
            {mut.isPending ? "Creating..." : "Create document"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentEditor({ doc, onBack, demoMode, onSaveDoc }: { doc: SopDocument; onBack: () => void; demoMode?: boolean; onSaveDoc?: (doc: SopDocument) => void }) {
  const [content, setContent] = useState(doc.content);
  const [status, setStatus] = useState<SopStatus>(doc.status);
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({ academicBackground: "", workExperience: "", whyThisProgram: "", careerGoals: "" });
  const [showGenForm, setShowGenForm] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const saveMut = useMutation({
    mutationFn: () => updateDoc(doc.id, { content, status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/consultant/sop"] }); toast({ title: "Saved!" }); },
    onError: () => toast({ title: "Error", description: "Failed to save", variant: "destructive" }),
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      if (demoMode) {
        const draft = `${doc.type === "resume" ? "Professional Summary" : "Opening Direction"}\n\n${genForm.academicBackground || "BSc Computer Science with strong academic performance and applied project experience."}\n\n${genForm.workExperience || "Practical experience across analytics, product thinking, and stakeholder communication."}\n\n${doc.type === "sop" ? `${genForm.whyThisProgram || `I am drawn to ${doc.targetProgram || "this program"} because it combines academic depth with practical outcomes.`}\n\n${genForm.careerGoals || "My goal is to build an international career in technology and contribute to products that improve student mobility."}` : "This draft can now be refined for tone, evidence, and target university alignment."}`;
        setContent(draft);
        setShowGenForm(false);
        toast({ title: "AI draft generated!", description: "Demo draft created for review." });
        return;
      }

      const result = await generateContent(doc.id, { ...genForm, programName: doc.targetProgram ?? "", university: doc.targetUniversity ?? "", type: doc.type });
      setContent(result.content);
      qc.invalidateQueries({ queryKey: ["/api/consultant/sop"] });
      setShowGenForm(false);
      toast({ title: "AI draft generated!", description: "Review and edit the generated content." });
    } catch {
      toast({ title: "Generation failed", description: "Could not generate AI draft.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (demoMode) {
      onSaveDoc?.({ ...doc, content, status, version: doc.version + 1, updatedAt: new Date().toISOString() });
      toast({ title: "Saved!" });
      return;
    }

    saveMut.mutate();
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/ /g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const config = TYPE_CONFIG[doc.type];
  const Icon = config.icon;

  return (
    <div data-testid="document-editor">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">{doc.title}</span>
          <Badge className={`text-xs ${STATUS_CONFIG[status].color}`}>{STATUS_CONFIG[status].label}</Badge>
        </div>
        <div className="ml-auto flex gap-2">
          <select value={status} onChange={e => setStatus(e.target.value as SopStatus)} className="text-sm border border-input rounded-md px-2 py-1 bg-background">
            <option value="draft">Draft</option>
            <option value="review">In Review</option>
            <option value="final">Final</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm" onClick={handleSave} disabled={saveMut.isPending}><Save className="h-4 w-4 mr-1.5" />{saveMut.isPending ? "Saving..." : "Save"}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border border-border">
            <div className="border-b border-border p-3 flex items-center justify-between bg-muted/30">
              <span className="text-sm font-medium text-foreground">Editor</span>
              <button onClick={() => setShowGenForm(!showGenForm)}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Wand2 className="h-3.5 w-3.5" /> AI Generate
              </button>
            </div>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="min-h-[500px] border-0 rounded-none rounded-b-lg font-mono text-sm resize-none focus-visible:ring-0"
              placeholder={`Start writing your ${config.label}...\n\nOr use AI Generate to create a draft based on your information.`}
              data-testid="editor-textarea"
            />
          </Card>
        </div>

        <div className="space-y-4">
          {showGenForm && (
            <Card className="border border-border p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" />AI Generate</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs mb-1 block">Academic background</Label>
                  <Textarea value={genForm.academicBackground} onChange={e => setGenForm(f => ({ ...f, academicBackground: e.target.value }))} rows={2} placeholder="BSc Computer Science, 3.8 GPA..." className="text-xs" data-testid="input-gen-background" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Work experience</Label>
                  <Textarea value={genForm.workExperience} onChange={e => setGenForm(f => ({ ...f, workExperience: e.target.value }))} rows={2} placeholder="2 years as software engineer at..." className="text-xs" />
                </div>
                {doc.type === "sop" && (
                  <>
                    <div>
                      <Label className="text-xs mb-1 block">Why this program?</Label>
                      <Textarea value={genForm.whyThisProgram} onChange={e => setGenForm(f => ({ ...f, whyThisProgram: e.target.value }))} rows={2} placeholder="I want to specialise in AI because..." className="text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Career goals</Label>
                      <Textarea value={genForm.careerGoals} onChange={e => setGenForm(f => ({ ...f, careerGoals: e.target.value }))} rows={2} placeholder="My goal is to..." className="text-xs" />
                    </div>
                  </>
                )}
                <Button size="sm" className="w-full" onClick={handleGenerate} disabled={generating} data-testid="btn-generate-content">
                  <Wand2 className="h-3.5 w-3.5 mr-1.5" />{generating ? "Generating..." : "Generate draft"}
                </Button>
              </div>
            </Card>
          )}

          <Card className="border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Document info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><Badge className={`text-xs ${config.color}`}>{config.label}</Badge></div>
              {doc.targetUniversity && <div className="flex justify-between"><span className="text-muted-foreground">University</span><span className="font-medium">{doc.targetUniversity}</span></div>}
              {doc.targetProgram && <div className="flex justify-between"><span className="text-muted-foreground">Program</span><span className="font-medium">{doc.targetProgram}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span className="font-medium">v{doc.version}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Words</span><span className="font-medium">{content.trim().split(/\s+/).filter(Boolean).length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Last saved</span><span className="font-medium">{new Date(doc.updatedAt).toLocaleDateString()}</span></div>
            </div>
          </Card>

          <Card className="border border-border p-4 bg-blue-50">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Writing tips</h3>
            <ul className="text-xs text-blue-700 space-y-1.5">
              <li>• Open with a compelling hook or story</li>
              <li>• Be specific — name the program and why it</li>
              <li>• Show evidence, not just claims</li>
              <li>• Aim for 700-900 words for SOP</li>
              <li>• Tailor each draft to the university</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SopBuilderPage() {
  const [selectedDoc, setSelectedDoc] = useState<SopDocument | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  const demoMode = isDemoMode();
  const [demoDocs, setDemoDocs] = useState<SopDocument[]>(DEMO_SOP_DOCS);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/consultant/sop"],
    enabled: !demoMode,
    queryFn: fetchDocs,
  });

  const deleteMut = useMutation({
    mutationFn: deleteDoc,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/consultant/sop"] }); toast({ title: "Document deleted" }); },
  });

  const docs = demoMode ? demoDocs : data?.data ?? [];
  const handleDemoDocSave = (nextDoc: SopDocument) => {
    setDemoDocs((items) => items.map((doc) => doc.id === nextDoc.id ? nextDoc : doc));
    setSelectedDoc(nextDoc);
  };
  const handleDocCreated = (doc: SopDocument) => {
    if (demoMode) setDemoDocs((items) => [doc, ...items]);
    setSelectedDoc(doc);
  };
  const handleDelete = (id: string) => {
    if (demoMode) {
      setDemoDocs((items) => items.filter((doc) => doc.id !== id));
      toast({ title: "Document deleted" });
      return;
    }

    deleteMut.mutate(id);
  };

  if (selectedDoc) {
    return (
      <AppLayout>
        <DocumentEditor
          doc={selectedDoc}
          demoMode={demoMode}
          onSaveDoc={handleDemoDocSave}
          onBack={() => { setSelectedDoc(null); if (!demoMode) qc.invalidateQueries({ queryKey: ["/api/consultant/sop"] }); }}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div data-testid="sop-builder-page">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground">SOP / LOR / Resume Builder</h1>
            <p className="text-muted-foreground mt-1">AI-assisted document builder for student applications.</p>
          </div>
          <NewDocDialog onCreated={handleDocCreated} demoMode={demoMode} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {(Object.entries(TYPE_CONFIG) as [SopType, typeof TYPE_CONFIG[SopType]][]).map(([k, v]) => {
            const Icon = v.icon;
            const count = docs.filter(d => d.type === k).length;
            return (
              <Card key={k} className="p-4 border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${v.color}`}><Icon className="h-4 w-4" /></div>
                  <span className="font-semibold text-foreground">{v.label}</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{count}</div>
                <div className="text-sm text-muted-foreground">document{count !== 1 ? "s" : ""}</div>
              </Card>
            );
          })}
        </div>

        {!demoMode && isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : docs.length > 0 ? (
          <div className="space-y-3">
            {docs.map(doc => {
              const config = TYPE_CONFIG[doc.type];
              const Icon = config.icon;
              return (
                <Card key={doc.id} className="border border-border hover:shadow-sm transition-shadow" data-testid={`doc-card-${doc.id}`}>
                  <div className="flex items-center gap-4 p-4">
                    <div className={`p-2 rounded-lg ${config.color}`}><Icon className="h-5 w-5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-foreground truncate">{doc.title}</p>
                        <Badge className={`text-xs ${STATUS_CONFIG[doc.status].color} flex-shrink-0`}>{STATUS_CONFIG[doc.status].label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {doc.targetUniversity && <span>{doc.targetUniversity}</span>}
                        {doc.targetProgram && <span>· {doc.targetProgram}</span>}
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(doc.updatedAt).toLocaleDateString()}</span>
                        <span>v{doc.version}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedDoc(doc)} data-testid={`btn-edit-${doc.id}`}><Eye className="h-4 w-4 mr-1.5" />Open</Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(doc.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No documents yet</h3>
            <p className="text-muted-foreground mb-6">Create your first SOP, LOR, or Resume using our AI-assisted builder.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
