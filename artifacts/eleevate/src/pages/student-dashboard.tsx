import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ModuleCard,
  PageHeader,
  SectionHeader,
  TaskQueue,
} from "@/components/common/page-shell";
import {
  demoEdgeReport,
  financeSignals,
  studentJourneyTasks,
  studentModules,
} from "@/lib/demo-data";
import { demoUser } from "@/lib/demo-mode";
import { cn } from "@/lib/utils";

const journeyStages = [
  { label: "Profile", status: "Complete", progress: 100, tone: "good" },
  { label: "Shortlist", status: "4 saved", progress: 72, tone: "good" },
  { label: "Applications", status: "Researching", progress: 46, tone: "watch" },
  { label: "Documents", status: "Needs proof", progress: 67, tone: "action" },
  { label: "Visa", status: "Pre-check", progress: 38, tone: "action" },
  { label: "Arrival", status: "Preview", progress: 18, tone: "muted" },
];

const readinessSignals = [
  { label: "Country fit", value: "88%", detail: "Canada is the strongest route", progress: 88, tone: "good" },
  { label: "Document readiness", value: "67%", detail: "SOP and finance proof pending", progress: 67, tone: "watch" },
  { label: "Visa confidence", value: "Medium", detail: "Funding evidence decides risk", progress: 54, tone: "action" },
  { label: "Upskilling", value: "61%", detail: "IELTS writing is next", progress: 61, tone: "primary" },
];

const countryBriefs = [
  { country: "Canada", fit: 88, decision: "Lead choice", note: "Strong CS fit, PGWP pathway, sponsor budget close." },
  { country: "United Kingdom", fit: 81, decision: "Backup strong", note: "One-year masters works, but finance proof needs polish." },
  { country: "Germany", fit: 74, decision: "Value route", note: "Low tuition, needs language and timing discipline." },
];

const nextActions = [
  "Upload sponsor bank statement and loan pre-approval",
  "Approve SOP direction before university submission",
  "Confirm Toronto and Manchester application deadlines",
];

function toneClass(tone: string) {
  return cn(
    tone === "good" && "border-emerald-200 bg-emerald-50 text-emerald-800",
    tone === "watch" && "border-[#F8B133]/40 bg-[#F8B133]/10 text-[#7A5200]",
    tone === "action" && "border-red-200 bg-red-50 text-red-700",
    tone === "primary" && "border-primary/20 bg-primary/5 text-primary",
    tone === "muted" && "border-border bg-muted/40 text-muted-foreground",
  );
}

export default function StudentDashboardPage() {
  const user = demoUser.student;
  const urgentTasks = studentJourneyTasks.filter((task) => task.status !== "done").slice(0, 4);
  const financeGap = demoEdgeReport.financialReadiness.fundingGapUsd;

  return (
    <AppLayout>
      <div data-testid="student-dashboard">
        <PageHeader
          eyebrow="Student Journey OS"
          title={`Good morning, ${user.firstName}`}
          description="A clean operating view for decisions, deadlines, documents, finance, visa readiness, and the next action that moves the journey forward."
          actions={
            <>
              <Link href="/elle-report">
                <Button variant="outline" className="rounded-full font-serif">
                  Open ELLE report
                </Button>
              </Link>
              <Link href="/universities">
                <Button className="rounded-full font-serif">
                  Explore universities
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
                  <div className="font-serif text-5xl font-bold leading-none text-primary">{demoEdgeReport.clarityScore}</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">ELLE score</div>
                </div>
                <div className="min-w-0 flex-1">
                  <Badge className="mb-4 rounded-full border-primary/20 bg-primary/10 px-3 text-xs text-primary hover:bg-primary/10">
                    This week&apos;s decision brief
                  </Badge>
                  <h2 className="max-w-3xl font-serif text-3xl font-bold leading-tight text-foreground">
                    Strong study fit, but finance proof is now the main blocker.
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                    Canada remains the lead route. The next improvement comes from closing the ${Math.round(financeGap / 1000)}k funding gap, finalising the SOP narrative, and moving the shortlist into tracked applications.
                  </p>
                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {nextActions.map((action, index) => (
                      <div key={action} className="rounded-lg border border-border bg-muted/35 p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Next {index + 1}</div>
                        <div className="mt-1 text-sm font-semibold leading-5 text-foreground">{action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <aside className="border-t border-border bg-muted/35 p-5 xl:border-l xl:border-t-0">
              <div className="eyebrow mb-3">72 hour focus</div>
              <div className="space-y-3">
                {[
                  { label: "Finance evidence", value: "Missing sponsor bundle", tone: "action" },
                  { label: "Applications", value: "Start from shortlist", tone: "watch" },
                  { label: "Learning", value: "IELTS writing mock", tone: "primary" },
                ].map((item) => (
                  <div key={item.label} className={cn("rounded-lg border px-3 py-3", toneClass(item.tone))}>
                    <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{item.label}</div>
                    <div className="mt-1 text-sm font-bold leading-5">{item.value}</div>
                  </div>
                ))}
              </div>
              <Link href="/documents">
                <Button className="mt-4 w-full rounded-full font-serif">Open document vault</Button>
              </Link>
            </aside>
          </div>
        </section>

        <section className="mb-5">
          <SectionHeader title="Journey status" description="The whole student journey in one scan, from profile to arrival." href="/applications" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {journeyStages.map((stage, index) => (
              <Card key={stage.label} className="app-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Step {index + 1}</div>
                  <span className={cn("h-2.5 w-2.5 rounded-full", stage.tone === "good" && "bg-emerald-500", stage.tone === "watch" && "bg-[#F8B133]", stage.tone === "action" && "bg-red-500", stage.tone === "muted" && "bg-muted-foreground/35")} />
                </div>
                <div className="mt-3 font-serif text-base font-bold text-foreground">{stage.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{stage.status}</div>
                <Progress value={stage.progress} className="mt-4 h-1.5" />
              </Card>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section>
            <SectionHeader title="Readiness signals" description="No decoration, just the numbers that change decisions." />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {readinessSignals.map((signal) => (
                <Card key={signal.label} className="app-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">{signal.label}</div>
                      <div className="mt-2 font-serif text-2xl font-bold text-foreground">{signal.value}</div>
                    </div>
                    <Badge variant="outline" className={cn("rounded-full", toneClass(signal.tone))}>{signal.tone}</Badge>
                  </div>
                  <Progress value={signal.progress} className="mt-4 h-2" />
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">{signal.detail}</p>
                </Card>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <Card className="app-card p-4">
                <SectionHeader title="Country decision table" />
                <div className="space-y-3">
                  {countryBriefs.map((item) => (
                    <div key={item.country} className="rounded-lg border border-border bg-muted/25 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-serif text-sm font-bold text-foreground">{item.country}</div>
                        <Badge variant="secondary" className="rounded-full">{item.fit}%</Badge>
                      </div>
                      <div className="mt-2 text-xs font-semibold text-primary">{item.decision}</div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="app-card p-4">
                <SectionHeader title="Finance and visa" href="/loans" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {financeSignals.map((signal) => (
                    <div key={signal.label} className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className={cn("h-2.5 w-2.5 rounded-full", signal.tone === "good" && "bg-emerald-500", signal.tone === "watch" && "bg-[#F8B133]", signal.tone === "action" && "bg-red-500")} />
                        <div className="font-serif text-lg font-bold text-foreground">{signal.value}</div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">{signal.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg border border-[#F8B133]/30 bg-[#F8B133]/10 p-3 text-sm leading-6 text-foreground">
                  <span className="mr-2 rounded-full bg-[#F8B133]/30 px-2 py-0.5 text-xs font-semibold text-foreground">Action</span>
                  Funding proof is the main visa blocker. Upload sponsor statements before paying more application fees.
                </div>
              </Card>
            </div>
          </section>

          <aside className="space-y-5">
            <Card className="app-card p-4">
              <SectionHeader title="Action queue" description="Sorted by what unlocks progress fastest." href="/elle-report" />
              <TaskQueue tasks={urgentTasks} compact />
            </Card>
            <Card className="app-card p-4">
              <SectionHeader title="Module hub" description="Priority modules for this student." />
              <div className="space-y-3">
                {studentModules.slice(0, 4).map((module) => (
                  <ModuleCard key={module.id} module={module} />
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
