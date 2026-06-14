import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { STUDENT_GUIDE_STEPS } from "@/lib/student-guide";
import { useStudentJourneySnapshot } from "@/lib/student-journey-state";
import { useStudentWorkspaceProfile } from "@/lib/student-workspace";
import { cn } from "@/lib/utils";

function statusClass(status: string) {
  return cn(
    status === "complete" && "border-emerald-200 bg-emerald-50 text-emerald-800",
    status === "current" && "border-primary/25 bg-primary/5 text-primary",
    status === "incomplete" && "border-border bg-muted/30 text-muted-foreground",
  );
}

const STEP_TOOLS: Record<string, Array<{ label: string; href: string }>> = {
  profile: [
    { label: "Profile form", href: "/profile" },
    { label: "Psychometric test", href: "/assessment" },
  ],
  "elee-report": [
    { label: "Generate report", href: "/elee-report" },
  ],
  "country-fit": [
    { label: "Compare countries", href: "/countries" },
    { label: "Find courses", href: "/course-finder" },
    { label: "University finder", href: "/universities" },
  ],
  shortlist: [
    { label: "Shortlist", href: "/shortlist" },
    { label: "Add universities", href: "/universities" },
  ],
  applications: [
    { label: "Applications", href: "/applications" },
    { label: "Draft SOP", href: "/sop-studio" },
    { label: "Find scholarship", href: "/scholarships" },
  ],
  "documents-visa": [
    { label: "Documents", href: "/documents" },
    { label: "Visa center", href: "/visa-center" },
  ],
  "finance-arrival": [
    { label: "Finance hub", href: "/financial-hub" },
    { label: "Education loan", href: "/loans" },
    { label: "Remittance", href: "/remittance" },
  ],
};

export default function JourneyMapPage() {
  const snapshot = useStudentJourneySnapshot();
  const profile = useStudentWorkspaceProfile();
  const selectedRoute = profile?.targetCountries?.length ? profile.targetCountries.join(", ") : "Not chosen";

  return (
    <AppLayout>
      <div data-testid="journey-map-page">
        <PageHeader
          eyebrow="Journey Checklist"
          title="Your study-abroad journey map"
          description="Follow the steps in order. Each card shows the job, the required details, and the exact page to open next."
          actions={
            <>
              <Link href="/dashboard">
                <Button variant="outline" className="rounded-full font-serif">Back to dashboard</Button>
              </Link>
              <Link href={snapshot.currentStep.href}>
                <Button className="rounded-full font-serif">Continue current step</Button>
              </Link>
            </>
          }
        />

        <section className="mb-5 rounded-lg border border-border bg-white p-4 shadow-sm md:p-5" data-testid="journey-status-panel">
          <div className="brand-gradient-bg h-1.5" />
          <div className="pt-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <Badge className="mb-3 rounded-full border-primary/20 bg-primary/5 px-3 text-primary hover:bg-primary/5">
                  Current step: {snapshot.currentStep.label}
                </Badge>
                <h2 className="max-w-3xl font-serif text-2xl font-bold leading-tight text-foreground md:text-3xl">
                  {snapshot.currentStep.cta}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {snapshot.currentStep.prompt}
                </p>
              </div>
              <Link href={snapshot.currentStep.href}>
                <Button className="w-full rounded-full font-serif sm:w-auto">Continue</Button>
              </Link>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Journey progress</span>
                <span>{snapshot.completedCount} of {snapshot.steps.length} steps complete</span>
              </div>
              <Progress value={snapshot.progress} className="h-2" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Selected route", value: selectedRoute },
                { label: "Saved universities", value: String(snapshot.shortlistedCount) },
                { label: "Documents", value: `${snapshot.documentReadiness}%` },
                { label: "Package", value: snapshot.packageName ?? "Not selected" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</div>
                  <div className="mt-1 truncate font-serif text-lg font-bold text-foreground">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-5">
          <SectionHeader title="Step-by-step path" description="Open only the page you need for the current step. Related tools are shown as small links." />
          <div className="space-y-4">
            {snapshot.steps.map((stage, index) => {
              const guide = STUDENT_GUIDE_STEPS.find((item) => item.id === stage.id);
              const tools = STEP_TOOLS[stage.id] ?? [{ label: stage.label, href: stage.href }];

              return (
              <Card key={stage.id} className="app-card overflow-hidden p-0">
                <div className="grid gap-0 lg:grid-cols-[80px_minmax(0,1fr)_300px]">
                  <div className={cn(
                    "flex min-h-20 items-center justify-center text-white",
                    stage.status === "complete" ? "bg-emerald-500" : stage.status === "current" ? "brand-gradient-bg" : "bg-slate-300",
                  )}>
                    <div className="text-center">
                      <div className="font-serif text-xl font-bold">{String(index + 1).padStart(2, "0")}</div>
                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-white/80">Step</div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-serif text-xl font-bold leading-tight text-foreground">{stage.label}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{guide?.whatStudentDoes ?? stage.prompt}</p>
                      </div>
                      <Badge variant="outline" className={cn("w-fit rounded-full", statusClass(stage.status))}>{stage.statusLabel}</Badge>
                    </div>
                    <div className="mt-4 rounded-lg border border-border bg-muted/25 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Required</div>
                      <p className="mt-1 text-sm leading-6 text-foreground">{guide?.required ?? stage.prompt}</p>
                    </div>
                    <Progress value={stage.complete ? 100 : stage.status === "current" ? 40 : 0} className="mt-4 h-2" />
                  </div>

                  <div className="border-t border-border bg-muted/20 p-4 lg:border-l lg:border-t-0">
                    <Link href={stage.href} className="block w-full">
                      <Button variant={stage.status === "current" ? "default" : "outline"} className="w-full rounded-full font-serif">
                        {stage.complete ? "Review" : stage.cta}
                      </Button>
                    </Link>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tools.map((tool) => (
                        <Link key={`${stage.id}-${tool.href}`} href={tool.href}>
                          <Button size="sm" variant="ghost" className="h-8 rounded-full border border-border bg-white px-3 text-xs font-semibold">
                            {tool.label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
            })}
          </div>
        </section>

        <Card className="app-card border-primary/20 bg-primary/5 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-serif text-lg font-bold text-foreground">Useful tools after the main step</div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Test prep, SOP drafting, scholarships, finance services, rewards, news, alumni, and support stay available without cluttering the core journey.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/test-prep">
                <Button variant="outline" className="rounded-full font-serif">Test prep</Button>
              </Link>
              <Link href="/sop-studio">
                <Button variant="outline" className="rounded-full font-serif">Draft SOP</Button>
              </Link>
              <Link href="/more">
                <Button className="rounded-full font-serif">More tools</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
