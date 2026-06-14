import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/common/page-shell";
import {
  useListDocuments, useCreateDocument, useDeleteDocument,
  getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import type { Document } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, FileText, Upload, Trash2, CheckCircle2, Clock, XCircle, Eye, FolderOpen, Loader2, History, ChevronDown, ChevronUp } from "lucide-react";
import { isDemoMode, listFromApi } from "@/lib/demo-mode";
import { readStudentDocuments, writeStudentDocuments } from "@/lib/student-documents";

const DOC_TYPES = [
  { value: "sop", label: "Statement of Purpose" },
  { value: "lor", label: "Letter of Recommendation" },
  { value: "transcript", label: "Academic Transcript" },
  { value: "passport", label: "Passport" },
  { value: "financial_proof", label: "Financial Proof" },
  { value: "resume", label: "Resume / CV" },
  { value: "english_test", label: "English Test Result" },
  { value: "other", label: "Other" },
];

const REQUIRED_PACKET = [
  { type: "passport", label: "Passport", owner: "Student" },
  { type: "transcript", label: "Academic transcript", owner: "Student" },
  { type: "sop", label: "SOP", owner: "Consultant" },
  { type: "lor", label: "LOR", owner: "Consultant" },
  { type: "financial_proof", label: "Financial proof", owner: "Student" },
  { type: "english_test", label: "English test", owner: "Student" },
];

const REQUIRED_DOCUMENT_SECTIONS = [
  {
    title: "Personal details",
    documents: ["Passport", "Photograph", "Aadhaar / national ID", "Birth certificate", "Address proof", "Medical report", "Travel history", "Name change affidavit"],
  },
  {
    title: "Education",
    documents: ["10th marksheet", "12th marksheet", "Bachelor marksheets", "Degree certificate", "Transcript", "Backlog certificate", "Medium of instruction", "Provisional certificate"],
  },
  {
    title: "Language proficiency certificate",
    documents: ["IELTS TRF", "TOEFL scorecard", "PTE scorecard", "Duolingo scorecard", "English waiver evidence"],
  },
  {
    title: "Aptitude test",
    documents: ["GRE scorecard", "GMAT scorecard", "SAT scorecard", "ACT scorecard", "MAT scorecard"],
  },
  {
    title: "Work experience",
    documents: ["Appointment letter", "Experience letter", "Job offer letter", "Salary slips", "Relieving letter", "Internship certificate"],
  },
  {
    title: "Application story",
    documents: ["Statement of Purpose", "Letters of Recommendation", "Resume / CV", "Portfolio", "Professional certificates", "Scholarship essays"],
  },
  {
    title: "Financial standing",
    documents: ["Bank statement", "Sponsor affidavit", "Income tax returns", "Loan sanction letter", "Fixed deposit proof", "Property valuation", "CA certificate", "Source of funds note"],
  },
  {
    title: "Tuition fee payment",
    documents: ["Application fee receipt", "Tuition deposit receipt", "SWIFT / TT copy", "University invoice", "Payment confirmation", "Refund policy acknowledgement"],
  },
  {
    title: "Visa evidence",
    documents: ["CAS / I-20 / CoE / LOA", "Visa application form", "IHS receipt", "VFS receipt", "Biometric appointment letter", "TB test report", "Insurance policy", "Visa decision letter"],
  },
];

const STATUS_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>, label: string, className: string }> = {
  pending: { icon: Clock, label: "Pending Review", className: "bg-yellow-100 text-yellow-700" },
  approved: { icon: CheckCircle2, label: "Approved", className: "bg-green-100 text-green-700" },
  rejected: { icon: XCircle, label: "Rejected", className: "bg-red-100 text-red-700" },
  under_review: { icon: Eye, label: "Under Review", className: "bg-blue-100 text-blue-700" },
};

const DEMO_DOCUMENTS: Document[] = [];

function groupDocsByType(documents: Document[]): Record<string, Document[]> {
  const result: Record<string, Document[]> = {};
  for (const doc of documents) {
    if (!result[doc.type]) result[doc.type] = [];
    result[doc.type].push(doc);
  }
  for (const type in result) {
    result[type].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return result;
}

function VersionHistory({ docs, onDelete }: { docs: Document[]; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  if (docs.length <= 1) return null;
  const older = docs.slice(1);
  return (
    <div className="mt-2 ml-14">
      <button
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <History className="h-3.5 w-3.5" />
        {older.length} older version{older.length !== 1 ? "s" : ""}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="mt-2 space-y-2 border-l-2 border-border pl-3">
          {older.map((doc, i) => (
            <div key={doc.id} className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center font-medium text-foreground flex-shrink-0">
                v{docs.length - 1 - i}
              </span>
              <span className="flex-1 truncate">{doc.name}</span>
              <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs"><Eye className="h-3 w-3" /></Button>
              </a>
              <Button
                size="sm" variant="ghost"
                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                onClick={() => onDelete(doc.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocumentVaultPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const demoMode = isDemoMode();
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("");
  const [docName, setDocName] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState<"flat" | "grouped">("grouped");
  const [demoDocuments, setDemoDocuments] = useState<Document[]>(() => readStudentDocuments());

  useEffect(() => {
    if (demoMode) writeStudentDocuments(demoDocuments);
  }, [demoDocuments, demoMode]);

  const { data: docs, isLoading } = useListDocuments({}, {
    query: { queryKey: getListDocumentsQueryKey({}), enabled: !demoMode }
  });
  const createDoc = useCreateDocument();
  const deleteDoc = useDeleteDocument();

  const documents = demoMode ? demoDocuments : listFromApi<Document>(docs);
  const grouped = groupDocsByType(documents);
  const filtered = filterType === "all" ? documents : documents.filter(d => d.type === filterType);
  const latestByType = Object.fromEntries(Object.entries(grouped).map(([type, typeDocs]) => [type, typeDocs[0]]));
  const packet = REQUIRED_PACKET.map((item) => ({
    ...item,
    document: latestByType[item.type],
  }));
  const approvedCount = documents.filter((doc) => doc.status === "approved").length;
  const reviewCount = documents.filter((doc) => ["pending", "under_review"].includes(doc.status)).length;
  const missingCount = packet.filter((item) => !item.document).length;
  const packetReadiness = Math.round(((packet.length - missingCount) / packet.length) * 100);
  const requirementUploaded = (name: string) => {
    const normalized = name.toLowerCase();
    return documents.some((doc) =>
      doc.name.toLowerCase().includes(normalized)
      || normalized.includes(doc.name.toLowerCase())
      || DOC_TYPES.find((type) => type.value === doc.type)?.label.toLowerCase().includes(normalized),
    );
  };

  const prepareRequirementUpload = (name: string) => {
    const normalized = name.toLowerCase();
    const mappedType = DOC_TYPES.find((type) => normalized.includes(type.label.toLowerCase().split(" ")[0]))?.value
      ?? (normalized.includes("passport") ? "passport" : undefined)
      ?? (normalized.includes("sop") || normalized.includes("statement") ? "sop" : undefined)
      ?? (normalized.includes("recommendation") || normalized.includes("lor") ? "lor" : undefined)
      ?? (normalized.includes("transcript") || normalized.includes("marksheet") || normalized.includes("degree") ? "transcript" : undefined)
      ?? (normalized.includes("bank") || normalized.includes("loan") || normalized.includes("fund") ? "financial_proof" : undefined)
      ?? (normalized.includes("ielts") || normalized.includes("toefl") || normalized.includes("pte") || normalized.includes("duolingo") ? "english_test" : undefined)
      ?? "other";
    setDocName(name);
    setDocType(mappedType);
    fileRef.current?.click();
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !docType || !docName.trim()) {
      toast({ title: "Please fill all fields and select a file", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      if (demoMode) {
        const fileUrl = URL.createObjectURL(file);
        const newDoc: Document = {
          id: `demo-doc-${Date.now()}`,
          userId: "demo-student",
          type: docType as Document["type"],
          name: docName.trim(),
          url: fileUrl,
          status: "pending",
          notes: "Uploaded for review. The consultant queue can pick this up when review is enabled.",
          createdAt: new Date().toISOString(),
        };
        setDemoDocuments((items) => [newDoc, ...items]);
        toast({ title: "Document uploaded", description: "Document added to your vault." });
        setDocName("");
        setDocType("");
        if (fileRef.current) fileRef.current.value = "";
        return;
      }

      const urlResp = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });

      if (!urlResp.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await urlResp.json();

      const putResp = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putResp.ok) throw new Error("Failed to upload file to storage");

      const fileUrl = `/api/storage/objects${objectPath.replace("/objects", "")}`;
      await createDoc.mutateAsync({
        data: {
          type: docType as Document["type"],
          name: docName.trim(),
          url: fileUrl,
        }
      });

      queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey({}) });
      toast({ title: "Document uploaded successfully!" });
      setDocName("");
      setDocType("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast({ title: "Upload failed", description: String(err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (demoMode) {
      setDemoDocuments((items) => items.filter((doc) => doc.id !== id));
      toast({ title: "Document deleted" });
      return;
    }

    await deleteDoc.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey({}) });
    toast({ title: "Document deleted" });
  };

  const renderDocCard = (doc: Document, isLatest = true) => {
    const statusCfg = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.pending;
    const StatusIcon = statusCfg.icon;
    const typeLabel = DOC_TYPES.find(t => t.value === doc.type)?.label ?? doc.type;
    return (
      <Card key={doc.id} className={`p-4 border transition-all ${isLatest ? "border-border hover:border-primary/20" : "border-border/50"}`} data-testid={`doc-${doc.id}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-medium text-sm text-foreground">{doc.name}</div>
              {isLatest && <Badge variant="secondary" className="text-xs">Latest</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{typeLabel}</Badge>
              <span className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${statusCfg.className}`}>
              <StatusIcon className="h-3 w-3" />{statusCfg.label}
            </span>
            <a href={doc.url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />View
              </Button>
            </a>
            <Button
              size="sm" variant="ghost"
              className="text-destructive hover:text-destructive text-xs"
              onClick={() => handleDelete(doc.id)}
              data-testid={`btn-delete-${doc.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {doc.notes && (
          <div className="mt-3 ml-14 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">{doc.notes}</div>
        )}
      </Card>
    );
  };

  return (
    <AppLayout>
      <div data-testid="document-vault-page">
        <PageHeader
          eyebrow="Documents & Visa"
          title="Document Vault"
          description="Build a complete application packet with version history, consultant review, and visa-ready evidence."
          actions={
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => fileRef.current?.click()}>
              Choose file
            </Button>
          }
        />

        <section className="mb-6 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <div className="brand-gradient-bg h-1" />
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="p-5">
              <div className="eyebrow mb-2">Application packet</div>
              <h2 className="font-serif text-xl font-bold leading-tight text-foreground">Your document readiness is {packetReadiness}% complete.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                The packet combines admissions documents and visa evidence so counsellors can review the full story before submission.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { label: "Documents", value: String(documents.length) },
                  { label: "Approved", value: String(approvedCount) },
                  { label: "In review", value: String(reviewCount) },
                  { label: "Missing", value: String(missingCount) },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</div>
                    <div className="mt-1 font-serif text-xl font-bold text-foreground">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <aside className="border-t border-border bg-muted/35 p-4 lg:border-l lg:border-t-0">
              <div className="eyebrow mb-3">Required packet</div>
              <div className="space-y-2">
                {packet.map((item) => {
                  const statusCfg = item.document ? STATUS_CONFIG[item.document.status] ?? STATUS_CONFIG.pending : null;
                  return (
                    <div key={item.type} className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-xs">
                      <div>
                        <div className="font-semibold text-foreground">{item.label}</div>
                        <div className="text-[10px] text-muted-foreground">{item.owner}</div>
                      </div>
                      <span className={item.document ? statusCfg!.className + " rounded-full px-2 py-1 font-semibold" : "rounded-full bg-red-100 px-2 py-1 font-semibold text-red-700"}>
                        {item.document ? statusCfg!.label.replace("Pending Review", "Pending") : "Missing"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </section>

        <Card className="mb-6 border border-border bg-white p-4 shadow-sm" data-testid="documents-next-step">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge variant="outline" className="mb-2 rounded-full">
                {packetReadiness >= 100 ? "Stage 6 complete" : packetReadiness > 0 ? "Stage 6 in progress" : "Stage 6"}
              </Badge>
              <h2 className="font-serif text-lg font-bold text-foreground">
                {packetReadiness >= 100
                  ? "Document packet ready. Continue to visa details."
                  : packetReadiness > 0
                    ? "Keep uploading the missing documents."
                    : "Start with passport, transcript, and finance proof."}
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                {packetReadiness >= 100
                  ? "ELEE can now use the complete packet for visa preparation, payment evidence, and consultant review."
                  : "The checklist below shows every admissions, finance, and visa document. Uploads update dashboard readiness and the next prompt automatically."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="rounded-full font-serif" onClick={() => fileRef.current?.click()}>
                Upload document
              </Button>
              <Link href={packetReadiness >= 100 ? "/visa-center" : "/financial-hub"}>
                <Button variant="outline" className="rounded-full font-serif">
                  {packetReadiness >= 100 ? "Open visa center" : "Plan finance"} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Upload Section */}
        <Card className="mb-8 overflow-hidden border border-border bg-white p-0 shadow-sm" data-testid="upload-section">
          <div className="border-b border-border p-5">
            <h2 className="font-serif text-lg font-bold text-foreground">Upload document</h2>
            <p className="mt-1 text-sm text-muted-foreground">New uploads stay versioned, so earlier files remain available for review.</p>
          </div>
          <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm mb-1.5 block">Document Name</Label>
              <Input
                placeholder="e.g. SOP - University of Oxford"
                value={docName}
                onChange={e => setDocName(e.target.value)}
                data-testid="input-doc-name"
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger data-testid="select-doc-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">File</Label>
              <Input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                data-testid="input-file"
                className="cursor-pointer"
              />
            </div>
          </div>
          <Button className="mt-4" onClick={handleUpload} disabled={uploading} data-testid="btn-upload">
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {uploading ? "Uploading..." : "Upload Document"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">Uploading a new file of the same type creates a new version. Previous versions are preserved.</p>
          </div>
        </Card>

        <section className="mb-8" data-testid="required-document-sections">
          <div className="mb-4">
            <div className="eyebrow mb-1">Student file checklist</div>
            <h2 className="font-serif text-2xl font-bold text-foreground">All required documents, grouped by stage</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These are the documents from the student profile, application, finance, and visa workflow. Uploads remain blank until the student adds files.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {REQUIRED_DOCUMENT_SECTIONS.map((section) => (
              <Card key={section.title} className="app-card overflow-hidden p-0">
                <div className="border-b border-border bg-muted/25 px-4 py-3">
                  <h3 className="font-serif text-base font-bold text-foreground">{section.title}</h3>
                </div>
                <div className="divide-y divide-border">
                  {section.documents.map((documentName) => {
                    const uploaded = requirementUploaded(documentName);
                    return (
                      <div key={documentName} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-foreground">{documentName}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{uploaded ? "Uploaded to vault" : "Required when applicable"}</div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <Badge className={uploaded ? "rounded-full bg-green-100 text-green-700 hover:bg-green-100" : "rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100"}>
                            {uploaded ? "Uploaded" : "Pending"}
                          </Badge>
                          <Button size="sm" variant="outline" className="rounded-full" onClick={() => prepareRequirementUpload(documentName)}>
                            Upload
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* View Controls */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={filterType === "all" ? "default" : "outline"} onClick={() => setFilterType("all")} className="text-xs">
                All ({documents.length})
              </Button>
              {DOC_TYPES.filter(t => documents.some(d => d.type === t.value)).map(t => (
                <Button key={t.value} size="sm" variant={filterType === t.value ? "default" : "outline"} onClick={() => setFilterType(t.value)} className="text-xs">
                  {t.label} ({documents.filter(d => d.type === t.value).length})
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={viewMode === "grouped" ? "default" : "outline"} onClick={() => setViewMode("grouped")} className="text-xs">
              <History className="h-3.5 w-3.5 mr-1" /> Versioned
            </Button>
            <Button size="sm" variant={viewMode === "flat" ? "default" : "outline"} onClick={() => setViewMode("flat")} className="text-xs">
              List
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl" data-testid="empty-docs">
            <FolderOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No documents yet</h3>
            <p className="text-sm text-muted-foreground">Upload your application documents above to get started.</p>
          </div>
        ) : viewMode === "grouped" ? (
          <div className="space-y-6" data-testid="documents-grouped">
            {Object.entries(grouped)
              .filter(([type]) => filterType === "all" || type === filterType)
              .map(([type, typeDocs]) => {
                const typeLabel = DOC_TYPES.find(t => t.value === type)?.label ?? type;
                const latest = typeDocs[0];
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-semibold text-foreground">{typeLabel}</h3>
                      <Badge variant="secondary" className="text-xs">{typeDocs.length} version{typeDocs.length !== 1 ? "s" : ""}</Badge>
                    </div>
                    {renderDocCard(latest, true)}
                    <VersionHistory docs={typeDocs} onDelete={handleDelete} />
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="space-y-3" data-testid="documents-list">
            {filtered.map(doc => renderDocCard(doc, false))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
