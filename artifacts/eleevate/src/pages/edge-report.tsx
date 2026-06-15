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
import { useStudentAssessmentResult } from "@/lib/student-assessment";

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

interface CountryGuidance {
  name: string;
  shortName: string;
  universityCode: string;
  typicalAnnualBudgetInr: number;
  visaLabel: string;
  financeLabel: string;
  strengths: string[];
  watchouts: string[];
  courseSignals: string[];
}

const COUNTRY_GUIDANCE: CountryGuidance[] = [
  {
    name: "United Kingdom",
    shortName: "UK",
    universityCode: "GB",
    typicalAnnualBudgetInr: 3_000_000,
    visaLabel: "CAS, tuition deposit, maintenance funds, TB test if applicable, and UKVI form timing.",
    financeLabel: "Strong route when the annual budget can cover tuition plus UK living funds.",
    strengths: ["1-year master's routes", "Business, finance, management, analytics", "Graduate Route work option"],
    watchouts: ["CAS and deposit sequence", "Maintenance funds timing", "London living cost can rise quickly"],
    courseSignals: ["business", "management", "finance", "analytics", "law", "marketing", "data", "public health"],
  },
  {
    name: "Canada",
    shortName: "Canada",
    universityCode: "CA",
    typicalAnnualBudgetInr: 3_400_000,
    visaLabel: "Study permit, PAL where applicable, GIC/funds, tuition proof, and SDS/non-SDS evidence.",
    financeLabel: "Good route when family funds and GIC planning are ready before visa filing.",
    strengths: ["PGWP planning", "Applied programs", "Clear family settlement path"],
    watchouts: ["Program-public-private risk", "Proof of funds scrutiny", "Province and intake selection"],
    courseSignals: ["computer", "ai", "engineering", "business", "healthcare", "data", "analytics"],
  },
  {
    name: "Australia",
    shortName: "Australia",
    universityCode: "AU",
    typicalAnnualBudgetInr: 3_300_000,
    visaLabel: "Subclass 500, genuine student narrative, OSHC, finance proof, and CoE readiness.",
    financeLabel: "Plan tuition deposit, OSHC, and living funds before application-to-visa handoff.",
    strengths: ["Post-study work routes", "Health, business, STEM", "Student-friendly cities"],
    watchouts: ["GS narrative quality", "OSHC timing", "City living costs"],
    courseSignals: ["health", "nursing", "business", "management", "engineering", "data"],
  },
  {
    name: "Germany",
    shortName: "Germany",
    universityCode: "DE",
    typicalAnnualBudgetInr: 1_200_000,
    visaLabel: "Blocked account, APS where relevant, language/course requirements, and appointment timing.",
    financeLabel: "Low tuition can help, but blocked-account readiness is the key finance proof.",
    strengths: ["Low tuition", "Engineering and technical routes", "Strong EU career pathway"],
    watchouts: ["German language expectations", "APS and blocked account timing", "Course prerequisites"],
    courseSignals: ["engineering", "mechanical", "automotive", "computer", "ai", "data"],
  },
  {
    name: "United States",
    shortName: "USA",
    universityCode: "US",
    typicalAnnualBudgetInr: 4_700_000,
    visaLabel: "I-20, SEVIS, F-1 interview readiness, sponsor documents, and OPT/STEM OPT planning.",
    financeLabel: "Best if scholarship, assistantship, or strong sponsor evidence lowers the funding pressure.",
    strengths: ["Large course choice", "Research and STEM scale", "Scholarship opportunities"],
    watchouts: ["Higher annual cost", "Visa interview story", "Scholarship planning"],
    courseSignals: ["computer", "ai", "engineering", "finance", "business", "analytics"],
  },
  {
    name: "Netherlands",
    shortName: "Netherlands",
    universityCode: "NL",
    typicalAnnualBudgetInr: 3_000_000,
    visaLabel: "University-led residence process, tuition proof, living funds, and housing planning.",
    financeLabel: "Budget should include tuition, living funds, and early housing deposits.",
    strengths: ["Applied tech", "Business and design", "English-taught programs"],
    watchouts: ["Housing scarcity", "Early deadlines", "Program fit requirements"],
    courseSignals: ["design", "business", "data", "engineering", "analytics"],
  },
  {
    name: "Singapore",
    shortName: "Singapore",
    universityCode: "SG",
    typicalAnnualBudgetInr: 3_500_000,
    visaLabel: "Student Pass, institution sponsorship, finance proof, and employability alignment.",
    financeLabel: "Strong route when the student wants an Asia hub with clear career focus.",
    strengths: ["Asia business hub", "Finance and analytics", "Strong employability"],
    watchouts: ["Competitive admissions", "Limited university count", "Higher living cost"],
    courseSignals: ["finance", "analytics", "business", "management", "technology"],
  },
  {
    name: "Ireland",
    shortName: "Ireland",
    universityCode: "IE",
    typicalAnnualBudgetInr: 2_900_000,
    visaLabel: "Stamp 2 route, tuition receipt, living expense proof, insurance, and stay-back planning.",
    financeLabel: "Good fit when tech/business employability and reasonable budget need to balance.",
    strengths: ["Tech and pharma careers", "Stay-back option", "English-speaking EU pathway"],
    watchouts: ["Accommodation pressure", "Fee payment timing", "Course-to-career clarity"],
    courseSignals: ["data", "business", "analytics", "computer", "pharma", "finance"],
  },
];

const COUNTRY_ALIASES: Record<string, string> = {
  uk: "United Kingdom",
  "u.k.": "United Kingdom",
  "united kingdom": "United Kingdom",
  britain: "United Kingdom",
  "great britain": "United Kingdom",
  england: "United Kingdom",
  usa: "United States",
  us: "United States",
  "u.s.": "United States",
  "united states": "United States",
  "united states of america": "United States",
  canada: "Canada",
  australia: "Australia",
  germany: "Germany",
  netherlands: "Netherlands",
  singapore: "Singapore",
  ireland: "Ireland",
  "new zealand": "New Zealand",
  uae: "United Arab Emirates",
  "united arab emirates": "United Arab Emirates",
};

function normalizeCountryName(country: string | undefined | null) {
  const cleaned = country?.trim();
  if (!cleaned) return "";
  return COUNTRY_ALIASES[cleaned.toLowerCase()] ?? cleaned;
}

function getCountryGuidance(country: string) {
  const normalized = normalizeCountryName(country);
  return COUNTRY_GUIDANCE.find((item) => item.name === normalized || item.shortName.toLowerCase() === normalized.toLowerCase()) ?? {
    name: normalized,
    shortName: normalized,
    universityCode: normalized,
    typicalAnnualBudgetInr: 3_000_000,
    visaLabel: "Destination-specific visa checklist, finance proof, and application timing.",
    financeLabel: "ELEE will compare this route once budget, course, and document evidence are complete.",
    strengths: ["Global study route", "Course-led comparison", "Family readiness planning"],
    watchouts: ["Document timing", "Budget proof", "Visa evidence"],
    courseSignals: [],
  };
}

function getSelectedCountries(profile: StudentWorkspaceProfile | null) {
  const countries = profile?.targetCountries?.length
    ? profile.targetCountries
    : profile?.preferredCountry
      ? [profile.preferredCountry]
      : [];
  return Array.from(new Set(countries.map(normalizeCountryName).filter(Boolean)));
}

function getPrimaryGoal(profile: StudentWorkspaceProfile | null) {
  return [profile?.courseGoal, profile?.careerGoal].filter(Boolean).join(" ").trim();
}

function hasGoalSignal(goal: string, signals: string[]) {
  const lower = goal.toLowerCase();
  return signals.some((signal) => lower.includes(signal));
}

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

function buildRouteRows(profile: StudentWorkspaceProfile | null, assessmentTopCountries: string[] = []) {
  const countries = getSelectedCountries(profile);
  const assessmentCountries = assessmentTopCountries.map(normalizeCountryName).filter(Boolean);
  const base = profileReadiness(profile);
  const goal = getPrimaryGoal(profile);
  const budgetMax = normalizeBudgetAmount(profile?.budgetMax ?? profile?.budget, profile?.budgetCurrency);

  return countries.map((country, index) => {
    const guidance = getCountryGuidance(country);
    const budgetScore = budgetMax <= 0
      ? 0
      : budgetMax >= guidance.typicalAnnualBudgetInr
        ? 12
        : budgetMax >= guidance.typicalAnnualBudgetInr * 0.75
          ? 6
          : -6;
    const courseScore = goal && hasGoalSignal(goal, guidance.courseSignals) ? 9 : 0;
    const assessmentScore = assessmentCountries.includes(guidance.name) ? 6 : 0;
    const priorityScore = Math.max(0, 7 - index * 3);
    const score = Math.max(48, Math.min(97, base + budgetScore + courseScore + assessmentScore + priorityScore));
    const reasons = [
      profile?.studyLevel ? `${profile.studyLevel} pathway` : "Add study level",
      goal ? (courseScore ? "Course goal aligns" : "Course goal captured") : "Add course goal",
      budgetMax > 0 ? (budgetScore >= 12 ? "Budget looks workable" : "Budget needs review") : "Add INR budget",
      assessmentScore ? "Psychometric match" : "Assessment can improve this",
    ];
    return { country: guidance.name, guidance, score, reasons };
  }).sort((a, b) => b.score - a.score);
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

function nextActions(profile: StudentWorkspaceProfile | null, topRoute?: ReturnType<typeof buildRouteRows>[number]) {
  const docs = documentChecks(profile);
  const missingDoc = docs.find((item) => !item.ready);
  const countryLabel = topRoute?.guidance.shortName ?? "global";
  const universityHref = topRoute ? `/universities?country=${encodeURIComponent(topRoute.guidance.universityCode)}` : "/universities";
  const courseHref = topRoute ? `/course-finder?country=${encodeURIComponent(topRoute.guidance.name)}` : "/course-finder";
  return [
    topRoute ? { label: `Review ${countryLabel} universities`, href: universityHref } : { label: "Choose target countries", href: "/profile" },
    { label: `Find ${countryLabel === "global" ? "matching" : countryLabel} courses`, href: courseHref },
    missingDoc ? { label: missingDoc.action, href: "/profile" } : { label: "Review document and visa checklist", href: "/documents" },
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
  const assessment = useStudentAssessmentResult();
  const hasProfile = hasStudentWorkspaceProfile(profile);
  const topAssessment = assessment?.fieldRecommendations?.[0] ?? null;
  const preferredCountries = getSelectedCountries(profile);
  const routes = buildRouteRows(profile, topAssessment?.countries ?? []);
  const topRoute = routes[0];
  const readiness = profileReadiness(profile);
  const [budgetMin, budgetMax] = getBudgetRange(profile);
  const docs = documentChecks(profile);
  const readyDocs = docs.filter((item) => item.ready).length;
  const visaReadiness = Math.round(((profile?.passportNumber ? 1 : 0) + (budgetMax > 0 ? 1 : 0) + (hasEnglishTest(profile) ? 1 : 0) + (preferredCountries.length ? 1 : 0)) / 4 * 100);
  const reportScore = Math.max(0, Math.min(100, Math.round((readiness * 0.55) + ((topRoute?.score ?? 0) * 0.3) + ((readyDocs / docs.length) * 100 * 0.15))));
  const routeName = topRoute?.guidance.name;
  const routeShortName = topRoute?.guidance.shortName;
  const universitiesHref = topRoute ? `/universities?country=${encodeURIComponent(topRoute.guidance.universityCode)}` : "/universities";
  const coursesHref = topRoute ? `/course-finder?country=${encodeURIComponent(topRoute.guidance.name)}` : "/course-finder";

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
              <Link href={hasProfile ? universitiesHref : "/profile"}>
                <Button className="rounded-full font-serif">{hasProfile ? `Review ${routeShortName ?? "matched"} universities` : "Complete profile"}</Button>
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
                  <Badge variant="outline" className="mb-3 rounded-full bg-primary/5 text-primary">ELEE scoring active</Badge>
                  <h2 className="font-serif text-2xl font-bold leading-tight text-foreground">
                    {routeName ? `${routeName} is your strongest saved route right now.` : "Your profile is ready. Choose target countries next."}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                    ELEE recalculates this report from your saved profile, selected countries, INR budget, course goal, test evidence, documents, and psychometric result.
                  </p>
                  {topRoute && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={universitiesHref}>
                        <Button size="sm" className="rounded-full font-serif">Review {topRoute.guidance.shortName} universities</Button>
                      </Link>
                      <Link href={coursesHref}>
                        <Button size="sm" variant="outline" className="rounded-full bg-white font-serif">Find {topRoute.guidance.shortName} courses</Button>
                      </Link>
                    </div>
                  )}
                </div>
                <aside className="border-t border-border bg-primary/5 p-5 xl:border-l xl:border-t-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">ELEE score</div>
                  <div className="mt-2 font-serif text-5xl font-bold text-foreground">{reportScore}%</div>
                  <Progress value={reportScore} className="mt-4 h-2" />
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {topRoute ? `${topRoute.score}% route fit for ${topRoute.guidance.shortName}.` : "Add countries to unlock route fit."}
                  </p>
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
                  <SectionHeader
                    title="AI recommendation"
                    description="This is the current ELEE guidance from the saved student file. It changes as the profile, test result, shortlist, and documents change."
                  />
                  {topRoute ? (
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">Recommended route</div>
                        <div className="mt-2 font-serif text-2xl font-bold text-foreground">{topRoute.guidance.name}</div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {topRoute.guidance.financeLabel} ELEE recommends reviewing {topRoute.guidance.shortName} universities and courses before moving to applications.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {topRoute.guidance.strengths.map((item) => (
                            <Badge key={item} variant="outline" className="rounded-full bg-white">{item}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border bg-white p-4">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Based on</div>
                        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                          <div><strong className="text-foreground">Profile:</strong> {readiness}% complete</div>
                          <div><strong className="text-foreground">Psychometric:</strong> {topAssessment ? `${topAssessment.field} (${topAssessment.matchScore}%)` : "Not taken yet"}</div>
                          <div><strong className="text-foreground">Documents:</strong> {readyDocs}/{docs.length} evidence areas ready</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-muted/25 p-6 text-center text-sm text-muted-foreground">
                      Select at least one target country in Profile so ELEE can recommend a route.
                    </div>
                  )}
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
                    {nextActions(profile, topRoute).map((action, index) => (
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
                        ? topRoute
                          ? `${topRoute.guidance.shortName} route benchmark: ${formatInr(topRoute.guidance.typicalAnnualBudgetInr)} per year. Your saved ceiling is ${formatInr(budgetMax)}.`
                          : `ELEE will compare courses and countries against a budget ceiling of ${formatInr(budgetMax)} per year.`
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
                      {topRoute
                        ? `${topRoute.guidance.shortName} checklist: ${topRoute.guidance.visaLabel}`
                        : "Visa readiness improves when passport details, finance proof, English test evidence, and destination choice are complete."}
                    </p>
                  </div>
                </Card>

                <Card className="app-card p-4">
                  <SectionHeader title="Report status" />
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="font-serif text-base font-bold text-foreground">ELEE score is active</div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      This report is calculated in the portal from your saved profile. {readyDocs} of {docs.length} evidence areas are ready; completing the missing items will update the score, next actions, and alerts.
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
