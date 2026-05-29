import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Trash2, DollarSign, TrendingUp, Clock, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { isDemoMode } from "@/lib/demo-mode";

interface LineItem { description: string; quantity: number; unitPrice: number; }
type Invoice = { id: string; clientName: string; clientEmail: string | null; lineItems: LineItem[]; subtotal: number; taxAmount: number; total: number; currency: string; status: string; notes: string | null; dueDate: string | null; createdAt: string };
type Commission = { id: string; source: string; description: string | null; amount: number; currency: string; status: string; paidAt: string | null; createdAt: string };

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  canceled: "bg-slate-100 text-slate-500",
};

const COMMISSION_COLORS: Record<string, string> = {
  earned: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
};

const DEMO_INVOICES: Invoice[] = [
  {
    id: "demo-invoice-1",
    clientName: "Aarav Mehta",
    clientEmail: "aarav.mehta@example.com",
    lineItems: [{ description: "SOP and application review", quantity: 1, unitPrice: 14900 }],
    subtotal: 14900,
    taxAmount: 2682,
    total: 17582,
    currency: "USD",
    status: "sent",
    notes: "Due before final submission.",
    dueDate: "2026-06-05",
    createdAt: "2026-05-21T09:00:00.000Z",
  },
];

const DEMO_COMMISSIONS: Commission[] = [
  { id: "demo-commission-1", source: "university_partner", description: "University of Leeds enrolment commission", amount: 42000, currency: "USD", status: "earned", paidAt: null, createdAt: "2026-05-18T10:00:00.000Z" },
  { id: "demo-commission-2", source: "service_order", description: "Visa strategy session", amount: 9900, currency: "USD", status: "paid", paidAt: "2026-05-20", createdAt: "2026-05-12T10:00:00.000Z" },
];

export default function InvoicingPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const demoMode = isDemoMode();
  const [creating, setCreating] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [taxRate, setTaxRate] = useState("18");
  const [notes, setNotes] = useState("");
  const [demoInvoices, setDemoInvoices] = useState<Invoice[]>(DEMO_INVOICES);
  const [demoCommissions, setDemoCommissions] = useState<Commission[]>(DEMO_COMMISSIONS);

  const { data: invoices } = useQuery({
    queryKey: ["my-invoices"],
    enabled: !demoMode,
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/invoices/me`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      return d.data as Invoice[];
    },
  });

  const { data: commissions } = useQuery({
    queryKey: ["my-commissions"],
    enabled: !demoMode,
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/consultants/me/commissions`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      return d.data as Commission[];
    },
  });

  const requestPayout = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/consultants/me/commissions/payout-request`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (d) => toast.success(d.message),
  });

  const createInvoice = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      const taxAmount = Math.round(subtotal * parseFloat(taxRate) / 100);
      const res = await fetch(`${getBaseUrl()}/api/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clientName, clientEmail: clientEmail || undefined, lineItems, taxAmount, notes: notes || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-invoices"] });
      setCreating(false); setClientName(""); setClientEmail(""); setLineItems([{ description: "", quantity: 1, unitPrice: 0 }]); setNotes("");
      toast.success("Invoice created successfully!");
    },
    onError: () => toast.error("Failed to create invoice."),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-invoices"] }),
  });

  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = Math.round(subtotal * parseFloat(taxRate || "0") / 100);
  const total = subtotal + tax;
  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const invoiceList = demoMode ? demoInvoices : invoices ?? [];
  const commissionList = demoMode ? demoCommissions : commissions ?? [];
  const totalEarned = commissionList.filter(c => c.status === "paid").reduce((s, c) => s + c.amount, 0);
  const pending = commissionList.filter(c => c.status !== "paid").reduce((s, c) => s + c.amount, 0);

  const handleCreateInvoice = () => {
    if (demoMode) {
      const nextInvoice: Invoice = {
        id: `demo-invoice-${Date.now()}`,
        clientName,
        clientEmail: clientEmail || null,
        lineItems,
        subtotal,
        taxAmount: tax,
        total,
        currency: "USD",
        status: "draft",
        notes: notes || null,
        dueDate: null,
        createdAt: new Date().toISOString(),
      };
      setDemoInvoices((items) => [nextInvoice, ...items]);
      setCreating(false);
      setClientName("");
      setClientEmail("");
      setLineItems([{ description: "", quantity: 1, unitPrice: 0 }]);
      setNotes("");
      toast.success("Invoice created successfully.");
      return;
    }

    createInvoice.mutate();
  };

  const handleUpdateStatus = (id: string, status: string) => {
    if (demoMode) {
      setDemoInvoices((items) => items.map((invoice) => invoice.id === id ? { ...invoice, status } : invoice));
      return;
    }

    updateStatus.mutate({ id, status });
  };

  const handlePayout = () => {
    if (demoMode) {
      setDemoCommissions((items) => items.map((item) => item.status === "paid" ? item : { ...item, status: "paid", paidAt: new Date().toISOString() }));
      toast.success("Payout requested. Demo commissions marked as paid.");
      return;
    }

    requestPayout.mutate();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><FileText className="h-8 w-8 text-primary" />Invoicing & Commission</h1>
          <p className="text-muted-foreground mt-1">Generate invoices and track your earnings</p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2"><Plus className="h-4 w-4" />New Invoice</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Earned", value: fmt(totalEarned), icon: CheckCircle2, color: "text-green-600" },
          { label: "Pending Payout", value: fmt(pending), icon: Clock, color: "text-yellow-600" },
          { label: "Invoices Issued", value: String(invoiceList.length), icon: FileText, color: "text-blue-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 flex items-center gap-3">
              <Icon className={`h-6 w-6 ${color}`} />
              <div><div className="text-2xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="commissions">Commission Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          {invoiceList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No invoices yet. Click "New Invoice" to create one.</div>
          ) : (
            <div className="space-y-3">
              {invoiceList.map(inv => (
                <Card key={inv.id}>
                  <CardContent className="py-4 space-y-2">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-semibold text-sm">{inv.clientName}</div>
                        <div className="text-xs text-muted-foreground">{inv.clientEmail} · Issued {new Date(inv.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base">{fmt(inv.total)}</span>
                        <Badge className={`${STATUS_COLORS[inv.status] ?? ""} border-0 text-xs capitalize`}>{inv.status}</Badge>
                      </div>
                    </div>
                    {inv.status !== "paid" && inv.status !== "canceled" && (
                      <div className="flex gap-2 pt-1">
                        {inv.status === "draft" && (
                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(inv.id, "sent")} disabled={updateStatus.isPending}>Mark as Sent</Button>
                        )}
                        {inv.status === "sent" && (
                          <Button size="sm" onClick={() => handleUpdateStatus(inv.id, "paid")} disabled={updateStatus.isPending}>Mark as Paid</Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => handleUpdateStatus(inv.id, "canceled")} disabled={updateStatus.isPending}>Cancel</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="commissions" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{commissionList.filter(c => c.status !== "paid").length} items pending payout</p>
            <Button size="sm" onClick={handlePayout} disabled={requestPayout.isPending || pending === 0}>
              {requestPayout.isPending ? "Requesting…" : "Request Payout"}
            </Button>
          </div>
          <div className="space-y-2">
            {commissionList.map(c => (
              <Card key={c.id}>
                <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-medium text-sm">{c.description ?? c.source}</div>
                    <div className="text-xs text-muted-foreground capitalize">{c.source.replace("_", " ")} · {new Date(c.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{fmt(c.amount)}</span>
                    <Badge className={`${COMMISSION_COLORS[c.status] ?? ""} border-0 text-xs capitalize`}>{c.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Client Name *</label><Input placeholder="Full name or company" value={clientName} onChange={e => setClientName(e.target.value)} className="mt-1" /></div>
              <div><label className="text-sm font-medium">Client Email</label><Input type="email" placeholder="client@email.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="mt-1" /></div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Line Items</label>
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setLineItems(l => [...l, { description: "", quantity: 1, unitPrice: 0 }])}>
                  <Plus className="h-3 w-3" />Add Item
                </Button>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                  <span className="col-span-6">Description</span><span className="col-span-2 text-center">Qty</span><span className="col-span-3 text-center">Unit Price</span><span className="col-span-1" />
                </div>
                {lineItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-6 text-sm h-8" placeholder="Service description" value={item.description} onChange={e => setLineItems(l => l.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
                    <Input type="number" className="col-span-2 text-sm h-8 text-center" min={1} value={item.quantity} onChange={e => setLineItems(l => l.map((x, j) => j === i ? { ...x, quantity: parseInt(e.target.value) || 1 } : x))} />
                    <Input type="number" className="col-span-3 text-sm h-8" placeholder="0.00" value={item.unitPrice || ""} onChange={e => setLineItems(l => l.map((x, j) => j === i ? { ...x, unitPrice: parseFloat(e.target.value) || 0 } : x))} />
                    <button className="col-span-1 flex justify-center text-muted-foreground hover:text-red-500" onClick={() => setLineItems(l => l.filter((_, j) => j !== i))}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">GST/Tax Rate (%)</label><Input type="number" placeholder="18" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="mt-1" /></div>
              <div><label className="text-sm font-medium">Notes</label><Input placeholder="Payment terms, etc." value={notes} onChange={e => setNotes(e.target.value)} className="mt-1" /></div>
            </div>

            <div className="rounded-lg border p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${(subtotal / 100).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">GST ({taxRate}%)</span><span>${(tax / 100).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold border-t pt-1 mt-1"><span>Total</span><span>${(total / 100).toFixed(2)}</span></div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleCreateInvoice} disabled={!clientName || lineItems.every(i => !i.description) || createInvoice.isPending}>
                {createInvoice.isPending ? "Creating…" : "Create Invoice"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setCreating(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
