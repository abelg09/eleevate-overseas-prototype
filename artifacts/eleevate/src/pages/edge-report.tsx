import { useEffect } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { markEleeReportGenerated } from "@/lib/student-journey-state";
import { hasStudentWorkspaceProfile, useStudentWorkspaceProfile } from "@/lib/student-workspace";

const reportInputs = [
  "Academic background",
  "Target course",
  "Country preferences",
  "Budget range",
  "Test status",
  "Preferred intake",
  "Family funding details",
];

export default function EdgeReportPage() {
  const profile = useStudentWorkspaceProfile();
  const hasProfile = hasStudentWorkspaceProfile(profile);
  const preferredCountries = profile?.targetCountries ?? [];

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
                  ELEE needs your academics, goals, country interests, budget, test status, intake, and family funding details before it can recommend a route.
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
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="space-y-5">
              <Card className="app-card p-4">
                <SectionHeader title="Profile ready" description="ELEE can now compare routes and help you choose the right destinations." />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-border bg-muted/25 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Study level</div>
                    <div className="mt-2 font-serif text-xl font-bold capitalize text-foreground">{profile?.studyLevel || "Not set"}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/25 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Countries</div>
                    <div className="mt-2 font-serif text-xl font-bold text-foreground">{preferredCountries.length || "Not set"}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/25 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Budget</div>
                    <div className="mt-2 font-serif text-xl font-bold text-foreground">{profile?.budget ? `$${Number(profile.budget).toLocaleString()}` : "Not set"}</div>
                  </div>
                </div>
              </Card>

              <Card className="app-card p-4">
                <SectionHeader title="Route ranking" description="Your ranked routes will appear here once ELEE scoring is connected to the final database." />
                {preferredCountries.length > 0 ? (
                  <div className="space-y-3">
                    {preferredCountries.map((country, index) => (
                      <div key={country} className="rounded-lg border border-border bg-muted/25 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Route {index + 1}</div>
                            <div className="mt-1 font-serif text-lg font-bold text-foreground">{country}</div>
                          </div>
                          <Badge variant="outline" className="rounded-full">Ready to compare</Badge>
                        </div>
                        <Progress value={0} className="mt-3 h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-muted/25 p-6 text-center text-sm text-muted-foreground">
                    Add target countries in your profile to start route ranking.
                  </div>
                )}
              </Card>
            </section>

            <aside className="space-y-5">
              <Card className="app-card p-4">
                <SectionHeader title="Next 3 actions" />
                <div className="space-y-3">
                  {[
                    { label: "Review global universities", href: "/universities" },
                    { label: "Shortlist best-fit options", href: "/shortlist" },
                    { label: "Upload key documents", href: "/documents" },
                  ].map((action, index) => (
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
                <SectionHeader title="Report status" />
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="font-serif text-base font-bold text-foreground">Ready for ELEE scoring</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    The final score will be generated once the database and scoring rules are connected.
                  </p>
                </div>
              </Card>
            </aside>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
