import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { addDemoLedgerEvent } from "@/lib/demo-journey";
import { hasStudentWorkspaceProfile, useStudentWorkspaceProfile } from "@/lib/student-workspace";
import { cn } from "@/lib/utils";

const cardPlans = [
  {
    name: "Student Essential",
    fee: "Zero issuance",
    currencies: "USD, CAD, GBP, EUR",
    fit: "Best for tuition deposits and first 90 days abroad.",
    status: "Recommended",
    tone: "border-l-primary",
  },
  {
    name: "Travel Plus",
    fee: "$15 issuance",
    currencies: "12 currencies",
    fit: "Best for students with transit and multi-country travel.",
    status: "Compare",
    tone: "border-l-[#F8B133]",
  },
  {
    name: "Family Backup",
    fee: "Linked add-on",
    currencies: "Home currency reload",
    fit: "Emergency reloads and parent-controlled spending guardrails.",
    status: "Later",
    tone: "border-l-emerald-400",
  },
];

const readinessSteps = [
  { label: "Passport and admission letter" },
  { label: "KYC and address proof" },
  { label: "Initial load amount" },
  { label: "Spending limits and alerts" },
];

const usageControls = [
  "Country-specific load recommendation from ELEE budget",
  "Parent and student alerts for large transactions",
  "Receipt sync for visa and finance evidence",
  "Emergency reload workflow through consultant desk",
  "Monthly spend insights by rent, food, travel, and study materials",
  "Card freeze, replacement, and local support workflow",
];

export default function ForexCardPage() {
  const profile = useStudentWorkspaceProfile();
  const hasProfile = hasStudentWorkspaceProfile(profile);

  const handleQueueCard = () => {
    addDemoLedgerEvent({
      id: "ledger-forex-card-action",
      source: "Forex Card",
      event: "Student forex card queued",
      studentView: "CAD initial load, family alerts, and arrival spending controls are queued.",
      consultantView: "Card partner fee and KYC follow-up appear in operations.",
      revenue: "Card Partner Fee",
      status: "Queued",
    });
  };

  return (
    <div data-testid="forex-card-page">
      <PageHeader
        eyebrow="Finance - Forex Card"
        title="Student forex card"
        description="A planned card workflow for tuition, arrival expenses, family visibility, and post-landing safety."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full font-serif" onClick={handleQueueCard}>Queue card</Button>
            <Link href="/remittance">
              <Button className="rounded-full font-serif">Plan remittance</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="app-card p-4">
          <SectionHeader title="Card options" description="Planned structure for partner card integrations and student comparison." />
          <div className="space-y-3">
            {cardPlans.map((plan) => (
              <div key={plan.name} className={cn("rounded-lg border border-border border-l-4 bg-white p-4", plan.tone)}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-serif text-base font-bold text-foreground">{plan.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{plan.currencies} - {plan.fee}</div>
                  </div>
                  <Badge variant="outline">{plan.status}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{plan.fit}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="app-card p-4">
          <SectionHeader title="Card readiness" description="These requirements start blank and should be verified before a partner card request is sent." />
          <div className="space-y-4">
            {readinessSteps.map((step) => (
              <div key={step.label} className="rounded-lg border border-border bg-muted/25 p-3">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">{step.label}</span>
                  <Badge variant="outline" className="rounded-full text-xs">{hasProfile ? "To verify" : "Profile needed"}</Badge>
                </div>
                <Progress value={0} className="h-1.5" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="app-card mt-4 p-4">
        <SectionHeader title="Usage controls" description="Controls that make the card useful inside the wider overseas journey." />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {usageControls.map((control) => (
            <div key={control} className="rounded-lg border border-border bg-white p-3 text-sm leading-6 text-muted-foreground">
              {control}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
