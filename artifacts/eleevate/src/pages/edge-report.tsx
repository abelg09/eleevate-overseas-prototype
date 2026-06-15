import { useEffect } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { markEleeReportGenerated } from "@/lib/student-journey-state";
import {
  hasStudentWorkspaceProfile,
  useStudentWorkspaceProfile,
  type StudentWorkspaceProfile,
} from "@/lib/student-workspace";

const LEGACY_USD_TO_INR = 83;
const inrFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

const reportInputs = [
  "Academic background",
  "Target course",
  "Country preferences",
  "Budget range",
  "Test status",
  "Preferred intake",
  "Family funding details",
];

function normalizeBudgetAmount(value: unknown, currency?: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  if (currency !== "INR" && parsed <= 120_000) return Math.round(parsed * LEGACY_USD_TO_INR);
  return parsed;
}

function formatInr(value: number) {
  return `INR ${inrFormatter.format(value)}`;
}

function getBudgetRange(profile: StudentWorkspaceProfile | null) {
  const min = normalizeBudgetAmount(profile?.budgetMin, profile?.budgetCurrency);
  const max = normalizeBudgetAmount(profile?.budgetMax ?? profile?.budget, profile?.budgetCurrency);
  return [Math.min(min, max), Math.max(min, max)] as const;
}

function getBudgetLabel(profile: StudentWorkspaceProfile | null) {
  const [min, max] = getBudgetRange(profile);
  if (!min && !max) return "Not added";
  return `${formatInr(min)} - ${formatInr(max)} / year`;
}

function hasEnglishTest(profile: StudentWorkspaceProfile | null) {
  return Boolean(profile?.ieltsScore || profile?.toeflScore || profile?.languageTestName || profile?.readingScore || profile?.writingScore || profile?.speakingScore || profile?.listeningScore);
}

function profileReadiness(profile: StudentWorkspaceProfile | null) {
  const checks = [
    profile?.studyLevel,
    profile?.courseGoal || profile?.careerGoal,
    profile?.targetCountries?.length || profile?.preferredCountry,
    profile?.nationality,
    profile?.preferredIntake,
    normalizeBudgetAmount(profile?.budgetMax ?? profile?.budget, profile?.budgetCurrency) > 0,
    profile?.highestEducation || profile?.stream || profile?.gpa,
    hasEnglishTest(profile),
    profile?.passportNumber,
    profile?.mobileNumber || profile?.email,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function buildRouteRows(profile: StudentWorkspaceProfile | null) {
  const countries = profile?.targetCountries?.length
    ? profile.targetCountries
    : profile?.preferredCountry
      ? [profile.preferredCountry]
      : [];
  const base = profileReadiness(profile);

  return countries.map((country, index) => {
    const score = Math.max(54, Math.min(96, base + 12 - index * 5));
    const reasons = [
      profile?.studyLevel ? `${profile.studyLevel} route` : "Study level needed",
      profile?.courseGoal || profile?.careerGoal ? profile.courseGoal || profile.careerGoal : "Course direction needed",
      normalizeBudgetAmount(profile?.budgetMax ?? profile?.budget, profile?.budgetCurrency) > 0 ? "Budget available" : "Budget missing",
    ];
    return { country, score, reasons };
  });
}

function documentChecks(profile: StudentWorkspaceProfile | null) {
  return [
    { label: "Passport details", ready: Boolean(profile?.passportNumber), action: "Add passport number" },
    { label: "Academic marksheets", ready: Boolean(profile?.highestEducation || profile?.stream || profile?.gpa), action: "Add education details" },
    { label: "English test evidence", ready: hasEnglishTest(profile), action: "Add IELTS / TOEFL / PTE" },
    { label: "Finance proof", ready: normalizeBudgetAmount(profile?.budgetMax ?? profile?.budget, profile?.budgetCurrency) > 0, action: "Add budget and sponsor evidence" },
    { label: "SOP / resume direction", ready: Boolean(profile?.courseGoal || profile?.careerGoal), action: "Add course or career goal" },
  ];
}

function nextActions(profile: StudentWorkspaceProfile | null) {
  const docs = documentChecks(profile);
  const missingDoc = docs.find((item) => !item.ready);
  return [
    missingDoc ? { label: missingDoc.action, href: "/profile" } : { label: "Review document checklist", href: "/documents" },
    buildRouteRows(profile).length ? { label: "Compare shortlisted destinations", href: "/countries" } : { label: "Choose target countries", href: "/profile" },
    { label: "Find matching courses and universities", href: "/course-finder" },
  ];
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/25 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 break-words font-serif text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}

export default function EdgeReportPage() {
  const profile = useStudentWorkspaceProfile();
  const hasProfile = hasStudentWorkspaceProfile(profile);
  const preferredCountries = profile?.targetCountries ?? [];
  const routes = buildRouteRows(profile);
  const readiness = profileReadiness(profile);
  const [budgetMin, budgetMax] = getBudgetRange(profile);
  const docs = documentChecks(profile);
  const readyDocs = docs.filter((item) => item.ready).length;
  const visaReadiness = Math.round(((profile?.passportNumber ? 1 : 0) + (budgetMax > 0 ? 1 : 0) + (hasEnglishTest(profile) ? 1 : 0) + (profile?.targetCountries?.length ? 1 : 0)) / 4 * 100);

  useEffect(() => {
    if (hasProfile) markEleeReportGenerated();
  }, [hasProfile]);

  return (
    <AppLayout>
      <div data-testid="edge-report-page">
        <PageHeader
          eyebrow="ELEE Report"
          title="Your study-abroad readiness report"
          description="ELEE turns your profile into route ranking, country fit, document gaps, finance clarity, visa readiness, and next actions."
          actions={
            <>
              <Link href="/dashboard">
                <Button variant="outline" className="rounded-full font-serif">Back to dashboard</Button>
              </Link>
              <Link href={hasProfile ? "/universities" : "/profile"}>
                <Button className="rounded-full font-serif">{hasProfile ? "Explore matches" : "Complete profile"}</Button>
              </Link>
            </>
          }
        />

        {!hasProfile ? (
          <section className="overflow-hidden rounded-lg border border-primary/20 bg-white shadow-sm" data-testid="empty-elee-report">
            <div className="brand-gradient-bg h-1.5" />
            <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="p-5 md:p-6">
                <Badge className="mb-4 rounded-full bg-primary/10 px-3 text-primary hover:bg-primary/10">
                  Report not generated
                </Badge>
                <h2 className="max-w-3xl font-serif text-3xl font-bold leading-tight text-foreground">
                  Complete your profile to generate your ELEE Report.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                  ELEE needs your academics, goals, country interests, INR budget, test status, intake, and family funding details before it can recommend a route.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href="/profile">
                    <Button className="rounded-full font-serif">Complete profile</Button>
                  </Link>
                  <Link href="/universities">
                    <Button variant="outline" className="rounded-full font-serif">Browse universities</Button>
                  </Link>
                </div>
              </div>

              <aside className="border-t border-border bg-muted/35 p-5 xl:border-l xl:border-t-0">
                <div className="eyebrow mb-3">Inputs needed</div>
                <div className="space-y-2">
                  {reportInputs.map((item) => (
                    <div key={item} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2 text-sm">
                      <span className="font-semibold text-foreground">{item}</span>
                      <Badge variant="outline" className="rounded-full">Pending</Badge>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </section>
        ) : (
          <div>
            <Card className="mb-5 overflow-hidden border border-primary/20 bg-white p-0 shadow-sm" data-testid="elee-report-next-step">
              <div className="brand-gradient-bg h-1.5" />
              <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="p-5">
                  <Badge variant="outline" className="mb-3 rounded-full bg-primary/5 text-primary">Generated from saved profile</Badge>
                  <h2 className="font-serif text-2xl font-bold leading-tight text-foreground">
                    {routes[0]?.country ? `${routes[0].country} is your first route to compare.` : "Your profile is ready. Choose target countries next."}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                    ELEE is using your saved profile to show route readiness, documents, finance clarity, visa preparation, and the next student actions.
                  </p>
                </div>
                <aside className="border-t border-border bg-primary/5 p-5 xl:border-l xl:border-t-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">Readiness score</div>
                  <div className="mt-2 font-serif text-5xl font-bold text-foreground">{readiness}%</div>
                  <Progress value={readiness} className="mt-4 h-2" />
                </aside>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
              <section className="space-y-5">
                <Card className="app-card p-4">
                  <SectionHeader title="Profile snapshot" description="The core details ELEE is reading from your saved profile." />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <MiniStat label="Study level" value={profile?.studyLevel || "Not set"} />
                    <MiniStat label="Course direction" value={profile?.courseGoal || profile?.careerGoal || "Not set"} />
                    <MiniStat label="Countries" value={preferredCountries.length ? preferredCountries.join(", ") : "Not set"} />
                    <MiniStat label="Budget" value={getBudgetLabel(profile)} />
                  </div>
                </Card>

                <Card className="app-card p-4">
                  <SectionHeader title="Route ranking" description="A first-pass ranking based on target countries, profile completeness, course direction, tests, and budget." />
                  {routes.length > 0 ? (
                    <div className="space-y-3">
                      {routes.map((route, index) => (
                        <div key={route.country} className="rounded-lg border border-border bg-muted/25 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Route {index + 1}</div>
                              <div className="mt-1 font-serif text-lg font-bold text-foreground">{route.country}</div>
                            </div>
                            <Badge variant={index === 0 ? "default" : "outline"} className="rounded-full">{route.score}% fit</Badge>
                          </div>
                          <Progress value={route.score} className="mt-3 h-2" />
                          <div className="mt-3 flex flex-wrap gap-2">
                            {route.reasons.map((reason) => (
                              <Badge key={reason} variant="outline" className="rounded-full bg-white">{reason}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-muted/25 p-6 text-center text-sm text-muted-foreground">
                      Add target countries in your profile to start route ranking.
                    </div>
                  )}
                </Card>

                <Card className="app-card p-4">
                  <SectionHeader title="Document and visa readiness" description="The report now explains what is ready and what is still missing." />
                  <div className="grid gap-3 md:grid-cols-2">
                    {docs.map((item) => (
                      <div key={item.label} className="rounded-lg border border-border bg-white p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-serif text-sm font-bold text-foreground">{item.label}</div>
                          <Badge variant={item.ready ? "default" : "outline"} className="rounded-full">{item.ready ? "Ready" : "Missing"}</Badge>
                        </div>
                        {!item.ready && <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.action}</p>}
                      </div>
                    ))}
                  </div>
                </Card>
              </section>

              <aside className="space-y-5">
                <Card className="app-card p-4">
                  <SectionHeader title="Next 3 actions" />
                  <div className="space-y-3">
                    {nextActions(profile).map((action, index) => (
                      <Link key={action.label} href={action.href}>
                        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/25 p-3 transition-all hover:border-primary/35 hover:bg-primary/5">
                          <div className="brand-gradient-bg flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg font-serif text-xs font-bold text-white">
                            {index + 1}
                          </div>
                          <div className="font-serif text-sm font-bold text-foreground">{action.label}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>

                <Card className="app-card p-4">
                  <SectionHeader title="Finance clarity" />
                  <div className="rounded-lg border border-border bg-muted/25 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Annual budget</div>
                    <div className="mt-2 font-serif text-xl font-bold text-foreground">{getBudgetLabel(profile)}</div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {budgetMax > 0
                        ? `ELEE will compare courses and countries against a budget ceiling of ${formatInr(budgetMax)} per year.`
                        : "Add your INR budget so ELEE can compare tuition, living cost, loan needs, remittance, forex, and visa fund proof."}
                    </p>
                  </div>
                </Card>

                <Card className="app-card p-4">
                  <SectionHeader title="Visa readiness" />
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="font-serif text-base font-bold text-foreground">{visaReadiness}% ready</div>
                    <Progress value={visaReadiness} className="mt-3 h-2" />
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      Visa readiness improves when passport details, finance proof, English test evidence, and destination choice are complete.
                    </p>
                  </div>
                </Card>

                <Card className="app-card p-4">
                  <SectionHeader title="Report status" />
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="font-serif text-base font-bold text-foreground">Generated from your saved profile</div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {readyDocs} of {docs.length} evidence areas are ready. Continue updating your profile and documents to improve the report.
                    </p>
                  </div>
                </Card>
              </aside>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
