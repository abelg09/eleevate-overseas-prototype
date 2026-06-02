import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Zap, Building2, Users } from "lucide-react";
import { isDemoMode } from "@/lib/demo-mode";

type SubscriptionPlan = {
  id: string; name: string; price: number; currency: string; interval: string;
  description: string; features: string[]; popular?: boolean;
  limits: { shortlists: number; applications: number; aiRecommendations: number };
};

type CurrentSubscription = { plan: string; status: string; cancelAtPeriodEnd: boolean; currentPeriodEnd: string | null };

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Zap,
  student_pro: Crown,
  consultant_pro: Building2,
  agency: Users,
};

const PLAN_COLORS: Record<string, string> = {
  free: "text-slate-600",
  student_pro: "text-blue-600",
  consultant_pro: "text-purple-600",
  agency: "text-orange-600",
};

const DEMO_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "USD",
    interval: "month",
    description: "For early exploration and basic planning.",
    features: ["University discovery", "Basic shortlist", "ELEE preview", "Community access"],
    limits: { shortlists: 5, applications: 1, aiRecommendations: 2 },
  },
  {
    id: "student_pro",
    name: "Student Pro",
    price: 1900,
    currency: "USD",
    interval: "month",
    description: "For students actively shortlisting and applying.",
    features: ["Unlimited shortlist", "Application tracker", "Document vault", "AI recommendations", "Priority support"],
    limits: { shortlists: 999, applications: 8, aiRecommendations: 20 },
    popular: true,
  },
  {
    id: "consultant_pro",
    name: "Consultant Pro",
    price: 4900,
    currency: "USD",
    interval: "month",
    description: "For independent advisors managing student workflows.",
    features: ["Consultant CRM", "Document review", "SOP workflow", "Invoicing", "Student pipeline"],
    limits: { shortlists: 999, applications: 50, aiRecommendations: 100 },
  },
  {
    id: "agency",
    name: "Agency",
    price: 14900,
    currency: "USD",
    interval: "month",
    description: "For teams and education agencies.",
    features: ["Team roles", "Partner branding", "Advanced reporting", "Bulk student imports", "Dedicated support"],
    limits: { shortlists: 999, applications: 500, aiRecommendations: 500 },
  },
];

const DEMO_SUBSCRIPTION: CurrentSubscription = {
  plan: "student_pro",
  status: "active",
  cancelAtPeriodEnd: false,
  currentPeriodEnd: "2026-06-21",
};

export default function SubscriptionPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const demoMode = isDemoMode();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [demoSub, setDemoSub] = useState<CurrentSubscription>(DEMO_SUBSCRIPTION);

  const { data: plans } = useQuery({
    queryKey: ["subscription-plans"],
    enabled: !demoMode,
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/subscriptions/plans`);
      const d = await res.json();
      return d.data as SubscriptionPlan[];
    },
  });

  const { data: currentSub } = useQuery({
    queryKey: ["my-subscription"],
    enabled: !demoMode,
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/subscriptions/me`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json() as Promise<CurrentSubscription>;
    },
  });

  const subscribe = useMutation({
    mutationFn: async (planId: string) => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/subscriptions/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-subscription"] }); setConfirming(null); },
  });

  const cancel = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/subscriptions/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-subscription"] }),
  });

  const fmt = (cents: number) => cents === 0 ? "Free" : `$${(cents / 100).toFixed(2)}`;
  const planList = demoMode ? DEMO_PLANS : plans ?? [];
  const activeSub = demoMode ? demoSub : currentSub;
  const currentPlan = activeSub?.plan ?? "free";

  const handleSubscribe = (planId: string) => {
    if (demoMode) {
      setDemoSub({
        plan: planId,
        status: "active",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: "2026-06-21",
      });
      setConfirming(null);
      return;
    }

    subscribe.mutate(planId);
  };

  const handleCancel = () => {
    if (demoMode) {
      setDemoSub((sub) => ({ ...sub, cancelAtPeriodEnd: true }));
      return;
    }

    cancel.mutate();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Crown className="h-8 w-8 text-primary" />Subscription Plans</h1>
        <p className="text-muted-foreground mt-1">Choose the plan that fits your journey</p>
      </div>

      {activeSub && currentPlan !== "free" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {(() => { const Icon = PLAN_ICONS[currentPlan] ?? Crown; return <Icon className={`h-5 w-5 ${PLAN_COLORS[currentPlan]}`} />; })()}
              <div>
                <div className="font-semibold">Current Plan: {planList.find(p => p.id === currentPlan)?.name ?? currentPlan}</div>
                <div className="text-sm text-muted-foreground">
                  Status: <Badge variant="secondary" className="capitalize">{activeSub.status}</Badge>
                  {activeSub.currentPeriodEnd && <span className="ml-2">· Renews {new Date(activeSub.currentPeriodEnd).toLocaleDateString()}</span>}
                  {activeSub.cancelAtPeriodEnd && <Badge variant="outline" className="ml-2 text-orange-600">Cancels at period end</Badge>}
                </div>
              </div>
            </div>
            {!activeSub.cancelAtPeriodEnd && (
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancel.isPending}>
                {cancel.isPending ? "Cancelling…" : "Cancel Subscription"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {planList.map(plan => {
          const Icon = PLAN_ICONS[plan.id] ?? Crown;
          const isCurrent = currentPlan === plan.id;
          return (
            <Card key={plan.id} className={`relative flex flex-col transition-shadow hover:shadow-md ${plan.popular ? "border-primary ring-1 ring-primary" : ""} ${isCurrent ? "bg-muted/40" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className={`${PLAN_COLORS[plan.id]} mb-2`}><Icon className="h-6 w-6" /></div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription className="text-xs">{plan.description}</CardDescription>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{fmt(plan.price)}</span>
                  {plan.price > 0 && <span className="text-sm text-muted-foreground">/{plan.interval}</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <ul className="space-y-2 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button variant="secondary" disabled className="w-full">Current Plan</Button>
                ) : confirming === plan.id ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">Confirm switch to {plan.name}?</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => handleSubscribe(plan.id)} disabled={subscribe.isPending}>
                        {subscribe.isPending ? "Processing…" : "Confirm"}
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setConfirming(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"} onClick={() => plan.price === 0 ? handleSubscribe(plan.id) : setConfirming(plan.id)}>
                    {plan.price === 0 ? "Downgrade to Free" : `Upgrade to ${plan.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">All plans include</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {["University search & explore", "Application tracker", "Community forums", "Mobile-friendly interface", "Secure data storage", "SSL encrypted connection"].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-green-600" />{f}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
