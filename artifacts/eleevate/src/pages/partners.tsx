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
import { Building2, PlusCircle, Globe2, Mail, Percent, CheckCircle2, Clock, XCircle } from "lucide-react";

type PartnerType = "bank" | "nbfc" | "university" | "employer" | "csp" | "other";
type PartnerStatus = "active" | "inactive" | "pending";

interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  contactName?: string;
  contactEmail?: string;
  website?: string;
  commissionRate?: number;
  status: PartnerStatus;
  notes?: string;
  logoUrl?: string;
  country?: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<PartnerType, { label: string; color: string; emoji: string }> = {
  bank: { label: "Bank", color: "bg-blue-100 text-blue-700", emoji: "🏦" },
  nbfc: { label: "NBFC", color: "bg-indigo-100 text-indigo-700", emoji: "💳" },
  university: { label: "University", color: "bg-purple-100 text-purple-700", emoji: "🎓" },
  employer: { label: "Employer", color: "bg-orange-100 text-orange-700", emoji: "💼" },
  csp: { label: "CSP", color: "bg-teal-100 text-teal-700", emoji: "🤝" },
  other: { label: "Other", color: "bg-gray-100 text-gray-700", emoji: "🏢" },
};

const STATUS_CONFIG: Record<PartnerStatus, { label: string; color: string; icon: typeof Clock }> = {
  active: { label: "Active", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  inactive: { label: "Inactive", color: "bg-gray-100 text-gray-500", icon: XCircle },
};

async function fetchPartners(): Promise<{ data: Partner[]; total: number }> {
  const res = await fetch("/api/partners");
  if (!res.ok) throw new Error("Failed to fetch partners");
  return res.json();
}

async function createPartner(data: Partial<Partner>): Promise<Partner> {
  const res = await fetch("/api/partners", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create partner");
  return res.json();
}

async function updatePartner(id: string, data: Partial<Partner>): Promise<Partner> {
  const res = await fetch(`/api/partners/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update partner");
  return res.json();
}

function AddPartnerDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "other" as PartnerType, contactName: "", contactEmail: "",
    website: "", commissionRate: "", country: "", notes: "",
  });
  const { toast } = useToast();
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: (data: Partial<Partner>) => createPartner(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/partners"] });
      setOpen(false);
      setForm({ name: "", type: "other", contactName: "", contactEmail: "", website: "", commissionRate: "", country: "", notes: "" });
      toast({ title: "Partner added!" });
    },
    onError: () => toast({ title: "Error", description: "Failed to add partner", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="btn-add-partner"><PlusCircle className="mr-2 h-4 w-4" /> Add partner</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add partner organisation</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Organisation name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="HDFC Bank" data-testid="input-partner-name" />
            </div>
            <div>
              <Label className="mb-1.5">Type</Label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as PartnerType }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="mb-1.5">Contact name</Label>
              <Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Rahul Verma" />
            </div>
            <div>
              <Label className="mb-1.5">Contact email</Label>
              <Input value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="rahul@hdfc.com" type="email" />
            </div>
            <div>
              <Label className="mb-1.5">Website</Label>
              <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://hdfcbank.com" />
            </div>
            <div>
              <Label className="mb-1.5">Commission rate (%)</Label>
              <Input value={form.commissionRate} onChange={e => setForm(f => ({ ...f, commissionRate: e.target.value }))} placeholder="2.5" type="number" step="0.1" min="0" max="100" />
            </div>
            <div>
              <Label className="mb-1.5">Country</Label>
              <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="India" />
            </div>
          </div>
          <div>
            <Label className="mb-1.5">Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Partnership details, terms..." />
          </div>
          <Button className="w-full" onClick={() => mut.mutate({ ...form, commissionRate: form.commissionRate ? parseFloat(form.commissionRate) : undefined } as Partial<Partner>)} disabled={!form.name || mut.isPending} data-testid="btn-submit-partner">
            {mut.isPending ? "Adding..." : "Add partner"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PartnersPage() {
  const [typeFilter, setTypeFilter] = useState<PartnerType | "all">("all");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/partners"],
    queryFn: fetchPartners,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PartnerStatus }) => updatePartner(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/partners"] }); toast({ title: "Status updated" }); },
  });

  const partners = data?.data ?? [];
  const filtered = typeFilter === "all" ? partners : partners.filter(p => p.type === typeFilter);

  return (
    <AppLayout>
      <div data-testid="partners-page">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground">Partner Management</h1>
            <p className="text-muted-foreground mt-1">Manage banks, universities, employers, and other partner organisations.</p>
          </div>
          <AddPartnerDialog />
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {(Object.entries(TYPE_CONFIG) as [PartnerType, typeof TYPE_CONFIG[PartnerType]][]).map(([k, v]) => {
            const count = partners.filter(p => p.type === k).length;
            return (
              <Card key={k} className={`p-3 border cursor-pointer transition-all text-center ${typeFilter === k ? "border-primary shadow-sm" : "border-border hover:shadow-sm"}`} onClick={() => setTypeFilter(typeFilter === k ? "all" : k)}>
                <div className="text-xl mb-1">{v.emoji}</div>
                <div className="text-lg font-bold text-foreground">{count}</div>
                <div className="text-xs text-muted-foreground">{v.label}</div>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          <button onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${typeFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
          >All ({partners.length})</button>
          {(Object.entries(TYPE_CONFIG) as [PartnerType, typeof TYPE_CONFIG[PartnerType]][]).map(([k, v]) => {
            const count = partners.filter(p => p.type === k).length;
            return (
              <button key={k} onClick={() => setTypeFilter(k)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${typeFilter === k ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
              >{v.label} ({count})</button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(partner => {
              const typeConfig = TYPE_CONFIG[partner.type];
              const statusConfig = STATUS_CONFIG[partner.status];
              const StatusIcon = statusConfig.icon;
              return (
                <Card key={partner.id} className="border border-border p-4" data-testid={`partner-${partner.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl flex-shrink-0">{typeConfig.emoji}</div>
                      <div>
                        <p className="font-semibold text-foreground">{partner.name}</p>
                        <Badge className={`text-xs ${typeConfig.color}`}>{typeConfig.label}</Badge>
                      </div>
                    </div>
                    <Badge className={`text-xs ${statusConfig.color}`}><StatusIcon className="h-3 w-3 mr-1" />{statusConfig.label}</Badge>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    {partner.contactEmail && (
                      <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{partner.contactEmail}</div>
                    )}
                    {partner.website && (
                      <div className="flex items-center gap-2 text-muted-foreground"><Globe2 className="h-3.5 w-3.5" />
                        <a href={partner.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">{partner.website}</a>
                      </div>
                    )}
                    {partner.commissionRate !== undefined && partner.commissionRate !== null && (
                      <div className="flex items-center gap-2 text-muted-foreground"><Percent className="h-3.5 w-3.5" />{partner.commissionRate}% commission</div>
                    )}
                    {partner.country && (
                      <div className="flex items-center gap-2 text-muted-foreground"><Globe2 className="h-3.5 w-3.5" />{partner.country}</div>
                    )}
                  </div>

                  {partner.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{partner.notes}</p>}

                  <div className="flex gap-2 mt-3">
                    {partner.status !== "active" && (
                      <Button size="sm" variant="outline" className="text-xs text-green-700" onClick={() => updateMut.mutate({ id: partner.id, status: "active" })}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Activate
                      </Button>
                    )}
                    {partner.status === "active" && (
                      <Button size="sm" variant="outline" className="text-xs text-red-700" onClick={() => updateMut.mutate({ id: partner.id, status: "inactive" })}>
                        <XCircle className="h-3.5 w-3.5 mr-1" />Deactivate
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No partners yet</h3>
            <p className="text-muted-foreground mb-6">Add partner organisations to track commissions and relationships.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
