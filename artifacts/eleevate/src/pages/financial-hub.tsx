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
  { label: "ELEE funding gap", value: "Not calculated", detail: "Add budget and offers first", tone: "border-l-primary" },
  { label: "Confirmed funds", value: "Not added", detail: "Sponsor and savings pending", tone: "border-l-emerald-500" },
  { label: "Pending payouts", value: "None", detail: "Service actions create events", tone: "border-l-[#C67452]" },
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
        eyebrow="Unified Ledger"
        title="Financial Hub"
        description="A single ledger that connects education loans, remittance, forex card, insurance, receipts, visa evidence, and consultant revenue events once the student takes finance actions."
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

      <section className="route-ribbon-bg mb-5 rounded-lg border border-primary/20 p-5 shadow-sm">
        <div className="max-w-3xl">
          <Badge className="mb-4 rounded-full bg-secondary text-white hover:bg-secondary">Modules talking to each other</Badge>
          <h2 className="font-serif text-3xl font-bold leading-tight text-foreground">
            One finance action should create the right student status, visa evidence, consultant task, and revenue event.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The ledger starts empty. Add profile and finance details, then start a loan, remittance, forex card, insurance, or service request to create linked student and consultant events.
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
          <SectionHeader title="Ledger handshake timeline" description="Student-facing action on the left, consultant/revenue event on the right." />
          {ledgerEvents.length > 0 ? (
            <div className="space-y-3">
              {ledgerEvents.map((item, index) => (
              <div key={item.event} className="rounded-lg border border-border bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">Ledger event {index + 1}</div>
                    <div className="mt-1 font-serif text-base font-bold text-foreground">{item.event}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Source: {item.source}</div>
                  </div>
                  <Badge variant="outline" className="w-fit rounded-full font-semibold">{item.status}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-border bg-muted/25 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Student</div>
                    <p className="mt-1 text-xs leading-5 text-foreground">{item.studentView}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/25 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Consultant</div>
                    <p className="mt-1 text-xs leading-5 text-foreground">{item.consultantView}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/25 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Revenue stream</div>
                    <p className="mt-1 text-xs font-semibold leading-5 text-foreground">{item.revenue}</p>
                  </div>
                </div>
              </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6">
              <div className="font-serif text-lg font-bold text-foreground">No ledger events yet.</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Start an education loan, remittance, forex card, forex, insurance, or service action to populate the unified ledger.
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

          <Card className="app-card p-4">
            <SectionHeader title="Finance modules" description="Still available, now connected by the ledger." />
            <div className="space-y-2">
              {financeModules.map((module) => (
                <Link key={module.href} href={module.href}>
                  <div className="rounded-lg border border-border bg-muted/25 p-3 transition-colors hover:border-primary/30 hover:bg-primary/5">
                    <div className="font-serif text-sm font-bold text-foreground">{module.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{module.detail}</div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
