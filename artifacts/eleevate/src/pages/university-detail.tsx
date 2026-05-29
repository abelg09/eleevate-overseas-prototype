import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import {
  useGetUniversity, useListPrograms, useCreateApplication,
  getGetUniversityQueryKey, getListProgramsQueryKey, getListApplicationsQueryKey
} from "@workspace/api-client-react";
import type { Application, University, Program, ProgramListResponse } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe2, TrendingUp, ExternalLink, ArrowLeft, BookOpen, Clock, CheckCircle2 } from "lucide-react";
import { UniversityLogo } from "@/components/common/university-logo";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isDemoMode } from "@/lib/demo-mode";
import { DEMO_APPLICATION_STORAGE_KEY, getDemoProgramsForUniversity, getDemoUniversity } from "@/lib/demo-catalog";

function getStoredDemoApplicationProgramIds() {
  try {
    const existing = JSON.parse(localStorage.getItem(DEMO_APPLICATION_STORAGE_KEY) ?? "[]") as Application[];
    return new Set(existing.map((app) => app.programId));
  } catch {
    return new Set<string>();
  }
}

export default function UniversityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const demoMode = isDemoMode();
  const [appliedProgramIds, setAppliedProgramIds] = useState<Set<string>>(new Set());
  const [lastAddedProgramId, setLastAddedProgramId] = useState<string | null>(null);

  const { data: uni, isLoading } = useGetUniversity(id!, {
    query: { enabled: !!id && !demoMode, queryKey: getGetUniversityQueryKey(id!) }
  });

  const { data: programsData, isLoading: programsLoading } = useListPrograms({ universityId: id, limit: 20 }, {
    query: { enabled: !!id && !demoMode, queryKey: getListProgramsQueryKey({ universityId: id }) }
  });

  const createApp = useCreateApplication();
  const university: University | undefined = demoMode ? getDemoUniversity(id) : uni;
  const programsList: ProgramListResponse | undefined = programsData;
  const programs: Program[] = demoMode ? getDemoProgramsForUniversity(id) : programsList?.data ?? [];
  const nearestProgram = programs
    .filter((program) => program.applicationDeadline)
    .sort((a, b) => new Date(a.applicationDeadline!).getTime() - new Date(b.applicationDeadline!).getTime())[0];
  const appliedProgramsForUniversity = programs.filter((program) => appliedProgramIds.has(program.id)).length;

  useEffect(() => {
    if (demoMode) setAppliedProgramIds(getStoredDemoApplicationProgramIds());
  }, [demoMode, id]);

  const handleApply = async (programId: string) => {
    if (demoMode) {
      const program = programs.find((item) => item.id === programId);
      const existing = JSON.parse(localStorage.getItem(DEMO_APPLICATION_STORAGE_KEY) ?? "[]") as Application[];
      if (existing.some((app) => app.programId === programId)) {
        toast({ title: "Already in applications", description: "Open Applications to continue the workflow." });
        return;
      }

      const nextApplication: Application = {
        id: `demo-app-${Date.now()}`,
        studentId: "demo-student",
        programId,
        status: "researching",
        notes: `Added from ${university?.name ?? "university"} detail page for consultant review.`,
        deadline: program?.applicationDeadline,
        updatedAt: new Date().toISOString(),
        program,
      };
      localStorage.setItem(DEMO_APPLICATION_STORAGE_KEY, JSON.stringify([nextApplication, ...existing]));
      setAppliedProgramIds((current) => new Set(current).add(programId));
      setLastAddedProgramId(programId);
      toast({ title: "Added to applications!", description: "Open Applications to continue the workflow." });
      return;
    }

    await createApp.mutateAsync({ data: { programId } });
    queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
    setAppliedProgramIds((current) => new Set(current).add(programId));
    setLastAddedProgramId(programId);
    toast({ title: "Added to applications!", description: "Track your progress in the Applications page." });
  };

  if (!demoMode && isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6" data-testid="university-loading">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!university) {
    return (
      <AppLayout>
        <div className="text-center py-20" data-testid="university-not-found">
          <p className="text-muted-foreground">University not found.</p>
          <Link href="/universities"><Button variant="outline" className="mt-4">Back to universities</Button></Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div data-testid="university-detail-page">
        <Link href="/universities">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors" data-testid="back-to-universities">
            <ArrowLeft className="h-4 w-4" /> Back to universities
          </button>
        </Link>

        {/* Header */}
        <section className="mb-6 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <div className="brand-gradient-bg h-1" />
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="p-5 md:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <UniversityLogo name={university.name} website={university.website} className="h-16 w-16 rounded-xl" imageClassName="h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <div className="eyebrow mb-2">University profile</div>
                  <h1 className="font-serif text-2xl font-bold leading-tight text-foreground" data-testid="uni-name">{university.name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Globe2 className="h-4 w-4" />{university.city}, {university.country}
                    </div>
                    {university.ranking !== undefined && (
                      <Badge variant="secondary">#{university.ranking} World Ranking</Badge>
                    )}
                    {university.featured && <Badge className="bg-accent text-accent-foreground">Featured</Badge>}
                  </div>
                  {university.description && (
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{university.description}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {university.website && (
                      <a href={university.website} target="_blank" rel="noopener noreferrer" data-testid="uni-website">
                        <Button variant="outline" size="sm" className="rounded-full">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Website
                        </Button>
                      </a>
                    )}
                    <Link href="/applications">
                      <Button variant="outline" size="sm" className="rounded-full">Open applications</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <aside className="border-t border-border bg-muted/35 p-4 lg:border-l lg:border-t-0">
              <div className="eyebrow mb-3">Application path</div>
              <div className="space-y-2">
                {[
                  { label: "Pick program", status: programs.length ? `${programs.length} listed` : "Review" },
                  { label: "Apply", status: appliedProgramsForUniversity ? `${appliedProgramsForUniversity} started` : "Ready" },
                  { label: "Documents", status: "Vault next" },
                ].map((item, index) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-xs">
                    <span className="font-semibold text-foreground">{index + 1}. {item.label}</span>
                    <span className="text-muted-foreground">{item.status}</span>
                  </div>
                ))}
              </div>
              {nearestProgram?.applicationDeadline && (
                <div className="mt-3 rounded-lg border border-[#F8B133]/30 bg-[#F8B133]/10 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[#8A5B00]">Nearest deadline</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{new Date(nearestProgram.applicationDeadline).toLocaleDateString()}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{nearestProgram.name}</div>
                </div>
              )}
            </aside>
          </div>
        </section>

        {lastAddedProgramId && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4" data-testid="application-created-banner">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-serif text-sm font-bold text-emerald-800">Application added</div>
                <p className="mt-1 text-xs text-emerald-700">Continue the workflow in Applications, then upload the required documents.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/applications"><Button size="sm" className="rounded-full">Open applications</Button></Link>
                <Link href="/documents"><Button size="sm" variant="outline" className="rounded-full bg-white">Upload documents</Button></Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {university.acceptanceRate !== undefined && (
            <Card className="p-4 text-center border border-border" data-testid="stat-acceptance">
              <div className="text-2xl font-bold text-foreground">{university.acceptanceRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">Acceptance rate</div>
            </Card>
          )}
          {university.avgTuitionUsd !== undefined && (
            <Card className="p-4 text-center border border-border" data-testid="stat-tuition">
              <div className="text-2xl font-bold text-foreground">
                {university.avgTuitionUsd === 0 ? "Free" : `$${(university.avgTuitionUsd / 1000).toFixed(0)}k`}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Avg tuition/year</div>
            </Card>
          )}
          {(university.programCount ?? 0) > 0 && (
            <Card className="p-4 text-center border border-border" data-testid="stat-programs">
              <div className="text-2xl font-bold text-foreground">{university.programCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Programs</div>
            </Card>
          )}
        </div>

        {/* Programs */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Available programs
          </h2>
          {programsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : programs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map((prog: Program) => (
                <Card key={prog.id} className="overflow-hidden border border-border bg-white p-0 transition-all hover:border-primary/30 hover:shadow-sm" data-testid={`program-card-${prog.id}`}>
                  <div className="h-1 bg-gradient-to-r from-primary/80 to-accent/80" />
                  <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {appliedProgramIds.has(prog.id) && (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> In Applications
                          </Badge>
                        )}
                      </div>
                      <h3 className="mt-2 font-serif text-base font-bold leading-snug text-foreground">{prog.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="secondary" className="capitalize text-xs">{prog.degree}</Badge>
                        <Badge variant="outline" className="text-xs">{prog.field}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {prog.duration !== undefined && (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{prog.duration} {prog.durationUnit}</span>
                        )}
                        {prog.tuitionUsd !== undefined && (
                          <span>{prog.tuitionUsd === 0 ? "Tuition-free" : `$${(prog.tuitionUsd / 1000).toFixed(0)}k/yr`}</span>
                        )}
                      </div>
                    </div>
                    {appliedProgramIds.has(prog.id) ? (
                      <Link href="/applications">
                        <Button size="sm" variant="outline" className="rounded-full" data-testid={`btn-open-app-${prog.id}`}>
                          Open workflow
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={() => handleApply(prog.id)}
                        disabled={createApp.isPending}
                        data-testid={`btn-apply-${prog.id}`}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                  {prog.ieltsRequirement !== undefined && (
                    <div className="mt-3 flex gap-3 text-xs text-muted-foreground border-t border-border pt-3">
                      <span>IELTS: {prog.ieltsRequirement}+</span>
                      {prog.toeflRequirement !== undefined && <span>TOEFL: {prog.toeflRequirement}+</span>}
                      {prog.gpaRequirement !== undefined && <span>GPA: {prog.gpaRequirement}+</span>}
                    </div>
                  )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-border rounded-xl" data-testid="no-programs">
              <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No programs listed yet.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
