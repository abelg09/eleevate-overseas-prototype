import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { isDemoMode } from "@/lib/demo-mode";
import { addDemoLedgerEvent } from "@/lib/demo-journey";

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  under_review: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  disbursed: "bg-emerald-100 text-emerald-700",
};

const DEMO_LOAN_PRODUCTS = [
  {
    id: "loan-demo-1",
    lenderName: "HDFC Credila",
    type: "Secured / unsecured",
    minAmount: 500000,
    maxAmount: 7500000,
    interestRate: "10.5-12.5%",
    tenure: "Up to 15 years",
    processingFee: "1.0%",
    collateralRequired: false,
    maxLoanINR: "INR 75L",
    eligibility: "Best for admitted students with co-applicant income proof and a clean academic profile.",
    turnaround: "5-7 working days",
    popular: true,
  },
  {
    id: "loan-demo-2",
    lenderName: "Avanse Education Finance",
    type: "Flexible collateral",
    minAmount: 800000,
    maxAmount: 10000000,
    interestRate: "11.0-13.0%",
    tenure: "Up to 14 years",
    processingFee: "1.25%",
    collateralRequired: true,
    maxLoanINR: "INR 1Cr",
    eligibility: "Good for high-ticket programs, family-backed files, and fast sanction letter needs.",
    turnaround: "4-6 working days",
  },
  {
    id: "loan-demo-3",
    lenderName: "Prodigy Finance",
    type: "International",
    minAmount: 1200000,
    maxAmount: 6000000,
    interestRate: "11.5-14.0%",
    tenure: "Up to 12 years",
    processingFee: "2.0%",
    collateralRequired: false,
    maxLoanINR: "INR 60L",
    eligibility: "Useful for selected universities where collateral-free global lending is available.",
    turnaround: "7-10 working days",
  },
];

const DEMO_LOAN_APPLICATIONS: Array<{
  id: string;
  lenderName: string;
  amount: number;
  currency: string;
  interestRate: string | null;
  tenureMonths: number | null;
  status: string;
  universityName: string | null;
  createdAt: string;
}> = [];

function parseInrAmount(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatInr(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export default function LoansPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const demoMode = isDemoMode();
  const [loanAmount, setLoanAmount] = useState("100000");
  const [tenure, setTenure] = useState("60");
  const [universityName, setUniversityName] = useState("");
  const [country, setCountry] = useState("");
  const [calculatorRate, setCalculatorRate] = useState("7");
  const [selectedLender, setSelectedLender] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [demoLoanApplications, setDemoLoanApplications] = useState(DEMO_LOAN_APPLICATIONS);

  const { data: products } = useQuery({
    queryKey: ["loan-products"],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/loans/products`);
      const d = await res.json();
      return d.data as Array<{
        id: string; lenderName: string; type: string; minAmount: number; maxAmount: number;
        interestRate: string; tenure: string; processingFee: string; collateralRequired: boolean;
        maxLoanINR: string; eligibility: string; turnaround: string; popular?: boolean;
      }>;
    },
    enabled: !demoMode,
  });

  const { data: applications } = useQuery({
    queryKey: ["my-loan-applications"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/loans/applications/me`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      return d.data as Array<{ id: string; lenderName: string; amount: number; currency: string; interestRate: string | null; tenureMonths: number | null; status: string; universityName: string | null; createdAt: string }>;
    },
    enabled: !demoMode,
  });

  const apply = useMutation({
    mutationFn: async (lenderId: string) => {
      if (demoMode) return { lenderId };
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/loans/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lenderId, amount: parseInrAmount(loanAmount), tenureMonths: parseInt(tenure), universityName: universityName || undefined, country: country || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (_data, lenderId) => {
      if (demoMode) {
        const product = DEMO_LOAN_PRODUCTS.find((item) => item.id === lenderId);
        if (product) {
          setDemoLoanApplications((items) => [
            {
              id: `loan-app-${lenderId}`,
              lenderName: product.lenderName,
              amount: parseInrAmount(loanAmount),
              currency: "INR",
              interestRate: product.interestRate,
              tenureMonths: parseInt(tenure),
              status: "submitted",
              universityName: universityName || "Selected university",
              createdAt: new Date().toISOString(),
            },
            ...items.filter((item) => item.lenderName !== product.lenderName),
          ]);
          addDemoLedgerEvent({
            id: `ledger-loan-${lenderId}`,
            source: "Edu Loans",
            event: `${product.lenderName} loan application submitted`,
            studentView: "Documents and funding gap are bundled for lender review.",
            consultantView: "Loan desk receives follow-up task and pending NBFC commission.",
            revenue: "NBFC Commission",
            status: "Processing",
          });
        }
      } else {
        qc.invalidateQueries({ queryKey: ["my-loan-applications"] });
      }
      setSelectedLender(null);
      toast.success("Application submitted! The lender will contact you within their stated turnaround time.");
    },
    onError: () => toast.error("Application failed. Please try again."),
  });

  const eligibleProducts = searched && loanAmount
    ? ((demoMode || !products?.length ? DEMO_LOAN_PRODUCTS : products) ?? []).filter(p => {
        const amt = parseInrAmount(loanAmount);
        return amt >= p.minAmount && amt <= p.maxAmount;
      })
    : [];

  const productsList = demoMode || !products?.length ? DEMO_LOAN_PRODUCTS : products;
  const applicationsList = demoMode ? demoLoanApplications : applications ?? [];
  const principalInr = parseInrAmount(loanAmount);
  const tenureMonths = parseInt(tenure) || 60;
  const rate = parseFloat(calculatorRate) || 7;
  const monthlyRate = rate / 100 / 12;
  const displayedEmi = principalInr > 0 && monthlyRate > 0 && tenureMonths > 0
    ? Math.round(principalInr * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1))
    : 0;
  const totalPayable = displayedEmi * tenureMonths;
  const interestPayable = Math.max(totalPayable - principalInr, 0);

  const queueCalculatorPlan = () => {
    addDemoLedgerEvent({
      id: `ledger-loan-calculator-${principalInr}-${tenureMonths}-${rate}`,
      source: "Edu Loans",
      event: `Education loan EMI calculated`,
      studentView: `Estimated EMI ${formatInr(displayedEmi)} for ${formatInr(principalInr)} over ${tenureMonths} months added to funding plan.`,
      consultantView: "Loan desk receives calculator output and lender comparison context.",
      revenue: "NBFC Commission",
      status: "Ready",
    });
    toast.success("Loan estimate saved to the funding plan.");
  };

  const emi = (principal: number, rateStr: string, months: number) => {
    const minRate = parseFloat(rateStr.split("–")[0]) / 100 / 12;
    const emi = principal * minRate * Math.pow(1 + minRate, months) / (Math.pow(1 + minRate, months) - 1);
    return isNaN(emi) ? null : Math.round(emi).toLocaleString("en-IN");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Edu Loans</h1>
        <p className="text-muted-foreground mt-1">
          Compare and apply to leading education loan providers after adding your budget, destination, and offer details.
        </p>
      </div>

      <Tabs defaultValue="marketplace">
        <TabsList>
          <TabsTrigger value="marketplace">Loan Marketplace</TabsTrigger>
          <TabsTrigger value="applications">My Applications {applicationsList.length > 0 && `(${applicationsList.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="mt-4 space-y-4">
          <Card className="route-ribbon-bg overflow-hidden border-primary/20">
            <CardHeader><CardTitle className="text-base">Find Your Best Loan Match</CardTitle><CardDescription>Enter your requirements to see eligible loan products</CardDescription></CardHeader>
            <CardContent>
              {demoMode && (
                <div className="mb-4 rounded-lg border border-primary/20 bg-white/90 p-3 text-sm leading-6 text-foreground">
                  <span className="mr-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Funding plan</span>
                  Add tuition, living cost, and sponsor details to compare eligible education loan options.
                </div>
              )}
              <div className="mb-4 rounded-lg border border-border bg-white p-4 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="eyebrow mb-1">EMI calculator</div>
                    <h2 className="font-serif text-xl font-bold text-foreground">Get your education loan EMI calculated now.</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Use the same core inputs as the Eleevate calculator: loan amount, tenure, and interest rate.</p>
                  </div>
                  <Button variant="outline" className="rounded-full font-serif" onClick={queueCalculatorPlan} disabled={!principalInr}>
                    Save loan estimate
                  </Button>
                </div>
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-6">
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Loan amount</label>
                        <div className="font-serif text-xl font-bold text-foreground">{formatInr(principalInr)}</div>
                      </div>
                      <Slider
                        value={[principalInr]}
                        min={100000}
                        max={10000000}
                        step={50000}
                        onValueChange={(value) => setLoanAmount(String(value[0] ?? 100000))}
                        data-testid="slider-loan-amount"
                      />
                      <div className="mt-2 flex justify-between text-xs font-semibold text-muted-foreground">
                        <span>1 Lakh</span>
                        <span>1 Crore</span>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Loan tenure</label>
                        <div className="font-serif text-xl font-bold text-foreground">{tenureMonths} <span className="text-sm font-semibold text-muted-foreground">months</span></div>
                      </div>
                      <Slider
                        value={[tenureMonths]}
                        min={60}
                        max={180}
                        step={12}
                        onValueChange={(value) => setTenure(String(value[0] ?? 60))}
                        data-testid="slider-loan-tenure"
                      />
                      <div className="mt-2 flex justify-between text-xs font-semibold text-muted-foreground">
                        <span>60</span>
                        <span>180</span>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Interest rate</label>
                        <div className="font-serif text-xl font-bold text-foreground">{rate.toFixed(1)}%</div>
                      </div>
                      <Slider
                        value={[rate]}
                        min={7}
                        max={15}
                        step={0.1}
                        onValueChange={(value) => setCalculatorRate(String(value[0] ?? 7))}
                        data-testid="slider-interest-rate"
                      />
                      <div className="mt-2 flex justify-between text-xs font-semibold text-muted-foreground">
                        <span>7%</span>
                        <span>15%</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-primary">Estimated EMI</div>
                      <div className="mt-2 font-serif text-3xl font-bold text-foreground">{formatInr(displayedEmi)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">per month</div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/35 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Total interest</div>
                      <div className="mt-1 font-serif text-xl font-bold text-foreground">{formatInr(interestPayable)}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/35 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Total payable</div>
                      <div className="mt-1 font-serif text-xl font-bold text-foreground">{formatInr(totalPayable)}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-sm font-medium">Loan Amount (INR) *</label>
                  <Input type="number" placeholder="e.g. 3000000 for ₹30L" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Tenure (months)</label>
                  <Select value={tenure} onValueChange={setTenure}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[36, 60, 84, 120, 144, 180].map(m => <SelectItem key={m} value={String(m)}>{m} months ({m / 12} yrs)</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">University (optional)</label>
                  <Input placeholder="e.g. University name" value={universityName} onChange={e => setUniversityName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Country (optional)</label>
                  <Input placeholder="e.g. United Kingdom" value={country} onChange={e => setCountry(e.target.value)} className="mt-1" />
                </div>
              </div>
              <Button className="mt-4 gap-2" onClick={() => setSearched(true)} disabled={!loanAmount}>
                Find Loan Products
              </Button>
            </CardContent>
          </Card>

          {searched && (
            eligibleProducts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No eligible products found for this amount. Try a different amount or browse all products below.</div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{eligibleProducts.length} eligible loan product{eligibleProducts.length !== 1 ? "s" : ""} found</p>
                {eligibleProducts.map(product => {
                  const principalINR = parseInrAmount(loanAmount);
                  const monthlyEmi = emi(principalINR, product.interestRate, parseInt(tenure));
                  return (
                    <Card key={product.id} className={product.popular ? "border-primary/40" : ""}>
                      <CardContent className="pt-5 space-y-4">
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-bold text-base">{product.lenderName}</div>
                              <Badge variant="outline" className="text-xs">{product.type}</Badge>
                              {product.popular && <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">Popular</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground mt-0.5">{product.maxLoanINR} max · {product.turnaround}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{product.interestRate}</div>
                            <div className="text-xs text-muted-foreground">p.a. interest rate</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div><div className="text-muted-foreground">Tenure</div><div className="font-medium">{product.tenure}</div></div>
                          <div><div className="text-muted-foreground">Processing Fee</div><div className="font-medium">{product.processingFee}</div></div>
                          <div><div className="text-muted-foreground">Collateral</div><div className="font-medium">{product.collateralRequired ? "Required" : "Not required"}</div></div>
                          {monthlyEmi && <div><div className="text-muted-foreground">Est. EMI (₹/mo)</div><div className="font-medium text-primary">₹{monthlyEmi}</div></div>}
                        </div>
                        <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">{product.eligibility}</div>
                        <div className="flex gap-2">
                          {selectedLender === product.id ? (
                            <div className="flex gap-2 w-full">
                              <Button className="flex-1" onClick={() => apply.mutate(product.id)} disabled={apply.isPending}>
                                {apply.isPending ? "Submitting…" : "Submit Application"}
                              </Button>
                              <Button variant="outline" className="flex-1" onClick={() => setSelectedLender(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <>
                              <Button onClick={() => setSelectedLender(product.id)} className="gap-2 flex-1">Apply Now</Button>
                              <Button variant="outline">Lender website</Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          )}

          {!searched && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {productsList.slice(0, 3).map(p => (
                <Card key={p.id} className="p-4">
                  <div className="font-semibold text-sm">{p.lenderName}</div>
                  <div className="text-2xl font-bold text-primary mt-1">{p.interestRate}</div>
                  <div className="text-xs text-muted-foreground">Up to {p.maxLoanINR}</div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications" className="mt-4">
          {applicationsList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No loan applications yet.</div>
          ) : (
            <div className="space-y-3">
              {applicationsList.map(app => (
                <Card key={app.id}>
                  <CardContent className="py-4 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-medium text-sm">{app.lenderName}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatInr(app.amount)} · {app.tenureMonths} months
                        {app.universityName ? ` · ${app.universityName}` : ""}
                        · Applied {new Date(app.createdAt).toLocaleDateString()}
                      </div>
                      <div className="mt-2 text-xs font-semibold text-primary">Ledger sync: HDFC Credila NBFC Commission - Processing</div>
                    </div>
                    <Badge className={`${STATUS_COLORS[app.status] ?? ""} border-0 text-xs capitalize`}>{app.status.replace("_", " ")}</Badge>
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
