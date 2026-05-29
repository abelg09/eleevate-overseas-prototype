import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  MetricCard,
  ModuleStatusBadge,
  PageHeader,
  SectionHeader,
  TaskQueue,
} from "@/components/common/page-shell";
import {
  communicationSignals,
  consultantStages,
  consultantTasks,
  serviceOrders,
} from "@/lib/demo-data";
import { demoUser } from "@/lib/demo-mode";
import { cn } from "@/lib/utils";

const stageBarStyles = {
  live: "border-l-emerald-400",
  demo: "border-l-primary",
  preview: "border-l-[#F8B133]",
  deferred: "border-l-muted-foreground/30",
};

export default function ConsultantDashboardPage() {
  const user = demoUser.consultant;

  return (
    <AppLayout>
      <div data-testid="consultant-dashboard">
        <PageHeader
          eyebrow="Consultant Command Center"
          title={`Welcome back, ${user.firstName}`}
          description="A daily intelligent operating system for leads, documents, university communication, SOP/LOR/resume work, interviews, offers, visa strategy, and post-visa advocacy."
          actions={
            <>
              <Link href="/consultant/crm">
                <Button variant="outline" className="rounded-full font-serif">
                  Lead pipeline
                </Button>
              </Link>
              <Link href="/consultant/doc-review">
                <Button className="rounded-full font-serif">
                  Review documents
                </Button>
              </Link>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <MetricCard label="Active students" value="128" detail="+12 this week" />
          <MetricCard label="Tasks due today" value="24" detail="6 high" tone="action" />
          <MetricCard label="Docs awaiting review" value="17" detail="AI checked" tone="watch" />
          <MetricCard label="Offer wins" value="31" detail="May intake" tone="good" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="app-card p-4">
            <SectionHeader title="Today's intelligent to-do list" description="Prioritized from student status, deadlines, and blocked workflows." />
            <TaskQueue tasks={consultantTasks} />
          </Card>

          <Card className="app-card p-4">
            <SectionHeader title="AI-enhanced student journey" description="The automation deck translated into consultant workflows." />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {consultantStages.map((stage, index) => (
                <div key={stage.id} className={cn("rounded-lg border border-border border-l-4 bg-white p-3.5", stageBarStyles[stage.status])}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-serif text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Stage {String(index + 1).padStart(2, "0")}
                    </div>
                    <ModuleStatusBadge status={stage.status} />
                  </div>
                  <div className="mt-3 font-serif font-bold text-foreground">{stage.stage}</div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    <span className="font-semibold text-foreground">Student:</span> {stage.studentImpact}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    <span className="font-semibold text-foreground">Team:</span> {stage.teamImpact}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="app-card p-4 lg:col-span-2">
            <SectionHeader title="Operating pipeline" href="/consultant/crm" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {[
                { label: "Lead qualified", count: 42, progress: 72 },
                { label: "Docs collecting", count: 28, progress: 54 },
                { label: "Applied / review", count: 35, progress: 68 },
                { label: "Visa / post-visa", count: 23, progress: 44 },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border bg-white p-3">
                  <div className="font-serif text-xl font-bold text-foreground">{item.count}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{item.label}</div>
                  <Progress value={item.progress} className="mt-4 h-1.5" />
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {communicationSignals.map((signal) => (
                <div key={signal.label} className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
                  <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">{signal.value}</div>
                    <div className="text-xs text-muted-foreground">{signal.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="app-card p-4">
            <SectionHeader title="Revenue and services" href="/consultant/invoicing" />
            <div className="space-y-3">
              {serviceOrders.map((order) => (
                <div key={order.id} className="rounded-lg border border-border bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{order.service}</div>
                      <div className="text-xs text-muted-foreground">{order.student} · {order.owner}</div>
                    </div>
                    <Badge variant="outline" className="capitalize">{order.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">{order.amount}</span>
                    <span className="text-xs text-muted-foreground">{order.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          {[
            { label: "Doc Review", href: "/consultant/doc-review", code: "DOC" },
            { label: "SOP Builder", href: "/consultant/sop", code: "SOP" },
            { label: "Counselling", href: "/consultant/counselling", code: "CON" },
            { label: "University Inbox", href: "/consultant/crm", code: "UNI" },
            { label: "Invoicing", href: "/consultant/invoicing", code: "INV" },
          ].map((item) => (
            <Link key={item.label} href={item.href}>
              <Card className="app-card cursor-pointer p-3.5 transition-all hover:border-primary/40">
                <div className="mb-3 font-serif text-xs font-bold uppercase tracking-wide text-primary">{item.code}</div>
                <div className="text-sm font-semibold text-foreground">{item.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">Open module</div>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="app-card mt-5 border-primary/20 bg-primary/5 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="border-l-4 border-l-primary pl-4">
              <div>
                <div className="font-semibold text-foreground">Automation impact preview</div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  AI validation and task routing are estimated to save 18 consultant hours this week across document review, university inbox follow-up, and SOP formatting.
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              +22% capacity
            </Badge>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
