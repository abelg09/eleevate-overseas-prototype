import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ModuleStatusBadge, PageHeader, SectionHeader } from "@/components/common/page-shell";
import { demystifiedJourneyStages } from "@/lib/demo-data";

const operatingLoop = [
  {
    label: "Daily intelligent to-do list",
    detail: "The system detects each student's status and generates the next consultant task before work slips.",
  },
  {
    label: "What happens next",
    detail: "When a step is completed, the team sees the upcoming steps and can share the same view with the student.",
  },
  {
    label: "Human approval gates",
    detail: "AI prepares, checks, and routes work, while the team approves critical documents, offers, visa strategy, and final communication.",
  },
];

export default function JourneyMapPage() {
  const liveStages = demystifiedJourneyStages.filter((stage) => stage.status === "live").length;
  const averageProgress = Math.round(
    demystifiedJourneyStages.reduce((total, stage) => total + stage.progress, 0) / demystifiedJourneyStages.length,
  );

  return (
    <AppLayout>
      <div data-testid="journey-map-page">
        <PageHeader
          eyebrow="Study Abroad, Demystified"
          title="One journey map from first enquiry to alumni advocacy"
          description="The student sees a clear checklist. The consultant sees a daily operating system. AI handles validation, routing, summaries, and reminders while the team keeps strategic control."
          actions={
            <>
              <Link href="/applications">
                <Button variant="outline" className="rounded-full font-serif">Open applications</Button>
              </Link>
              <Link href="/documents">
                <Button className="rounded-full font-serif">Start document check</Button>
              </Link>
            </>
          }
        />

        <section className="route-ribbon-bg mb-5 rounded-lg border border-border shadow-sm">
          <div className="brand-gradient-bg h-1.5" />
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="p-5 md:p-6">
              <Badge className="mb-4 rounded-full border-primary/20 bg-primary/10 px-3 text-xs text-primary hover:bg-primary/10">
                Your biggest dream, turned into tracked steps
              </Badge>
              <h2 className="max-w-4xl font-serif text-3xl font-bold leading-tight text-foreground">
                From confusion to clarity, every stage has a student action, an automation layer, and a consultant approval point.
              </h2>
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  { label: "Journey stages", value: String(demystifiedJourneyStages.length), detail: "Inquiry to arrival" },
                  { label: "Live modules", value: String(liveStages), detail: "Ready for demo review" },
                  { label: "Prototype coverage", value: `${averageProgress}%`, detail: "Across all stages" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</div>
                    <div className="mt-2 font-serif text-3xl font-bold text-foreground">{item.value}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
            <aside className="border-t border-border bg-muted/35 p-5 xl:border-l xl:border-t-0">
              <div className="eyebrow mb-3">Operating promise</div>
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-white p-4">
                  <div className="font-serif text-sm font-bold text-foreground">Student clarity</div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">What to do, why it matters, who owns it, and what comes next.</p>
                </div>
                <div className="rounded-lg border border-border bg-white p-4">
                  <div className="font-serif text-sm font-bold text-foreground">Team control</div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">Automation accelerates the work, but final judgement stays with consultants.</p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mb-5">
          <SectionHeader title="Eight-stage journey" description="Built from the student video and consultancy automation deck." />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {demystifiedJourneyStages.map((stage, index) => (
              <Card key={stage.id} className="app-card overflow-hidden p-0">
                <div className="flex items-stretch">
                  <div className="brand-gradient-bg flex w-16 flex-shrink-0 items-center justify-center text-white">
                    <span className="font-serif text-xl font-bold">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="min-w-0 flex-1 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="font-serif text-lg font-bold leading-tight text-foreground">{stage.stage}</div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{stage.promise}</p>
                      </div>
                      <ModuleStatusBadge status={stage.status} />
                    </div>
                    <Progress value={stage.progress} className="mt-4 h-2" />
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-border bg-muted/25 p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Student</div>
                        <p className="mt-1 text-xs leading-5 text-foreground">{stage.studentAction}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/25 p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Automation</div>
                        <p className="mt-1 text-xs leading-5 text-foreground">{stage.automation}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/25 p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Team</div>
                        <p className="mt-1 text-xs leading-5 text-foreground">{stage.teamAction}</p>
                      </div>
                    </div>
                    <Link href={stage.href}>
                      <Button variant="ghost" size="sm" className="mt-3 px-0 font-serif text-primary hover:bg-transparent">
                        Open related module
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="app-card p-4">
            <SectionHeader title="Operational loop" description="How the platform stays two steps ahead." />
            <div className="space-y-3">
              {operatingLoop.map((item, index) => (
                <div key={item.label} className="rounded-lg border border-border bg-muted/25 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Loop {index + 1}</div>
                  <div className="mt-1 font-serif text-base font-bold text-foreground">{item.label}</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="app-card border-primary/20 bg-primary/5 p-5">
            <div className="border-l-4 border-l-primary pl-4">
              <div className="font-serif text-lg font-bold text-foreground">Build principle</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                EleevateOverseas should feel like a guided operating system, not a directory. Every module needs a clear owner, next action, status, evidence, and handoff between student, AI, consultant, finance, university, visa, and alumni.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/dashboard">
                <Button variant="outline" className="rounded-full font-serif">Back to dashboard</Button>
              </Link>
              <Link href="/consultant/dashboard">
                <Button className="rounded-full font-serif">Open consultant OS</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
