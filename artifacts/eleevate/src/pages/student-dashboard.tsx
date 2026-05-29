import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MetricCard,
  ModuleCard,
  PageHeader,
  SectionHeader,
  TaskQueue,
  TimelineStepper,
} from "@/components/common/page-shell";
import {
  applicationTimeline,
  demoEdgeReport,
  financeSignals,
  studentJourneyTasks,
  studentModules,
} from "@/lib/demo-data";
import { demoUser } from "@/lib/demo-mode";
import { cn } from "@/lib/utils";

export default function StudentDashboardPage() {
  const user = demoUser.student;
  const urgentTasks = studentJourneyTasks.filter((task) => task.status !== "done").slice(0, 4);
  const readinessSignals = [
    { label: "Country fit", value: "88%", detail: "Canada + UK strongest", tone: "good" as const },
    { label: "Document readiness", value: "67%", detail: "SOP and finance pending", tone: "watch" as const },
    { label: "Visa risk", value: "Medium", detail: "Funding proof blocker", tone: "action" as const },
    { label: "Upskilling progress", value: "61%", detail: "IELTS writing next", tone: "primary" as const },
  ];
  const journeyPulse = [
    { label: "Profile", value: "Complete", tone: "good" as const },
    { label: "Shortlist", value: "4 saved", tone: "primary" as const },
    { label: "Applications", value: "2 active", tone: "watch" as const },
    { label: "Visa", value: "Pre-check", tone: "action" as const },
  ];

  return (
    <AppLayout>
      <div data-testid="student-dashboard">
        <PageHeader
          eyebrow="Student Journey OS"
          title={`Good morning, ${user.firstName}`}
          description="Your overseas journey is organized around readiness, applications, documents, visa risk, finance, upskilling, and the next best action."
          actions={
            <>
              <Link href="/edge-report">
                <Button variant="outline" className="rounded-full font-serif">
                  View EDGE+ report
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

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
            <div className="brand-gradient-bg h-1.5" />
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_230px]">
              <div className="p-5 md:p-6">
              <div className="min-w-0">
                <Badge className="mb-4 rounded-full border-primary/20 bg-primary/10 px-3 text-xs text-primary hover:bg-primary/10">EDGE+ readiness</Badge>
                <h2 className="max-w-xl font-serif text-3xl font-bold leading-tight text-foreground">{demoEdgeReport.readinessBand}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Your profile is strong for Canada and the UK. The fastest way to raise confidence is to close finance evidence, finish the SOP review, and confirm upcoming application deadlines.
                </p>
                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {readinessSignals.map((item) => (
                      <div
                        key={item.label}
                        className={cn(
                          "min-w-0 rounded-lg border bg-muted/40 p-3",
                          item.tone === "primary" && "border-l-4 border-l-primary",
                          item.tone === "good" && "border-l-4 border-l-emerald-400",
                          item.tone === "watch" && "border-l-4 border-l-[#F8B133]",
                          item.tone === "action" && "border-l-4 border-l-red-400",
                        )}
                      >
                        <div className="truncate font-serif text-lg font-bold leading-none text-foreground">{item.value}</div>
                        <div className="mt-1 text-[11px] leading-4 text-muted-foreground">{item.label}</div>
                        <div className="mt-2 text-[10px] leading-4 text-muted-foreground">{item.detail}</div>
                      </div>
                  ))}
                </div>
              </div>
              </div>
              <aside className="border-t border-border bg-muted/40 p-5 lg:border-l lg:border-t-0">
                <div className="mx-auto flex h-36 w-36 flex-col items-center justify-center rounded-full border-[10px] border-primary/15 bg-white text-center shadow-sm">
                  <div className="font-serif text-5xl font-bold leading-none text-primary">{demoEdgeReport.clarityScore}</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Clarity score</div>
                </div>
                <div className="mt-5 space-y-2">
                  {journeyPulse.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-md border border-border bg-white px-3 py-2 text-xs">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className={cn(
                        "font-semibold",
                        item.tone === "primary" && "text-primary",
                        item.tone === "good" && "text-emerald-700",
                        item.tone === "watch" && "text-[#A66B00]",
                        item.tone === "action" && "text-red-600",
                      )}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="eyebrow mb-1">Decision Queue</div>
                <h2 className="font-serif text-lg font-bold text-foreground">Next best actions</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Ranked by what unlocks the most progress this week.</p>
              </div>
              <Link href="/edge-report">
                <Button variant="outline" size="sm" className="rounded-full">Review</Button>
              </Link>
            </div>
            <div className="mb-3 rounded-lg border border-[#F8B133]/35 bg-[#F8B133]/10 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#8A5B00]">Primary blocker</div>
              <div className="mt-1 text-sm font-semibold leading-5 text-foreground">Finance proof must be closed before visa confidence improves.</div>
            </div>
            <TaskQueue tasks={urgentTasks} compact />
          </section>
        </div>

        <div className="mt-4">
          <SectionHeader title="Application journey" description="A single status map from research to arrival." href="/applications" />
          <TimelineStepper steps={applicationTimeline} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <SectionHeader title="Finance and visa signals" href="/loans" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {financeSignals.map((signal) => (
                <div key={signal.label} className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      signal.tone === "good" && "bg-emerald-500",
                      signal.tone === "watch" && "bg-[#F8B133]",
                      signal.tone === "action" && "bg-red-500",
                    )} />
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
          </section>

          <div className="p-1">
            <SectionHeader title="Module hub" description="Every super-app module is visible, even when still in preview." />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {studentModules.map((module) => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            { label: "Active applications", value: "7", detail: "3 urgent" },
            { label: "Upcoming deadline", value: "5 days", detail: "Toronto", tone: "watch" as const },
            { label: "Visa checklist", value: "48%", detail: "Needs offer", tone: "action" as const },
            { label: "Payments ready", value: "$38k", detail: "83% funded", tone: "good" as const },
          ].map((item) => (
            <MetricCard key={item.label} {...item} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
