import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useGetTestScores, useAddTestScore, useDeleteTestScore,
  getGetTestScoresQueryKey,
} from "@workspace/api-client-react";
import type { TestScore } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, TrendingUp, Plus, Trash2, ExternalLink, Target, Award, Loader2 } from "lucide-react";
import { isDemoMode, listFromApi } from "@/lib/demo-mode";

const TESTS = [
  {
    id: "ielts", name: "IELTS", fullName: "International English Language Testing System",
    maxScore: 9, scoreUnit: "band", targetScore: "6.5–7.0+", color: "blue",
    resources: [
      { title: "British Council IELTS Prep", url: "https://www.britishcouncil.org/exam/ielts/preparation", desc: "Official practice materials and sample tests" },
      { title: "IELTS.org Practice Tests", url: "https://www.ielts.org/about-ielts/practice-test-centre", desc: "Free practice tests from the official source" },
      { title: "Cambridge IELTS Books", url: "https://www.cambridge.org/gb/cambridgeenglish/catalog/ielts", desc: "Authentic past papers for full practice" },
    ],
    tips: ["Focus on academic reading speed", "Practice writing Task 2 essays daily", "Listen to BBC/podcasts for Listening", "Speak with native speakers via apps like Tandem"],
  },
  {
    id: "toefl", name: "TOEFL iBT", fullName: "Test of English as a Foreign Language",
    maxScore: 120, scoreUnit: "points", targetScore: "90–100+", color: "green",
    resources: [
      { title: "ETS Official TOEFL Prep", url: "https://www.ets.org/toefl/test-takers/ibt/prepare.html", desc: "Official test prep from the makers of TOEFL" },
      { title: "Magoosh TOEFL", url: "https://magoosh.com/toefl/", desc: "Comprehensive online TOEFL preparation" },
      { title: "TOEFL Quick Prep", url: "https://www.ets.org/toefl/test-takers/ibt/prepare/free-study-materials.html", desc: "Free study materials from ETS" },
    ],
    tips: ["Practice integrated tasks (reading + listening + writing)", "Master note-taking for lectures", "Use 3-minute prep time wisely for Speaking", "Build vocabulary with academic word lists"],
  },
  {
    id: "gre", name: "GRE", fullName: "Graduate Record Examination",
    maxScore: 340, scoreUnit: "points", targetScore: "310+ (Quant 165+)", color: "purple",
    resources: [
      { title: "ETS GRE Prep", url: "https://www.ets.org/gre/test-takers/general-test/prepare.html", desc: "Official practice tests and materials" },
      { title: "Manhattan Prep GRE", url: "https://www.manhattanprep.com/gre/", desc: "Comprehensive GRE strategy guides" },
      { title: "Magoosh GRE", url: "https://magoosh.com/gre/", desc: "Video explanations and adaptive practice" },
    ],
    tips: ["Learn GRE vocabulary with Magoosh 1000 word list", "Practice Quant daily — it's learnable", "Write one Analytical Writing essay per week", "Take full-length practice tests under timed conditions"],
  },
  {
    id: "gmat", name: "GMAT", fullName: "Graduate Management Admission Test",
    maxScore: 800, scoreUnit: "points", targetScore: "650–700+", color: "orange",
    resources: [
      { title: "GMAC Official Prep", url: "https://www.mba.com/exams/gmat-exam/prepare", desc: "Official GMAT prep from the test makers" },
      { title: "Manhattan GMAT", url: "https://www.manhattanprep.com/gmat/", desc: "Industry-leading GMAT preparation" },
      { title: "Target Test Prep", url: "https://targetgmatprep.com/", desc: "Highly rated GMAT quant prep" },
    ],
    tips: ["Focus on Critical Reasoning early", "Practice Data Sufficiency methodically", "Study Sentence Correction grammar rules", "Use the Official Guide extensively"],
  },
  {
    id: "pte", name: "PTE Academic", fullName: "Pearson Test of English Academic",
    maxScore: 90, scoreUnit: "points", targetScore: "58–65+", color: "teal",
    resources: [
      { title: "Pearson Practice App", url: "https://www.pearsonpte.com/preparation", desc: "Official PTE practice and scored tests" },
      { title: "E2Language PTE", url: "https://www.e2language.com/", desc: "Popular online PTE preparation platform" },
    ],
    tips: ["PTE is computer-scored — consistency is key", "Read-aloud and Repeat Sentence carry heavy weight", "Practice Summarize Written Text efficiently"],
  },
  {
    id: "duolingo", name: "Duolingo", fullName: "Duolingo English Test",
    maxScore: 160, scoreUnit: "points", targetScore: "110–120+", color: "emerald",
    resources: [
      { title: "Duolingo Test Prep", url: "https://englishtest.duolingo.com/prepare", desc: "Official preparation and sample tests" },
    ],
    tips: ["Fast and affordable — results in 48 hours", "Practice adaptive questions under timed conditions", "Accepted by 4,000+ universities globally"],
  },
];

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; chart: string }> = {
  blue:    { bg: "bg-blue-100",    text: "text-blue-700",    border: "border-blue-200",    chart: "#3b82f6" },
  green:   { bg: "bg-green-100",   text: "text-green-700",   border: "border-green-200",   chart: "#22c55e" },
  purple:  { bg: "bg-purple-100",  text: "text-purple-700",  border: "border-purple-200",  chart: "#a855f7" },
  orange:  { bg: "bg-orange-100",  text: "text-orange-700",  border: "border-orange-200",  chart: "#f97316" },
  teal:    { bg: "bg-teal-100",    text: "text-teal-700",    border: "border-teal-200",    chart: "#14b8a6" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", chart: "#10b981" },
};

const DEMO_TEST_SCORES_STORAGE_KEY = "eleevate.ai.language-scores.v1";

function readDemoTestScores(): TestScore[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_TEST_SCORES_STORAGE_KEY) ?? "[]") as TestScore[];
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeDemoTestScores(scores: TestScore[]) {
  if (typeof window === "undefined") return scores;
  localStorage.setItem(DEMO_TEST_SCORES_STORAGE_KEY, JSON.stringify(scores));
  return scores;
}

function ScoreProgressChart({
  scores,
  maxScore,
  targetScore,
  color,
}: {
  scores: TestScore[];
  maxScore: number;
  targetScore: string;
  color: string;
}) {
  const chartColor = COLOR_CLASSES[color]?.chart ?? "#3b82f6";
  const sorted = [...scores]
    .filter(s => s.takenAt)
    .sort((a, b) => new Date(a.takenAt!).getTime() - new Date(b.takenAt!).getTime());

  if (sorted.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <TrendingUp className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Log at least 2 dated scores to see your progress chart</p>
      </div>
    );
  }

  const W = 320, H = 120, PAD = 24;
  const chartW = W - PAD * 2;
  const chartH = H - PAD * 2;

  const minScore = Math.min(...sorted.map(s => s.score));
  const scoreRange = maxScore - 0;
  const yFor = (score: number) => PAD + chartH - ((score / scoreRange) * chartH);
  const xFor = (i: number) => PAD + (i / (sorted.length - 1)) * chartW;

  const points = sorted.map((s, i) => `${xFor(i)},${yFor(s.score)}`).join(" ");
  const areaPoints = [
    `${xFor(0)},${H - PAD}`,
    ...sorted.map((s, i) => `${xFor(i)},${yFor(s.score)}`),
    `${xFor(sorted.length - 1)},${H - PAD}`,
  ].join(" ");

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">Score Progress</span>
        <span className="text-xs text-muted-foreground">Target: {targetScore}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" data-testid="score-chart">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={chartColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(frac => {
          const y = PAD + chartH * (1 - frac);
          return (
            <g key={frac}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={PAD - 4} y={y + 4} fontSize="8" fill="#9ca3af" textAnchor="end">
                {Math.round(maxScore * frac)}
              </text>
            </g>
          );
        })}
        {/* Area fill */}
        <polygon points={areaPoints} fill={`url(#grad-${color})`} />
        {/* Line */}
        <polyline points={points} fill="none" stroke={chartColor} strokeWidth="2" strokeLinejoin="round" />
        {/* Data points */}
        {sorted.map((s, i) => (
          <g key={s.id}>
            <circle cx={xFor(i)} cy={yFor(s.score)} r="4" fill="white" stroke={chartColor} strokeWidth="2" />
            <text x={xFor(i)} y={yFor(s.score) - 8} fontSize="9" fill={chartColor} textAnchor="middle" fontWeight="600">
              {s.score}
            </text>
            <text x={xFor(i)} y={H - 4} fontSize="8" fill="#9ca3af" textAnchor="middle">
              {s.takenAt ? new Date(s.takenAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
        <span>Low: <strong className="text-foreground">{Math.min(...sorted.map(s => s.score))}</strong></span>
        <span>High: <strong className="text-foreground">{Math.max(...sorted.map(s => s.score))}</strong></span>
        <span>Attempts: <strong className="text-foreground">{sorted.length}</strong></span>
      </div>
    </div>
  );
}

export default function LanguageHubPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const demoMode = isDemoMode();
  const [activeTest, setActiveTest] = useState(TESTS[0].id);
  const [newScore, setNewScore] = useState("");
  const [newDate, setNewDate] = useState("");
  const [addingScore, setAddingScore] = useState(false);
  const [demoScores, setDemoScores] = useState<TestScore[]>(() => readDemoTestScores());

  useEffect(() => {
    if (demoMode) writeDemoTestScores(demoScores);
  }, [demoMode, demoScores]);

  const { data: scores, isLoading: scoresLoading } = useGetTestScores({
    query: { queryKey: getGetTestScoresQueryKey(), enabled: !demoMode }
  });
  const addScore = useAddTestScore();
  const deleteScore = useDeleteTestScore();

  const testScores = demoMode ? demoScores : listFromApi<TestScore>(scores);
  const activeTestData = TESTS.find(t => t.id === activeTest)!;
  const colors = COLOR_CLASSES[activeTestData.color] ?? COLOR_CLASSES.blue;

  const myScoresForTest = testScores
    .filter(s => s.testType === activeTest)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const bestScore = myScoresForTest.length > 0
    ? Math.max(...myScoresForTest.map(s => s.score))
    : undefined;

  const handleAddScore = async () => {
    const score = parseFloat(newScore);
    if (isNaN(score) || score <= 0) {
      toast({ title: "Please enter a valid score", variant: "destructive" });
      return;
    }
    setAddingScore(true);
    try {
      if (demoMode) {
        setDemoScores((items) => [
          {
            id: `demo-score-${Date.now()}`,
            studentId: "demo-student",
            testType: activeTest as TestScore["testType"],
            score,
            takenAt: newDate || new Date().toISOString().slice(0, 10),
            createdAt: new Date().toISOString(),
          },
          ...items,
        ]);
        setNewScore("");
        setNewDate("");
        toast({ title: "Score recorded!" });
        return;
      }

      await addScore.mutateAsync({
        data: { testType: activeTest as TestScore["testType"], score, takenAt: newDate || undefined }
      });
      queryClient.invalidateQueries({ queryKey: getGetTestScoresQueryKey() });
      setNewScore("");
      setNewDate("");
      toast({ title: "Score recorded!" });
    } catch {
      toast({ title: "Failed to record score", variant: "destructive" });
    } finally {
      setAddingScore(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (demoMode) {
      setDemoScores((items) => items.filter((score) => score.id !== id));
      toast({ title: "Score deleted" });
      return;
    }

    await deleteScore.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getGetTestScoresQueryKey() });
    toast({ title: "Score deleted" });
  };

  return (
    <AppLayout>
      <div data-testid="language-hub-page">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-serif text-foreground">Language Training Hub</h1>
          <p className="text-muted-foreground mt-1">Resources, study tips, and score tracker with progress charts for IELTS, TOEFL, GRE, and more.</p>
        </div>

        {/* Test selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TESTS.map(test => {
            const myBest = testScores.filter(s => s.testType === test.id).reduce<number | undefined>(
              (best, s) => best === undefined || s.score > best ? s.score : best,
              undefined
            );
            return (
              <Button
                key={test.id}
                variant={activeTest === test.id ? "default" : "outline"}
                onClick={() => setActiveTest(test.id)}
                className="flex items-center gap-2 text-sm"
                data-testid={`tab-${test.id}`}
              >
                {test.name}
                {myBest !== undefined && <Badge variant="secondary" className="text-xs">{myBest}</Badge>}
              </Button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Test Overview */}
            <Card className={`p-6 border-2 ${colors.border}`} data-testid="test-overview">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{activeTestData.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{activeTestData.fullName}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className={`px-3 py-1.5 rounded-lg ${colors.bg} ${colors.text} text-sm font-medium`}>
                      Max: {activeTestData.maxScore} {activeTestData.scoreUnit}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-primary" />
                      Target: <span className="font-medium text-foreground">{activeTestData.targetScore}</span>
                    </div>
                  </div>
                </div>
                {bestScore !== undefined && (
                  <div className="text-center flex-shrink-0">
                    <div className="text-3xl font-bold text-foreground">{bestScore}</div>
                    <div className="text-xs text-muted-foreground">Best score</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Score Progress Chart */}
            <Card className="p-6 border border-border" data-testid="progress-chart-card">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Score Progress Over Time
              </h3>
              {scoresLoading ? (
                <Skeleton className="h-32 rounded-lg" />
              ) : (
                <ScoreProgressChart
                  scores={myScoresForTest}
                  maxScore={activeTestData.maxScore}
                  targetScore={activeTestData.targetScore}
                  color={activeTestData.color}
                />
              )}
            </Card>

            {/* Study Tips */}
            <Card className="p-6 border border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Study Tips
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTestData.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40">
                    <span className={`w-5 h-5 rounded-full ${colors.bg} ${colors.text} text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5`}>{i + 1}</span>
                    <p className="text-sm text-muted-foreground">{tip}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Resources */}
            <Card className="p-6 border border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-primary" /> Preparation Resources
              </h3>
              <div className="space-y-3">
                {activeTestData.resources.map((res, i) => (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-all group"
                    data-testid={`resource-${i}`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{res.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{res.desc}</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-0.5 transition-colors" />
                  </a>
                ))}
              </div>
            </Card>
          </div>

          {/* Score Tracker */}
          <div className="space-y-4">
            <Card className="p-5 border border-border" data-testid="score-tracker">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" /> Log a Score
              </h3>
              <div className="space-y-3 mb-4">
                <div>
                  <Label className="text-xs mb-1.5 block">Score</Label>
                  <Input
                    type="number"
                    placeholder={`e.g. ${activeTestData.id === "ielts" ? "7.5" : "105"}`}
                    value={newScore}
                    onChange={e => setNewScore(e.target.value)}
                    data-testid="input-score"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Test Date (for progress chart)</Label>
                  <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} data-testid="input-date" />
                </div>
                <Button className="w-full" onClick={handleAddScore} disabled={addingScore} data-testid="btn-add-score">
                  {addingScore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Add Score
                </Button>
              </div>

              <div className="space-y-2">
                {scoresLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
                ) : myScoresForTest.length > 0 ? (
                  myScoresForTest.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40" data-testid={`score-${s.id}`}>
                      <div>
                        <div className="font-bold text-foreground">
                          {s.score} <span className="text-xs font-normal text-muted-foreground">{activeTestData.scoreUnit}</span>
                        </div>
                        {s.takenAt && <div className="text-xs text-muted-foreground">{new Date(s.takenAt).toLocaleDateString()}</div>}
                      </div>
                      <button onClick={() => handleDelete(s.id)} className="text-muted-foreground/50 hover:text-destructive transition-colors" data-testid={`btn-del-score-${s.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Award className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No scores logged for {activeTestData.name} yet</p>
                  </div>
                )}
              </div>
            </Card>

            {/* All test scores summary */}
            {testScores.length > 0 && (
              <Card className="p-5 border border-border">
                <h3 className="font-semibold text-foreground mb-3 text-sm">All My Scores</h3>
                <div className="space-y-2">
                  {TESTS.filter(t => testScores.some(s => s.testType === t.id)).map(t => {
                    const best = testScores
                      .filter(s => s.testType === t.id)
                      .reduce<number>((m, s) => Math.max(m, s.score), 0);
                    const c = COLOR_CLASSES[t.color] ?? COLOR_CLASSES.blue;
                    const attempts = testScores.filter(s => s.testType === t.id).length;
                    return (
                      <div key={t.id} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{t.name}</span>
                          <span className="text-xs text-muted-foreground">{attempts}×</span>
                        </div>
                        <span className="font-semibold text-sm text-foreground">{best}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
