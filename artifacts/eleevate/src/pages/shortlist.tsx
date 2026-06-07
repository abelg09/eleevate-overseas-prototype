import { useState } from "react";
import { Link, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { UniversityLogo } from "@/components/common/university-logo";
import { PageHeader } from "@/components/common/page-shell";
import {
  useGetShortlist, useToggleShortlist, useAiRecommend,
  getGetShortlistQueryKey,
} from "@workspace/api-client-react";
import type { University, AiRecommendation } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap, Sparkles, Trash2, ArrowRight,
  Star, AlertCircle, CheckCircle2, Loader2
} from "lucide-react";
import { isDemoMode, listFromApi } from "@/lib/demo-mode";
import { DEMO_UNIVERSITIES, getDemoProgramsForUniversity, getDemoUniversity } from "@/lib/demo-catalog";
import { ensureDemoApplicationForUniversity, readDemoShortlistIds, writeDemoShortlistIds } from "@/lib/demo-flow";
import { getScopedDemoUniversities } from "@/lib/demo-journey";

const DEMO_AI_RECOMMENDATIONS: AiRecommendation[] = [
  {
    universityId: "demo-ubc",
    matchScore: 0,
    reasons: ["Complete AI Profile & Test to calculate personalized fit", "Public catalog data is available now", "Budget, visa, and outcome fit will unlock after profile"],
    concern: "Personalized match is pending.",
    university: getDemoUniversity("demo-ubc"),
  },
  {
    universityId: "demo-leeds",
    matchScore: 0,
    reasons: ["Complete AI Profile & Test to calculate personalized fit", "Public catalog data is available now", "Course and city comparison can start immediately"],
    concern: "Personalized match is pending.",
    university: getDemoUniversity("demo-leeds"),
  },
];

export default function ShortlistPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [demoShortlistIds, setDemoShortlistIds] = useState<Set<string>>(() => new Set(readDemoShortlistIds()));
  const demoMode = isDemoMode();

  const { data: shortlist, isLoading } = useGetShortlist({
    query: { queryKey: getGetShortlistQueryKey(), enabled: !demoMode }
  });

  const toggle = useToggleShortlist();
  const aiRecommend = useAiRecommend();

  const universities = demoMode
    ? getScopedDemoUniversities(DEMO_UNIVERSITIES).filter((uni) => demoShortlistIds.has(uni.id))
    : listFromApi<University>(shortlist);
  const shortlistPrograms = demoMode
    ? universities.flatMap((uni) => getDemoProgramsForUniversity(uni.id))
    : [];
  const nearestDeadline = shortlistPrograms
    .filter((program) => program.applicationDeadline)
    .sort((a, b) => new Date(a.applicationDeadline!).getTime() - new Date(b.applicationDeadline!).getTime())[0];

  const handleRemove = async (id: string) => {
    if (demoMode) {
      setDemoShortlistIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return new Set(writeDemoShortlistIds(next));
      });
      toast({ title: "Removed from shortlist" });
      return;
    }

    await toggle.mutateAsync({ universityId: id, data: {} });
    queryClient.invalidateQueries({ queryKey: getGetShortlistQueryKey() });
    toast({ title: "Removed from shortlist" });
  };

  const handleStartApplication = (id: string) => {
    const application = ensureDemoApplicationForUniversity(id, "shortlist");
    toast({
      title: application ? "Application ready" : "No program found",
      description: application ? "Open Applications to continue the workflow." : "Review the university detail page for available programs.",
      variant: application ? undefined : "destructive",
    });
    if (application) setLocation("/applications");
  };

  const handleAiRecommend = async () => {
    setAiLoading(true);
    try {
      if (demoMode) {
        const nextRecommendations = DEMO_AI_RECOMMENDATIONS;
        setRecommendations(nextRecommendations);
        toast({ title: "ELEE recommendations ready", description: "Recommendations improve after AI Profile & Test is complete." });
        return;
      }

      const result = await aiRecommend.mutateAsync({ data: {} });
      const nextRecommendations = listFromApi<AiRecommendation>(result.recommendations);
      setRecommendations(nextRecommendations);
      if (!nextRecommendations.length) {
        toast({ title: "No recommendations", description: "Complete your student profile for better results." });
      }
    } catch {
      toast({ title: "AI recommendation failed", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <AppLayout>
      <div data-testid="shortlist-page">
        <PageHeader
          eyebrow="Discovery"
          title="My Shortlist"
          description="Turn saved universities into applications with program clarity, deadline awareness, and document readiness."
          actions={
            <Button onClick={handleAiRecommend} disabled={aiLoading} data-testid="btn-ai-recommend" className="rounded-full font-serif">
              {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              AI Recommend
            </Button>
          }
        />

        <section className="mb-6 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <div className="brand-gradient-bg h-1" />
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="p-5">
              <div className="eyebrow mb-2">Shortlist to application</div>
              <h2 className="font-serif text-xl font-bold leading-tight text-foreground">Choose the right program, then open the application workflow.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Saved universities now carry their next action: review programs, check deadlines, and move the strongest fit into Applications.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Saved", "Program fit", "Apply"].map((step, index) => (
                  <div key={step} className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Step {index + 1}</div>
                    <div className="mt-1 font-serif text-sm font-bold text-foreground">{step}</div>
                  </div>
                ))}
              </div>
            </div>
            <aside className="border-t border-border bg-muted/35 p-4 lg:border-l lg:border-t-0">
              <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
                <div className="rounded-lg border border-border bg-white p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Saved</div>
                  <div className="mt-1 font-serif text-xl font-bold text-foreground">{universities.length}</div>
                </div>
                <div className="rounded-lg border border-border bg-white p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Programs</div>
                  <div className="mt-1 font-serif text-xl font-bold text-foreground">{demoMode ? shortlistPrograms.length : "Review"}</div>
                </div>
                <div className="rounded-lg border border-border bg-white p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Next deadline</div>
                  <div className="mt-1 font-serif text-sm font-bold text-foreground">
                    {nearestDeadline?.applicationDeadline ? new Date(nearestDeadline.applicationDeadline).toLocaleDateString() : "TBD"}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-8" data-testid="ai-recommendations">
            <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-bold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" /> AI-Powered Recommendations
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {recommendations.map((rec) => (
                <Card key={rec.universityId} className="app-card border-primary/20 p-5 transition-all hover:border-primary/40" data-testid={`ai-rec-${rec.universityId}`}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {rec.university && (
                        <UniversityLogo
                          name={rec.university.name}
                          website={rec.university.website}
                          className="h-11 w-11"
                          imageClassName="h-8 w-8"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="font-serif text-sm font-bold text-foreground">{rec.university?.name}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{rec.university?.city}, {rec.university?.country}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="brand-gradient-bg text-xs text-white">
                        <Star className="h-3 w-3 mr-1" />{rec.matchScore > 0 ? `${rec.matchScore}% match` : "Match pending"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mb-3 space-y-1.5">
                    {rec.reasons?.map((reason: string, i: number) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        {reason}
                      </div>
                    ))}
                    {rec.concern && (
                      <div className="flex items-start gap-1.5 text-xs text-amber-600">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                        {rec.concern}
                      </div>
                    )}
                  </div>
                  <Link href={`/universities/${rec.universityId}`}>
                    <Button size="sm" variant="outline" className="w-full rounded-full font-serif text-xs">
                      View University <ArrowRight className="ml-1.5 h-3 w-3" />
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Saved Shortlist */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-bold text-foreground">
            Saved Universities
            <Badge variant="secondary">{universities.length}</Badge>
          </h2>

          {!demoMode && isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : universities.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {universities.map((uni: University) => (
                <Card key={uni.id} className="app-card overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md" data-testid={`shortlist-uni-${uni.id}`}>
                  <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-accent" />
                  <div className="p-5">
                  <div className="flex items-start gap-4">
                    <UniversityLogo name={uni.name} website={uni.website} className="h-14 w-14" imageClassName="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <div className="font-serif text-sm font-bold text-foreground">{uni.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{uni.city}, {uni.country}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {uni.ranking && (
                          <Badge variant="secondary" className="text-xs">
                            #{uni.ranking}
                          </Badge>
                        )}
                        {uni.avgTuitionUsd !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            ${(uni.avgTuitionUsd / 1000).toFixed(0)}k/yr
                          </span>
                        )}
                        {demoMode && (
                          <span className="text-xs text-muted-foreground">
                            {getDemoProgramsForUniversity(uni.id).length} program{getDemoProgramsForUniversity(uni.id).length === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link href={`/universities/${uni.id}`}>
                        <Button size="sm" variant="outline" className="rounded-full text-xs">View programs</Button>
                      </Link>
                      {demoMode && (
                        <Button
                          size="sm"
                          className="rounded-full text-xs"
                          onClick={() => handleStartApplication(uni.id)}
                          data-testid={`btn-start-application-${uni.id}`}
                        >
                          Open application
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-destructive hover:text-destructive"
                        onClick={() => handleRemove(uni.id)}
                        data-testid={`btn-remove-${uni.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border py-16 text-center">
              <GraduationCap className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
              <h3 className="mb-2 font-serif font-bold text-foreground">No universities saved yet</h3>
              <p className="mb-6 text-sm text-muted-foreground">Browse universities and bookmark the ones you're interested in.</p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/universities">
                  <Button variant="outline" className="rounded-full font-serif">Browse Universities</Button>
                </Link>
                <Button onClick={handleAiRecommend} disabled={aiLoading} data-testid="btn-ai-empty" className="rounded-full font-serif">
                  {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Get AI Recommendations
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
