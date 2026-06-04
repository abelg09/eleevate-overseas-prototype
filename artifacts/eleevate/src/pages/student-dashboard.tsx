import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { DEMO_UNIVERSITIES } from "@/lib/demo-catalog";
import { demoEdgeReport } from "@/lib/demo-data";
import { demoUser } from "@/lib/demo-mode";
import { useDemoJourneyState } from "@/lib/demo-journey";
import { cn } from "@/lib/utils";

const journeySteps = [
  { label: "Profile", status: "Done", detail: "Academics, goals, budget", href: "/profile", tone: "done" },
  { label: "ELEE Report", status: "Done", detail: "Canada leads the route", href: "/elee-report", tone: "done" },
  { label: "Country & Course Fit", status: "Review", detail: "Compare Canada backups", href: "/universities", tone: "current" },
  { label: "Shortlist", status: "Done", detail: "4 universities saved", href: "/shortlist", tone: "done" },
  { label: "Applications", status: "Start", detail: "2 applications ready", href: "/applications", tone: "current" },
  { label: "Documents & Visa", status: "Blocked", detail: "Finance proof missing", href: "/documents", tone: "action" },
  { label: "Finance & Arrival", status: "Next", detail: "Loan and forex pending", href: "/financial-hub", tone: "next" },
];

const pendingTasks = [
  {
    title: "Upload sponsor bank statement",
    detail: "Needed for Canada visa confidence and university payment planning.",
    due: "Today",
    href: "/documents",
    tone: "action",
  },
  {
    title: "Review SOP for University of Toronto",
    detail: "Add project outcomes and why this course fits your career goal.",
    due: "Tomorrow",
    href: "/sop-studio",
    tone: "current",
  },
  {
    title: "Move saved universities into applications",
    detail: "Toronto and UBC are ready to track with deadlines and documents.",
    due: "This week",
    href: "/applications",
    tone: "next",
  },
  {
    title: "Complete IELTS writing mock",
    detail: "Target score is 7.5; current mock is close but needs writing polish.",
    due: "24 May",
    href: "/test-prep",
    tone: "next",
  },
];

const documentStatus = [
  { label: "Passport", status: "Ready" },
  { label: "Transcripts", status: "Ready" },
  { label: "SOP", status: "Review" },
  { label: "LOR", status: "Review" },
  { label: "Finance proof", status: "Missing" },
  { label: "Resume", status: "Review" },
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
  const student = demoUser.student;
  const report = demoEdgeReport;
  const demoJourney = useDemoJourneyState();
  const selectedCountry = demoJourney.countryLock?.countryName ?? report.preferredCountries[0].country;
  const selectedIds = demoJourney.countryLock?.universityIds ?? ["demo-uoft", "demo-ubc", "demo-manchester", "demo-melbourne"];
  const selectedUniversities = DEMO_UNIVERSITIES.filter((university) => selectedIds.includes(university.id)).slice(0, 4);
  const fundingProgress = Math.round((report.financialReadiness.confirmedFundsUsd / report.financialReadiness.budgetUsd) * 100);

  return (
    <AppLayout>
      <div data-testid="student-dashboard">
        <PageHeader
          eyebrow="Dashboard"
          title={`Welcome, ${student.firstName}`}
          description={`Your ${selectedCountry} journey is focused on applications, documents, finance proof, and visa readiness.`}
          actions={
            <>
              <Link href="/elee-report">
                <Button variant="outline" className="rounded-full font-serif">Open ELEE Report</Button>
              </Link>
              <Link href="/universities">
                <Button className="rounded-full font-serif">Find universities</Button>
              </Link>
            </>
          }
        />

        <section className="mb-5 overflow-hidden rounded-lg border border-primary/20 bg-white shadow-sm">
          <div className="brand-gradient-bg h-1.5" />
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="p-5 md:p-6">
              <Badge className="mb-4 rounded-full bg-red-50 px-3 py-1 text-red-700 hover:bg-red-50">
                Next action
              </Badge>
              <h2 className="max-w-3xl font-serif text-3xl font-bold leading-tight text-foreground">
                Upload finance proof before starting paid submissions.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                Your profile and shortlist are strong. The main blocker is an ${Math.round(report.financialReadiness.fundingGapUsd / 1000)}k funding evidence gap for visa and offer confidence.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/documents">
                  <Button className="rounded-full font-serif">Upload documents</Button>
                </Link>
                <Link href="/loans">
                  <Button variant="outline" className="rounded-full font-serif">Check education loan</Button>
                </Link>
              </div>
            </div>

            <aside className="border-t border-border bg-muted/35 p-5 xl:border-l xl:border-t-0">
              <div className="space-y-3">
                {[
                  { label: "Current stage", value: "Documents & Visa" },
                  { label: "Deadline", value: "26 May" },
                  { label: "Selected country", value: selectedCountry },
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
          <SectionHeader title="Your 7-step journey" description="Work through these steps in order. The current blocker is documents and finance proof." href="/journey-map" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
            {journeySteps.map((step, index) => (
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
              <SectionHeader title="What needs attention" description="Sorted by the tasks that unlock the journey fastest." />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {pendingTasks.map((task) => (
                  <Link key={task.title} href={task.href}>
                    <div className="group h-full rounded-lg border border-border bg-muted/25 p-4 transition-all hover:border-primary/35 hover:bg-primary/5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-serif text-base font-bold leading-tight text-foreground">{task.title}</div>
                        <Badge variant="outline" className={cn("rounded-full", toneClass(task.tone))}>{task.due}</Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.detail}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="app-card p-4">
              <SectionHeader title="Selected universities" description="Shortlisted options ready to move into the application tracker." href="/shortlist" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {selectedUniversities.map((university) => (
                  <Link key={university.id} href={`/universities/${university.id}`}>
                    <div className="rounded-lg border border-border bg-white p-4 transition-all hover:border-primary/35 hover:bg-primary/5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-serif text-base font-bold leading-tight text-foreground">{university.name}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{university.city}, {university.country}</div>
                        </div>
                        {university.ranking && <Badge className="rounded-full bg-secondary text-white hover:bg-secondary">#{university.ranking}</Badge>}
                      </div>
                      <div className="mt-3 text-sm text-muted-foreground">${Math.round((university.avgTuitionUsd ?? 0) / 1000)}k/yr tuition estimate</div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </section>

          <aside className="space-y-5">
            <Card className="app-card p-4">
              <SectionHeader title="ELEE score" href="/elee-report" />
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border-[8px] border-primary/15 bg-muted/40">
                  <span className="font-serif text-4xl font-bold text-primary">{report.clarityScore}</span>
                </div>
                <div>
                  <div className="font-serif text-lg font-bold text-foreground">{selectedCountry} is the best route</div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Strong study fit. Finance evidence and SOP polish are the next improvements.</p>
                </div>
              </div>
            </Card>

            <Card className="app-card p-4">
              <SectionHeader title="Document status" href="/documents" />
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-muted-foreground">Readiness</span>
                <span className="font-serif text-lg font-bold text-foreground">67%</span>
              </div>
              <Progress value={67} className="h-2" />
              <div className="mt-4 space-y-2">
                {documentStatus.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/25 px-3 py-2">
                    <span className="text-sm font-semibold text-foreground">{item.label}</span>
                    <Badge variant="outline" className={cn("rounded-full", item.status === "Ready" ? toneClass("done") : item.status === "Missing" ? toneClass("action") : toneClass("current"))}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="app-card p-4">
              <SectionHeader title="Finance & arrival" href="/financial-hub" />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/25 p-3">
                  <div className="font-serif text-xl font-bold text-foreground">${Math.round(report.financialReadiness.confirmedFundsUsd / 1000)}k</div>
                  <div className="mt-1 text-xs text-muted-foreground">Confirmed funds</div>
                </div>
                <div className="rounded-lg border border-border bg-muted/25 p-3">
                  <div className="font-serif text-xl font-bold text-foreground">${Math.round(report.financialReadiness.fundingGapUsd / 1000)}k</div>
                  <div className="mt-1 text-xs text-muted-foreground">Funding gap</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-semibold text-muted-foreground">Funding readiness</span>
                <span className="font-serif font-bold text-foreground">{fundingProgress}%</span>
              </div>
              <Progress value={fundingProgress} className="mt-2 h-2" />
            </Card>

            <Card className="app-card border-primary/20 bg-primary/5 p-4">
              <div className="font-serif text-base font-bold text-foreground">Need something else?</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Finance, visa, upskilling, alumni, news, support, and rewards are grouped in More.</p>
              <Link href="/more">
                <Button className="mt-4 w-full rounded-full font-serif">Open More</Button>
              </Link>
            </Card>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
