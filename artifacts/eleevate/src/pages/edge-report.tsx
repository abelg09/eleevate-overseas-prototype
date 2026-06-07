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
import { hasStudentWorkspaceProfile, useStudentWorkspaceProfile } from "@/lib/student-workspace";

export default function EdgeReportPage() {
  const profile = useStudentWorkspaceProfile();
  const hasProfile = hasStudentWorkspaceProfile(profile);
  const shortlist = getDemoShortlistUniversities();
  const { ledgerEvents } = useDemoJourneyState();

  return (
    <AppLayout>
      <div data-testid="edge-report-page">
        <PageHeader
          eyebrow="ELEE Report"
          title={hasProfile ? "Generate your route intelligence." : "Your ELEE Report is waiting for profile data."}
          description={hasProfile
            ? "ELEE can now convert your saved profile into country fit, university match, document needs, visa signals, and finance planning. Scores remain pending until the report is generated."
            : "Complete AI Profile & Test first. The report does not invent a route, score, funding gap, or visa risk before you provide student-owned details."}
          actions={
            <>
              <Link href="/profile">
                <Button variant="outline" className="rounded-full font-serif">
                  AI Profile & Test
                </Button>
              </Link>
              <Link href={hasProfile ? "/universities" : "/profile"}>
                <Button className="rounded-full font-serif">
                  {hasProfile ? "Find university matches" : "Add profile data"}
                </Button>
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
                  Once the student completes profile and assessment fields, ELEE can rank routes, explain why they fit, list missing documents, show funding readiness, and create the next three actions.
                </p>
                <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {["Route ranking", "Document needs", "Finance readiness"].map((item) => (
                    <div key={item} className="rounded-lg border border-dashed border-border bg-[#f8fbff] p-4">
                      <div className="font-serif text-base font-bold text-foreground">{item}</div>
                      <div className="mt-2 text-sm text-muted-foreground">Locked until profile exists</div>
                    </div>
                  ))}
                </div>
                <Link href="/profile">
                  <Button className="mt-6 rounded-full px-6 font-serif">
                    Complete AI Profile & Test <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <aside className="rounded-lg border border-[#ead8c4] bg-[#fffaf2] p-5">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-[#a85f36]" />
                  <div className="font-serif text-lg font-bold text-foreground">Blank-state guarantee</div>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  No default country, no default score, no default student name, and no fake funding gap appear here. Public university data remains visible in discovery, but private readiness stays empty.
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
                  <Badge className="mb-4 rounded-full border-primary/20 bg-primary/10 px-3 text-xs font-bold text-primary hover:bg-primary/10">
                    Ready to generate
                  </Badge>
                  <h2 className="max-w-3xl font-serif text-3xl font-bold leading-tight text-foreground">
                    ELEE has the first profile signals. Personalized scoring is pending generation.
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                    Study level, budget, test status, nationality, intake, and career goal can now feed route comparison and university matching. The report still avoids fake numeric confidence until the scoring step runs.
                  </p>
                  <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
                    {[
                      ["ELEE score", "--"],
                      ["Best route", "Pending"],
                      ["Funding gap", "Pending"],
                      ["Visa readiness", "Pending"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-border bg-[#f8fbff] p-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
                        <div className="mt-2 font-serif text-2xl font-bold text-foreground">{value}</div>
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
                  <SectionHeader title="Route ranking" description="Country ranking appears after the AI report generation step." />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {["Best route", "Backup route", "Value route"].map((label) => (
                      <div key={label} className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
                        <div className="mt-2 font-serif text-lg font-bold text-foreground">Pending</div>
                        <Progress value={0} className="mt-4 h-1.5" />
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
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">Save universities to let ELEE compare course fit, cost, deadlines, documents, and outcomes.</p>
                    </div>
                  )}
                </Card>
              </section>

              <aside className="space-y-5">
                <Card className="app-card p-5">
                  <SectionHeader title="What changed" description="Report-related system events." />
                  {ledgerEvents.length > 0 ? (
                    <div className="space-y-3">
                      {ledgerEvents.slice(0, 4).map((event) => (
                        <div key={event.id} className="rounded-lg border border-border bg-muted/25 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wide text-primary">{event.source}</div>
                              <div className="mt-1 text-sm font-bold leading-5 text-foreground">{event.event}</div>
                            </div>
                            <Badge variant="outline" className="rounded-full text-xs">{event.status}</Badge>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-muted-foreground">{event.studentView}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <div className="mt-3 font-serif text-base font-bold text-foreground">No report events yet.</div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">Events appear after profile generation, shortlisting, document upload, or finance actions.</p>
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
