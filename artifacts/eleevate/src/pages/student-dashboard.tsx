import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { DEMO_UNIVERSITIES } from "@/lib/demo-catalog";
import { readDemoShortlistIds } from "@/lib/demo-flow";
import { hasStudentWorkspaceProfile, useStudentWorkspaceProfile } from "@/lib/student-workspace";
import { getPackageRank, getStudentPackage, STUDENT_PACKAGES } from "@/lib/student-packages";
import { useStudentJourneySnapshot } from "@/lib/student-journey-state";
import { cn } from "@/lib/utils";

const documentStatus = [
  { label: "Passport", status: "Not uploaded" },
  { label: "Transcripts", status: "Not uploaded" },
  { label: "SOP", status: "Not started" },
  { label: "LOR", status: "Not started" },
  { label: "Finance proof", status: "Not uploaded" },
  { label: "Resume", status: "Not uploaded" },
];

function statusClass(status: string) {
  return cn(
    status === "complete" && "border-emerald-200 bg-emerald-50 text-emerald-800",
    status === "current" && "border-primary/25 bg-primary/5 text-primary",
    status === "incomplete" && "border-border bg-muted/30 text-muted-foreground",
  );
}

export default function StudentDashboardPage() {
  const profile = useStudentWorkspaceProfile();
  const hasProfile = hasStudentWorkspaceProfile(profile);
  const snapshot = useStudentJourneySnapshot();
  const selectedIds = readDemoShortlistIds();
  const selectedUniversities = DEMO_UNIVERSITIES.filter((university) => selectedIds.includes(university.id)).slice(0, 4);
  const nextStep = snapshot.nextIncompleteStep ?? snapshot.currentStep;
  const selectedPackage = getStudentPackage(snapshot.packageId);
  const nextPackage = selectedPackage
    ? STUDENT_PACKAGES.find((pack) => getPackageRank(pack.id) > getPackageRank(selectedPackage.id))
    : STUDENT_PACKAGES[0];
  const documentStatusLabel = snapshot.documentReadiness >= 100
    ? "Ready"
    : snapshot.documentReadiness > 0
      ? "In progress"
      : "Not started";

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
                {nextStep.label}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                {nextStep.prompt}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={nextStep.href}>
                  <Button className="rounded-full font-serif">{nextStep.cta}</Button>
                </Link>
                <Link href="/journey-map">
                  <Button variant="outline" className="rounded-full font-serif">View journey map</Button>
                </Link>
              </div>
            </div>

            <aside className="border-t border-border bg-muted/35 p-5 xl:border-l xl:border-t-0">
              <div className="space-y-3">
                {[
                  { label: "Current stage", value: snapshot.currentStep.label },
                  { label: "Journey progress", value: `${snapshot.progress}%` },
                  { label: "Shortlisted universities", value: String(snapshot.shortlistedCount) },
                  { label: "Package", value: snapshot.packageName ?? "Not selected" },
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
            {snapshot.steps.map((step, index) => (
              <Link key={step.label} href={step.href}>
                <Card className="app-card group h-full cursor-pointer p-4 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Step {index + 1}</div>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", statusClass(step.status))}>{step.statusLabel}</span>
                  </div>
                  <div className="mt-3 font-serif text-base font-bold leading-tight text-foreground">{step.label}</div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{step.prompt}</p>
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
                description={hasProfile ? "These prompts update when you save profile details, shortlist universities, upload documents, choose packages, or start finance actions." : "Your personal tasks will appear here as you complete the profile and start applications."}
              />
              {snapshot.notifications.length === 0 ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
                  <div className="font-serif text-lg font-bold text-emerald-900">Everything is up to date</div>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-emerald-800">
                    ELEE will show new prompts as soon as your next document, application, finance, or arrival task appears.
                  </p>
                </div>
              ) : !hasProfile ? (
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
                  {snapshot.notifications.slice(0, 3).map((task) => (
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
                  <span className="font-serif text-3xl font-bold text-primary">{snapshot.reportGenerated ? `${snapshot.progress}%` : "--"}</span>
                </div>
                <div>
                  <div className="font-serif text-lg font-bold text-foreground">{snapshot.reportGenerated ? "Generated" : "Not generated yet"}</div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {snapshot.reportGenerated
                      ? "Your report now reacts to profile, shortlist, documents, finance, and test changes."
                      : "Complete your profile to unlock country fit, finance clarity, and next actions."}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="app-card p-4">
              <SectionHeader title="Document status" href="/documents" />
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-muted-foreground">Readiness</span>
                <span className="font-serif text-lg font-bold text-foreground">{snapshot.documentReadiness}%</span>
              </div>
              <Progress value={snapshot.documentReadiness} className="h-2" />
              <div className="mt-4 space-y-2">
                {documentStatus.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/25 px-3 py-2">
                    <span className="text-sm font-semibold text-foreground">{item.label}</span>
                    <Badge variant="outline" className="rounded-full">{snapshot.documentReadiness > 0 ? documentStatusLabel : item.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="app-card p-4">
              <SectionHeader title="Finance & arrival" href="/financial-hub" />
              <div className="rounded-lg border border-dashed border-border bg-muted/25 p-4 text-sm leading-6 text-muted-foreground">
                {snapshot.financeEventCount > 0
                  ? `${snapshot.financeEventCount} finance action${snapshot.financeEventCount === 1 ? "" : "s"} started. Continue loans, remittance, forex, insurance, and arrival planning.`
                  : "Add budget, target countries, offer details, and funding documents to build your finance and arrival plan."}
              </div>
            </Card>

            <Card className="app-card p-4">
              <SectionHeader title="Package & rewards" href="/packages" />
              <div className="rounded-lg border border-border bg-muted/25 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Current package</div>
                <div className="mt-1 font-serif text-lg font-bold text-foreground">{selectedPackage?.name ?? "Not selected"}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {selectedPackage
                    ? `${selectedPackage.shortName} gives ${selectedPackage.rewardMultiplier}x reward earning.`
                    : "Choose Silver, Gold, or Platinum to unlock package-based prompts and rewards."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/packages">
                    <Button size="sm" className="rounded-full font-serif">
                      {nextPackage ? (selectedPackage ? `Upgrade to ${nextPackage.shortName}` : "Choose package") : "Manage package"}
                    </Button>
                  </Link>
                  <Link href="/rewards">
                    <Button size="sm" variant="outline" className="rounded-full font-serif">{snapshot.rewardPoints} points</Button>
                  </Link>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
