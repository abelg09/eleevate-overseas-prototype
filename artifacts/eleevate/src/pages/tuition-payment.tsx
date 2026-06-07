import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, CreditCard, CheckCircle2, Clock, AlertCircle, Receipt } from "lucide-react";
import { toast } from "sonner";
import { isDemoMode } from "@/lib/demo-mode";

type TuitionPayment = {
  id: string; type: string; amount: number; currency: string; status: string;
  description: string | null; reference: string | null; createdAt: string;
};

const CURRENCIES = ["USD", "GBP", "AUD", "CAD", "EUR", "SGD", "NZD"];

const INR_RATES: Record<string, number> = {
  USD: 83.77, GBP: 105.76, AUD: 55.17, CAD: 61.52, EUR: 90.93, SGD: 61.95, NZD: 50.60,
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  completed: CheckCircle2,
  processing: Clock,
  pending: Clock,
  failed: AlertCircle,
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-700 text-white",
  processing: "bg-blue-700 text-white",
  pending: "bg-yellow-600 text-white",
  failed: "bg-red-700 text-white",
  refunded: "bg-slate-700 text-white",
};

const DEMO_PAYMENTS: TuitionPayment[] = [];

export default function TuitionPaymentPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const demoMode = isDemoMode();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [university, setUniversity] = useState("");
  const [description, setDescription] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [demoPayments, setDemoPayments] = useState<TuitionPayment[]>(DEMO_PAYMENTS);

  const { data: payments } = useQuery({
    queryKey: ["my-payments"],
    enabled: !demoMode,
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/payments/me`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      return (d.data as TuitionPayment[])
        .filter(p => p.type === "tuition");
    },
  });

  const pay = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/payments/tuition`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parseFloat(amount), currency, universityId: university || undefined, description: description || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-payments"] });
      setAmount(""); setUniversity(""); setDescription(""); setConfirming(false);
      toast.success("Payment initiated! Processing will complete within a few minutes.");
    },
    onError: () => toast.error("Payment failed. Please try again."),
  });

  const inrEquiv = amount && parseFloat(amount) > 0
    ? (parseFloat(amount) * (INR_RATES[currency] ?? 1)).toFixed(0)
    : null;
  const paymentList = demoMode ? demoPayments : payments ?? [];

  const handlePay = () => {
    if (demoMode) {
      setDemoPayments((items) => [
        {
          id: `demo-payment-${Date.now()}`,
          type: "tuition",
          amount: Math.round(parseFloat(amount) * 100),
          currency,
          status: "processing",
          description: description || `${university || "University"} tuition payment`,
          reference: `EO-TU-${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: new Date().toISOString(),
        },
        ...items,
      ]);
      setAmount("");
      setUniversity("");
      setDescription("");
      setConfirming(false);
      toast.success("Payment initiated. Transaction added to history.");
      return;
    }

    pay.mutate();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><GraduationCap className="h-8 w-8 text-primary" />Tuition Fee Payment</h1>
        <p className="text-muted-foreground mt-1">Pay your university tuition fees securely through EleevateOverseas</p>
      </div>

      <Tabs defaultValue="pay">
        <TabsList>
          <TabsTrigger value="pay">Make a Payment</TabsTrigger>
          <TabsTrigger value="history">Payment History {paymentList.length > 0 && `(${paymentList.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="pay" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" />Payment Details</CardTitle>
                <CardDescription>Enter your tuition payment details below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">University Name</label>
                  <Input placeholder="e.g. University of Melbourne" value={university} onChange={e => setUniversity(e.target.value)} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Amount *</label>
                    <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Currency</label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Input placeholder="e.g. Semester 1 tuition fee" value={description} onChange={e => setDescription(e.target.value)} className="mt-1" />
                </div>

                {inrEquiv && (
                  <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    <span className="text-muted-foreground">≈ ₹{parseInt(inrEquiv).toLocaleString("en-IN")} INR</span>
                    <span className="text-xs text-muted-foreground ml-2">(indicative rate)</span>
                  </div>
                )}

                {confirming ? (
                  <div className="space-y-3 pt-2">
                    <div className="rounded-lg border p-3 space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{currency} {parseFloat(amount).toFixed(2)}</span></div>
                      {university && <div className="flex justify-between"><span className="text-muted-foreground">University</span><span>{university}</span></div>}
                      <div className="flex justify-between"><span className="text-muted-foreground">Platform fee</span><span className="text-green-600">Nil</span></div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={handlePay} disabled={pay.isPending}>
                        {pay.isPending ? "Processing…" : "Confirm Payment"}
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)}>Back</Button>
                    </div>
                  </div>
                ) : (
                  <Button className="w-full gap-2 mt-2" disabled={!amount || parseFloat(amount) <= 0} onClick={() => setConfirming(true)}>
                    <CreditCard className="h-4 w-4" />Proceed to Payment
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">How it works</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {[
                    { step: "1", text: "Enter your university and payment amount" },
                    { step: "2", text: "Review the currency conversion and confirm" },
                    { step: "3", text: "Payment is processed securely via our banking partner" },
                    { step: "4", text: "Receive a receipt and track status in Payment History" },
                  ].map(s => (
                    <div key={s.step} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{s.step}</div>
                      <span className="text-muted-foreground">{s.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 space-y-2 text-sm">
                  {["Bank-grade 256-bit SSL encryption", "Real-time payment status tracking", "Digital receipts for all transactions", "0% platform fee on tuition payments"].map(f => (
                    <div key={f} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />{f}</div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {paymentList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No payments yet.</div>
          ) : (
            <div className="space-y-3">
              {paymentList.map(p => {
                const Icon = STATUS_ICONS[p.status] ?? Receipt;
                return (
                  <Card key={p.id}>
                    <CardContent className="py-4 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{p.description ?? "Tuition Payment"}</div>
                          <div className="text-xs text-muted-foreground">{p.reference} · {new Date(p.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{p.currency} {(p.amount / 100).toFixed(2)}</span>
                        <Badge className={`${STATUS_COLORS[p.status] ?? ""} border-0 capitalize text-xs`}>{p.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
