import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShoppingCart, Clock, Star, CheckCircle, Package, FileText, Globe, BookOpen, UserCheck, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { isDemoMode, listFromApi } from "@/lib/demo-mode";
import { addDemoLedgerEvent, useDemoJourneyState } from "@/lib/demo-journey";

type ServiceItem = {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: string;
  description: string;
  deliveryDays: number;
  popular?: boolean;
};

type ServiceOrderItem = {
  id: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  document: FileText,
  visa: Globe,
  test: BookOpen,
  application: UserCheck,
  coaching: Star,
  financial: DollarSign,
  accommodation: Package,
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  in_delivery: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  refunded: "bg-red-100 text-red-700",
  canceled: "bg-slate-100 text-slate-700",
};

const DEMO_SERVICES: ServiceItem[] = [
  {
    id: "demo-service-sop",
    name: "SOP Strategy + Rewrite",
    price: 14900,
    currency: "USD",
    category: "document",
    description: "Consultant-led SOP structure, motivation arc, redline review, and final polish for one target university.",
    deliveryDays: 4,
    popular: true,
  },
  {
    id: "demo-service-doc-audit",
    name: "Document Readiness Audit",
    price: 7900,
    currency: "USD",
    category: "document",
    description: "Full checklist review across transcripts, passport, finance proof, LORs, test scores, and application uploads.",
    deliveryDays: 2,
  },
  {
    id: "demo-service-visa",
    name: "Visa Strategy Session",
    price: 19900,
    currency: "USD",
    category: "visa",
    description: "Country-specific visa file review, finance explanation, interview preparation, and risk action plan.",
    deliveryDays: 3,
    popular: true,
  },
  {
    id: "demo-service-loan",
    name: "Edu Loan Pre-Approval Desk",
    price: 4900,
    currency: "USD",
    category: "financial",
    description: "Eligibility check, lender comparison, collateral/no-collateral guidance, and document pack preparation.",
    deliveryDays: 5,
  },
  {
    id: "demo-service-accommodation",
    name: "Canada Accommodation Launch Desk",
    price: 6900,
    currency: "USD",
    category: "accommodation",
    description: "Shortlist Toronto and Vancouver housing options, arrival timeline, rent proof, and parent visibility.",
    deliveryDays: 5,
    popular: true,
  },
  {
    id: "demo-service-test",
    name: "IELTS Writing Review",
    price: 3900,
    currency: "USD",
    category: "test",
    description: "Two writing task reviews with band estimate, corrections, and improvement drills.",
    deliveryDays: 2,
  },
  {
    id: "demo-service-interview",
    name: "Admission Interview Coaching",
    price: 8900,
    currency: "USD",
    category: "coaching",
    description: "Mock interview, feedback scorecard, and country/university-specific question bank.",
    deliveryDays: 3,
  },
];

const DEMO_ORDERS: ServiceOrderItem[] = [
  {
    id: "demo-order-1",
    serviceId: "demo-service-doc-audit",
    serviceName: "Document Readiness Audit",
    amount: 7900,
    currency: "USD",
    status: "in_delivery",
    createdAt: "2026-05-20T10:00:00.000Z",
  },
  {
    id: "demo-order-2",
    serviceId: "demo-service-test",
    serviceName: "IELTS Writing Review",
    amount: 3900,
    currency: "USD",
    status: "completed",
    createdAt: "2026-05-12T10:00:00.000Z",
  },
];

export default function MarketplacePage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const demoMode = isDemoMode();
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [category, setCategory] = useState("all");
  const [demoOrders, setDemoOrders] = useState<ServiceOrderItem[]>(DEMO_ORDERS);
  const demoJourney = useDemoJourneyState();
  const lockedCountry = demoJourney.countryLock;

  const { data: services } = useQuery({
    queryKey: ["services"],
    enabled: !demoMode,
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/services`);
      const d = await res.json();
      return listFromApi<ServiceItem>(d);
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["my-service-orders"],
    enabled: !demoMode,
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/services/orders/me`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      return listFromApi<ServiceOrderItem>(d);
    },
  });

  const purchase = useMutation({
    mutationFn: async (serviceId: string) => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/services/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ serviceId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-service-orders"] });
      setSelectedService(null);
      setConfirming(false);
      toast.success("Order placed successfully! Our team will contact you within 24 hours.");
    },
    onError: () => toast.error("Failed to place order. Please try again."),
  });

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const serviceList = demoMode ? DEMO_SERVICES : listFromApi<ServiceItem>(services);
  const orderList = demoMode ? demoOrders : listFromApi<ServiceOrderItem>(orders);
  const categories = ["all", ...new Set(serviceList.map(s => s.category))];
  const visibleServices = category === "all" ? serviceList : serviceList.filter((service) => service.category === category);

  const handlePurchase = (service: ServiceItem) => {
    if (demoMode) {
      setDemoOrders((items) => [
        {
          id: `demo-order-${Date.now()}`,
          serviceId: service.id,
          serviceName: service.name,
          amount: service.price,
          currency: service.currency,
          status: "paid",
          createdAt: new Date().toISOString(),
        },
        ...items,
      ]);
      setSelectedService(null);
      setConfirming(false);
      addDemoLedgerEvent({
        id: `ledger-service-${service.id}`,
        source: service.category === "accommodation" ? "Accommodation" : "Services",
        event: `${service.name} ordered`,
        studentView: `${service.name} added to Jehan's ${lockedCountry?.countryName ?? "study-abroad"} service queue.`,
        consultantView: "Service order routed to consultant workbench with delivery owner and revenue line.",
        revenue: service.category === "accommodation" ? "Accommodation Partner Fee" : "Service Order Revenue",
        status: "Queued",
      });
      toast.success("Order placed successfully. Demo order added to your services queue.");
      return;
    }

    purchase.mutate(service.id);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><ShoppingCart className="h-8 w-8 text-primary" />Service Marketplace</h1>
        <p className="text-muted-foreground mt-1">
          Expert services to boost your study abroad application{lockedCountry ? `, scoped to the ${lockedCountry.countryName} route` : ""}.
        </p>
      </div>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse Services</TabsTrigger>
          <TabsTrigger value="orders">My Orders {orderList.length > 0 && `(${orderList.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <Badge
                key={cat}
                variant={category === cat ? "default" : "outline"}
                className="cursor-pointer capitalize px-3 py-1"
                onClick={() => setCategory(cat)}
              >
                {cat === "all" ? "All Services" : cat}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleServices.map(service => {
              const Icon = CATEGORY_ICONS[service.category] ?? Package;
              return (
                <Card key={service.id} className={`hover:shadow-md transition-shadow cursor-pointer ${service.popular ? "border-primary/40" : ""}`} onClick={() => setSelectedService(service)}>
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{service.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{service.deliveryDays}-day delivery</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-lg text-primary">{fmt(service.price)}</div>
                        {service.popular && <Badge className="text-xs bg-orange-100 text-orange-700 border-0">Popular</Badge>}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{service.description}</p>
                    <Button size="sm" variant="outline" className="w-full" onClick={e => { e.stopPropagation(); setSelectedService(service); }}>
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          {orderList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">You haven't placed any orders yet.</div>
          ) : (
            <div className="space-y-3">
              {orderList.map(order => (
                <Card key={order.id}>
                  <CardContent className="py-4 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-medium text-sm">{order.serviceName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {fmt(order.amount)} · Ordered {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge className={`${STATUS_COLORS[order.status] ?? ""} border-0 text-xs capitalize`}>{order.status.replace("_", " ")}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedService} onOpenChange={open => { if (!open) { setSelectedService(null); setConfirming(false); } }}>
        <DialogContent className="max-w-lg">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedService.name}</DialogTitle>
                <DialogDescription>{selectedService.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{fmt(selectedService.price)}</div>
                    <div className="text-xs text-muted-foreground">one-time</div>
                  </div>
                  <div className="border-l pl-4 text-sm space-y-1">
                    <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-muted-foreground" />{selectedService.deliveryDays}-day delivery</div>
                    <div className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-green-600" />Money-back guarantee</div>
                    <div className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-yellow-500" />Expert consultant assigned</div>
                  </div>
                </div>
                {confirming ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">Confirm purchase of <strong>{selectedService.name}</strong> for <strong>{fmt(selectedService.price)}</strong>?</p>
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => handlePurchase(selectedService)} disabled={purchase.isPending}>
                        {purchase.isPending ? "Processing…" : "Confirm Purchase"}
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)}>Back</Button>
                    </div>
                  </div>
                ) : (
                  <Button className="w-full gap-2" onClick={() => setConfirming(true)}>
                    <ShoppingCart className="h-4 w-4" />Buy Now — {fmt(selectedService.price)}
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
