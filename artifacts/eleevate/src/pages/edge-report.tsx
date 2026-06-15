import { Link } from "wouter";
import { AlertCircle, ArrowRight, FileSearch, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { getDemoShortlistUniversities } from "@/lib/demo-flow";
import { useDemoJourneyState } from "@/lib/demo-journey";
import {
  hasStudentWorkspaceProfile,
  useStudentWorkspaceProfile,
  type StudentWorkspaceProfile,
} from "@/lib/student-workspace";

const LEGACY_USD_TO_INR = 83;
const inrFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

function normalizeBudgetAmount(value: unknown, currency?: string) {
  const parsed = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  if (currency !== "INR" && parsed <= 120_000) return Math.round(parsed * LEGACY_USD_TO_INR);
  return Math.round(parsed);
}

function formatInr(value: number) {
  return `INR ${inrFormatter.format(value)}`;
}

function readiness(profile: StudentWorkspaceProfile | null) {
  const checks = [
    profile?.studyLevel,
    profile?.careerGoal,
    profile?.nationality,
    profile?.preferredIntake,
    normalizeBudgetAmount(profile?.budget, profile?.budgetCurrency) > 0,
    profile?.gpa,
    profile?.ieltsScore || profile?.toeflScore,
    profile?.greScore || profile?.gmatScore,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function inferRoutes(profile: StudentWorkspaceProfile | null) {
  if (profile?.targetCountries?.length) return profile.targetCountries;
  const goal = (profile?.careerGoal ?? "").toLowerCase();
  if (goal.includes("finance") || goal.includes("account")) return ["United Kingdom", "Singapore", "Ireland"];
  if (goal.includes("health")) return ["Canada", "Australia", "United Kingdom"];
  if (goal.includes("business") || goal.includes("management")) return ["United Kingdom", "Australia", "Netherlands"];
  return ["United Kingdom", "Canada", "Australia"];
}

function routeRows(profile: StudentWorkspaceProfile | null) {
  const score = readiness(profile);
  return inferRoutes(profile).map((country, index) => ({
    country,
    score: Math.max(55, Math.min(95, score + 14 - index * 5)),
  }));
}

export default function EdgeReportPage() {
  const profile = useStudentWorkspaceProfile();
  const hasProfile = hasStudentWorkspaceProfile(profile);
  const shortlist = getDemoShortlistUniversities();
  const { ledgerEvents } = useDemoJourneyState();
  const budget = normalizeBudgetAmount(profile?.budget, profile?.budgetCurrency);
  const routes = routeRows(profile);
  const score = readiness(profile);
  const docsReady = [
    Boolean(profile?.gpa),
    Boolean(profile?.ieltsScore || profile?.toeflScore),
    budget > 0,
    Boolean(profile?.careerGoal),
  ].filter(Boolean).length;

  return (
    <AppLayout>
      <div data-testid="edge-report-page">
        <PageHeader
          eyebrow="ELEE Report"
          title={hasProfile ? "Your personalized ELEE Report" : "Your ELEE Report starts after your profile."}
          description={hasProfile
            ? "ELEE turns your saved profile into route fit, university direction, document needs, INR finance planning, and next actions."
            : "Complete AI Profile & Test first. ELEE will not guess your route, score, funding gap, or visa readiness before you share your details."}
          actions={
            <>
              <Link href="/profile">
                <Button variant="outline" className="rounded-full font-serif">AI Profile & Test</Button>
              </Link>
              <Link href={hasProfile ? "/universities" : "/profile"}>
                <Button className="rounded-full font-serif">{hasProfile ? "Find university matches" : "Add profile data"}</Button>
              </Link>
            </>
          }
        />

        {!hasProfile ? (
          <Card className="overflow-hidden border border-border bg-white p-0 shadow-sm">
            <div className="h-2 bg-[linear-gradient(90deg,#102044_0%,#102044_58%,#C9784A_58%,#C9784A_74%,#39B54A_74%,#39B54A_100%)]" />
            <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#102044,#39B54A)] text-white">
                  <FileSearch className="h-7 w-7" />
                </div>
                <h2 className="mt-5 font-serif text-3xl font-bold leading-tight text-foreground">Generate your first ELEE Report.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Add your study level, career goal, nationality, intake, budget in INR, and test details. ELEE will then show route fit, document gaps, finance readiness, and next actions.
                </p>
                <Link href="/profile">
                  <Button className="mt-6 rounded-full px-6 font-serif">
                    Complete AI Profile & Test <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <aside className="rounded-lg border border-[#ead8c4] bg-[#fffaf2] p-5">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-[#a85f36]" />
                  <div className="font-serif text-lg font-bold text-foreground">No guesses before your profile</div>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  ELEE will not show a default country, score, or funding gap until you add your own details.
                </p>
              </aside>
            </div>
          </Card>
        ) : (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <div className="h-2 bg-[linear-gradient(90deg,#102044_0%,#102044_58%,#C9784A_58%,#C9784A_74%,#39B54A_74%,#39B54A_100%)]" />
              <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="p-5 md:p-6">
                  <Badge className="mb-4 rounded-full border-primary/20 bg-primary/10 px-3 text-xs font-bold text-primary hover:bg-primary/10">Generated from saved profile</Badge>
                  <h2 className="max-w-3xl font-serif text-3xl font-bold leading-tight text-foreground">
                    {routes[0]?.country} is the first route to compare.
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                    ELEE is using your study level, career goal, INR budget, intake, nationality, and test details to create the first guidance layer.
                  </p>
                  <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
                    {[
                      ["Readiness", `${score}%`],
                      ["Best route", routes[0]?.country ?? "Pending"],
                      ["Budget", budget > 0 ? formatInr(budget) : "Not added"],
                      ["Docs ready", `${docsReady}/4`],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-border bg-[#f8fbff] p-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
                        <div className="mt-2 font-serif text-xl font-bold text-foreground">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <aside className="border-t border-border bg-[#fffaf2] p-5 xl:border-l xl:border-t-0">
                  <div className="eyebrow text-[#a85f36]">Next 3 actions</div>
                  <div className="mt-4 space-y-3">
                    {[
                      ["Review profile completeness", "/profile"],
                      ["Shortlist universities for match tracking", "/universities"],
                      ["Upload passport and academic documents", "/documents"],
                    ].map(([label, href]) => (
                      <Link key={label} href={href}>
                        <div className="group rounded-lg border border-[#ead8c4] bg-white p-3 transition-all hover:border-primary/35">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-bold text-foreground">{label}</div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </aside>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
              <section className="space-y-5">
                <Card className="app-card p-5">
                  <SectionHeader title="Route ranking" description="First-pass country ranking based on saved profile signals." />
                  <div className="space-y-3">
                    {routes.map((route, index) => (
                      <div key={route.country} className="rounded-lg border border-border bg-muted/25 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Route {index + 1}</div>
                            <div className="mt-1 font-serif text-lg font-bold text-foreground">{route.country}</div>
                          </div>
                          <Badge variant={index === 0 ? "default" : "outline"}>{route.score}% fit</Badge>
                        </div>
                        <Progress value={route.score} className="mt-4 h-1.5" />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="app-card p-5">
                  <SectionHeader title="University match input" description="Shortlisted universities feed the next report pass." href="/universities" />
                  {shortlist.length > 0 ? (
                    <div className="space-y-3">
                      {shortlist.map((university) => (
                        <div key={university.id} className="rounded-lg border border-border bg-white p-4">
                          <div className="font-serif text-base font-bold text-foreground">{university.name}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{university.city}, {university.country}</div>
                          <Badge className="mt-3 rounded-full bg-secondary text-white hover:bg-secondary">ELEE Match pending</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-5">
                      <div className="font-serif text-base font-bold text-foreground">No universities shortlisted yet.</div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">Save universities to compare course fit, cost, deadlines, documents, and outcomes.</p>
                    </div>
                  )}
                </Card>
              </section>

              <aside className="space-y-5">
                <Card className="app-card p-5">
                  <SectionHeader title="Finance clarity" />
                  <div className="rounded-lg border border-border bg-muted/25 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Annual budget</div>
                    <div className="mt-2 font-serif text-xl font-bold text-foreground">{budget > 0 ? formatInr(budget) : "Not added"}</div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {budget > 0 ? "ELEE will compare tuition, living cost, loan, remittance, forex, and visa fund proof against this INR budget." : "Add your INR budget in Profile to unlock finance guidance."}
                    </p>
                  </div>
                </Card>

                <Card className="app-card p-5">
                  <SectionHeader title="What changed" description="Report-related system events." />
                  {ledgerEvents.length > 0 ? (
                    <div className="space-y-3">
                      {ledgerEvents.slice(0, 4).map((event) => (
                        <div key={event.id} className="rounded-lg border border-border bg-muted/25 p-3">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-primary">{event.source}</div>
                          <div className="mt-1 text-sm font-bold leading-5 text-foreground">{event.event}</div>
                          <p className="mt-2 text-xs leading-5 text-muted-foreground">{event.studentView}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <div className="mt-3 font-serif text-base font-bold text-foreground">No report events yet.</div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">Events appear after shortlisting, document upload, or finance actions.</p>
                    </div>
                  )}
                </Card>
              </aside>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
