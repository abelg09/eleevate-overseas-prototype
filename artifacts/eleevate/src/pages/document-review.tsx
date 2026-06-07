import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, CheckCircle2, XCircle, Clock, AlertCircle,
  MessageSquare, Eye, ChevronDown, ChevronUp
} from "lucide-react";
import { isDemoMode } from "@/lib/demo-mode";

type DocStatus = "pending" | "under_review" | "approved" | "rejected";
type DocType = "sop" | "lor" | "transcript" | "passport" | "financial_proof" | "resume" | "english_test" | "other";

interface Document {
  id: string;
  userId: string;
  applicationId?: string;
  type: DocType;
  name: string;
  url: string;
  status: DocStatus;
  notes?: string;
  createdAt: string;
}

const DOC_TYPE_LABELS: Record<DocType, string> = {
  sop: "Statement of Purpose", lor: "Letter of Recommendation", transcript: "Academic Transcript",
  passport: "Passport", financial_proof: "Financial Proof", resume: "Resume / CV",
  english_test: "English Test Score", other: "Other",
};

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; icon: typeof Clock; actions: DocStatus[] }> = {
  pending: { label: "Pending", color: "bg-gray-700 text-white", icon: Clock, actions: ["under_review", "approved", "rejected"] },
  under_review: { label: "Under Review", color: "bg-yellow-600 text-white", icon: AlertCircle, actions: ["approved", "rejected"] },
  approved: { label: "Approved", color: "bg-green-700 text-white", icon: CheckCircle2, actions: ["under_review"] },
  rejected: { label: "Rejected", color: "bg-red-700 text-white", icon: XCircle, actions: ["under_review", "approved"] },
};

const ACTION_LABELS: Partial<Record<DocStatus, { label: string; color: string }>> = {
  under_review: { label: "Start review", color: "text-yellow-700" },
  approved: { label: "Approve", color: "text-green-700" },
  rejected: { label: "Reject", color: "text-red-700" },
};

const DEMO_REVIEW_DOCS: Document[] = [];

async function fetchDocuments(): Promise<Document[]> {
  const res = await fetch("/api/consultant/doc-review");
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

async function updateDocument(id: string, data: { status: DocStatus; notes?: string }): Promise<Document> {
  const res = await fetch(`/api/consultant/doc-review/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update document");
  return res.json();
}

function DocumentReviewCard({ doc, demoMode, onUpdate }: { doc: Document; demoMode?: boolean; onUpdate?: (id: string, data: { status: DocStatus; notes?: string }) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(doc.notes ?? "");
  const { toast } = useToast();
  const qc = useQueryClient();
  const config = STATUS_CONFIG[doc.status];
  const Icon = config.icon;

  const updateMut = useMutation({
    mutationFn: (data: { status: DocStatus; notes?: string }) => updateDocument(doc.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/consultant/doc-review"] }); toast({ title: "Document updated" }); },
    onError: () => toast({ title: "Error", description: "Failed to update document", variant: "destructive" }),
  });
  const updateDocStatus = (data: { status: DocStatus; notes?: string }) => {
    if (demoMode) {
      onUpdate?.(doc.id, data);
      toast({ title: "Document updated" });
      return;
    }

    updateMut.mutate(data);
  };

  return (
    <Card className="border border-border overflow-hidden" data-testid={`doc-review-${doc.id}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-muted rounded-lg flex-shrink-0"><FileText className="h-5 w-5 text-primary" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">{doc.name}</p>
                <p className="text-sm text-muted-foreground">{DOC_TYPE_LABELS[doc.type]}</p>
              </div>
              <Badge className={`text-xs flex-shrink-0 ${config.color}`}><Icon className="h-3 w-3 mr-1" />{config.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{new Date(doc.createdAt).toLocaleDateString()}</p>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground ml-2">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {doc.url && (
            <a href={doc.url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="text-xs"><Eye className="h-3.5 w-3.5 mr-1" />View doc</Button>
            </a>
          )}
          {config.actions.map(action => {
            const actionConfig = ACTION_LABELS[action];
            if (!actionConfig) return null;
            return (
              <Button key={action} size="sm" variant="outline" className={`text-xs ${actionConfig.color}`}
                onClick={() => updateDocStatus({ status: action, notes })}
                disabled={updateMut.isPending}
                data-testid={`btn-${action}-${doc.id}`}
              >
                {action === "approved" && <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                {action === "rejected" && <XCircle className="h-3.5 w-3.5 mr-1" />}
                {action === "under_review" && <AlertCircle className="h-3.5 w-3.5 mr-1" />}
                {actionConfig.label}
              </Button>
            );
          })}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border p-4 bg-muted/20 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Review notes / comments</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Add review notes, feedback, or reasons for rejection..."
              className="text-sm"
              data-testid={`notes-${doc.id}`}
            />
            <Button size="sm" className="mt-2" onClick={() => updateDocStatus({ status: doc.status, notes })} disabled={updateMut.isPending}>
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />{updateMut.isPending ? "Saving..." : "Save notes"}
            </Button>
          </div>
          {doc.notes && (
            <div className="bg-background border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Previous notes:</p>
              <p className="text-sm text-foreground">{doc.notes}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function DocumentReviewPage() {
  const demoMode = isDemoMode();
  const [statusFilter, setStatusFilter] = useState<DocStatus | "all">("all");
  const [demoDocs, setDemoDocs] = useState<Document[]>(DEMO_REVIEW_DOCS);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/consultant/doc-review"],
    enabled: !demoMode,
    queryFn: fetchDocuments,
  });

  const docs = demoMode ? demoDocs : Array.isArray(data) ? data : [];
  const handleDemoUpdate = (id: string, payload: { status: DocStatus; notes?: string }) => {
    setDemoDocs((items) => items.map((doc) => doc.id === id ? { ...doc, ...payload } : doc));
  };
  const filtered = statusFilter === "all" ? docs : docs.filter(d => d.status === statusFilter);

  const counts = {
    all: docs.length,
    pending: docs.filter(d => d.status === "pending").length,
    under_review: docs.filter(d => d.status === "under_review").length,
    approved: docs.filter(d => d.status === "approved").length,
    rejected: docs.filter(d => d.status === "rejected").length,
  };

  return (
    <AppLayout>
      <div data-testid="document-review-page">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-serif text-foreground">Document Review</h1>
          <p className="text-muted-foreground mt-1">Review and approve student application documents.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { key: "pending" as const, label: "Pending", color: "text-gray-600" },
            { key: "under_review" as const, label: "Under Review", color: "text-yellow-600" },
            { key: "approved" as const, label: "Approved", color: "text-green-600" },
            { key: "rejected" as const, label: "Rejected", color: "text-red-600" },
          ].map(stat => (
            <Card key={stat.key} className="p-4 border border-border cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setStatusFilter(stat.key)}>
              <div className={`text-2xl font-bold ${stat.color}`}>{isLoading ? "—" : counts[stat.key]}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {(["all", "pending", "under_review", "approved", "rejected"] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${statusFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
            >
              {f === "all" ? `All (${counts.all})` : `${STATUS_CONFIG[f].label} (${counts[f]})`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
              {filtered.map(doc => <DocumentReviewCard key={doc.id} doc={doc} demoMode={demoMode} onUpdate={handleDemoUpdate} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No documents {statusFilter !== "all" ? `with status "${STATUS_CONFIG[statusFilter as DocStatus]?.label}"` : ""}</h3>
            <p className="text-muted-foreground">Student documents will appear here when uploaded.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
