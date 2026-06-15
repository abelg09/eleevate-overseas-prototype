import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@clerk/react";
import { isDemoMode } from "@/lib/demo-mode";

interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
}

interface FieldRec {
  field: string;
  countries: string[];
  careers: string[];
  matchScore: number;
}

interface Session {
  id: string;
  fieldRecommendations: FieldRec[];
  careerRecommendations: { career: string; field: string }[];
  personalityInsights?: { workStyle: string; socialStyle: string; decisionStyle: string; planningStyle: string };
  completedAt: string;
}

type FieldKey = "ai" | "finance" | "business" | "healthcare";

const DEMO_QUESTIONS: Question[] = [
  {
    id: "demo-q1",
    category: "personality",
    question: "When you solve a difficult problem, what feels most natural?",
    options: ["Build a model and test it", "Talk it through with people", "Research examples first", "Create a step-by-step checklist"],
  },
  {
    id: "demo-q2",
    category: "interest",
    question: "Which project would you choose for a portfolio?",
    options: ["AI product prototype", "Market entry research", "Healthcare operations study", "Financial dashboard"],
  },
  {
    id: "demo-q3",
    category: "aptitude",
    question: "Which learning environment fits you best?",
    options: ["Research-led university", "Applied industry campus", "Startup ecosystem", "Small cohort with mentorship"],
  },
  {
    id: "demo-q4",
    category: "planning",
    question: "What worries your family most about studying abroad?",
    options: ["Cost and funding", "Visa risk", "Safety and settling in", "Career outcome"],
  },
];

const FIELD_LIBRARY: Record<FieldKey, Omit<FieldRec, "matchScore">> = {
  ai: {
    field: "Computer Science and AI",
    countries: ["Canada", "United Kingdom", "Germany"],
    careers: ["AI Product Engineer", "Data Analyst", "Machine Learning Analyst", "Product Analyst"],
  },
  finance: {
    field: "Finance, Accounting and FinTech",
    countries: ["United Kingdom", "Singapore", "Ireland"],
    careers: ["Financial Analyst", "Investment Analyst", "Risk Analyst", "FinTech Product Analyst"],
  },
  business: {
    field: "Business Analytics and Management",
    countries: ["United Kingdom", "Australia", "Netherlands"],
    careers: ["Business Analyst", "Management Consultant", "Market Research Analyst", "Strategy Associate"],
  },
  healthcare: {
    field: "Healthcare Management and Operations",
    countries: ["Canada", "Australia", "United Kingdom"],
    careers: ["Healthcare Operations Analyst", "Hospital Administrator", "Public Health Analyst", "Clinical Project Coordinator"],
  },
};

function buildDemoAssessmentResult(ans: Record<string, number>): Session {
  const scores: Record<FieldKey, number> = {
    ai: 52,
    finance: 52,
    business: 52,
    healthcare: 52,
  };
  const add = (field: FieldKey, points: number) => {
    scores[field] += points;
  };

  const scoring: Record<string, Array<Partial<Record<FieldKey, number>>>> = {
    "demo-q1": [
      { ai: 16, business: 6, finance: 4 },
      { business: 14, healthcare: 8 },
      { business: 10, finance: 10, healthcare: 6 },
      { finance: 12, business: 8, healthcare: 4 },
    ],
    "demo-q2": [
      { ai: 35, business: 7 },
      { business: 32, finance: 12 },
      { healthcare: 35, business: 8 },
      { finance: 38, business: 10, ai: 4 },
    ],
    "demo-q3": [
      { ai: 10, finance: 8, healthcare: 8 },
      { business: 10, finance: 12, healthcare: 10 },
      { ai: 11, business: 11, finance: 10 },
      { healthcare: 10, business: 8, finance: 6 },
    ],
    "demo-q4": [
      { finance: 28, business: 8 },
      { business: 8, healthcare: 4, finance: 5 },
      { healthcare: 9, business: 6 },
      { business: 10, finance: 8, ai: 8 },
    ],
  };

  Object.entries(ans).forEach(([questionId, optionIndex]) => {
    const optionScores = scoring[questionId]?.[optionIndex];
    if (!optionScores) return;
    Object.entries(optionScores).forEach(([field, points]) => add(field as FieldKey, points ?? 0));
  });

  const fieldRecommendations = (Object.keys(scores) as FieldKey[])
    .map((key) => ({
      ...FIELD_LIBRARY[key],
      matchScore: Math.min(96, Math.round(scores[key])),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

  const workStyles = ["Analytical builder", "People-first collaborator", "Research-led planner", "Structured planner"];
  const socialStyles = ["Independent problem solver", "Applied industry collaborator", "Startup-minded networker", "Mentorship-led learner"];
  const decisionStyles = ["Model-led", "Market-led", "Impact-led", "Finance-led"];
  const planningStyles = ["Budget-first planner", "Risk-aware planner", "Settling-in planner", "Career-outcome planner"];

  const top = fieldRecommendations[0];
  return {
    id: `demo-session-${Date.now()}`,
    completedAt: new Date().toISOString(),
    personalityInsights: {
      workStyle: workStyles[ans["demo-q1"] ?? 0],
      socialStyle: socialStyles[ans["demo-q3"] ?? 0],
      decisionStyle: decisionStyles[ans["demo-q2"] ?? 0],
      planningStyle: planningStyles[ans["demo-q4"] ?? 0],
    },
    fieldRecommendations,
    careerRecommendations: top.careers.map((career) => ({ career, field: top.field })),
  };
}

const DEMO_RESULT: Session = buildDemoAssessmentResult({
  "demo-q1": 3,
  "demo-q2": 3,
  "demo-q3": 1,
  "demo-q4": 0,
});

export default function AssessmentPage() {
  const { getToken } = useAuth();
  const demoMode = isDemoMode();
  const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Session | null>(null);

  const { data: pastSessions } = useQuery<Session[]>({
    queryKey: ["assessment-sessions"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/assessment/sessions`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !demoMode,
  });
  const pastSessionsList = demoMode ? [] : pastSessions ?? [];

  const fetchQuestions = async () => {
    if (demoMode) {
      setQuestions(DEMO_QUESTIONS);
      setPhase("quiz");
      setCurrentIdx(0);
      setAnswers({});
      return;
    }
    const token = await getToken();
    const res = await fetch(`${getBaseUrl()}/api/assessment/questions`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setQuestions(data.questions);
    setPhase("quiz");
    setCurrentIdx(0);
    setAnswers({});
  };

  const submitMutation = useMutation({
    mutationFn: async (ans: Record<string, number>) => {
      if (demoMode) return buildDemoAssessmentResult(ans);
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/assessment/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: ans }),
      });
      return res.json();
    },
    onSuccess: (data) => { setResult(data); setPhase("result"); },
  });

  const handleAnswer = (optionIdx: number) => {
    const q = questions[currentIdx];
    const newAnswers = { ...answers, [q.id]: optionIdx };
    setAnswers(newAnswers);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      submitMutation.mutate(newAnswers);
    }
  };

  const categoryColors: Record<string, string> = {
    personality: "bg-purple-100 text-purple-700",
    aptitude: "bg-blue-100 text-blue-700",
    interest: "bg-green-100 text-green-700",
  };

  if (phase === "intro") {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Psychometric Test</h1>
          <p className="mt-1 text-muted-foreground">Discover your ideal study field, career path, and best-fit countries through a personality, aptitude, and interest inventory.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "25 Questions", desc: "Personality, aptitude & interest inventory" },
            { title: "Study-Fit Scoring", desc: "Maps your profile to fields and programs" },
            { title: "Personalised Report", desc: "Career paths, countries, and program matches" },
          ].map(({ title, desc }) => (
            <Card key={title}><CardContent className="pt-5 text-center">
              <div className="font-semibold">{title}</div>
              <div className="text-sm text-muted-foreground mt-1">{desc}</div>
            </CardContent></Card>
          ))}
        </div>

        {pastSessionsList.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Previous Results</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pastSessionsList.slice(0, 3).map(s => {
                const top = (s.fieldRecommendations as FieldRec[])?.[0];
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <div className="font-medium text-sm">{top?.field ?? "Assessment"}</div>
                      <div className="text-xs text-muted-foreground">{new Date(s.completedAt).toLocaleDateString()}</div>
                    </div>
                    {top && <Badge variant="secondary">{top.matchScore}% match</Badge>}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button size="lg" onClick={fetchQuestions}>Start test</Button>
          {pastSessionsList[0] && (
            <Button variant="outline" size="lg" onClick={() => { setResult(pastSessionsList[0]); setPhase("result"); }}>View Last Result</Button>
          )}
        </div>
      </div>
    );
  }

  if (phase === "quiz") {
    const q = questions[currentIdx];
    const progress = ((currentIdx) / questions.length) * 100;
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Question {currentIdx + 1} of {questions.length}</span>
            <Badge className={categoryColors[q?.category] ?? ""}>{q?.category}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardContent className="pt-8 pb-6">
            <h2 className="text-xl font-semibold mb-6 text-center">{q?.question}</h2>
            <div className="space-y-3">
              {q?.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium"
                >
                  <span className="inline-flex items-center gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                  </span>
                </button>
              ))}
            </div>
            {currentIdx > 0 && (
              <Button variant="ghost" size="sm" className="mt-4" onClick={() => setCurrentIdx(i => i - 1)}>
                Back
              </Button>
            )}
          </CardContent>
        </Card>

        {submitMutation.isPending && (
          <div className="text-center text-muted-foreground text-sm animate-pulse">Analysing your responses with AI…</div>
        )}
      </div>
    );
  }

  if (phase === "result" && result) {
    const recs = (result.fieldRecommendations as FieldRec[]) ?? [];
    const top = recs[0];
    const pi = result.personalityInsights;
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Your Psychometric Results</h1>
            <p className="text-muted-foreground">Based on your personality, aptitude, and interests</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPhase("intro")}>Retake</Button>
        </div>

        {top && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <div className="text-sm text-muted-foreground">Top Field Match</div>
                  <div className="text-2xl font-bold">{top.field}</div>
                  <Badge className="mt-1 bg-primary/20 text-primary border-0">{top.matchScore}% match score</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Recommended Careers</div>
                  <div className="space-y-1">
                    {top.careers.slice(0, 4).map(c => (
                      <div key={c} className="text-sm">{c}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Best Countries for You</div>
                  <div className="flex flex-wrap gap-1.5">
                    {top.countries.map(c => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {pi && (
          <Card>
            <CardHeader><CardTitle className="text-base">Your Personality Profile</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(pi).map(([key, val]) => (
                  <div key={key} className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground capitalize">{key.replace(/Style$/, " Style")}</div>
                    <div className="font-semibold text-sm mt-0.5">{val as string}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recs.slice(0, 3).map((rec, i) => (
            <Card key={rec.field} className={i === 0 ? "border-primary/40" : ""}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-sm">{rec.field}</div>
                  <Badge variant={i === 0 ? "default" : "secondary"}>{rec.matchScore}%</Badge>
                </div>
                <Progress value={rec.matchScore} className="h-1.5 mb-3" />
                <div className="text-xs text-muted-foreground">{rec.careers.slice(0, 2).join(" · ")}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button onClick={() => window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/universities`}>Explore Universities</Button>
          <Button variant="outline" onClick={() => window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/shortlist`}>AI Shortlist</Button>
          <Button variant="outline" onClick={() => window.print()} className="print:hidden">Download Report</Button>
        </div>

        <style>{`
          @media print {
            [data-testid="sidebar"], nav, header, .no-print { display: none !important; }
            body { margin: 0; }
          }
        `}</style>
      </div>
    );
  }

  return null;
}
