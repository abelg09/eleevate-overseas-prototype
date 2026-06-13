import type { ReactNode } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { JourneyTask, ModuleStatus, ModuleStatusItem } from "@/lib/demo-data";

const statusStyles: Record<ModuleStatus, string> = {
  live: "bg-emerald-700 text-white border-emerald-700",
  demo: "bg-primary text-white border-primary",
  preview: "bg-[#7A5200] text-white border-[#7A5200]",
  deferred: "bg-slate-700 text-white border-slate-700",
};
const statusLabels: Record<ModuleStatus, string> = {
  live: "Ready",
  demo: "Guided",
  preview: "Planned",
  deferred: "Later",
};

const priorityStyles = {
  high: "bg-red-700 text-white",
  medium: "bg-[#7A5200] text-white",
  low: "bg-slate-700 text-white",
};

const toneBars = {
  primary: "border-l-primary",
  good: "border-l-emerald-400",
  watch: "border-l-[#F8B133]",
  action: "border-l-red-400",
};

const taskStatusDot = {
  due: "bg-[#F8B133]",
  in_progress: "bg-primary",
  blocked: "bg-red-500",
  done: "bg-emerald-500",
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow && (
          <div className="eyebrow mb-2">
            {eyebrow}
          </div>
        )}
        <h1 className="font-serif text-2xl font-bold leading-tight text-foreground md:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "primary",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "primary" | "good" | "watch" | "action";
}) {
  return (
    <Card className={cn("app-card border-l-4 p-3.5", toneBars[tone])}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-muted-foreground">{label}</div>
        {detail && <span className="text-xs font-medium text-muted-foreground">{detail}</span>}
      </div>
      <div className="mt-3 font-serif text-xl font-bold text-foreground">{value}</div>
    </Card>
  );
}

export function ModuleStatusBadge({ status }: { status: ModuleStatus }) {
  return (
    <Badge variant="outline" className={cn(statusStyles[status])}>
      {statusLabels[status]}
    </Badge>
  );
}

export function ModuleCard({ module }: { module: ModuleStatusItem }) {
  return (
    <Link href={module.href}>
      <Card className="group h-full cursor-pointer overflow-hidden border border-border bg-white p-0 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <div className="h-1 brand-gradient-bg opacity-80 transition-opacity group-hover:opacity-100" />
        <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <div className="font-serif text-sm font-bold text-foreground">{module.title}</div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{module.id.replace(/-/g, " ")}</div>
          </div>
          <ModuleStatusBadge status={module.status} />
        </div>
        <p className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">{module.description}</p>
        <div className="mt-3 flex items-center gap-3">
          <Progress value={module.progress} className="h-1.5 flex-1" />
          <span className="text-xs font-semibold text-foreground">{module.progress}%</span>
        </div>
        </div>
      </Card>
    </Link>
  );
}

export function TaskQueue({ tasks, compact = false }: { tasks: JourneyTask[]; compact?: boolean }) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        return (
          <div
            key={task.id}
            className={cn(
              "group flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 transition-colors hover:border-primary/30 hover:bg-primary/5",
              task.status === "done" && "opacity-70",
            )}
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-muted">
              <span className={cn("h-2.5 w-2.5 rounded-full", taskStatusDot[task.status])} />
            </div>
            <div className="min-w-0 flex-1">
              <div className={cn("text-sm font-semibold leading-5 text-foreground", compact && "line-clamp-2", task.status === "done" && "line-through")}>
                {task.title}
              </div>
              <div className={cn("mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground", compact && "sr-only")}>
                  <span>{task.module}</span>
                  <span>{task.due}</span>
                  <span className="capitalize">{task.owner}</span>
              </div>
            </div>
            <Badge className={cn("text-xs", priorityStyles[task.priority])}>{task.priority}</Badge>
          </div>
        );
      })}
    </div>
  );
}

export function TimelineStepper({
  steps,
}: {
  steps: Array<{ label: string; status: string }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
      {steps.map((step, index) => {
        const tone = step.status === "done"
          ? "bg-emerald-500 text-white border-emerald-500"
          : step.status === "current"
            ? "bg-primary text-primary-foreground border-primary"
            : step.status === "risk"
              ? "bg-red-500 text-white border-red-500"
              : "bg-white text-muted-foreground border-border";
        return (
          <div key={step.label} className="relative flex min-h-16 items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
            {index > 0 && <div className="absolute -left-2 top-1/2 hidden h-px w-2 bg-border lg:block" />}
            <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-[11px] font-bold", tone)}>
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold leading-4 text-foreground">{step.label}</div>
              <div className="mt-0.5 text-xs capitalize text-muted-foreground">{step.status.replace("_", " ")}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  href,
}: {
  title: string;
  description?: string;
  href?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-serif text-base font-bold text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {href && (
        <Link href={href}>
          <Button variant="ghost" size="sm">
            Open
          </Button>
        </Link>
      )}
    </div>
  );
}
