import { Link } from "wouter";
import { ArrowRight, Bot, ClipboardList, FileCheck2, GraduationCap, Sparkles, WalletCards } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { getDemoApplicationsFromShortlist, getDemoShortlistUniversities } from "@/lib/demo-flow";
import { useDemoJourneyState } from "@/lib/demo-journey";
import { useStudentWorkspaceProfile } from "@/lib/student-workspace";

const journeySteps = [
  { label: "AI Profile & Test", href: "/profile", icon: Bot },
  { label: "ELEE Report", href: "/elee-report", icon: Sparkles },
  { label: "University Finder", href: "/universities", icon: GraduationCap },
  { label: "Applications", href: "/applications", icon: ClipboardList },
  { label: "Docs & Visa", href: "/documents", icon: FileCheck2 },
  { label: "Financial Hub", href: "/financial-hub", icon: WalletCards },
];

export default function StudentDashboardPage() {
  const profile = useStudentWorkspaceProfile();
  const shortlistedUniversities = getDemoShortlistUniversities();
  const applications = getDemoApplicationsFromShortlist();
  const { ledgerEvents } = useDemoJourneyState();
  const documentReadiness = 0;
  const profileComplete = Boolean(profile);
  const currentStep = profileComplete ? "ELEE Report" : "AI Profile & Test";
  const currentHref = profileComplete ? "/elee-report" : "/profile";

  return (
    <AppLayout>
      <div data-testid="student-dashboard">
        <PageHeader
          eyebrow="Student command center"
          title="Your study-abroad workspace starts here."
          description="Start with your AI Profile & Test. ELEE will then guide your country choices, course search, applications, documents, finance plan, and interview preparation."
          actions={
            <>
              <Link href="/profile">
                <Button variant="outline" className="rounded-full font-serif">
                  AI Profile & Test
                </Button>
              </Link>
              <Link href="/universities">
                <Button className="rounded-full font-serif">
                  Explore global universities
                </Button>
              </Link>
            </>
          }
        />

        <section className="mb-5 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <div className="h-2 bg-[linear-gradient(90deg,#102044_0%,#102044_58%,#C9784A_58%,#C9784A_74%,#39B54A_74%,#39B54A_100%)]" />
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="p-5 md:p-6">
              <Badge className="mb-4 rounded-full border-[#C9784A]/25 bg-[#fff2e8] px-3 text-xs font-bold text-[#8a4b2b] hover:bg-[#fff2e8]">
                Next best action
              </Badge>
              <h2 className="max-w-3xl font-serif text-3xl font-bold leading-tight text-foreground">
                {profileComplete ? "Generate the ELEE Report from your saved profile." : "Complete AI Profile & Test to unlock recommendations."}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                {profileComplete
                  ? "ELEE has enough starting context to prepare country, course, document, visa, finance, and interview guidance. No personal score is shown until you generate the report."
                  : "Add academics, budget range, test status, preferred intake, goals, and family sponsor details. ELEE will not guess your route before you share the basics."}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
                {[
                  ["Selected route", "Not chosen"],
                  ["Saved universities", String(shortlistedUniversities.length)],
                  ["Applications", String(applications.length)],
                  ["Document readiness", `${documentReadiness}%`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-border bg-[#f8fbff] p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
                    <div className="mt-2 font-serif text-2xl font-bold text-foreground">{value}</div>
                  </div>
                ))}
              </div>

              <Link href={currentHref}>
                <Button className="mt-6 rounded-full px-6 font-serif">
                  Continue: {currentStep} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <aside className="border-t border-border bg-[#fffaf2] p-5 xl:border-l xl:border-t-0">
              <div className="eyebrow text-[#a85f36]">What ELEE needs</div>
              <div className="mt-4 space-y-3">
                {[
                  ["Academics", profile?.studyLevel || "Add study level and marks"],
                  ["Budget", profile?.budget || "Add budget range"],
                  ["Goal", profile?.careerGoal || "Add career direction"],
                  ["Test status", profile?.ieltsScore || profile?.toeflScore || profile?.greScore || "Add IELTS/TOEFL/GRE status"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[#ead8c4] bg-white p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#8a4b2b]">{label}</div>
                    <div className="mt-1 text-sm font-semibold leading-5 text-foreground">{value}</div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="mb-5">
          <SectionHeader title="Guided journey hubs" description="A smaller route through the product, not a wall of modules." href="/journey-map" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {journeySteps.map((step, index) => {
              const Icon = step.icon;
              const isCurrent = step.label === currentStep;
              return (
                <Link key={step.label} href={step.href}>
                  <Card className={`app-card h-full p-4 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md ${isCurrent ? "border-primary/40 bg-primary/5" : ""}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#102044,#39B54A)] text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="rounded-full bg-white text-xs font-bold">{String(index + 1).padStart(2, "0")}</Badge>
                    </div>
                    <div className="mt-4 font-serif text-base font-bold leading-5 text-foreground">{step.label}</div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-[linear-gradient(90deg,#102044,#39B54A)]" style={{ width: isCurrent ? "36%" : index === 0 && profileComplete ? "100%" : "0%" }} />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-5">
            <Card className="app-card p-5">
              <SectionHeader title="Your activity trail" description="Every action you take can create the next task in your journey." href="/financial-hub" />
              {ledgerEvents.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {ledgerEvents.slice(0, 4).map((event) => (
                    <div key={event.id} className="rounded-lg border border-border bg-[#f8fbff] p-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">{event.source}</div>
                      <div className="mt-2 font-serif text-base font-bold leading-6 text-foreground">{event.event}</div>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{event.studentView}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-[#f8fbff] p-6">
                  <div className="font-serif text-lg font-bold text-foreground">No journey actions yet.</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Shortlist a university, upload a document, or start an education-loan plan to see your next tasks appear here.
                  </p>
                  <Link href="/universities">
                    <Button className="mt-4 rounded-full font-serif">Start with University Finder</Button>
                  </Link>
                </div>
              )}
            </Card>

            <Card className="app-card p-5">
              <SectionHeader title="Applications at a glance" description="Shortlisting a university creates tracker items for this session." href="/applications" />
              {applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.slice(0, 3).map((application) => (
                    <div key={application.id} className="rounded-lg border border-border bg-white p-4">
                      <div className="font-serif text-base font-bold text-foreground">{application.program?.university?.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{application.program?.name}</div>
                      <Progress value={28} className="mt-3 h-1.5" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/25 p-5">
                  <div className="font-serif text-base font-bold text-foreground">No applications yet.</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Save a university from the finder to open the first application tracker.</p>
                </div>
              )}
            </Card>
          </section>

          <aside className="space-y-5">
            <Card className="app-card p-5">
              <SectionHeader title="Private workspace" description="Blank until the student fills data." />
              <div className="space-y-3">
                {[
                  ["ELEE score", "Not generated"],
                  ["Best country", "Not chosen"],
                  ["Funding gap", "Not calculated"],
                  ["Visa readiness", "Not assessed"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-white p-3">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="font-serif text-sm font-bold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
