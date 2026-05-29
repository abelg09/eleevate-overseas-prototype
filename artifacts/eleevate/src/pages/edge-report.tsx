import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader, TaskQueue } from "@/components/common/page-shell";
import { cn } from "@/lib/utils";
import { demoEdgeReport } from "@/lib/demo-data";

const toneStyles = {
  good: "bg-emerald-100 text-emerald-700",
  watch: "bg-amber-100 text-amber-700",
  action: "bg-red-100 text-red-700",
};

const docStyles = {
  approved: "bg-emerald-100 text-emerald-700",
  review: "bg-blue-100 text-blue-700",
  missing: "bg-red-100 text-red-700",
  ai_check: "bg-purple-100 text-purple-700",
};

const docDotStyles = {
  approved: "bg-emerald-500",
  review: "bg-primary",
  missing: "bg-red-500",
  ai_check: "bg-[#F8B133]",
};

const docLabels = {
  approved: "Approved",
  review: "Review",
  missing: "Missing",
  ai_check: "AI check",
};

export default function EdgeReportPage() {
  const report = demoEdgeReport;
  const fundingProgress = Math.round((report.financialReadiness.confirmedFundsUsd / report.financialReadiness.budgetUsd) * 100);

  return (
    <AppLayout>
      <div data-testid="edge-report-page">
        <PageHeader
          eyebrow="ELLE Clarity Report"
          title={`${report.studentName}'s overseas readiness snapshot`}
          description="A practical decision report for students, families, and consultants: country fit, document readiness, funding clarity, and the next actions that unblock the journey."
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

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="app-card p-5">
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_140px] md:items-start">
              <div>
                <Badge className="brand-gradient-bg mb-3 rounded-full px-3 text-xs text-white hover:opacity-95">Generated {report.generatedAt}</Badge>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Readiness band</div>
                <div className="mt-2 font-serif text-2xl font-bold leading-tight text-foreground">{report.readinessBand}</div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  The student is a strong candidate, but the report flags finance evidence, SOP specificity, and family decision clarity as the next areas to close.
                </p>
              </div>
              <div className="mx-auto flex h-32 w-32 flex-shrink-0 flex-col items-center justify-center rounded-full border-[8px] border-primary/20 bg-muted text-center md:mx-0">
                <div className="font-serif text-4xl font-bold leading-none text-primary">{report.clarityScore}</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">ELLE Score</div>
              </div>
            </div>
          </Card>

          <Card className="app-card p-5">
            <SectionHeader title="Country fit" description="Ranked from profile, budget, outcomes, and visa feasibility." />
            <div className="space-y-3">
              {report.preferredCountries.map((country) => (
                <div key={country.country} className="rounded-lg border border-border bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-foreground">{country.country}</div>
                    <Badge variant="secondary">{country.score}% fit</Badge>
                  </div>
                  <Progress value={country.score} className="mt-3 h-1.5" />
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{country.rationale}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="app-card p-4">
            <SectionHeader title="Profile insights" />
            <div className="space-y-3">
              {report.profileInsights.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3">
                  <div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{item.value}</div>
                  </div>
                  <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", toneStyles[item.tone])}>
                    {item.tone}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="app-card p-4">
            <SectionHeader title="Family readiness" />
            <div className="space-y-3">
              {report.familyReadiness.map((item) => (
                <div key={item.label} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-foreground">{item.label}</div>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="app-card p-4">
            <SectionHeader title="Financial clarity" />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border border-l-4 border-l-primary bg-white p-3">
                <div className="text-xl font-bold text-foreground">${(report.financialReadiness.budgetUsd / 1000).toFixed(0)}k</div>
                <div className="text-xs text-muted-foreground">Budget</div>
              </div>
              <div className="rounded-lg border border-border border-l-4 border-l-emerald-400 bg-white p-3">
                <div className="text-xl font-bold text-foreground">${(report.financialReadiness.confirmedFundsUsd / 1000).toFixed(0)}k</div>
                <div className="text-xs text-muted-foreground">Confirmed</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Funding readiness</span>
                <span className="font-semibold text-foreground">{fundingProgress}%</span>
              </div>
              <Progress value={fundingProgress} className="h-2" />
            </div>
            <div className="mt-4 space-y-2">
              {report.financialReadiness.notes.map((note) => (
                <div key={note} className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#F8B133]" />
                  {note}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="app-card p-4">
            <SectionHeader title="Document readiness" href="/documents" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {report.documentChecklist.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <span className={cn("h-2.5 w-2.5 flex-shrink-0 rounded-full", docDotStyles[doc.status])} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{doc.label}</div>
                    <div className="text-xs capitalize text-muted-foreground">{doc.owner}</div>
                  </div>
                  <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", docStyles[doc.status])}>
                    {docLabels[doc.status]}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="app-card p-4">
            <SectionHeader title="Action plan" description="The next work items that improve the ELLE score fastest." />
            <TaskQueue tasks={report.actionPlan} />
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            { label: "Academic fit", value: "91%", tone: "border-l-emerald-400" },
            { label: "Visa risk", value: "Medium", tone: "border-l-[#F8B133]" },
            { label: "Family clarity", value: "72%", tone: "border-l-primary" },
            { label: "Decision confidence", value: "High", tone: "border-l-primary" },
          ].map((item) => (
            <Card key={item.label} className={cn("app-card border-l-4 p-4", item.tone)}>
              <div className="text-xl font-bold text-foreground">{item.value}</div>
              <div className="text-sm text-muted-foreground">{item.label}</div>
            </Card>
          ))}
        </div>

        <Card className="app-card mt-5 border-primary/20 bg-primary/5 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="border-l-4 border-l-primary pl-4">
              <div>
                <div className="font-semibold text-foreground">Recommended next step</div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Close the finance evidence gap first, then rerun the ELLE report to refresh visa risk and country priority.
                </p>
              </div>
            </div>
            <Link href="/loans">
              <Button className="rounded-full font-serif">Review finance options</Button>
            </Link>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
