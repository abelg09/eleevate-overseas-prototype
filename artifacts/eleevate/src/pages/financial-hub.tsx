import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { useDemoJourneyState } from "@/lib/demo-journey";
import { useStudentWorkspaceProfile } from "@/lib/student-workspace";
import { cn } from "@/lib/utils";

const financeModules = [
  { label: "Edu Loans", href: "/loans", detail: "Compare lenders once your budget and offer details are ready." },
  { label: "Remittance", href: "/remittance", detail: "Plan tuition transfers and receipt evidence." },
  { label: "Forex Card", href: "/forex-card", detail: "Prepare arrival money after destination and travel dates are clear." },
  { label: "Forex", href: "/forex", detail: "Review exchange rates and transfer options." },
  { label: "Insurance", href: "/insurance", detail: "Choose coverage for visa, travel, and arrival." },
];

const financeKpis = [
  { label: "Budget", value: "Not set", detail: "Add in profile", tone: "border-l-primary" },
  { label: "Confirmed funds", value: "Not set", detail: "Upload proof", tone: "border-l-emerald-500" },
  { label: "Loan plan", value: "Not started", detail: "Compare options", tone: "border-l-[#C67452]" },
  { label: "Visa evidence", value: "0%", detail: "Receipts + fund proof", tone: "border-l-[#F8B133]" },
];

export default function FinancialHubPage() {
  const profile = useStudentWorkspaceProfile();
  const demoJourney = useDemoJourneyState();
  const financeUpdates = demoJourney.ledgerEvents;
  const budgetValue = profile?.budget ? `$${Number(profile.budget).toLocaleString()}` : "Not set";

  return (
    <div data-testid="financial-hub-page">
      <PageHeader
        eyebrow="Finance & arrival"
        title="Finance plan"
        description="Track tuition budget, living cost, funding proof, loans, remittance, forex, insurance, accommodation, and arrival money."
        actions={
          <>
            <Link href="/profile">
              <Button variant="outline" className="rounded-full font-serif">Add budget</Button>
            </Link>
            <Link href="/loans">
              <Button className="rounded-full font-serif">Open loans</Button>
            </Link>
          </>
        }
      />

      <section className="mb-5">
        <SectionHeader title="Finance modules" description="Choose the money task you need now." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {financeModules.map((module) => (
            <Link key={module.href} href={module.href}>
              <Card className="app-card h-full p-4 transition-all hover:border-primary/35 hover:shadow-md">
                <div className="font-serif text-base font-bold text-foreground">{module.label}</div>
                <div className="mt-2 text-sm leading-6 text-muted-foreground">{module.detail}</div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-5 rounded-lg border border-border bg-white p-5 shadow-sm">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-white">Finance journey</div>
          <h2 className="font-serif text-3xl font-bold leading-tight text-foreground">
            Build one finance plan after the student adds budget, offers, and funding documents.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Start with budget and sponsor details. As the student uploads proof, starts a loan, or plans remittance, the finance timeline will update here.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {financeKpis.map((kpi) => (
          <Card key={kpi.label} className={cn("app-card border-l-4 p-4", kpi.tone)}>
            <div className="text-xs font-semibold text-muted-foreground">{kpi.label}</div>
            <div className="mt-2 font-serif text-2xl font-bold text-foreground">{kpi.label === "Budget" ? budgetValue : kpi.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{kpi.detail}</div>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="app-card p-4">
          <SectionHeader title="Recent finance updates" description="Finance activity will appear here as the student uses loans, remittance, forex, insurance, and payment tools." />
          {financeUpdates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/25 p-8 text-center">
              <div className="font-serif text-lg font-bold text-foreground">No finance activity yet</div>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Add a budget in Profile, upload funding proof in Documents, or start an education loan to build the finance timeline.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link href="/profile">
                  <Button className="rounded-full font-serif">Add budget</Button>
                </Link>
                <Link href="/documents">
                  <Button variant="outline" className="rounded-full font-serif">Upload proof</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {financeUpdates.map((item, index) => (
                <div key={item.event} className="rounded-lg border border-border bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">Update {index + 1}</div>
                      <div className="mt-1 font-serif text-base font-bold text-foreground">{item.event}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Source: {item.source}</div>
                    </div>
                    <div className="w-fit rounded-full border border-border px-3 py-1 text-xs font-semibold">{item.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <aside className="space-y-5">
          <Card className="app-card p-4">
            <SectionHeader title="Funding readiness" />
            <div className="space-y-4">
              {[
                { label: "Budget captured", value: profile?.budget ? 100 : 0 },
                { label: "Funds confirmed", value: 0 },
                { label: "Loan match ready", value: 0 },
                { label: "Visa evidence packet", value: 0 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{item.value}%</span>
                  </div>
                  <Progress value={item.value} className="h-1.5" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="app-card p-4">
            <SectionHeader title="Next finance prompts" description="What ELEE should ask before money movement starts." />
            <div className="space-y-2">
              {[
                "Which university invoice or offer is confirmed?",
                "Who is the sponsor and what proof is available?",
                "Is the student using loan, savings, remittance, or a mix?",
                "Which receipts must be reused for visa evidence?",
              ].map((prompt) => (
                <div key={prompt} className="rounded-lg border border-border bg-muted/25 p-3 text-sm leading-6 text-muted-foreground">{prompt}</div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
