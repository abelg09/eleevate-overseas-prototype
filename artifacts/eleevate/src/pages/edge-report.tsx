import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { demoEdgeReport } from "@/lib/demo-data";
import { useDemoJourneyState } from "@/lib/demo-journey";
import { cn } from "@/lib/utils";

const blockers = [
  {
    title: "Finance proof is incomplete",
    detail: "Upload sponsor bank statements and education loan pre-approval before paying more application fees.",
    href: "/documents",
  },
  {
    title: "SOP needs a stronger course story",
    detail: "Add project outcomes, why Canada, and why each selected program fits the career plan.",
    href: "/sop-studio",
  },
  {
    title: "Visa file is not ready yet",
    detail: "The visa checklist should be completed after finance proof and offer conditions are clear.",
    href: "/visa-center",
  },
];

const nextActions = [
  { label: "Upload sponsor statement", owner: "Student", due: "Today", href: "/documents" },
  { label: "Review SOP draft", owner: "Student + advisor", due: "Tomorrow", href: "/sop-studio" },
  { label: "Start Toronto and UBC applications", owner: "Student", due: "This week", href: "/applications" },
];

const readinessCards = [
  { label: "Country fit", value: "88%", detail: "Canada is strongest for CS, PGWP, and budget fit.", progress: 88, tone: "good" },
  { label: "Documents", value: "67%", detail: "Finance proof and final SOP review are pending.", progress: 67, tone: "watch" },
  { label: "Visa readiness", value: "Medium", detail: "Confidence improves once the sponsor file is complete.", progress: 54, tone: "action" },
  { label: "Family clarity", value: "72%", detail: "Share cost timeline before major fee payments.", progress: 72, tone: "watch" },
];

const recentUpdates = [
  "Canada moved to the top route after budget and post-study work checks.",
  "Finance gap added to the dashboard and document checklist.",
  "SOP review moved ahead of final university submissions.",
];

const documentLabels = {
  approved: "Ready",
  review: "Review",
  missing: "Missing",
  ai_check: "Review",
};

function toneClass(tone: string) {
  return cn(
    tone === "good" && "border-emerald-200 bg-emerald-50 text-emerald-800",
    tone === "watch" && "border-[#F8B133]/40 bg-[#F8B133]/10 text-[#7A5200]",
    tone === "action" && "border-red-200 bg-red-50 text-red-700",
  );
}

export default function EdgeReportPage() {
  const report = demoEdgeReport;
  const demoJourney = useDemoJourneyState();
  const selectedCountry = demoJourney.countryLock?.countryName ?? report.preferredCountries[0].country;
  const budget = report.financialReadiness.budgetUsd;
  const confirmed = report.financialReadiness.confirmedFundsUsd;
  const gap = report.financialReadiness.fundingGapUsd;
  const fundingProgress = Math.round((confirmed / budget) * 100);

  return (
    <AppLayout>
      <div data-testid="edge-report-page">
        <PageHeader
          eyebrow="ELEE Report"
          title="Your study-abroad readiness report"
          description={`ELEE ranks routes, explains why ${selectedCountry} fits, and shows the exact tasks that improve applications, finance, documents, and visa readiness.`}
          actions={
            <>
              <Link href="/dashboard">
                <Button variant="outline" className="rounded-full font-serif">Back to dashboard</Button>
              </Link>
              <Link href="/documents">
                <Button className="rounded-full font-serif">Fix blockers</Button>
              </Link>
            </>
          }
        />

        <section className="mb-5 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <div className="brand-gradient-bg h-1.5" />
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="p-5 md:p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="flex h-36 w-36 flex-shrink-0 flex-col items-center justify-center rounded-full border-[10px] border-primary/15 bg-muted/50 text-center">
                  <div className="font-serif text-5xl font-bold leading-none text-primary">{report.clarityScore}</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">ELEE score</div>
                </div>
                <div className="min-w-0 flex-1">
                  <Badge className="mb-4 rounded-full border-primary/20 bg-primary/10 px-3 text-xs text-primary hover:bg-primary/10">
                    Updated {report.generatedAt}
                  </Badge>
                  <h2 className="max-w-3xl font-serif text-3xl font-bold leading-tight text-foreground">
                    {selectedCountry} should lead your application plan.
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                    The profile is strong for computer science and AI programs. The next score improvement comes from finance proof, final SOP polish, and moving shortlisted universities into applications.
                  </p>
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Best country</div>
                      <div className="mt-1 font-serif text-lg font-bold text-foreground">{selectedCountry}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Funding gap</div>
                      <div className="mt-1 font-serif text-lg font-bold text-foreground">${Math.round(gap / 1000)}k</div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Current blocker</div>
                      <div className="mt-1 font-serif text-lg font-bold text-foreground">Finance proof</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="border-t border-border bg-muted/35 p-5 xl:border-l xl:border-t-0">
              <div className="eyebrow mb-3">Finance summary</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-white p-3">
                  <div className="font-serif text-xl font-bold text-foreground">${Math.round(budget / 1000)}k</div>
                  <div className="mt-1 text-xs text-muted-foreground">Total budget</div>
                </div>
                <div className="rounded-lg border border-border bg-white p-3">
                  <div className="font-serif text-xl font-bold text-foreground">${Math.round(confirmed / 1000)}k</div>
                  <div className="mt-1 text-xs text-muted-foreground">Confirmed funds</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-semibold text-muted-foreground">Funding readiness</span>
                <span className="font-serif font-bold text-foreground">{fundingProgress}%</span>
              </div>
              <Progress value={fundingProgress} className="mt-2 h-2" />
              <Link href="/loans">
                <Button className="mt-4 w-full rounded-full font-serif">Review finance options</Button>
              </Link>
            </aside>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-5">
            <Card className="app-card p-4">
              <SectionHeader title="Route ranking" description="Countries ranked by study fit, budget fit, visa path, and career outcomes." />
              <div className="space-y-3">
                {report.preferredCountries.map((country, index) => (
                  <div key={country.country} className="rounded-lg border border-border bg-muted/25 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Route {index + 1}</div>
                        <div className="mt-1 font-serif text-lg font-bold text-foreground">{country.country}</div>
                      </div>
                      <Badge variant="secondary" className="w-fit rounded-full">{country.score}% fit</Badge>
                    </div>
                    <Progress value={country.score} className="mt-3 h-2" />
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{country.rationale}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="app-card p-4">
              <SectionHeader title="Readiness summary" description="The four areas that most affect the next decision." />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {readinessCards.map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">{item.label}</div>
                        <div className="mt-2 font-serif text-2xl font-bold text-foreground">{item.value}</div>
                      </div>
                      <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", toneClass(item.tone))}>
                        {item.tone === "good" ? "Ready" : item.tone === "action" ? "Fix next" : "Review"}
                      </span>
                    </div>
                    <Progress value={item.progress} className="mt-4 h-2" />
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="app-card p-4">
              <SectionHeader title="Missing or weak items" description="Fix these before payment-heavy applications." />
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                {blockers.map((blocker) => (
                  <Link key={blocker.title} href={blocker.href}>
                    <div className="h-full rounded-lg border border-red-200 bg-red-50 p-4 transition-all hover:border-red-300 hover:bg-red-100/60">
                      <div className="font-serif text-base font-bold leading-tight text-red-800">{blocker.title}</div>
                      <p className="mt-2 text-sm leading-6 text-red-700/85">{blocker.detail}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </section>

          <aside className="space-y-5">
            <Card className="app-card p-4">
              <SectionHeader title="Next 3 actions" />
              <div className="space-y-3">
                {nextActions.map((action, index) => (
                  <Link key={action.label} href={action.href}>
                    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/25 p-3 transition-all hover:border-primary/35 hover:bg-primary/5">
                      <div className="brand-gradient-bg flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg font-serif text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-serif text-sm font-bold text-foreground">{action.label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{action.owner} · {action.due}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="app-card p-4">
              <SectionHeader title="Documents" href="/documents" />
              <div className="space-y-2">
                {report.documentChecklist.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/25 px-3 py-2">
                    <span className="text-sm font-semibold text-foreground">{doc.label}</span>
                    <Badge variant="outline" className={cn("rounded-full", doc.status === "approved" ? toneClass("good") : doc.status === "missing" ? toneClass("action") : toneClass("watch"))}>
                      {documentLabels[doc.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="app-card p-4">
              <SectionHeader title="Family readiness" />
              <div className="space-y-3">
                {report.familyReadiness.map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-muted/25 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-serif text-sm font-bold text-foreground">{item.label}</div>
                      <Badge variant="outline" className="rounded-full">{item.status}</Badge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>

        <Card className="app-card mt-5 p-4">
          <SectionHeader title="What changed recently" description="Simple updates from your latest profile, shortlist, and finance information." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {recentUpdates.map((update) => (
              <div key={update} className="rounded-lg border border-border bg-muted/25 p-3 text-sm leading-6 text-muted-foreground">
                {update}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
