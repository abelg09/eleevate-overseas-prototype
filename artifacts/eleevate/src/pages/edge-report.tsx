import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader, TaskQueue } from "@/components/common/page-shell";
import { demoEdgeReport } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const profileToneStyles = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-800",
  watch: "border-[#F8B133]/40 bg-[#F8B133]/10 text-[#7A5200]",
  action: "border-red-200 bg-red-50 text-red-700",
};

const documentStatusStyles = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  review: "border-primary/20 bg-primary/5 text-primary",
  missing: "border-red-200 bg-red-50 text-red-700",
  ai_check: "border-[#F8B133]/40 bg-[#F8B133]/10 text-[#7A5200]",
};

const documentStatusLabels = {
  approved: "Approved",
  review: "Review",
  missing: "Missing",
  ai_check: "ELLE check",
};

const decisionSummary = [
  { label: "Best route", value: "Canada", note: "Highest study fit and post-study pathway confidence." },
  { label: "Main blocker", value: "Finance proof", note: "Sponsor documents need to close an $8k evidence gap." },
  { label: "Application story", value: "Promising", note: "Projects are strong, SOP needs a sharper motivation arc." },
  { label: "Family decision", value: "Needs briefing", note: "Cost timeline should be shared before fee payments." },
];

const readinessMatrix = [
  { label: "Academic fit", value: "91%", progress: 91, status: "Ready", tone: "good" },
  { label: "Document packet", value: "67%", progress: 67, status: "Cleanup", tone: "watch" },
  { label: "Visa confidence", value: "Medium", progress: 54, status: "Proof-led", tone: "action" },
  { label: "Family clarity", value: "72%", progress: 72, status: "Briefing", tone: "watch" },
];

function scoreToneClass(tone: string) {
  return cn(
    tone === "good" && "border-emerald-200 bg-emerald-50 text-emerald-800",
    tone === "watch" && "border-[#F8B133]/40 bg-[#F8B133]/10 text-[#7A5200]",
    tone === "action" && "border-red-200 bg-red-50 text-red-700",
  );
}

export default function EdgeReportPage() {
  const report = demoEdgeReport;
  const budget = report.financialReadiness.budgetUsd;
  const confirmed = report.financialReadiness.confirmedFundsUsd;
  const gap = report.financialReadiness.fundingGapUsd;
  const fundingProgress = Math.round((confirmed / budget) * 100);
  const primaryCountry = report.preferredCountries[0];

  return (
    <AppLayout>
      <div data-testid="edge-report-page">
        <PageHeader
          eyebrow="ELLE Clarity Report"
          title={`${report.studentName}'s decision dossier`}
          description="A consultant-ready view of country fit, family readiness, finance evidence, documents, and the actions that improve the student journey fastest."
          actions={
            <>
              <Button variant="outline" className="rounded-full font-serif">
                Export PDF
              </Button>
              <Link href="/documents">
                <Button className="rounded-full font-serif">
                  Fix blockers
                </Button>
              </Link>
            </>
          }
        />

        <section className="mb-5 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <div className="brand-gradient-bg h-1.5" />
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="p-5 md:p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="flex h-36 w-36 flex-shrink-0 flex-col items-center justify-center rounded-full border-[10px] border-primary/15 bg-muted/50 text-center">
                  <div className="font-serif text-5xl font-bold leading-none text-primary">{report.clarityScore}</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">ELLE score</div>
                </div>
                <div className="min-w-0 flex-1">
                  <Badge className="mb-4 rounded-full border-primary/20 bg-primary/10 px-3 text-xs text-primary hover:bg-primary/10">
                    Generated {report.generatedAt}
                  </Badge>
                  <h2 className="max-w-3xl font-serif text-3xl font-bold leading-tight text-foreground">
                    {report.readinessBand}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {primaryCountry.country} should lead the application route. The profile is strong, but confidence depends on finance evidence, SOP clarity, and turning the shortlist into tracked applications.
                  </p>
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {decisionSummary.map((item) => (
                      <div key={item.label} className="rounded-lg border border-border bg-muted/30 p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</div>
                        <div className="mt-1 font-serif text-lg font-bold leading-6 text-foreground">{item.value}</div>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <aside className="border-t border-border bg-muted/35 p-5 xl:border-l xl:border-t-0">
              <div className="eyebrow mb-3">Consultant verdict</div>
              <div className="rounded-lg border border-primary/20 bg-white p-4">
                <div className="text-sm font-semibold text-foreground">Proceed with targeted cleanup</div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Submit high-fit applications after the finance proof bundle and SOP review are completed.
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-white p-3">
                  <div className="font-serif text-xl font-bold text-foreground">${Math.round(gap / 1000)}k</div>
                  <div className="mt-1 text-xs text-muted-foreground">Evidence gap</div>
                </div>
                <div className="rounded-lg border border-border bg-white p-3">
                  <div className="font-serif text-xl font-bold text-foreground">{fundingProgress}%</div>
                  <div className="mt-1 text-xs text-muted-foreground">Funding ready</div>
                </div>
              </div>
              <Link href="/applications">
                <Button className="mt-4 w-full rounded-full font-serif">Open applications</Button>
              </Link>
            </aside>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-5">
            <Card className="app-card p-4">
              <SectionHeader title="Country route" description="Ranked by profile fit, budget, outcomes, and visa feasibility." />
              <div className="space-y-3">
                {report.preferredCountries.map((country, index) => (
                  <div key={country.country} className="rounded-lg border border-border bg-muted/25 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Route {index + 1}</div>
                        <div className="mt-1 font-serif text-lg font-bold text-foreground">{country.country}</div>
                      </div>
                      <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">{country.score}% fit</Badge>
                    </div>
                    <Progress value={country.score} className="mt-3 h-2" />
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{country.rationale}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="app-card p-4">
              <SectionHeader title="Readiness matrix" description="The four areas that affect admission confidence and visa risk." />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {readinessMatrix.map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-muted/25 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground">{item.label}</div>
                        <div className="mt-2 font-serif text-2xl font-bold leading-none text-foreground">{item.value}</div>
                      </div>
                      <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", scoreToneClass(item.tone))}>
                        {item.status}
                      </span>
                    </div>
                    <Progress value={item.progress} className="mt-4 h-2" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="app-card p-4">
              <SectionHeader title="Student profile signals" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {report.profileInsights.map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-muted-foreground">{item.label}</div>
                        <div className="mt-1 text-sm font-semibold leading-5 text-foreground">{item.value}</div>
                      </div>
                      <span className={cn("flex-shrink-0 rounded-full border px-2 py-1 text-xs font-semibold", profileToneStyles[item.tone])}>
                        {item.tone}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <aside className="space-y-5">
            <Card className="app-card p-4">
              <SectionHeader title="Finance proof stack" href="/loans" />
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-muted/25 p-3">
                    <div className="font-serif text-xl font-bold text-foreground">${Math.round(budget / 1000)}k</div>
                    <div className="mt-1 text-xs text-muted-foreground">Total budget</div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/25 p-3">
                    <div className="font-serif text-xl font-bold text-foreground">${Math.round(confirmed / 1000)}k</div>
                    <div className="mt-1 text-xs text-muted-foreground">Confirmed funds</div>
                  </div>
                </div>
                <div className="rounded-lg border border-[#F8B133]/40 bg-[#F8B133]/10 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#7A5200]">Funding readiness</span>
                    <span className="font-semibold text-foreground">{fundingProgress}%</span>
                  </div>
                  <Progress value={fundingProgress} className="mt-3 h-2" />
                </div>
                {report.financialReadiness.notes.map((note) => (
                  <div key={note} className="rounded-lg border border-border bg-white p-3 text-xs leading-5 text-muted-foreground">
                    {note}
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
                      <div className="text-sm font-semibold text-foreground">{item.label}</div>
                      <Badge variant="outline" className="rounded-full">{item.status}</Badge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="app-card p-4">
            <SectionHeader title="Document packet" description="What is ready, what needs review, and what blocks visa confidence." href="/documents" />
            <div className="space-y-3">
              {report.documentChecklist.map((doc) => (
                <div key={doc.id} className="rounded-lg border border-border bg-white p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground">{doc.label}</div>
                      <div className="mt-1 text-xs capitalize text-muted-foreground">Owner: {doc.owner}</div>
                    </div>
                    <span className={cn("w-fit rounded-full border px-2.5 py-1 text-xs font-semibold", documentStatusStyles[doc.status])}>
                      {documentStatusLabels[doc.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="app-card p-4">
            <SectionHeader title="Action plan" description="Work in this order to improve the ELLE score fastest." href="/dashboard" />
            <TaskQueue tasks={report.actionPlan} />
          </Card>
        </div>

        <Card className="app-card mt-5 border-primary/20 bg-primary/5 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="border-l-4 border-l-primary pl-4">
              <div className="font-serif text-lg font-bold text-foreground">Recommended next step</div>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                Build the sponsor evidence bundle first, then rerun ELLE before finalising payment-heavy applications.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/loans">
                <Button variant="outline" className="rounded-full font-serif">Review finance</Button>
              </Link>
              <Link href="/documents">
                <Button className="rounded-full font-serif">Upload proof</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
