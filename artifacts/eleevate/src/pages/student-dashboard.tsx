import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { DEMO_UNIVERSITIES } from "@/lib/demo-catalog";
import { readDemoShortlistIds } from "@/lib/demo-flow";
import { STUDENT_GUIDE_STEPS } from "@/lib/student-guide";
import { hasStudentWorkspaceProfile, useStudentWorkspaceProfile } from "@/lib/student-workspace";
import { cn } from "@/lib/utils";

const documentStatus = [
  { label: "Passport", status: "Not uploaded" },
  { label: "Transcripts", status: "Not uploaded" },
  { label: "SOP", status: "Not started" },
  { label: "LOR", status: "Not started" },
  { label: "Finance proof", status: "Not uploaded" },
  { label: "Resume", status: "Not uploaded" },
];

function toneClass(tone: string) {
  return cn(
    tone === "done" && "border-emerald-200 bg-emerald-50 text-emerald-800",
    tone === "current" && "border-primary/25 bg-primary/5 text-primary",
    tone === "action" && "border-red-200 bg-red-50 text-red-700",
    tone === "next" && "border-[#F8B133]/40 bg-[#F8B133]/10 text-[#7A5200]",
  );
}

export default function StudentDashboardPage() {
  const profile = useStudentWorkspaceProfile();
  const hasProfile = hasStudentWorkspaceProfile(profile);
  const selectedIds = readDemoShortlistIds();
  const selectedUniversities = DEMO_UNIVERSITIES.filter((university) => selectedIds.includes(university.id)).slice(0, 4);
  const nextAction = hasProfile ? "Generate your ELEE Report" : "Complete your profile";
  const nextActionDetail = hasProfile
    ? "Your profile is ready. ELEE can now turn it into country fit, route clarity, document gaps, and next actions."
    : "Add your academics, target course, budget, intake, test status, and country preferences so ELEE can guide the journey.";
  const nextActionHref = hasProfile ? "/elee-report" : "/profile";

  return (
    <AppLayout>
      <div data-testid="student-dashboard">
        <PageHeader
          eyebrow="Dashboard"
          title="Welcome to your study-abroad workspace"
          description="Start blank, fill your profile, compare global options, shortlist universities, and move step by step toward applications, visa, finance, and arrival."
          actions={
            <>
              <Link href="/profile">
                <Button variant="outline" className="rounded-full font-serif">Complete profile</Button>
              </Link>
              <Link href="/universities">
                <Button className="rounded-full font-serif">Explore universities</Button>
              </Link>
            </>
          }
        />

        <section className="mb-5 overflow-hidden rounded-lg border border-primary/20 bg-white shadow-sm">
          <div className="brand-gradient-bg h-1.5" />
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="p-5 md:p-6">
              <Badge className="mb-4 rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                Next action
              </Badge>
              <h2 className="max-w-3xl font-serif text-3xl font-bold leading-tight text-foreground">
                {nextAction}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                {nextActionDetail}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={nextActionHref}>
                  <Button className="rounded-full font-serif">{nextAction}</Button>
                </Link>
                <Link href="/journey-map">
                  <Button variant="outline" className="rounded-full font-serif">View journey map</Button>
                </Link>
              </div>
            </div>

            <aside className="border-t border-border bg-muted/35 p-5 xl:border-l xl:border-t-0">
              <div className="space-y-3">
                {[
                  { label: "Current stage", value: hasProfile ? "ELEE Report" : "Profile" },
                  { label: "Selected countries", value: profile?.targetCountries?.length ? String(profile.targetCountries.length) : "Not set" },
                  { label: "Shortlisted universities", value: String(selectedUniversities.length) },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-white p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</div>
                    <div className="mt-1 font-serif text-base font-bold text-foreground">{item.value}</div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="mb-5">
          <SectionHeader title="Your 7-step journey" description="Work through these steps in order. ELEE will guide you as your profile, shortlist, and documents grow." href="/journey-map" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
            {STUDENT_GUIDE_STEPS.map((step, index) => (
              <Link key={step.label} href={step.href}>
                <Card className="app-card group h-full cursor-pointer p-4 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Step {index + 1}</div>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", toneClass(step.tone))}>{step.status}</span>
                  </div>
                  <div className="mt-3 font-serif text-base font-bold leading-tight text-foreground">{step.label}</div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{step.detail}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-5">
            <Card className="app-card p-4">
              <SectionHeader
                title="What needs attention"
                description={hasProfile ? "Your next tasks are based on the profile saved in this browser." : "Your personal tasks will appear here as you complete the profile and start applications."}
              />
              {!hasProfile ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/25 p-6 text-center">
                  <div className="font-serif text-lg font-bold text-foreground">No personal tasks yet</div>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                    Complete your profile first. ELEE will then create report actions, document gaps, university next steps, and finance reminders.
                  </p>
                  <Link href="/profile">
                    <Button className="mt-4 rounded-full font-serif">Complete profile</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[
                    {
                      title: "Generate ELEE Report",
                      detail: "Turn your saved profile into route ranking, missing documents, finance clarity, and next actions.",
                      href: "/elee-report",
                    },
                    {
                      title: "Compare universities",
                      detail: "Use your countries, course goal, budget, and intake to shortlist suitable options.",
                      href: "/universities",
                    },
                    {
                      title: "Prepare documents",
                      detail: "Start passport, transcripts, SOP, resume, LOR, and finance proof early.",
                      href: "/documents",
                    },
                  ].map((task) => (
                    <Link key={task.title} href={task.href}>
                      <div className="h-full rounded-lg border border-border bg-white p-4 transition-all hover:border-primary/35 hover:bg-primary/5">
                        <div className="font-serif text-base font-bold text-foreground">{task.title}</div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.detail}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            <Card className="app-card p-4">
              <SectionHeader title="Selected universities" description="Shortlisted universities will appear here and can be moved into applications." href="/shortlist" />
              {selectedUniversities.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/25 p-6 text-center">
                  <div className="font-serif text-lg font-bold text-foreground">No universities shortlisted yet</div>
                  <p className="mt-2 text-sm text-muted-foreground">Browse global destinations and save universities that fit your goals.</p>
                  <Link href="/universities">
                    <Button className="mt-4 rounded-full font-serif">Explore universities</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {selectedUniversities.map((university) => (
                    <Link key={university.id} href={`/universities/${university.id}`}>
                      <div className="rounded-lg border border-border bg-white p-4 transition-all hover:border-primary/35 hover:bg-primary/5">
                        <div className="font-serif text-base font-bold leading-tight text-foreground">{university.name}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{university.city}, {university.country}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </section>

          <aside className="space-y-5">
            <Card className="app-card p-4">
              <SectionHeader title="ELEE Report" href="/elee-report" />
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border-[8px] border-primary/15 bg-muted/40">
                  <span className="font-serif text-3xl font-bold text-primary">--</span>
                </div>
                <div>
                  <div className="font-serif text-lg font-bold text-foreground">Not generated yet</div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Complete your profile to unlock country fit, finance clarity, and next actions.</p>
                </div>
              </div>
            </Card>

            <Card className="app-card p-4">
              <SectionHeader title="Document status" href="/documents" />
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-muted-foreground">Readiness</span>
                <span className="font-serif text-lg font-bold text-foreground">0%</span>
              </div>
              <Progress value={0} className="h-2" />
              <div className="mt-4 space-y-2">
                {documentStatus.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/25 px-3 py-2">
                    <span className="text-sm font-semibold text-foreground">{item.label}</span>
                    <Badge variant="outline" className="rounded-full">{item.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="app-card p-4">
              <SectionHeader title="Finance & arrival" href="/financial-hub" />
              <div className="rounded-lg border border-dashed border-border bg-muted/25 p-4 text-sm leading-6 text-muted-foreground">
                Add budget, target countries, offer details, and funding documents to build your finance and arrival plan.
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
