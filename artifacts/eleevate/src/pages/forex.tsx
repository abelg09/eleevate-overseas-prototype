import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { isDemoMode } from "@/lib/demo-mode";
import { addDemoLedgerEvent } from "@/lib/demo-journey";

const CURRENCIES = ["INR", "USD", "GBP", "AUD", "CAD", "EUR", "SGD", "NZD"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const PURPOSES = [
  "University tuition fee",
  "Living expenses / rent",
  "Exam registration fee",
  "Course/study materials",
  "Flight & travel",
  "Health insurance premium",
  "Other education expense",
];

const DEMO_RATES: Record<string, Record<string, number>> = {
  INR: { USD: 0.012, GBP: 0.0094, AUD: 0.018, CAD: 0.016, EUR: 0.011, SGD: 0.016, NZD: 0.019 },
  USD: { INR: 83.2, GBP: 0.78, AUD: 1.5, CAD: 1.36, EUR: 0.92, SGD: 1.35, NZD: 1.62 },
  GBP: { INR: 106.2, USD: 1.28, AUD: 1.92, CAD: 1.74, EUR: 1.17, SGD: 1.72, NZD: 2.07 },
  CAD: { INR: 61.1, USD: 0.74, GBP: 0.57, AUD: 1.1, EUR: 0.68, SGD: 0.99, NZD: 1.19 },
};

const DEMO_TRANSACTIONS: Array<{
  id: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  rate: string;
  status: string;
  purpose: string | null;
  createdAt: string;
}> = [];

export default function ForexPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const demoMode = isDemoMode();
  const [fromCurrency, setFromCurrency] = useState("INR");
  const [toCurrency, setToCurrency] = useState("USD");
  const [fromAmount, setFromAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientBank, setRecipientBank] = useState("");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [demoTransactions, setDemoTransactions] = useState(DEMO_TRANSACTIONS);

  const { data: rateData, refetch: refetchRates } = useQuery({
    queryKey: ["forex-rates", fromCurrency, toCurrency],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/forex/rates?from=${fromCurrency}&to=${toCurrency}`);
      return res.json() as Promise<{ from: string; to: string; rate: number; timestamp: string }>;
    },
    enabled: !demoMode,
  });

  const { data: allRates } = useQuery({
    queryKey: ["forex-all-rates", fromCurrency],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/forex/rates?from=${fromCurrency}`);
      return res.json() as Promise<{ from: string; rates: Record<string, number>; timestamp: string }>;
    },
    enabled: !demoMode,
  });

  const { data: transactions } = useQuery({
    queryKey: ["my-forex-transactions"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/forex/transactions/me`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      return d.data as Array<{ id: string; fromCurrency: string; toCurrency: string; fromAmount: number; toAmount: number; rate: string; status: string; purpose: string | null; createdAt: string }>;
    },
    enabled: !demoMode,
  });

  const sendMoney = useMutation({
    mutationFn: async () => {
      if (demoMode) return { ok: true };
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/forex/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fromCurrency, toCurrency, fromAmount: parseFloat(fromAmount), purpose: purpose || undefined, recipientName: recipientName || undefined, recipientBank: recipientBank || undefined, recipientAccount: recipientAccount || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      if (demoMode) {
        const nextToAmount = parseFloat(fromAmount || "0") * effectiveRateData.rate;
        setDemoTransactions((items) => [
          {
            id: `fx-demo-${Date.now()}`,
            fromCurrency,
            toCurrency,
            fromAmount: parseFloat(fromAmount || "0"),
            toAmount: Number(nextToAmount.toFixed(2)),
            rate: String(effectiveRateData.rate),
            status: "processing",
            purpose: purpose || "University tuition fee",
            createdAt: new Date().toISOString(),
          },
          ...items,
        ]);
        addDemoLedgerEvent({
          id: "ledger-forex-action",
          source: "Forex",
          event: `${fromCurrency} to ${toCurrency} transfer initiated`,
          studentView: "Transfer receipt will sync to the finance and visa evidence packet.",
          consultantView: "Forex margin event and receipt follow-up are created.",
          revenue: "Forex Margin",
          status: "Processing",
        });
      } else {
        qc.invalidateQueries({ queryKey: ["my-forex-transactions"] });
      }
      setFromAmount(""); setRecipientName(""); setRecipientBank(""); setRecipientAccount(""); setPurpose(""); setConfirming(false);
      toast.success("Remittance initiated! Funds will be transferred within 1–2 business days.");
    },
    onError: () => toast.error("Transaction failed. Please try again."),
  });

  const fallbackRates = DEMO_RATES[fromCurrency] ?? {};
  const effectiveRateData = rateData ?? {
    from: fromCurrency,
    to: toCurrency,
    rate: fallbackRates[toCurrency] ?? 1,
    timestamp: new Date().toISOString(),
  };
  const effectiveAllRates = allRates ?? {
    from: fromCurrency,
    rates: fallbackRates,
    timestamp: new Date().toISOString(),
  };
  const transactionList = demoMode ? demoTransactions : transactions ?? [];

  const toAmount = fromAmount && parseFloat(fromAmount) > 0
    ? (parseFloat(fromAmount) * effectiveRateData.rate).toFixed(2) : null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Forex</h1>
        <p className="text-muted-foreground mt-1">
          Live exchange rates and international money transfers for study-abroad payments.
        </p>
      </div>

      <Tabs defaultValue="convert">
        <TabsList>
          <TabsTrigger value="convert">Rate Converter</TabsTrigger>
          <TabsTrigger value="send">Send Money</TabsTrigger>
          <TabsTrigger value="history">Transaction History {transactionList.length > 0 && `(${transactionList.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="convert" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Currency Converter</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-5 items-end gap-2">
                  <div className="col-span-2">
                    <label className="text-sm font-medium">From</label>
                    <Select value={fromCurrency} onValueChange={v => { setFromCurrency(v); }}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" placeholder="Amount" value={fromAmount} onChange={e => setFromAmount(e.target.value)} className="mt-2" />
                  </div>
                  <div className="flex justify-center pb-2">
                    <button onClick={() => { setFromCurrency(toCurrency); setToCurrency(fromCurrency); }} className="rounded-full border p-2 hover:bg-muted transition-colors">
                      <span className="text-xs font-semibold">Swap</span>
                    </button>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">To</label>
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{CURRENCIES.filter(c => c !== fromCurrency).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="mt-2 h-10 rounded-md border bg-muted/50 flex items-center px-3 font-semibold text-lg text-primary">
                      {toAmount ?? "—"}
                    </div>
                  </div>
                </div>
                {effectiveRateData && (
                  <div className="text-sm text-muted-foreground flex justify-between">
                    <span>1 {fromCurrency} = {effectiveRateData.rate} {toCurrency}</span>
                    <button onClick={() => refetchRates()} className="text-primary text-xs hover:underline">Refresh</button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Live Rates from {fromCurrency}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {effectiveAllRates && Object.entries(effectiveAllRates.rates).map(([cur, rate]) => (
                    <div key={cur} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cur}</span>
                      <span className="text-muted-foreground tabular-nums">{rate.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
                {effectiveAllRates && <p className="text-xs text-muted-foreground mt-3">Updated {new Date(effectiveAllRates.timestamp).toLocaleTimeString()}</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="send" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Transfer Details</CardTitle><CardDescription>Send money internationally for education expenses</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">You send</label>
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" placeholder="Amount" value={fromAmount} onChange={e => setFromAmount(e.target.value)} className="mt-2" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Recipient gets</label>
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{CURRENCIES.filter(c => c !== fromCurrency).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="mt-2 h-10 rounded-md border bg-muted/50 flex items-center px-3 font-semibold text-primary">
                      {toAmount ? `≈ ${toAmount} ${toCurrency}` : "—"}
                    </div>
                  </div>
                </div>

                {effectiveRateData && fromAmount && (
                  <div className="rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
                    Rate: 1 {fromCurrency} = {effectiveRateData.rate} {toCurrency} (incl. 0.8% spread)
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Purpose</label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select purpose" /></SelectTrigger>
                    <SelectContent>{PURPOSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><label className="text-sm font-medium">Recipient Name</label><Input placeholder="Full legal name" value={recipientName} onChange={e => setRecipientName(e.target.value)} className="mt-1" /></div>
                <div><label className="text-sm font-medium">Recipient Bank</label><Input placeholder="Bank name" value={recipientBank} onChange={e => setRecipientBank(e.target.value)} className="mt-1" /></div>
                <div><label className="text-sm font-medium">Account / IBAN</label><Input placeholder="Account number or IBAN" value={recipientAccount} onChange={e => setRecipientAccount(e.target.value)} className="mt-1" /></div>

                {confirming ? (
                  <div className="space-y-2">
                    <div className="border rounded p-3 text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">You send</span><span className="font-semibold">{fromAmount} {fromCurrency}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Recipient gets</span><span className="font-semibold text-primary">≈ {toAmount} {toCurrency}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Transfer fee</span><span className="text-green-600">Nil</span></div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => sendMoney.mutate()} disabled={sendMoney.isPending}>{sendMoney.isPending ? "Sending…" : "Confirm Transfer"}</Button>
                      <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)}>Back</Button>
                    </div>
                  </div>
                ) : (
                  <Button className="w-full gap-2" disabled={!fromAmount || !recipientName || !toCurrency} onClick={() => setConfirming(true)}>
                    Continue
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Transfer Benefits</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {["Competitive exchange rates with minimal spread", "Transfers within 1–2 business days", "Zero platform fees on remittances", "RBI-compliant Liberalised Remittance Scheme (LRS)", "Real-time tracking and notifications", "24/7 customer support"].map(f => (
                    <div key={f} className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />{f}</div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-sm">
                  <p className="text-muted-foreground text-xs leading-relaxed">Transfers are processed through RBI-authorised Authorised Dealer banks. All transactions comply with FEMA and RBI LRS guidelines. Annual remittance limit: USD 250,000 per financial year per individual.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {transactionList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No transactions yet.</div>
          ) : (
            <div className="space-y-3">
              {transactionList.map(tx => (
                <Card key={tx.id}>
                  <CardContent className="py-4 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-medium text-sm">{tx.fromCurrency} → {tx.toCurrency}</div>
                      <div className="text-xs text-muted-foreground">
                        {(tx.fromAmount / 100).toLocaleString()} {tx.fromCurrency} → {(tx.toAmount / 100).toLocaleString()} {tx.toCurrency}
                        · Rate: {tx.rate}
                        {tx.purpose && ` · ${tx.purpose}`}
                        · {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge className={`${STATUS_COLORS[tx.status] ?? ""} border-0 text-xs capitalize`}>{tx.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
