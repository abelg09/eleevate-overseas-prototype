import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  useListApplications, useUpdateApplication,
  getListApplicationsQueryKey
} from "@workspace/api-client-react";
import type { Application, ApplicationListResponse, UpdateApplicationBodyStatus } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, AlertTriangle, Clock, Calendar, LayoutGrid, List, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/common/page-shell";
import { UniversityLogo } from "@/components/common/university-logo";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isDemoMode } from "@/lib/demo-mode";
import { DEMO_APPLICATION_STORAGE_KEY, DEMO_UNIVERSITIES } from "@/lib/demo-catalog";
import { getDemoApplicationsFromShortlist } from "@/lib/demo-flow";
import { addDemoLedgerEvent } from "@/lib/demo-journey";

const ALL_STATUSES: UpdateApplicationBodyStatus[] = [
  "researching", "applied", "under_review", "conditional_offer",
  "unconditional_offer", "rejected", "accepted", "visa_applied", "visa_approved", "enrolled",
];

const STATUS_LABELS: Record<UpdateApplicationBodyStatus, string> = {
  researching: "Researching", applied: "Applied", under_review: "Under Review",
  conditional_offer: "Conditional Offer", unconditional_offer: "Unconditional Offer",
  rejected: "Rejected", accepted: "Accepted", visa_applied: "Visa Applied",
  visa_approved: "Visa Approved", enrolled: "Enrolled",
};

const HEADER_COLORS: Record<UpdateApplicationBodyStatus, string> = {
  researching: "border-t-blue-400", applied: "border-t-purple-400",
  under_review: "border-t-yellow-400", conditional_offer: "border-t-orange-400",
  unconditional_offer: "border-t-green-400", rejected: "border-t-red-400",
  accepted: "border-t-emerald-400", visa_applied: "border-t-indigo-400",
  visa_approved: "border-t-teal-400", enrolled: "border-t-green-600",
};

const TIMELINE_STEPS: UpdateApplicationBodyStatus[] = [
  "researching", "applied", "under_review", "conditional_offer",
  "unconditional_offer", "accepted", "visa_applied", "visa_approved", "enrolled",
];

const DEMO_APPLICATIONS: Application[] = [];

function getInitialDemoApplications() {
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_APPLICATION_STORAGE_KEY) ?? "[]") as Application[];
    const merged: Application[] = [];
    const seenProgramIds = new Set<string>();

    for (const app of [...stored, ...getDemoApplicationsFromShortlist(), ...DEMO_APPLICATIONS]) {
      if (seenProgramIds.has(app.programId)) continue;
      seenProgramIds.add(app.programId);
      merged.push(app);
    }

    return merged;
  } catch {
    return getDemoApplicationsFromShortlist();
  }
}

function DeadlineCountdown({ deadline }: { deadline: string }) {
  const diffDays = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return (
    <Badge variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50">
      <AlertTriangle className="h-3 w-3 mr-1" />Overdue
    </Badge>
  );
  if (diffDays <= 7) return (
    <Badge variant="outline" className="text-xs text-orange-600 border-orange-200 bg-orange-50">
      <Clock className="h-3 w-3 mr-1" />{diffDays}d left
    </Badge>
  );
  if (diffDays <= 30) return (
    <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-200 bg-yellow-50">
      <Calendar className="h-3 w-3 mr-1" />{diffDays}d left
    </Badge>
  );
  return (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      <Calendar className="h-3 w-3 mr-1" />Due {new Date(deadline).toLocaleDateString()}
    </Badge>
  );
}

function getUniversityForApplication(app: Application) {
  const university = app.program?.university;
  const fallback = DEMO_UNIVERSITIES.find((item) => item.name === university?.name || item.id === university?.id);
  return {
    name: university?.name ?? "University",
    city: university?.city,
    country: university?.country,
    website: university?.website ?? fallback?.website,
  };
}

function KanbanBoard({
  applications,
  onStatusChange,
}: {
  applications: Application[];
  onStatusChange: (id: string, fromStatus: string, toStatus: UpdateApplicationBodyStatus) => Promise<void>;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const dragSource = useRef<{ id: string; fromStatus: string } | null>(null);

  const grouped = ALL_STATUSES.reduce<Record<UpdateApplicationBodyStatus, Application[]>>((acc, s) => {
    acc[s] = applications.filter(a => a.status === s);
    return acc;
  }, {} as Record<UpdateApplicationBodyStatus, Application[]>);

  const handleDragStart = (e: React.DragEvent, id: string, fromStatus: string) => {
    dragSource.current = { id, fromStatus };
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, toStatus: UpdateApplicationBodyStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const src = dragSource.current;
    if (!src || src.fromStatus === toStatus) return;
    await onStatusChange(src.id, src.fromStatus, toStatus);
    setDraggingId(null);
    dragSource.current = null;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6" data-testid="kanban-board">
      {ALL_STATUSES.map(col => (
        <div
          key={col}
          className={`min-w-[210px] max-w-[210px] flex-shrink-0 transition-all ${dragOverCol === col ? "scale-[1.02]" : ""}`}
          onDragOver={e => { e.preventDefault(); setDragOverCol(col); }}
          onDragLeave={() => setDragOverCol(prev => prev === col ? null : prev)}
          onDrop={e => handleDrop(e, col)}
          data-testid={`kanban-col-${col}`}
        >
          <div className={`bg-muted/60 rounded-xl border-2 border-t-4 min-h-[200px] p-3 transition-colors ${HEADER_COLORS[col]} ${dragOverCol === col ? "border-primary/40 bg-primary/5" : "border-transparent"}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-foreground">{STATUS_LABELS[col]}</span>
              {grouped[col].length > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5">{grouped[col].length}</Badge>
              )}
            </div>
            <div className="space-y-2">
              {grouped[col].map(app => (
                <div
                  key={app.id}
                  draggable
                  onDragStart={e => handleDragStart(e, app.id, app.status)}
                  onDragEnd={() => { setDraggingId(null); setDragOverCol(null); dragSource.current = null; }}
                  className={`bg-background border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all select-none ${draggingId === app.id ? "opacity-40 scale-95" : ""}`}
                  data-testid={`app-card-${app.id}`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <UniversityLogo
                      name={getUniversityForApplication(app).name}
                      website={getUniversityForApplication(app).website}
                      className="h-9 w-9"
                      imageClassName="h-6 w-6"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-foreground leading-snug line-clamp-2">{app.program?.name ?? "Program"}</div>
                      <div className="text-xs text-muted-foreground truncate">{app.program?.university?.name ?? "University"}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {app.program?.degree && <Badge variant="secondary" className="capitalize text-xs">{app.program.degree}</Badge>}
                    {app.deadline && <DeadlineCountdown deadline={app.deadline} />}
                  </div>
                </div>
              ))}
              {grouped[col].length === 0 && (
                <div className="text-center text-xs text-muted-foreground/50 py-6 border border-dashed border-border rounded-lg">Drop here</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineView({ applications }: { applications: Application[] }) {
  if (applications.length === 0) return null;

  const isRejected = (app: Application) => app.status === "rejected";

  const sorted = [...applications].sort((a, b) => {
    if (isRejected(a) && !isRejected(b)) return 1;
    if (!isRejected(a) && isRejected(b)) return -1;
    const ai = TIMELINE_STEPS.indexOf(a.status as UpdateApplicationBodyStatus);
    const bi = TIMELINE_STEPS.indexOf(b.status as UpdateApplicationBodyStatus);
    return bi - ai;
  });

  return (
    <div className="space-y-8" data-testid="timeline-view">
      {sorted.map(app => {
        const rejected = isRejected(app);
        const currentStep = rejected ? -1 : TIMELINE_STEPS.indexOf(app.status as UpdateApplicationBodyStatus);
        return (
          <Card
            key={app.id}
            className={`p-6 border ${rejected ? "border-red-200 bg-red-50/30" : "border-border"}`}
            data-testid={`timeline-app-${app.id}`}
          >
            <div className="flex items-start gap-4 mb-5">
              {rejected ? (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
              ) : (
                <UniversityLogo
                  name={getUniversityForApplication(app).name}
                  website={getUniversityForApplication(app).website}
                  className="h-10 w-10"
                  imageClassName="h-7 w-7"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">{app.program?.university?.name ?? "University"}</div>
                <div className="text-sm text-muted-foreground">{app.program?.name ?? "Program"}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  {app.program?.degree && <Badge variant="secondary" className="capitalize text-xs">{app.program.degree}</Badge>}
                  {rejected && (
                    <Badge className="text-xs bg-red-100 text-red-700 border-red-200">
                      <XCircle className="h-3 w-3 mr-1" /> Rejected
                    </Badge>
                  )}
                  {!rejected && app.deadline && <DeadlineCountdown deadline={app.deadline} />}
                </div>
              </div>
            </div>

            {/* Rejected terminal state — show simplified stopped progress */}
            {rejected ? (
              <div className="flex items-center gap-3 py-3 px-4 bg-red-50 border border-red-200 rounded-xl" data-testid="rejected-indicator">
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-red-700">Application Not Successful</div>
                  <div className="text-xs text-red-500 mt-0.5">This application reached a terminal rejected state. You can re-apply or explore alternatives.</div>
                </div>
              </div>
            ) : (
              /* Active progress steps */
              <div className="relative">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
                <div
                  className="absolute top-4 left-4 h-0.5 bg-primary transition-all"
                  style={{ width: `${(currentStep / (TIMELINE_STEPS.length - 1)) * (100 - 8)}%` }}
                />
                <div className="flex justify-between relative">
                  {TIMELINE_STEPS.map((step, i) => {
                    const done = i <= currentStep;
                    const active = i === currentStep;
                    return (
                      <div key={step} className="flex flex-col items-center gap-1.5 flex-1">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all ${active ? "border-primary bg-primary text-primary-foreground" : done ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}>
                          {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-xs font-bold">{i + 1}</span>}
                        </div>
                        <span
                          className={`text-center leading-tight ${active ? "text-xs font-semibold text-primary" : done ? "text-xs text-muted-foreground" : "text-xs text-muted-foreground/50"}`}
                          style={{ fontSize: "9px", maxWidth: "52px" }}
                        >
                          {STATUS_LABELS[step]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {app.notes && (
              <div className="mt-4 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">{app.notes}</div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export default function ApplicationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const demoMode = isDemoMode();
  const [view, setView] = useState<"kanban" | "timeline">("kanban");
  const [demoApplications, setDemoApplications] = useState<Application[]>(getInitialDemoApplications);

  useEffect(() => {
    if (demoMode) {
      localStorage.setItem(DEMO_APPLICATION_STORAGE_KEY, JSON.stringify(demoApplications));
    }
  }, [demoApplications, demoMode]);

  const { data, isLoading } = useListApplications({}, {
    query: { queryKey: getListApplicationsQueryKey({}), enabled: !demoMode }
  });
  const updateApp = useUpdateApplication();

  const result: ApplicationListResponse | undefined = data;
  const applications: Application[] = demoMode
    ? demoApplications
    : result?.data ?? [];
  const activeApplications = applications.filter((app) => !["rejected", "enrolled"].includes(app.status));
  const offers = applications.filter((app) => ["conditional_offer", "unconditional_offer", "accepted"].includes(app.status));
  const visaReady = applications.filter((app) => ["accepted", "visa_applied", "visa_approved", "enrolled"].includes(app.status));
  const documentReadiness = Math.min(100, applications.length * 10 + offers.length * 10);

  const upcomingDeadlines = applications.filter(a => {
    if (!a.deadline) return false;
    const diff = new Date(a.deadline).getTime() - Date.now();
    return diff > 0 && diff < 30 * 86400000;
  }).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  const handleStatusChange = async (id: string, fromStatus: string, toStatus: UpdateApplicationBodyStatus) => {
    if (demoMode) {
      setDemoApplications((items) => items.map((item) => item.id === id ? { ...item, status: toStatus, updatedAt: new Date().toISOString() } : item));
      addDemoLedgerEvent({
        id: `ledger-application-${id}-${toStatus}`,
        source: "Applications",
        event: `Application moved to ${STATUS_LABELS[toStatus]}`,
        studentView: "Application status updated and next document/visa task recalculated.",
        consultantView: "Counsellor queue receives the new application stage automatically.",
        revenue: "University partner pipeline",
        status: toStatus === "applied" || toStatus === "under_review" ? "Processing" : "Ready",
      });
      toast({ title: `Moved to ${STATUS_LABELS[toStatus]}` });
      return;
    }

    try {
      await updateApp.mutateAsync({ id, data: { status: toStatus } });
      queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey({}) });
      toast({ title: `Moved to ${STATUS_LABELS[toStatus]}` });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div data-testid="applications-page">
        <PageHeader
          eyebrow="Application Journey"
          title="Application Command Center"
          description={`${applications.length} application${applications.length !== 1 ? "s" : ""} from research to offer, visa, and enrollment. Shortlisting a university creates tracker items here.`}
          actions={
            <>
              <Link href="/documents">
                <Button variant="outline" size="sm" className="rounded-full">Document vault</Button>
              </Link>
              <Link href="/universities">
                <Button variant="outline" size="sm" className="rounded-full">Add application</Button>
              </Link>
            </>
          }
        />

        <section className="mb-6 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <div className="brand-gradient-bg h-1" />
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="p-5">
              <div className="eyebrow mb-2">Journey cockpit</div>
              <h2 className="font-serif text-xl font-bold leading-tight text-foreground">
                Keep applications, deadlines, and document blockers in one operating view.
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { label: "Active", value: String(activeApplications.length) },
                  { label: "Offers", value: String(offers.length) },
                  { label: "Visa ready", value: String(visaReady.length) },
                  { label: "Docs", value: `${documentReadiness}%` },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</div>
                    <div className="mt-1 font-serif text-xl font-bold text-foreground">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <aside className="border-t border-border bg-muted/35 p-4 lg:border-l lg:border-t-0">
              <div className="eyebrow mb-3">Next action</div>
              <div className="rounded-lg border border-[#F8B133]/35 bg-[#F8B133]/10 p-3">
                <div className="text-sm font-semibold leading-5 text-foreground">Upload finance proof before moving offer-stage applications into visa review.</div>
                <Link href="/documents">
                  <Button size="sm" variant="outline" className="mt-3 rounded-full bg-white">Open document packet</Button>
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">Switch between drag board and milestone timeline.</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <Button
                variant={view === "kanban" ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setView("kanban")}
                data-testid="btn-kanban-view"
              >
                <LayoutGrid className="h-4 w-4 mr-1.5" /> Board
              </Button>
              <Button
                variant={view === "timeline" ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setView("timeline")}
                data-testid="btn-timeline-view"
              >
                <List className="h-4 w-4 mr-1.5" /> Timeline
              </Button>
            </div>
          </div>
        </div>

        {/* Upcoming deadlines banner */}
        {upcomingDeadlines.length > 0 && (
          <Card className="p-4 border border-orange-200 bg-orange-50 mb-6" data-testid="deadlines-banner">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <h3 className="font-semibold text-orange-800 text-sm">Upcoming Deadlines ({upcomingDeadlines.length})</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {upcomingDeadlines.map(app => (
                <div key={app.id} className="flex items-center gap-2 text-xs bg-white border border-orange-200 rounded-lg px-3 py-1.5">
                  <span className="font-medium text-foreground truncate max-w-[120px]">{app.program?.university?.name ?? "University"}</span>
                  <DeadlineCountdown deadline={app.deadline!} />
                </div>
              ))}
            </div>
          </Card>
        )}

        {!demoMode && isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="min-w-[210px] space-y-3">
                <Skeleton className="h-8 rounded-lg" />
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
              </div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl" data-testid="no-applications">
            <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="font-semibold text-foreground mb-2">No applications yet</h2>
            <p className="text-sm text-muted-foreground mb-6">Start by exploring universities and programs.</p>
            <Link href="/universities"><Button>Explore universities</Button></Link>
          </div>
        ) : view === "kanban" ? (
          <KanbanBoard applications={applications} onStatusChange={handleStatusChange} />
        ) : (
          <TimelineView applications={applications} />
        )}
      </div>
    </AppLayout>
  );
}
