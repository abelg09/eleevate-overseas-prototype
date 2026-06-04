import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { useDemoJourneyState } from "@/lib/demo-journey";
import { cn } from "@/lib/utils";

const financeKpis = [
  { label: "ELEE funding gap", value: "$8k", detail: "Synced to Edu Loans", tone: "border-l-primary" },
  { label: "Confirmed funds", value: "$38k", detail: "Sponsor + savings", tone: "border-l-emerald-500" },
  { label: "Service savings", value: "$620", detail: "Loan + forex estimate", tone: "border-l-[#C67452]" },
  { label: "Visa evidence", value: "76%", detail: "Receipts + fund proof", tone: "border-l-[#F8B133]" },
];

const financeModules = [
  { label: "Edu Loans", href: "/loans", detail: "Pre-filled from ELEE funding gap" },
  { label: "Remittance", href: "/remittance", detail: "Fee timeline and receipt evidence" },
  { label: "Forex Card", href: "/forex-card", detail: "Country-specific load plan" },
  { label: "Forex", href: "/forex", detail: "Rates and margin visibility" },
  { label: "Insurance", href: "/insurance", detail: "Visa-stage cover and partner revenue" },
];

export default function FinancialHubPage() {
  const demoJourney = useDemoJourneyState();
  const financeUpdates = demoJourney.ledgerEvents;
  const lockedCountry = demoJourney.countryLock;

  return (
    <div data-testid="financial-hub-page">
      <PageHeader
        eyebrow="Finance & arrival"
        title={lockedCountry ? "Canada finance plan" : "Finance plan"}
        description="Track the money students need for tuition, living cost, visa proof, remittance, forex, insurance, and arrival."
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
            One finance plan for loans, remittance, visa proof, insurance, and arrival money.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Jehan&apos;s $8k funding gap becomes a loan shortlist, sponsor checklist, fee payment plan, and visa evidence task without repeating the same details.
            {lockedCountry ? ` Current route: ${lockedCountry.countryName}, ${lockedCountry.cities.join(" and ")}.` : ""}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {financeKpis.map((kpi) => (
          <Card key={kpi.label} className={cn("app-card border-l-4 p-4", kpi.tone)}>
            <div className="text-xs font-semibold text-muted-foreground">{kpi.label}</div>
            <div className="mt-2 font-serif text-2xl font-bold text-foreground">{kpi.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{kpi.detail}</div>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="app-card p-4">
          <SectionHeader title="Recent finance updates" description="What changed for the student, documents, and service follow-up." />
          <div className="space-y-3">
            {financeUpdates.map((item, index) => (
              <div key={item.event} className="rounded-lg border border-border bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">Update {index + 1}</div>
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
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Team follow-up</div>
                    <p className="mt-1 text-xs leading-5 text-foreground">{item.consultantView}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/25 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Service status</div>
                    <p className="mt-1 text-xs font-semibold leading-5 text-foreground">{item.revenue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <aside className="space-y-5">
          <Card className="app-card p-4">
            <SectionHeader title="Funding readiness" />
            <div className="space-y-4">
              {[
                { label: "Budget captured", value: 100 },
                { label: "Funds confirmed", value: 83 },
                { label: "Loan match ready", value: 72 },
                { label: "Visa evidence packet", value: 76 },
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
            <SectionHeader title="Finance modules" description="Choose the next finance tool you need." />
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
