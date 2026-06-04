import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { addDemoLedgerEvent } from "@/lib/demo-journey";
import { cn } from "@/lib/utils";

const remittanceKpis = [
  { label: "Tuition due", value: "$18.4k", detail: "University of Toronto", tone: "border-l-primary" },
  { label: "Living funds", value: "$8.2k", detail: "Q1 proof target", tone: "border-l-[#F8B133]" },
  { label: "Receipts stored", value: "6/8", detail: "Document vault sync", tone: "border-l-emerald-400" },
  { label: "Compliance status", value: "Ready", detail: "LRS checklist complete", tone: "border-l-emerald-400" },
];

const paymentMilestones = [
  { item: "Application fees", owner: "Student", due: "Done", status: "Completed", progress: 100 },
  { item: "Tuition deposit", owner: "Family", due: "3 Jun", status: "Ready to send", progress: 76 },
  { item: "GIC / living funds", owner: "Sponsor", due: "12 Jun", status: "Docs pending", progress: 52 },
  { item: "Insurance premium", owner: "System", due: "After visa filing", status: "Queued", progress: 24 },
];

const checklist = [
  "Sponsor bank statement and source-of-funds note",
  "University payment instruction and invoice",
  "PAN, passport, admission letter, and address proof",
  "Purpose code, LRS declaration, and receipt capture",
  "Auto-sync receipt to visa finance evidence",
  "Family notification with converted amount and rate lock",
];

export default function RemittancePage() {
  const handlePlanRemittance = () => {
    addDemoLedgerEvent({
      id: "ledger-remittance-action",
      source: "Remittance",
      event: "Tuition remittance plan confirmed",
      studentView: "University of Toronto tuition deposit, LRS checklist, and receipt evidence are queued.",
      consultantView: "Finance desk receives a receipt follow-up task for visa evidence.",
      revenue: "Receipt follow-up ready",
      status: "Ready",
    });
  };

  return (
    <div data-testid="remittance-page">
      <PageHeader
        eyebrow="Finance - Remittance"
        title="Fee remittance gateway"
        description="Plan, send, and evidence overseas education payments without breaking the application or visa timeline."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full font-serif" onClick={handlePlanRemittance}>Confirm plan</Button>
            <Link href="/forex">
              <Button className="rounded-full font-serif">Check forex rates</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {remittanceKpis.map((kpi) => (
          <Card key={kpi.label} className={cn("app-card border-l-4 p-4", kpi.tone)}>
            <div className="text-xs font-semibold text-muted-foreground">{kpi.label}</div>
            <div className="mt-2 font-serif text-2xl font-bold text-foreground">{kpi.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{kpi.detail}</div>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="app-card p-4">
          <SectionHeader title="Payment timeline" description="A finance layer tied to offer acceptance, visa evidence, and family updates." />
          <div className="space-y-3">
            {paymentMilestones.map((milestone) => (
              <div key={milestone.item} className="rounded-lg border border-border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-foreground">{milestone.item}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{milestone.owner} - due {milestone.due}</div>
                  </div>
                  <Badge variant="outline">{milestone.status}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={milestone.progress} className="h-1.5 flex-1" />
                  <span className="text-xs font-semibold text-foreground">{milestone.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="app-card p-4">
          <SectionHeader title="Compliance checklist" />
          <div className="space-y-2">
            {checklist.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-lg border border-border bg-muted/40 p-3">
                <div className="font-serif text-xs font-bold text-primary">{String(index + 1).padStart(2, "0")}</div>
                <div className="text-sm leading-6 text-muted-foreground">{item}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
