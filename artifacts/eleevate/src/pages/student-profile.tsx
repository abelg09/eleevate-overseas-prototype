import { useEffect, useState } from "react";
import { Bot, Brain, FileText, User } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  readStudentWorkspaceProfile,
  writeStudentWorkspaceProfile,
  type StudentWorkspaceProfile,
} from "@/lib/student-workspace";

const INTAKES = ["Fall 2026", "Spring 2027", "Fall 2027", "Spring 2028"];

export default function StudentProfilePage() {
  const { toast } = useToast();
  const savedProfile = readStudentWorkspaceProfile();
  const [form, setForm] = useState<StudentWorkspaceProfile>({
    studyLevel: "",
    gpa: "",
    ieltsScore: "",
    toeflScore: "",
    greScore: "",
    gmatScore: "",
    nationality: "",
    preferredIntake: "",
    budget: "",
    careerGoal: "",
  });

  useEffect(() => {
    if (savedProfile) setForm((current) => ({ ...current, ...savedProfile }));
  }, []);

  const updateField = (key: keyof StudentWorkspaceProfile, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    writeStudentWorkspaceProfile(form);
    toast({
      title: "AI Profile saved",
      description: "ELEE can now use these fields across report, university fit, applications, documents, and finance.",
    });
  };

  return (
    <AppLayout>
      <div data-testid="student-profile-page">
        <div className="mb-8">
          <div className="eyebrow">AI Profile & Test</div>
          <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-foreground">Build the student digital twin before recommendations.</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            ELEE should not guess. Add the basics first, then the assessment can generate target countries, study level confidence, university fit, document needs, and finance planning.
          </p>
        </div>

        <Card className="mb-6 border border-border p-6" data-testid="account-info">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <User className="h-4 w-4 text-primary" /> Account
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5">First name</Label>
              <Input placeholder="Student first name" data-testid="input-first-name" />
            </div>
            <div>
              <Label className="mb-1.5">Last name</Label>
              <Input placeholder="Student last name" data-testid="input-last-name" />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Email</Label>
              <Input placeholder="student@example.com" data-testid="input-email" />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-6">
            <Card className="border border-border p-6" data-testid="study-preferences">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-2 font-semibold text-foreground">
                  <Bot className="h-4 w-4 text-primary" /> Profile inputs
                </h2>
                <Badge className="rounded-full border-[#C9784A]/25 bg-[#fff2e8] text-[#8a4b2b] hover:bg-[#fff2e8]">
                  Recommendations unlock after assessment
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="mb-1.5">Study level interest</Label>
                  <Input value={form.studyLevel ?? ""} onChange={(event) => updateField("studyLevel", event.target.value)} placeholder="e.g. Undergraduate, Master's, MBA" data-testid="input-study-level" />
                </div>
                <div>
                  <Label className="mb-1.5">Preferred intake</Label>
                  <div className="flex flex-wrap gap-2">
                    {INTAKES.map((intake) => (
                      <button
                        key={intake}
                        onClick={() => updateField("preferredIntake", intake)}
                        data-testid={`intake-${intake}`}
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${form.preferredIntake === intake ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
                      >
                        {intake}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5">Budget range</Label>
                  <Input value={form.budget ?? ""} onChange={(event) => updateField("budget", event.target.value)} placeholder="e.g. USD 35k-45k per year" data-testid="input-budget" />
                </div>
                <div>
                  <Label className="mb-1.5">Nationality</Label>
                  <Input value={form.nationality ?? ""} onChange={(event) => updateField("nationality", event.target.value)} placeholder="e.g. Indian" data-testid="input-nationality" />
                </div>
                <div className="md:col-span-2">
                  <Label className="mb-1.5">Career goal</Label>
                  <Input value={form.careerGoal ?? ""} onChange={(event) => updateField("careerGoal", event.target.value)} placeholder="e.g. AI product engineering, healthcare management, finance analytics" data-testid="input-career-goal" />
                </div>
              </div>
            </Card>

            <Card className="border border-border p-6" data-testid="test-scores">
              <h2 className="mb-5 flex items-center gap-2 font-semibold text-foreground">
                <FileText className="h-4 w-4 text-primary" /> Academic and test evidence
              </h2>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {[
                  { label: "GPA / percentage", key: "gpa", placeholder: "e.g. 3.8 or 82%" },
                  { label: "IELTS", key: "ieltsScore", placeholder: "e.g. 7.5" },
                  { label: "TOEFL", key: "toeflScore", placeholder: "e.g. 105" },
                  { label: "GRE", key: "greScore", placeholder: "e.g. 320" },
                  { label: "GMAT", key: "gmatScore", placeholder: "e.g. 700" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <Label className="mb-1.5">{label}</Label>
                    <Input value={(form[key as keyof StudentWorkspaceProfile] as string) ?? ""} onChange={(event) => updateField(key as keyof StudentWorkspaceProfile, event.target.value)} placeholder={placeholder} data-testid={`input-${key}`} />
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <aside className="space-y-6">
            <Card className="border border-border bg-[#fffaf2] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#102044,#C9784A)] text-white">
                <Brain className="h-6 w-6" />
              </div>
              <h2 className="mt-5 font-serif text-xl font-bold text-foreground">AI-generated fields</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Target countries, route ranking, and university fit remain locked until the assessment and profile evidence exist.
              </p>
              <div className="mt-5 space-y-3">
                {["Target countries", "Study route", "Best city cluster", "Finance risk"].map((label) => (
                  <div key={label} className="rounded-lg border border-[#ead8c4] bg-white p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#8a4b2b]">{label}</div>
                    <div className="mt-1 font-serif text-sm font-bold text-foreground">Complete assessment to unlock</div>
                  </div>
                ))}
              </div>
            </Card>

            <Button onClick={handleSave} data-testid="btn-save-profile" className="w-full rounded-full font-serif">
              Save AI Profile
            </Button>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
