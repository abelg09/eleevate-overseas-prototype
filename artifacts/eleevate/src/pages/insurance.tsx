import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, CheckCircle2, Star, Plane, Heart, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { isDemoMode } from "@/lib/demo-mode";

type InsuranceProduct = {
  id: string; provider: string; name: string; type: string;
  annualPremium: number; currency: string; coverage: string;
  features: string[]; popular?: boolean;
};

type InsurancePolicy = {
  id: string; productName: string; provider: string; type: string; premium: number;
  currency: string; status: string; startDate: string | null; endDate: string | null; createdAt: string;
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  travel: Plane, health: Heart, study_abroad: BookOpen, property: Shield,
};

const TYPE_COLORS: Record<string, string> = {
  travel: "bg-sky-100 text-sky-700",
  health: "bg-rose-100 text-rose-700",
  study_abroad: "bg-purple-100 text-purple-700",
  property: "bg-amber-100 text-amber-700",
};

const STATUS_COLORS: Record<string, string> = {
  quoted: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  expired: "bg-slate-100 text-slate-700",
  canceled: "bg-red-100 text-red-700",
};

const DEMO_INSURANCE_PRODUCTS: InsuranceProduct[] = [
  {
    id: "demo-insurance-study",
    provider: "Global Student Cover",
    name: "Study Abroad Protect",
    type: "study_abroad",
    annualPremium: 18900,
    currency: "USD",
    coverage: "$100k coverage",
    features: ["Tuition interruption protection", "Emergency medical assistance", "Lost passport support", "Visa refusal add-on"],
    popular: true,
  },
  {
    id: "demo-insurance-health",
    provider: "CarePlus International",
    name: "Student Health Plus",
    type: "health",
    annualPremium: 24900,
    currency: "USD",
    coverage: "$250k coverage",
    features: ["Hospitalization", "Mental health coverage", "Telemedicine", "Prescription benefit"],
  },
  {
    id: "demo-insurance-travel",
    provider: "Atlas Travel",
    name: "Departure Travel Shield",
    type: "travel",
    annualPremium: 7900,
    currency: "USD",
    coverage: "$50k coverage",
    features: ["Flight delay", "Baggage loss", "Emergency evacuation", "Airport assistance"],
  },
];

const DEMO_POLICIES: InsurancePolicy[] = [
  {
    id: "demo-policy-1",
    productName: "Departure Travel Shield",
    provider: "Atlas Travel",
    type: "travel",
    premium: 7900,
    currency: "USD",
    status: "active",
    startDate: "2026-07-15",
    endDate: "2027-07-14",
    createdAt: "2026-05-18T10:00:00.000Z",
  },
];

export default function InsurancePage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const demoMode = isDemoMode();
  const [selectedProduct, setSelectedProduct] = useState<InsuranceProduct | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [demoPolicies, setDemoPolicies] = useState<InsurancePolicy[]>(DEMO_POLICIES);

  const { data: products } = useQuery({
    queryKey: ["insurance-products"],
    enabled: !demoMode,
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/insurance/products`);
      const d = await res.json();
      return d.data as InsuranceProduct[];
    },
  });

  const { data: policies } = useQuery({
    queryKey: ["my-insurance-policies"],
    enabled: !demoMode,
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/insurance/policies/me`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      return d.data as InsurancePolicy[];
    },
  });

  const purchase = useMutation({
    mutationFn: async (productId: string) => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/insurance/policies`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-insurance-policies"] });
      setSelectedProduct(null); setConfirming(false);
      toast.success("Policy activated! Your policy documents will be emailed within 24 hours.");
    },
    onError: () => toast.error("Purchase failed. Please try again."),
  });

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}/yr`;
  const productList = demoMode ? DEMO_INSURANCE_PRODUCTS : products ?? [];
  const policyList = demoMode ? demoPolicies : policies ?? [];
  const types = ["all", ...new Set(productList.map(p => p.type))];
  const filtered = typeFilter === "all" ? productList : productList.filter(p => p.type === typeFilter);

  const handlePurchase = (product: InsuranceProduct) => {
    if (demoMode) {
      setDemoPolicies((items) => [
        {
          id: `demo-policy-${Date.now()}`,
          productName: product.name,
          provider: product.provider,
          type: product.type,
          premium: product.annualPremium,
          currency: product.currency,
          status: "quoted",
          startDate: null,
          endDate: null,
          createdAt: new Date().toISOString(),
        },
        ...items,
      ]);
      setSelectedProduct(null);
      setConfirming(false);
      toast.success("Policy quote created. Demo policy added to your insurance tab.");
      return;
    }

    purchase.mutate(product.id);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="h-8 w-8 text-primary" />Insurance Marketplace</h1>
        <p className="text-muted-foreground mt-1">Compare travel, health, and study abroad insurance products</p>
      </div>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse Plans</TabsTrigger>
          <TabsTrigger value="policies">My Policies {policyList.length > 0 && `(${policyList.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {types.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all capitalize ${typeFilter === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                {t === "all" ? "All Types" : t.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(product => {
              const Icon = TYPE_ICONS[product.type] ?? Shield;
              return (
                <Card key={product.id} className={`relative flex flex-col hover:shadow-md transition-shadow ${product.popular ? "border-primary/40" : ""}`}>
                  {product.popular && (
                    <div className="absolute -top-2.5 left-4">
                      <Badge className="bg-primary text-primary-foreground text-xs px-2">Recommended</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3 pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${TYPE_COLORS[product.type] ?? "bg-slate-100 text-slate-700"}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold">{product.name}</CardTitle>
                          <CardDescription className="text-xs">{product.provider}</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">{fmt(product.annualPremium)}</div>
                        <div className="text-xs text-muted-foreground">{product.coverage}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-3">
                    <ul className="space-y-1.5">
                      {product.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />{f}
                        </li>
                      ))}
                    </ul>
                    <Button size="sm" className="w-full mt-auto" onClick={() => { setSelectedProduct(product); setConfirming(false); }}>
                      Get This Plan
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-6">
            <CardContent className="py-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                {[
                  { icon: Shield, title: "Trusted Providers", desc: "All products from A-rated global insurers" },
                  { icon: CheckCircle2, title: "Instant Activation", desc: "Policies active within minutes of purchase" },
                  { icon: Star, title: "Claims Support", desc: "24/7 dedicated claims assistance team" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                    <div><div className="font-semibold">{title}</div><div className="text-xs text-muted-foreground">{desc}</div></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="mt-4">
          {policyList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No active policies. Browse plans to get started.</div>
          ) : (
            <div className="space-y-3">
              {policyList.map(policy => {
                const Icon = TYPE_ICONS[policy.type] ?? Shield;
                return (
                  <Card key={policy.id}>
                    <CardContent className="py-4 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${TYPE_COLORS[policy.type] ?? "bg-slate-100"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{policy.productName}</div>
                          <div className="text-xs text-muted-foreground">{policy.provider} · {fmt(policy.premium)} · {policy.endDate ? `Expires ${new Date(policy.endDate).toLocaleDateString()}` : "—"}</div>
                        </div>
                      </div>
                      <Badge className={`${STATUS_COLORS[policy.status] ?? ""} border-0 text-xs capitalize`}>{policy.status}</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedProduct} onOpenChange={open => { if (!open) { setSelectedProduct(null); setConfirming(false); } }}>
        <DialogContent className="max-w-md">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProduct.name} — {selectedProduct.provider}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Annual premium</span><span className="font-bold text-primary text-lg">{fmt(selectedProduct.annualPremium)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Coverage</span><span>{selectedProduct.coverage}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Policy term</span><span>12 months (renewable)</span></div>
                </div>
                <ul className="space-y-1.5">
                  {selectedProduct.features.map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />{f}</li>
                  ))}
                </ul>
                {confirming ? (
                  <div className="space-y-3">
                    <p className="text-sm text-center text-muted-foreground">Confirm purchase of <strong>{selectedProduct.name}</strong> for <strong>{fmt(selectedProduct.annualPremium)}</strong>?</p>
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => handlePurchase(selectedProduct)} disabled={purchase.isPending}>{purchase.isPending ? "Processing…" : "Confirm Purchase"}</Button>
                      <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)}>Back</Button>
                    </div>
                  </div>
                ) : (
                  <Button className="w-full gap-2" onClick={() => setConfirming(true)}>
                    <Shield className="h-4 w-4" />Get This Plan — {fmt(selectedProduct.annualPremium)}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
