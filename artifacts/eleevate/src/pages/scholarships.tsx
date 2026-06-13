import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, MetricCard } from "@/components/common/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEMO_COUNTRIES } from "@/lib/demo-catalog";
import { addDemoLedgerEvent } from "@/lib/demo-journey";
import { DEMO_SCHOLARSHIPS } from "@/lib/product-demo";
import { hasStudentWorkspaceProfile, useStudentWorkspaceProfile } from "@/lib/student-workspace";

const all = "All";

export default function ScholarshipsPage() {
  const profile = useStudentWorkspaceProfile();
  const hasProfile = hasStudentWorkspaceProfile(profile);
  const [country, setCountry] = useState(all);
  const [type, setType] = useState(all);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  const scholarships = useMemo(() => {
    return DEMO_SCHOLARSHIPS.filter((scholarship) => {
      const matchesCountry = country === all || scholarship.country === country;
      const matchesType = type === all || scholarship.type === type;
      return matchesCountry && matchesType;
    }).sort((a, b) => hasProfile ? b.fitScore - a.fitScore : a.deadline.localeCompare(b.deadline));
  }, [country, hasProfile, type]);

  const addToPlan = (id: string) => {
    const scholarship = DEMO_SCHOLARSHIPS.find((item) => item.id === id);
    if (!scholarship) return;
    setAddedIds((ids) => Array.from(new Set([...ids, id])));
    addDemoLedgerEvent({
      id: `ledger-scholarship-${id}`,
      source: "Services",
      event: `${scholarship.name} added to funding plan`,
      studentView: `$${scholarship.amountUsd.toLocaleString()} potential award added to the funding planner.`,
      consultantView: "Scholarship document checklist added to counselling queue.",
      revenue: "Application support upsell",
      status: "Queued",
    });
    toast.success("Scholarship added to funding plan.");
  };

  const totalPotential = scholarships.reduce((sum, item) => sum + item.amountUsd, 0);
  const bestFit = hasProfile ? scholarships[0]?.fitScore ?? 0 : 0;

  return (
    <div data-testid="scholarships-page">
      <PageHeader
        eyebrow="Finance"
        title="Scholarship Finder"
        description="Match scholarships to route, eligibility, deadline, missing documents, and funding-gap impact."
        actions={(
          <Link href="/financial-hub">
            <Button className="rounded-full font-serif">Open financial hub <ArrowRight className="h-3.5 w-3.5" /></Button>
          </Link>
        )}
      />

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <MetricCard label="Scholarships found" value={String(scholarships.length)} detail="public catalog" />
        <MetricCard label="Potential funding" value={`$${Math.round(totalPotential / 1000)}k`} detail="before eligibility" tone="good" />
        <MetricCard label="Best fit" value={hasProfile ? `${bestFit}%` : "Pending"} detail={hasProfile ? "ELEE score" : "complete profile"} />
        <MetricCard label="Added to plan" value={String(addedIds.length)} detail="funding items" tone="watch" />
      </div>

      <Card className="app-card mb-5 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={all}>All countries</SelectItem>
              {DEMO_COUNTRIES.map((item) => <SelectItem key={item.code} value={item.name}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Scholarship type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={all}>All types</SelectItem>
              <SelectItem value="Merit">Merit</SelectItem>
              <SelectItem value="Need">Need</SelectItem>
              <SelectItem value="Country">Country</SelectItem>
              <SelectItem value="University">University</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-full font-serif" onClick={() => { setCountry(all); setType(all); }}>
            Reset
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 md:grid-cols-2">
          {scholarships.map((scholarship) => {
            const added = addedIds.includes(scholarship.id);
            return (
              <Card key={scholarship.id} className="app-card overflow-hidden p-0" data-testid={`scholarship-card-${scholarship.id}`}>
                <div className="brand-gradient-bg h-1" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="rounded-full">{scholarship.country}</Badge>
                        <Badge variant="outline" className="rounded-full">{scholarship.type}</Badge>
                      </div>
                      <h2 className="mt-3 font-serif text-xl font-bold leading-tight text-foreground">{scholarship.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{scholarship.provider}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-serif text-2xl font-bold text-primary">${Math.round(scholarship.amountUsd / 1000)}k</div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Potential award</div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                      <span>ELEE eligibility fit</span>
                      <span>{hasProfile ? `${scholarship.fitScore}%` : "Pending"}</span>
                    </div>
                    <Progress value={hasProfile ? scholarship.fitScore : 0} className="h-2" />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border bg-muted/35 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Deadline</div>
                      <div className="mt-1 font-serif text-sm font-bold text-foreground">{scholarship.deadline}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/35 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Required docs</div>
                      <div className="mt-1 font-serif text-sm font-bold text-foreground">{scholarship.requiredDocs.length} items</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Eligibility</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {scholarship.eligibility.map((item) => <Badge key={item} variant="outline" className="rounded-full">{item}</Badge>)}
                    </div>
                  </div>

                  <Button onClick={() => addToPlan(scholarship.id)} disabled={added} className="mt-5 w-full rounded-full font-serif">
                    {added ? "Added to funding plan" : "Add to funding plan"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <aside className="space-y-4">
          <Card className="app-card p-4">
            <div className="eyebrow mb-2">Funding impact</div>
            <h2 className="font-serif text-xl font-bold text-foreground">Scholarships can reduce what you need to fund.</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Add scholarships to your funding plan, then prepare the required documents before each deadline.
            </p>
          </Card>
          <Card className="app-card p-4">
            <div className="font-serif text-base font-bold text-foreground">Document pack</div>
            <div className="mt-3 space-y-2">
              {["Transcript", "SOP", "Resume", "Bank proof", "Offer letter"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-lg border border-border bg-muted/35 p-2 text-sm">
                  <span>{item}</span>
                  <Badge variant="outline" className="rounded-full text-xs">Needed</Badge>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
