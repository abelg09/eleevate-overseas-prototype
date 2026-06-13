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
  Users, PlusCircle, Phone, Mail, Globe2, Calendar, MessageSquare,
  MoreHorizontal, Trash2, ChevronRight, Clock, X, UserCheck
} from "lucide-react";
import { isDemoMode } from "@/lib/demo-mode";

type LeadStatus = "new" | "contacted" | "qualified" | "active_client" | "enrolled" | "lost";
type LeadSource = "website" | "referral" | "social_media" | "event" | "agency" | "other";

interface Lead {
  id: string;
  studentName: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSource;
  targetCountry?: string;
  targetDegree?: string;
  notes?: string;
  followUpAt?: string;
  createdAt: string;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

const COLUMNS: { key: LeadStatus; label: string; color: string; bg: string }[] = [
  { key: "new", label: "New", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  { key: "contacted", label: "Contacted", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  { key: "qualified", label: "Qualified", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  { key: "active_client", label: "Active Client", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  { key: "enrolled", label: "Enrolled", color: "text-teal-700", bg: "bg-teal-50 border-teal-200" },
  { key: "lost", label: "Lost", color: "text-red-700", bg: "bg-red-50 border-red-200" },
];

const SOURCE_LABELS: Record<LeadSource, string> = {
  website: "Website", referral: "Referral", social_media: "Social Media",
  event: "Event", agency: "Agency", other: "Other",
};

const SOURCE_COLORS: Record<LeadSource, string> = {
  website: "bg-blue-100 text-blue-700", referral: "bg-green-100 text-green-700",
  social_media: "bg-pink-100 text-pink-700", event: "bg-purple-100 text-purple-700",
  agency: "bg-orange-100 text-orange-700", other: "bg-gray-100 text-gray-700",
};

const DEMO_LEADS: Lead[] = [];

async function fetchLeads(): Promise<{ data: Lead[]; total: number }> {
  const res = await fetch("/api/consultant/leads");
  if (!res.ok) throw new Error("Failed to fetch leads");
  return res.json();
}

async function createLead(data: Partial<Lead>): Promise<Lead> {
  const res = await fetch("/api/consultant/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create lead");
  return res.json();
}

async function updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
  const res = await fetch(`/api/consultant/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update lead");
  return res.json();
}

async function deleteLead(id: string): Promise<void> {
  const res = await fetch(`/api/consultant/leads/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete lead");
}

async function fetchLeadDetail(id: string): Promise<Lead & { activities: Activity[] }> {
  const res = await fetch(`/api/consultant/leads/${id}`);
  if (!res.ok) throw new Error("Failed to fetch lead detail");
  return res.json();
}

async function addActivity(leadId: string, data: { type: string; message: string }): Promise<Activity> {
  const res = await fetch(`/api/consultant/leads/${leadId}/activity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add activity");
  return res.json();
}

function AddLeadDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ studentName: "", email: "", phone: "", source: "website" as LeadSource, targetCountry: "", targetDegree: "", notes: "" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/consultant/leads"] });
      setOpen(false);
      setForm({ studentName: "", email: "", phone: "", source: "website", targetCountry: "", targetDegree: "", notes: "" });
      toast({ title: "Lead added", description: "New lead added to your pipeline." });
      onCreated();
    },
    onError: () => toast({ title: "Error", description: "Failed to add lead", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="btn-add-lead"><PlusCircle className="mr-2 h-4 w-4" /> Add lead</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add new lead</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Name *</Label>
              <Input value={form.studentName} onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))} placeholder="John Doe" data-testid="input-lead-name" />
            </div>
            <div>
              <Label className="mb-1.5">Email *</Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@email.com" data-testid="input-lead-email" />
            </div>
            <div>
              <Label className="mb-1.5">Phone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </div>
            <div>
              <Label className="mb-1.5">Source</Label>
              <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as LeadSource }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <Label className="mb-1.5">Target country</Label>
              <Input value={form.targetCountry} onChange={e => setForm(f => ({ ...f, targetCountry: e.target.value }))} placeholder="UK, Canada..." />
            </div>
            <div>
              <Label className="mb-1.5">Target degree</Label>
              <Input value={form.targetDegree} onChange={e => setForm(f => ({ ...f, targetDegree: e.target.value }))} placeholder="e.g. Business Analytics / Management" />
            </div>
          </div>
          <div>
            <Label className="mb-1.5">Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Initial notes about this lead..." />
          </div>
          <Button className="w-full" onClick={() => mut.mutate(form)} disabled={!form.studentName || !form.email || mut.isPending} data-testid="btn-submit-lead">
            {mut.isPending ? "Adding..." : "Add lead"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LeadDetailDrawer({ lead, onClose, onUpdate, demoMode }: { lead: Lead; onClose: () => void; onUpdate: () => void; demoMode?: boolean }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [noteText, setNoteText] = useState("");

  const { data: detail, isLoading } = useQuery({
    queryKey: ["/api/consultant/leads", lead.id],
    enabled: !demoMode,
    queryFn: () => fetchLeadDetail(lead.id),
  });
  const leadDetail = demoMode
    ? {
      ...lead,
      activities: [
        { id: `${lead.id}-activity-1`, type: "note", message: "ELEE readiness reviewed and next best action assigned.", createdAt: "2026-05-21T09:00:00.000Z" },
        { id: `${lead.id}-activity-2`, type: "call", message: "Counselling call scheduled with family for finance clarity.", createdAt: "2026-05-20T16:00:00.000Z" },
      ],
    }
    : detail;

  const moveMut = useMutation({
    mutationFn: (status: LeadStatus) => updateLead(lead.id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/consultant/leads"] }); qc.invalidateQueries({ queryKey: ["/api/consultant/leads", lead.id] }); onUpdate(); },
  });

  const addNoteMut = useMutation({
    mutationFn: () => addActivity(lead.id, { type: "note", message: noteText }),
    onSuccess: () => { setNoteText(""); qc.invalidateQueries({ queryKey: ["/api/consultant/leads", lead.id] }); },
    onError: () => toast({ title: "Error", description: "Failed to add note", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteLead(lead.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/consultant/leads"] }); onClose(); toast({ title: "Lead deleted" }); },
  });

  const currentCol = COLUMNS.find(c => c.key === lead.status);

  return (
    <div className="fixed inset-0 z-50 flex" data-testid="lead-detail-drawer">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-background border-l border-border flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-semibold text-lg text-foreground">{lead.studentName}</h2>
            <Badge className={`text-xs mt-1 ${currentCol?.bg} ${currentCol?.color} border`}>{currentCol?.label}</Badge>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" />{lead.email}</div>
            {lead.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{lead.phone}</div>}
            {lead.targetCountry && <div className="flex items-center gap-2 text-muted-foreground"><Globe2 className="h-4 w-4" />{lead.targetCountry}</div>}
            {lead.targetDegree && <div className="flex items-center gap-2 text-muted-foreground"><UserCheck className="h-4 w-4" />{lead.targetDegree}</div>}
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" />Added {new Date(lead.createdAt).toLocaleDateString()}</div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Move to stage</Label>
            <div className="flex flex-wrap gap-1.5">
              {COLUMNS.map(col => (
                <button key={col.key}
                  onClick={() => demoMode ? toast({ title: `Moved to ${col.label}` }) : moveMut.mutate(col.key)}
                  disabled={col.key === lead.status || moveMut.isPending}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${col.key === lead.status ? `${col.bg} ${col.color} border-current opacity-100` : "border-border hover:border-primary/50"}`}
                >{col.label}</button>
              ))}
            </div>
          </div>

          {lead.notes && (
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Notes</Label>
              <p className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{lead.notes}</p>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Add note</Label>
            <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2} placeholder="Add a note or update..." className="text-sm" />
            <Button size="sm" className="mt-2" onClick={() => {
              if (demoMode) {
                setNoteText("");
                toast({ title: "Note added" });
              } else {
                addNoteMut.mutate();
              }
            }} disabled={!noteText.trim() || addNoteMut.isPending}>
              {addNoteMut.isPending ? "Adding..." : "Add note"}
            </Button>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Activity log</Label>
            {!demoMode && isLoading ? <Skeleton className="h-20 w-full" /> : (
              <div className="space-y-2">
                {(leadDetail?.activities ?? []).map(a => (
                  <div key={a.id} className="flex gap-2.5 p-2.5 bg-muted/30 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-foreground">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {(detail?.activities ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-border">
          <Button variant="destructive" size="sm" onClick={() => demoMode ? onClose() : deleteMut.mutate()} disabled={deleteMut.isPending} className="w-full">
            <Trash2 className="mr-2 h-4 w-4" />{deleteMut.isPending ? "Deleting..." : "Delete lead"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CrmPage() {
  const qc = useQueryClient();
  const demoMode = isDemoMode();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/consultant/leads"],
    enabled: !demoMode,
    queryFn: fetchLeads,
  });

  const leads = demoMode ? DEMO_LEADS : data?.data ?? [];
  const byStatus = (status: LeadStatus) => leads.filter(l => l.status === status);

  return (
    <AppLayout>
      <div data-testid="crm-page">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground">Lead Pipeline</h1>
            <p className="text-muted-foreground mt-1">Manage your student leads from enquiry to enrolment.</p>
          </div>
          <AddLeadDialog onCreated={() => qc.invalidateQueries({ queryKey: ["/api/consultant/leads"] })} />
        </div>

        {!demoMode && isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map(col => (
              <div key={col.key} className="flex-shrink-0 w-64">
                <Skeleton className="h-8 w-full mb-3" />
                {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full mb-2" />)}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-6">
            {COLUMNS.map(col => {
              const colLeads = byStatus(col.key);
              return (
                <div key={col.key} className="flex-shrink-0 w-64" data-testid={`kanban-col-${col.key}`}>
                  <div className={`flex items-center justify-between px-3 py-2 rounded-lg border mb-3 ${col.bg}`}>
                    <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
                    <Badge className={`text-xs ${col.bg} ${col.color} border-0`}>{colLeads.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {colLeads.map(lead => (
                      <Card key={lead.id} className="p-3 border border-border cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => setSelectedLead(lead)} data-testid={`lead-card-${lead.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-semibold text-foreground truncate pr-1">{lead.studentName}</p>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        </div>
                        {lead.targetCountry && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
                            <Globe2 className="h-3 w-3" />{lead.targetCountry}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <Badge className={`text-xs ${SOURCE_COLORS[lead.source]}`}>{SOURCE_LABELS[lead.source]}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </Card>
                    ))}
                    {colLeads.length === 0 && (
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground">No leads</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {leads.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No leads yet</h3>
            <p className="text-muted-foreground mb-6">Add your first lead to start building your pipeline.</p>
          </div>
        )}
      </div>

      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          demoMode={demoMode}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => { qc.invalidateQueries({ queryKey: ["/api/consultant/leads"] }); setSelectedLead(null); }}
        />
      )}
    </AppLayout>
  );
}
