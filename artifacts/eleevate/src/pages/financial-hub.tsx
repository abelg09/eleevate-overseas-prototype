import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { useDemoJourneyState } from "@/lib/demo-journey";
import { hasStudentWorkspaceProfile, useStudentWorkspaceProfile } from "@/lib/student-workspace";
import { cn } from "@/lib/utils";

const ledgerKpis = [
  { label: "Funding gap", value: "Not calculated", detail: "Add budget and offers first", tone: "border-l-primary" },
  { label: "Confirmed funds", value: "Not added", detail: "Sponsor and savings pending", tone: "border-l-emerald-500" },
  { label: "Pending payments", value: "None", detail: "No requests started", tone: "border-l-[#C67452]" },
  { label: "Visa evidence", value: "Not ready", detail: "Receipts and fund proof pending", tone: "border-l-[#F8B133]" },
];

const financeModules = [
  { label: "Edu Loans", href: "/loans", detail: "Build a funding planner after profile and offers" },
  { label: "Remittance", href: "/remittance", detail: "Fee timeline and receipt evidence" },
  { label: "Forex Card", href: "/forex-card", detail: "Country-specific load plan" },
  { label: "Forex", href: "/forex", detail: "Rates and margin visibility" },
  { label: "Insurance", href: "/insurance", detail: "Visa-stage cover and partner revenue" },
];

export default function FinancialHubPage() {
  const demoJourney = useDemoJourneyState();
  const ledgerEvents = demoJourney.ledgerEvents;
  const profile = useStudentWorkspaceProfile();
  const hasProfile = hasStudentWorkspaceProfile(profile);

  return (
    <div data-testid="financial-hub-page">
      <PageHeader
        eyebrow="Finance & Arrival"
        title="Financial Hub"
        description="Plan education loans, fee payments, remittance, forex card, insurance, receipts, and visa fund evidence in one place."
        actions={
          <>
            <Link href="/loans">
              <Button variant="outline" className="rounded-full font-serif">Open loans</Button>
            </Link>
            <Link href="/remittance">
              <Button className="rounded-full font-serif">Plan remittance</Button>
            </Link>
          </>
        }
      />

      <Card className="app-card mb-5 p-5">
        <SectionHeader title="Finance modules" description="Choose the money task you want to handle first." />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {financeModules.map((module) => (
            <Link key={module.href} href={module.href}>
              <div className="h-full rounded-lg border border-border bg-white p-4 transition-colors hover:border-primary/35 hover:bg-primary/5">
                <div className="font-serif text-base font-bold text-foreground">{module.label}</div>
                <div className="mt-2 text-sm leading-6 text-muted-foreground">{module.detail}</div>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <section className="mb-5 rounded-lg border border-border bg-white p-5 shadow-sm">
        <div className="max-w-3xl">
          <Badge className="mb-4 rounded-full border border-primary/25 bg-primary/10 text-primary hover:bg-primary/10">Finance journey</Badge>
          <h2 className="font-serif text-3xl font-bold leading-tight text-foreground">
            Plan how you will pay, prove funds, and arrive prepared.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Add your profile and finance details, then start a loan, remittance, forex card, insurance, or service request. ELEE will keep the next payment and evidence tasks visible.
          </p>
          {!hasProfile && (
            <Link href="/profile">
              <Button className="mt-5 rounded-full font-serif">Add finance profile</Button>
            </Link>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {ledgerKpis.map((kpi) => (
          <Card key={kpi.label} className={cn("app-card border-l-4 p-4", kpi.tone)}>
            <div className="text-xs font-semibold text-muted-foreground">{kpi.label}</div>
            <div className="mt-2 font-serif text-2xl font-bold text-foreground">{kpi.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{kpi.detail}</div>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="app-card p-4">
          <SectionHeader title="Finance activity timeline" description="Your finance actions appear here as next tasks, evidence, and advisor support." />
          {ledgerEvents.length > 0 ? (
            <div className="space-y-3">
              {ledgerEvents.map((item, index) => (
                <div key={item.event} className="rounded-lg border border-border bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">Finance activity {index + 1}</div>
                      <div className="mt-1 font-serif text-base font-bold text-foreground">{item.event}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Source: {item.source}</div>
                    </div>
                    <Badge variant="outline" className="w-fit rounded-full font-semibold">{item.status}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-border bg-muted/25 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Your status</div>
                      <p className="mt-1 text-xs leading-5 text-foreground">{item.studentView}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/25 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Advisor support</div>
                      <p className="mt-1 text-xs leading-5 text-foreground">{item.consultantView}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/25 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Evidence</div>
                      <p className="mt-1 text-xs font-semibold leading-5 text-foreground">Source: {item.source}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6">
              <div className="font-serif text-lg font-bold text-foreground">No finance actions yet.</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Start an education loan, remittance, forex card, forex, insurance, or service action to build your finance plan.
              </p>
              <Link href="/loans">
                <Button className="mt-4 rounded-full font-serif">Open loan planner</Button>
              </Link>
            </div>
          )}
        </Card>

        <aside className="space-y-5">
          <Card className="app-card p-4">
            <SectionHeader title="Funding readiness" />
            <div className="space-y-4">
              {[
                { label: "Budget captured", value: hasProfile && profile?.budget ? 35 : 0 },
                { label: "Funds confirmed", value: 0 },
                { label: "Loan match ready", value: ledgerEvents.some((event) => event.source === "Edu Loans") ? 45 : 0 },
                { label: "Visa evidence packet", value: 0 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{item.value}%</span>
                  </div>
                  <Progress value={item.value} className="h-1.5" />
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
