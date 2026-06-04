import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { STUDENT_GUIDE_STEPS } from "@/lib/student-guide";
import { cn } from "@/lib/utils";

function toneClass(tone: string) {
  return cn(
    tone === "done" && "border-emerald-200 bg-emerald-50 text-emerald-800",
    tone === "current" && "border-primary/25 bg-primary/5 text-primary",
    tone === "action" && "border-red-200 bg-red-50 text-red-700",
    tone === "next" && "border-[#F8B133]/40 bg-[#F8B133]/10 text-[#7A5200]",
  );
}

export default function JourneyMapPage() {
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
              <Link href="/documents">
                <Button className="rounded-full font-serif">Continue current step</Button>
              </Link>
            </>
          }
        />

        <section className="route-ribbon-bg mb-5 rounded-lg border border-border shadow-sm">
          <div className="brand-gradient-bg h-1.5" />
          <div className="p-5 md:p-6">
            <Badge className="mb-4 rounded-full border-primary/20 bg-white px-3 text-primary hover:bg-white">
              Current stage: Documents & Visa
            </Badge>
            <h2 className="max-w-4xl font-serif text-3xl font-bold leading-tight text-foreground">
              The journey is simple: choose the right route, apply properly, prepare documents early, then handle visa, finance, and arrival.
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
              {[
                { label: "Selected route", value: "Canada" },
                { label: "Saved universities", value: "4" },
                { label: "Document readiness", value: "67%" },
                { label: "Urgent blocker", value: "Finance proof" },
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
            {STUDENT_GUIDE_STEPS.map((stage, index) => (
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
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{stage.whatStudentDoes}</p>
                      </div>
                      <Badge variant="outline" className={cn("w-fit rounded-full", toneClass(stage.tone))}>{stage.status}</Badge>
                    </div>
                    <div className="mt-4 rounded-lg border border-border bg-muted/25 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Required</div>
                      <p className="mt-1 text-sm leading-6 text-foreground">{stage.required}</p>
                    </div>
                    <Progress value={stage.progress} className="mt-4 h-2" />
                  </div>

                  <div className="flex items-center border-t border-border bg-muted/25 p-4 lg:border-l lg:border-t-0">
                    <Link href={stage.href} className="w-full">
                      <Button variant={stage.tone === "action" || stage.tone === "current" ? "default" : "outline"} className="w-full rounded-full font-serif">
                        Continue
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
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
