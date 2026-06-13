import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useAuth } from "@clerk/react";
import { BookOpen, Target, TrendingUp, Clock, Volume2, PenLine, Globe, Brain } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { isDemoMode } from "@/lib/demo-mode";

const EXAMS = [
  {
    id: "IELTS", name: "IELTS", fullName: "International English Language Testing System",
    maxScore: 9, passingScore: 6.5, color: "blue",
    sections: ["Listening", "Reading", "Writing", "Speaking"],
    keyFacts: ["4 sections, 2h 45min", "Academic & General Training", "Accepted by 11,000+ organisations", "Valid for 2 years"],
    tips: [
      "Practice listening to various English accents (British, Australian, American)",
      "Read academic articles daily to improve reading speed and comprehension",
      "Write at least one task 1 and one task 2 essay per week",
      "Record yourself speaking and compare to sample answers",
    ],
    vocab: ["Consequently", "Nevertheless", "Furthermore", "In contrast", "Subsequently", "Predominantly", "Notably", "Essentially"],
    resources: [
      { name: "British Council Practice Tests", url: "https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice", type: "Official" },
      { name: "IELTS.org Practice Materials", url: "https://www.ielts.org/usa/ielts-for-test-takers/how-to-prepare", type: "Official" },
    ],
  },
  {
    id: "TOEFL", name: "TOEFL iBT", fullName: "Test of English as a Foreign Language",
    maxScore: 120, passingScore: 90, color: "green",
    sections: ["Reading", "Listening", "Speaking", "Writing"],
    keyFacts: ["4 sections, ~3 hours", "Computer-based test", "Accepted in 160+ countries", "Valid for 2 years"],
    tips: [
      "Use integrated tasks to practice combining reading and listening with writing",
      "Take timed practice tests under realistic conditions",
      "Note-taking is crucial for listening and speaking sections",
      "Practice the SPEAK method: State → Points → Explain → Acknowledge → Knock out",
    ],
    vocab: ["Advocate", "Diminish", "Incorporate", "Perceive", "Accumulate", "Attribute", "Controversial", "Substantial"],
    resources: [
      { name: "ETS Official TOEFL Prep", url: "https://www.ets.org/toefl/test-takers/ibt/prepare.html", type: "Official" },
    ],
  },
  {
    id: "GRE", name: "GRE", fullName: "Graduate Record Examinations",
    maxScore: 340, passingScore: 300, color: "purple",
    sections: ["Verbal Reasoning", "Quantitative Reasoning", "Analytical Writing"],
    keyFacts: ["3h 45min duration", "Section-adaptive scoring", "Valid for 5 years", "Required by most US grad schools"],
    tips: [
      "Build vocabulary systematically — 10 new words per day using spaced repetition",
      "For Quant, master every question type before moving to timed practice",
      "Write 2 essays per week and review them critically",
      "Use the on-screen calculator wisely; estimate when faster",
    ],
    vocab: ["Loquacious", "Obsequious", "Sycophant", "Ephemeral", "Esoteric", "Perfidious", "Equivocate", "Garrulous"],
    resources: [
      { name: "ETS PowerPrep", url: "https://www.ets.org/gre/test-takers/general-test/prepare/powerprep.html", type: "Official" },
    ],
  },
  {
    id: "GMAT", name: "GMAT Focus", fullName: "Graduate Management Admission Test",
    maxScore: 805, passingScore: 645, color: "orange",
    sections: ["Quantitative Reasoning", "Verbal Reasoning", "Data Insights"],
    keyFacts: ["2h 15min duration", "Adaptive testing", "Used for MBA admission", "Valid for 5 years"],
    tips: [
      "Focus on Data Sufficiency — it's unique to GMAT and trips up many students",
      "Critical Reasoning: always identify the conclusion and premises first",
      "For Quant: speed is key, practice eliminating wrong answers quickly",
      "Read The Economist and WSJ to build business reading comprehension",
    ],
    vocab: ["Ambiguous", "Corroborate", "Paradox", "Plausible", "Substantiate", "Undermine", "Infer", "Premise"],
    resources: [
      { name: "GMAT Official Starter Kit", url: "https://www.mba.com/exam-prep/gmat-official-starter-kit-practice-exams-1-and-2", type: "Official" },
    ],
  },
  {
    id: "SAT", name: "SAT", fullName: "Scholastic Assessment Test",
    maxScore: 1600, passingScore: 1200, color: "red",
    sections: ["Reading & Writing", "Math"],
    keyFacts: ["2h 14min (digital)", "Digital adaptive format since 2024", "Required for US undergrad", "Score valid 5 years"],
    tips: [
      "Digital SAT is adaptive — a strong first module boosts second-module difficulty and score ceiling",
      "Math: no calculator for some questions; master mental math shortcuts",
      "Reading: focus on evidence-based questions — always go back to the passage",
      "Eliminate obviously wrong answers before guessing",
    ],
    vocab: ["Pragmatic", "Contentious", "Ambivalent", "Nuanced", "Ironic", "Skeptical", "Ubiquitous", "Tenacious"],
    resources: [
      { name: "Khan Academy Official SAT Prep (Free)", url: "https://www.khanacademy.org/sat", type: "Free" },
    ],
  },
  {
    id: "PTE", name: "PTE Academic", fullName: "Pearson Test of English Academic",
    maxScore: 90, passingScore: 65, color: "teal",
    sections: ["Speaking & Writing", "Reading", "Listening"],
    keyFacts: ["3 hours total", "Computer-scored (no human bias)", "Fast results: 48-72 hours", "Accepted by 3,000+ universities"],
    tips: [
      "PTE is fully computer-scored — pronunciation and fluency score automatically",
      "Practice the Read Aloud task daily; it contributes to both speaking and reading scores",
      "Summarize Written Text: practise writing one complex sentence that captures the key idea",
      "Use the Retell Lecture task: note key nouns, verbs, and numbers while listening",
    ],
    vocab: ["Systematic", "Phenomenon", "Fundamental", "Significant", "Demonstrate", "Implement", "Relevant", "Consistent"],
    resources: [
      { name: "Pearson PTE Official Practice", url: "https://www.pearsonpte.com/preparation", type: "Official" },
    ],
  },
];

const SECTION_ICONS: Record<string, React.ElementType> = {
  Listening: Volume2, Reading: BookOpen, Writing: PenLine,
  Speaking: Globe, "Verbal Reasoning": Brain, "Quantitative Reasoning": Target,
  "Analytical Writing": PenLine, "Data Insights": TrendingUp,
  Math: Target, "Reading & Writing": BookOpen, "Speaking & Writing": Globe,
};

type TestPrepScore = { testType: string; score: number; takenAt: string };

const TEST_PREP_SCORE_STORAGE_KEY = "eleevate.student-first.test-prep.scores.v1";

function readLocalScores(): TestPrepScore[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(localStorage.getItem(TEST_PREP_SCORE_STORAGE_KEY) ?? "[]") as TestPrepScore[];
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeLocalScores(scores: TestPrepScore[]) {
  localStorage.setItem(TEST_PREP_SCORE_STORAGE_KEY, JSON.stringify(scores));
  return scores;
}

export default function TestPrepPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const demoMode = isDemoMode();
  const [activeExam, setActiveExam] = useState("IELTS");
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [showFlashcardBack, setShowFlashcardBack] = useState(false);
  const [newScore, setNewScore] = useState("");
  const [demoScores, setDemoScores] = useState<TestPrepScore[]>(() => readLocalScores());
  const exam = EXAMS.find(e => e.id === activeExam)!;

  useEffect(() => {
    if (demoMode) writeLocalScores(demoScores);
  }, [demoMode, demoScores]);

  const { data: scores } = useQuery({
    queryKey: ["test-scores"],
    enabled: !demoMode,
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/students/me/test-scores`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json() as Promise<{ testType: string; score: number; takenAt: string }[]>;
    },
  });

  const addScore = useMutation({
    mutationFn: async (score: number) => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/students/me/test-scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ testType: activeExam.toLowerCase(), score }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["test-scores"] }); setNewScore(""); },
  });

  const scoreList = demoMode ? demoScores : scores ?? [];
  const examScores = scoreList
    .filter(s => s.testType === activeExam.toLowerCase())
    .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
  const latestScore = examScores[0];
  const pct = latestScore ? Math.round((latestScore.score / exam.maxScore) * 100) : 0;
  const colorMap: Record<string, string> = { blue: "text-blue-600", green: "text-green-600", purple: "text-purple-600", orange: "text-orange-600", red: "text-red-600", teal: "text-teal-600" };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><BookOpen className="h-8 w-8 text-primary" />Test Prep Hub</h1>
        <p className="text-muted-foreground mt-1">Comprehensive preparation for IELTS, TOEFL, GRE, GMAT, SAT & PTE</p>
      </div>

      {/* Exam selector */}
      <div className="flex flex-wrap gap-2">
        {EXAMS.map(e => (
          <button key={e.id} onClick={() => { setActiveExam(e.id); setFlashcardIdx(0); setShowFlashcardBack(false); }}
            className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${activeExam === e.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}>
            {e.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className={colorMap[exam.color]}>{exam.name}</CardTitle>
              <CardDescription>{exam.fullName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {exam.keyFacts.map(f => (
                  <div key={f} className="flex items-start gap-2 text-sm"><Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />{f}</div>
                ))}
              </div>
              <div>
                <div className="text-sm font-semibold mb-2">Sections</div>
                <div className="flex flex-wrap gap-2">
                  {exam.sections.map(s => {
                    const Icon = SECTION_ICONS[s] ?? BookOpen;
                    return <Badge key={s} variant="secondary" className="gap-1.5"><Icon className="h-3 w-3" />{s}</Badge>;
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs: Tips + Vocab + Resources */}
          <Tabs defaultValue="tips">
            <TabsList><TabsTrigger value="tips">Study Tips</TabsTrigger><TabsTrigger value="vocab">Vocabulary</TabsTrigger><TabsTrigger value="resources">Resources</TabsTrigger></TabsList>
            <TabsContent value="tips" className="space-y-2 mt-3">
              {exam.tips.map((tip, i) => (
                <Card key={i}><CardContent className="py-3 flex gap-3 items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <p className="text-sm">{tip}</p>
                </CardContent></Card>
              ))}
            </TabsContent>
            <TabsContent value="vocab" className="mt-3">
              <Card>
                <CardHeader><CardTitle className="text-base">Vocabulary Flashcard</CardTitle><CardDescription>Tap card to reveal usage context</CardDescription></CardHeader>
                <CardContent>
                  <div
                    className="min-h-32 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center cursor-pointer hover:bg-muted/30 transition-all mb-4"
                    onClick={() => setShowFlashcardBack(b => !b)}
                  >
                    {!showFlashcardBack ? (
                      <div className="text-3xl font-bold text-primary">{exam.vocab[flashcardIdx]}</div>
                    ) : (
                      <div className="text-center px-4">
                        <div className="text-xl font-bold text-primary mb-2">{exam.vocab[flashcardIdx]}</div>
                        <p className="text-sm text-muted-foreground">Use this word in academic writing to signal contrast, cause-effect, or elaboration in your essay.</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => { setFlashcardIdx(i => Math.max(0, i - 1)); setShowFlashcardBack(false); }}>← Prev</Button>
                    <span className="text-sm text-muted-foreground self-center">{flashcardIdx + 1} / {exam.vocab.length}</span>
                    <Button variant="outline" size="sm" onClick={() => { setFlashcardIdx(i => Math.min(exam.vocab.length - 1, i + 1)); setShowFlashcardBack(false); }}>Next →</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="resources" className="mt-3 space-y-2">
              {exam.resources.map(r => (
                <Card key={r.name}><CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{r.name}</div>
                    <Badge variant="outline" className="text-xs mt-1">{r.type}</Badge>
                  </div>
                  <Button size="sm" variant="outline" asChild><a href={r.url} target="_blank" rel="noopener noreferrer">Open ↗</a></Button>
                </CardContent></Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Score tracker sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Score Tracker</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {latestScore ? (
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">{latestScore.score}</div>
                  <div className="text-sm text-muted-foreground">Latest score (max {exam.maxScore})</div>
                  <Progress value={pct} className="h-2 mt-2" />
                  <div className="text-xs text-muted-foreground mt-1">{pct}% of max score</div>
                  {latestScore.score >= exam.passingScore ? (
                    <Badge className="mt-2 bg-green-100 text-green-700 border-0">Above target ({exam.passingScore}+)</Badge>
                  ) : (
                    <Badge className="mt-2 bg-orange-100 text-orange-700 border-0">Target: {exam.passingScore}+</Badge>
                  )}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">No scores logged yet</div>
              )}

              <div className="flex gap-2">
                <Input placeholder={`Score (0–${exam.maxScore})`} type="number" value={newScore} onChange={e => setNewScore(e.target.value)} className="text-sm" />
                <Button
                  size="sm"
                  onClick={() => {
                    if (demoMode) {
                      setDemoScores((items) => [{ testType: activeExam.toLowerCase(), score: Number(newScore), takenAt: new Date().toISOString() }, ...items]);
                      setNewScore("");
                    } else {
                      addScore.mutate(Number(newScore));
                    }
                  }}
                  disabled={!newScore || addScore.isPending}
                >
                  Log
                </Button>
              </div>

              {examScores.length > 1 && (() => {
                const chartData = [...examScores].reverse().slice(-10).map(s => ({
                  date: new Date(s.takenAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                  score: s.score,
                }));
                return (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score Trend</div>
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, exam.maxScore]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ fontSize: 11, padding: "4px 8px", borderRadius: 6 }}
                          formatter={(v: number) => [`${v} / ${exam.maxScore}`, "Score"]}
                        />
                        <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-muted-foreground">History</div>
                      {examScores.slice(0, 5).map(s => (
                        <div key={s.takenAt} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{new Date(s.takenAt).toLocaleDateString()}</span>
                          <span className="font-semibold">{s.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Quick Start</CardTitle></CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = "/mock-test"}>Take Mock Test</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
