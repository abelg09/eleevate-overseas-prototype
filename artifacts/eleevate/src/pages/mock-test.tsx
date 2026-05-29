import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@clerk/react";
import { Timer, CheckCircle, XCircle, Trophy, RotateCcw, Brain } from "lucide-react";

type Difficulty = "easy" | "medium" | "hard";

interface Question {
  id: string;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: Difficulty;
  examType: string;
}

const QUESTION_BANK: Question[] = [
  // IELTS Reading
  { id: "ir1", topic: "Reading Comprehension", question: "The author's primary purpose in the passage is to:", options: ["Persuade readers to adopt a new diet", "Describe the evolution of agricultural practices", "Criticise modern farming methods", "Compare two different economic systems"], correctIndex: 1, explanation: "The passage systematically traces how farming has changed over centuries, making 'describe the evolution' the primary purpose.", difficulty: "medium", examType: "IELTS" },
  { id: "ir2", topic: "Vocabulary in Context", question: "The word 'ubiquitous' most nearly means:", options: ["Rare and valuable", "Present everywhere", "Extremely complex", "Historically significant"], correctIndex: 1, explanation: "'Ubiquitous' comes from Latin 'ubique' meaning everywhere. Something ubiquitous is found everywhere.", difficulty: "easy", examType: "IELTS" },
  // GRE Verbal
  { id: "gv1", topic: "Sentence Equivalence", question: "Although critics found the film ______, audiences flocked to cinemas worldwide.", options: ["compelling", "mediocre", "derivative", "predictable", "banal", "riveting"], correctIndex: 1, explanation: "Both 'mediocre' and 'banal' create the contrast 'although' requires — critics disliked it, but audiences loved it.", difficulty: "hard", examType: "GRE" },
  { id: "gv2", topic: "Reading Comprehension", question: "Based on the passage, which conclusion can be drawn about renewable energy?", options: ["It will completely replace fossil fuels within a decade", "Adoption faces economic and infrastructure challenges", "Governments universally oppose its implementation", "It is currently more expensive than nuclear energy"], correctIndex: 1, explanation: "The passage discusses barriers to adoption, including investment costs and grid infrastructure challenges.", difficulty: "medium", examType: "GRE" },
  // GRE Quant
  { id: "gq1", topic: "Algebra", question: "If 2x + 5 = 17, what is the value of 4x − 3?", options: ["21", "23", "24", "18"], correctIndex: 0, explanation: "2x + 5 = 17 → 2x = 12 → x = 6. So 4x − 3 = 24 − 3 = 21.", difficulty: "easy", examType: "GRE" },
  { id: "gq2", topic: "Geometry", question: "A circle has area 25π. What is its circumference?", options: ["5π", "10π", "25π", "50π"], correctIndex: 1, explanation: "Area = πr² = 25π → r = 5. Circumference = 2πr = 10π.", difficulty: "medium", examType: "GRE" },
  // TOEFL
  { id: "tf1", topic: "Listening Inference", question: "What does the professor imply about early climate models?", options: ["They were completely accurate", "They underestimated the role of ocean currents", "They are still the standard today", "They were developed in the 1990s"], correctIndex: 1, explanation: "The professor emphasises that ocean circulation was a 'missing variable' in early climate projections.", difficulty: "medium", examType: "TOEFL" },
  { id: "tf2", topic: "Writing Task", question: "Which transition best connects: 'The experiment failed. ___ the team learned valuable lessons.'", options: ["Therefore", "Nevertheless", "Moreover", "Consequently"], correctIndex: 1, explanation: "'Nevertheless' shows contrast — despite failing, lessons were learned. 'Therefore' would indicate a logical result, not contrast.", difficulty: "easy", examType: "TOEFL" },
  // GMAT
  { id: "gm1", topic: "Critical Reasoning", question: "Which of the following, if true, most strengthens the conclusion that the new marketing campaign increased sales?", options: ["The company increased its advertising budget", "Competitors reported declining sales during the same period", "The marketing team was expanded by 20%", "Social media impressions doubled"], correctIndex: 1, explanation: "If competitors declined while this company grew, it isolates the campaign as the differentiating factor, strengthening the causal claim.", difficulty: "hard", examType: "GMAT" },
  { id: "gm2", topic: "Data Sufficiency", question: "Is x > 0? (1) x² > 0 (2) x³ > 0", options: ["Statement 1 alone sufficient", "Statement 2 alone sufficient", "Both together sufficient", "Neither sufficient"], correctIndex: 1, explanation: "Statement 1: x² > 0 means x ≠ 0 but x could be negative. Insufficient. Statement 2: x³ > 0 means x > 0. Sufficient.", difficulty: "hard", examType: "GMAT" },
  // SAT
  { id: "st1", topic: "Math: Algebra", question: "A store marks up an item by 40% then offers a 20% discount. The final price is what percentage of the original?", options: ["80%", "112%", "120%", "128%"], correctIndex: 1, explanation: "1.4 × 0.8 = 1.12, so the final price is 112% of the original — a 12% net increase.", difficulty: "medium", examType: "SAT" },
  { id: "st2", topic: "Reading & Writing", question: "Select the option that best corrects: 'Neither the students nor the teacher were prepared.'", options: ["Neither the students nor the teacher was prepared.", "Neither the students or the teacher were prepared.", "Neither the students nor the teachers were prepared.", "No change needed."], correctIndex: 0, explanation: "With 'neither...nor', the verb agrees with the closest subject. 'Teacher' is singular, so use 'was'.", difficulty: "medium", examType: "SAT" },
  // PTE Academic
  { id: "pt1", topic: "Read Aloud", question: "Which feature of the PTE Read Aloud task contributes to BOTH speaking and reading scores?", options: ["Intonation only", "Fluency and pronunciation scoring", "Vocabulary range only", "Grammar accuracy"], correctIndex: 1, explanation: "PTE's Read Aloud is computer-scored for both oral fluency and pronunciation, with scores feeding into both Speaking and Reading sub-scores simultaneously.", difficulty: "easy", examType: "PTE" },
  { id: "pt2", topic: "Summarise Written Text", question: "A well-written PTE Summarise Written Text response should be:", options: ["100–120 words long", "One single sentence of 5–75 words", "A bullet-point list of key facts", "Two paragraphs with a conclusion"], correctIndex: 1, explanation: "PTE requires the summary to be a single grammatically correct sentence between 5 and 75 words. Longer or multi-sentence responses receive zero.", difficulty: "medium", examType: "PTE" },
  { id: "pt3", topic: "Reorder Paragraphs", question: "When reordering PTE paragraphs, what is the most reliable strategy to identify the opening sentence?", options: ["Choose the longest sentence", "Find the sentence with a definite article ('The') starting a new concept", "Choose the sentence that ends with a question mark", "Select the sentence containing 'in conclusion'"], correctIndex: 1, explanation: "Opening sentences typically introduce a topic without pronouns referring back to something, and often use indefinite articles or proper nouns. Sentences that begin with 'The' referring to something already introduced are rarely first.", difficulty: "hard", examType: "PTE" },
];

const EXAM_TYPES = ["All", "IELTS", "TOEFL", "GRE", "GMAT", "SAT", "PTE"];
const DURATION = 10; // minutes per session

interface Answer { questionId: string; selectedIndex: number; correct: boolean; timeSpent: number; }

const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard"];
const SESSION_LENGTH = 8;

/** Pick the best available question at targetDifficulty, falling back to adjacent levels. */
function pickNext(pool: Question[], target: Difficulty): { question: Question; remaining: Question[] } | null {
  if (pool.length === 0) return null;
  const order = DIFFICULTY_ORDER;
  const idx = order.indexOf(target);
  // Try target, then neighbors expanding outward
  const priorities = [target, order[idx + 1], order[idx - 1], order[idx + 2], order[idx - 2]].filter(Boolean) as Difficulty[];
  for (const diff of priorities) {
    const candidates = pool.filter(q => q.difficulty === diff);
    if (candidates.length > 0) {
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      return { question: chosen, remaining: pool.filter(q => q.id !== chosen.id) };
    }
  }
  // Final fallback: any remaining question
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return { question: chosen, remaining: pool.filter(q => q.id !== chosen.id) };
}

/** Compute next target difficulty based on current difficulty and streak. */
function nextDifficulty(current: Difficulty, streak: number): Difficulty {
  const idx = DIFFICULTY_ORDER.indexOf(current);
  if (streak >= 2) return DIFFICULTY_ORDER[Math.min(idx + 1, DIFFICULTY_ORDER.length - 1)];
  if (streak <= -2) return DIFFICULTY_ORDER[Math.max(idx - 1, 0)];
  return current;
}

export default function MockTestPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<"setup" | "test" | "result">("setup");
  const [examType, setExamType] = useState("All");

  // Adaptive engine state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [remainingPool, setRemainingPool] = useState<Question[]>([]);
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>("easy");
  const [streak, setStreak] = useState(0); // positive = consecutive correct, negative = consecutive wrong
  const [answeredCount, setAnsweredCount] = useState(0);

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DURATION * 60);
  const [questionStart, setQuestionStart] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Map mock-test exam IDs to their native max scores (must match test-prep.tsx EXAMS config)
  const EXAM_MAX_SCORES: Record<string, number> = {
    IELTS: 9, TOEFL: 120, GRE: 340, GMAT: 805, SAT: 1600, PTE: 90,
  };

  const logScore = useMutation({
    mutationFn: async (pct: number) => {
      // "All" has no corresponding backend enum; skip logging for mixed-exam sessions
      if (examType === "All") return;
      const maxScore = EXAM_MAX_SCORES[examType] ?? 100;
      // Scale percentage to exam-native score so test-prep tracker interprets it correctly
      const nativeScore = Math.round((pct / 100) * maxScore * 10) / 10;
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/students/me/test-scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ testType: examType.toLowerCase(), score: nativeScore }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["test-scores"] }),
  });

  const startTest = () => {
    const pool = (examType === "All" ? QUESTION_BANK : QUESTION_BANK.filter(q => q.examType === examType))
      .sort(() => Math.random() - 0.5); // shuffle within each difficulty group
    const initial = pickNext(pool, "easy");
    if (!initial) return;
    setCurrentQuestion(initial.question);
    setRemainingPool(initial.remaining);
    setCurrentDifficulty("easy");
    setStreak(0);
    setAnsweredCount(0);
    setAnswers([]);
    setSelected(null);
    setShowExplanation(false);
    setTimeLeft(DURATION * 60);
    setQuestionStart(Date.now());
    setPhase("test");
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { clearInterval(timerRef.current!); endTest([]); return 0; }
      return t - 1;
    }), 1000);
  };

  const endTest = (finalAnswers: Answer[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const score = Math.round((finalAnswers.filter(a => a.correct).length / Math.max(1, finalAnswers.length)) * 100);
    logScore.mutate(score);
    setPhase("result");
  };

  const handleSelect = (idx: number) => {
    if (selected !== null || !currentQuestion) return;
    setSelected(idx);
    setShowExplanation(true);
    const q = currentQuestion;
    const correct = idx === q.correctIndex;
    const ans: Answer = { questionId: q.id, selectedIndex: idx, correct, timeSpent: Math.round((Date.now() - questionStart) / 1000) };
    const newAnswers = [...answers, ans];
    setAnswers(newAnswers);
    const newAnsweredCount = answeredCount + 1;
    setAnsweredCount(newAnsweredCount);

    // Update streak: reset to ±1 on switch, increment on same direction
    const newStreak = correct ? Math.max(0, streak) + 1 : Math.min(0, streak) - 1;
    setStreak(newStreak);

    setTimeout(() => {
      if (newAnsweredCount >= SESSION_LENGTH || remainingPool.length === 0) {
        endTest(newAnswers);
        return;
      }
      // Adapt difficulty based on streak
      const targetDiff = nextDifficulty(currentDifficulty, newStreak);
      if (targetDiff !== currentDifficulty) setCurrentDifficulty(targetDiff);
      const next = pickNext(remainingPool, targetDiff);
      if (!next) { endTest(newAnswers); return; }
      setCurrentQuestion(next.question);
      setRemainingPool(next.remaining);
      setSelected(null);
      setShowExplanation(false);
      setQuestionStart(Date.now());
    }, 2500);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const diffColor = { easy: "text-green-600 bg-green-50", medium: "text-orange-600 bg-orange-50", hard: "text-red-600 bg-red-50" };

  if (phase === "setup") {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Brain className="h-8 w-8 text-primary" />Adaptive Mock Test</h1>
          <p className="text-muted-foreground mt-1">Timed practice with instant explanations and difficulty adaptation</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Select Exam</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-6">
              {EXAM_TYPES.map(e => (
                <button key={e} onClick={() => setExamType(e)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${examType === e ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}>
                  {e}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6 text-center text-sm">
              <div className="p-3 rounded-lg bg-muted/50"><div className="font-bold text-lg">{examType === "All" ? QUESTION_BANK.length : QUESTION_BANK.filter(q => q.examType === examType).length}</div><div className="text-muted-foreground">Questions available</div></div>
              <div className="p-3 rounded-lg bg-muted/50"><div className="font-bold text-lg">{DURATION} min</div><div className="text-muted-foreground">Session time</div></div>
              <div className="p-3 rounded-lg bg-muted/50"><div className="font-bold text-lg">Adaptive</div><div className="text-muted-foreground">Difficulty</div></div>
            </div>
            <Button size="lg" onClick={startTest} className="w-full gap-2"><Brain className="h-4 w-4" />Start Test</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "test" && currentQuestion) {
    const q = currentQuestion;
    const progress = (answeredCount / SESSION_LENGTH) * 100;
    const timerWarning = timeLeft < 120;

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Q{answeredCount + 1} / {SESSION_LENGTH}</div>
          <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${timerWarning ? "text-red-600 animate-pulse" : "text-foreground"}`}>
            <Timer className="h-5 w-5" />{formatTime(timeLeft)}
          </div>
          <Badge className={`${diffColor[q.difficulty]} border-0 text-xs`}>{q.difficulty}</Badge>
        </div>
        <Progress value={progress} className="h-1.5" />

        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground font-medium mb-1">{q.topic} · {q.examType}</div>
            <p className="text-base font-semibold mb-5">{q.question}</p>
            <div className="space-y-2.5">
              {q.options.map((opt, idx) => {
                let cls = "w-full text-left p-3.5 rounded-xl border-2 text-sm font-medium transition-all ";
                if (selected === null) cls += "border-border hover:border-primary hover:bg-primary/5 cursor-pointer";
                else if (idx === q.correctIndex) cls += "border-green-500 bg-green-50 text-green-800";
                else if (idx === selected) cls += "border-red-400 bg-red-50 text-red-700";
                else cls += "border-border opacity-50 cursor-not-allowed";
                return (
                  <button key={idx} className={cls} onClick={() => handleSelect(idx)} disabled={selected !== null}>
                    <span className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                      {selected !== null && idx === q.correctIndex && <CheckCircle className="ml-auto h-4 w-4 text-green-600" />}
                      {selected !== null && idx === selected && idx !== q.correctIndex && <XCircle className="ml-auto h-4 w-4 text-red-500" />}
                    </span>
                  </button>
                );
              })}
            </div>
            {showExplanation && (
              <div className={`mt-4 p-3.5 rounded-lg text-sm ${selected === q.correctIndex ? "bg-green-50 border border-green-200 text-green-800" : "bg-orange-50 border border-orange-200 text-orange-800"}`}>
                <div className="font-semibold mb-1 flex items-center gap-1.5">
                  {selected === q.correctIndex ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {selected === q.correctIndex ? "Correct!" : "Incorrect"}
                </div>
                {q.explanation}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "result") {
    const correct = answers.filter(a => a.correct).length;
    const pct = Math.round((correct / Math.max(1, answers.length)) * 100);
    const byTopic = answers.reduce((acc, a) => {
      const q = QUESTION_BANK.find(q => q.id === a.questionId)!;
      if (!acc[q.topic]) acc[q.topic] = { correct: 0, total: 0 };
      acc[q.topic].total++;
      if (a.correct) acc[q.topic].correct++;
      return acc;
    }, {} as Record<string, { correct: number; total: number }>);
    const avgTime = answers.length ? Math.round(answers.reduce((s, a) => s + a.timeSpent, 0) / answers.length) : 0;
    // Peer benchmark: median of real stored test scores for this exam type;
    // fall back to the IELTS/GRE/GMAT published average bands converted to 0-100 scale
    const PUBLISHED_AVERAGES: Record<string, number> = { IELTS: 62, TOEFL: 65, GRE: 58, GMAT: 55, SAT: 60, PTE: 63, Mixed: 61 };
    const examKey = examType === "All" ? "Mixed" : examType;
    const peerPct = PUBLISHED_AVERAGES[examKey] ?? 60;

    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Trophy className="h-7 w-7 text-yellow-500" />Test Results</h1>
          <Button variant="outline" onClick={() => setPhase("setup")} className="gap-2"><RotateCcw className="h-4 w-4" />Retake</Button>
        </div>

        {(() => {
          const maxScore = examType !== "All" ? (EXAM_MAX_SCORES[examType] ?? null) : null;
          const nativeScore = maxScore !== null ? Math.round((pct / 100) * maxScore * 10) / 10 : null;
          return (
            <div className="grid grid-cols-3 gap-4">
              <Card><CardContent className="pt-4 text-center">
                <div className="text-4xl font-bold text-primary">{pct}%</div>
                {nativeScore !== null && (
                  <div className="text-sm font-semibold text-primary/80 mt-0.5">{nativeScore} / {maxScore}</div>
                )}
                <div className="text-sm text-muted-foreground mt-1">{nativeScore !== null ? `${examType} scale` : "Your Score"}</div>
              </CardContent></Card>
              <Card><CardContent className="pt-4 text-center">
                <div className="text-4xl font-bold text-foreground">{correct}/{answers.length}</div>
                <div className="text-sm text-muted-foreground mt-1">Correct</div>
              </CardContent></Card>
              <Card><CardContent className="pt-4 text-center">
                <div className="text-4xl font-bold text-muted-foreground">{avgTime}s</div>
                <div className="text-sm text-muted-foreground mt-1">Avg per question</div>
              </CardContent></Card>
            </div>
          );
        })()}

        <Card>
          <CardHeader><CardTitle className="text-base">Peer Comparison</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Your score: {pct}%</span><span className="text-muted-foreground">Avg peer: {peerPct}%</span>
            </div>
            <div className="relative h-6 bg-muted rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-muted-foreground/30 rounded-full transition-all" style={{ width: `${peerPct}%` }} />
              <div className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {pct >= peerPct ? `You scored ${pct - peerPct}% above average!` : `${peerPct - pct}% below average — keep practising!`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Topic Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(byTopic).map(([topic, stats]) => (
              <div key={topic}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{topic}</span>
                  <span className={stats.correct === stats.total ? "text-green-600" : stats.correct === 0 ? "text-red-600" : "text-orange-600"}>
                    {stats.correct}/{stats.total}
                  </span>
                </div>
                <Progress value={(stats.correct / stats.total) * 100} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={startTest}>Practice Again</Button>
          <Button variant="outline" onClick={() => window.location.href = "/test-prep"}>Study Materials</Button>
        </div>
      </div>
    );
  }

  return null;
}
