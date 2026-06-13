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

export default function JourneyMapPage() {
  const snapshot = useStudentJourneySnapshot();
  const profile = useStudentWorkspaceProfile();
  const selectedRoute = profile?.targetCountries?.length ? profile.targetCountries.join(", ") : "Not chosen";

  return (
    <AppLayout>
      <div data-testid="journey-map-page">
        <PageHeader
          eyebrow="Journey Checklist"
          title="From profile to arrival, one step at a time"
          description="This map shows what the student does, what is required, and where to continue. Consultant tools stay separate from the student path."
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

        <section className="route-ribbon-bg mb-5 rounded-lg border border-border shadow-sm">
          <div className="brand-gradient-bg h-1.5" />
          <div className="p-5 md:p-6">
            <Badge className="mb-4 rounded-full border-primary/20 bg-white px-3 text-primary hover:bg-white">
              Current stage: {snapshot.currentStep.label}
            </Badge>
            <h2 className="max-w-4xl font-serif text-3xl font-bold leading-tight text-foreground">
              The journey is simple: choose the right route, apply properly, prepare documents early, then handle visa, finance, and arrival.
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
              {[
                { label: "Selected route", value: selectedRoute },
                { label: "Saved universities", value: String(snapshot.shortlistedCount) },
                { label: "Document readiness", value: `${snapshot.documentReadiness}%` },
                { label: "Next action", value: snapshot.currentStep.label },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border bg-white/85 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</div>
                  <div className="mt-2 font-serif text-2xl font-bold text-foreground">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-5">
          <SectionHeader title="Seven-step student journey" description="Each step has a clear job, requirement, and action button." />
          <div className="space-y-4">
            {snapshot.steps.map((stage, index) => {
              const guide = STUDENT_GUIDE_STEPS.find((item) => item.id === stage.id);

              return (
              <Card key={stage.id} className="app-card overflow-hidden p-0">
                <div className="grid gap-0 lg:grid-cols-[96px_minmax(0,1fr)_260px]">
                  <div className="brand-gradient-bg flex min-h-24 items-center justify-center text-white">
                    <div className="text-center">
                      <div className="font-serif text-2xl font-bold">{String(index + 1).padStart(2, "0")}</div>
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

                  <div className="flex items-center border-t border-border bg-muted/25 p-4 lg:border-l lg:border-t-0">
                    <Link href={stage.href} className="w-full">
                      <Button variant={stage.status === "current" ? "default" : "outline"} className="w-full rounded-full font-serif">
                        {stage.complete ? "Review" : stage.cta}
                      </Button>
                    </Link>
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
              <div className="font-serif text-lg font-bold text-foreground">Keep the student path calm</div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Extra modules like finance services, upskilling, alumni, rewards, news, and support stay grouped under More so the main path stays easy to follow.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/more">
                <Button variant="outline" className="rounded-full font-serif">Open More</Button>
              </Link>
              <Link href="/consultant/dashboard">
                <Button className="rounded-full font-serif">Consultant Workbench</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
