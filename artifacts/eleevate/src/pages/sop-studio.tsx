import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, MetricCard } from "@/components/common/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEMO_PROGRAMS } from "@/lib/demo-catalog";
import { addDemoLedgerEvent } from "@/lib/demo-journey";
import { getCourseInsight } from "@/lib/product-demo";
import { hasStudentWorkspaceProfile, useStudentWorkspaceProfile } from "@/lib/student-workspace";

const SOP_QUESTIONS = [
  "Why this course now?",
  "Which project proves readiness?",
  "What career outcome is realistic?",
  "Why this country and university?",
  "What funding or family context should be explained?",
];
const CUSTOM_PROGRAM_ID = "custom-program";

export default function SopStudioPage() {
  const profile = useStudentWorkspaceProfile();
  const hasProfile = hasStudentWorkspaceProfile(profile);
  const availablePrograms = useMemo(() => DEMO_PROGRAMS, []);
  const [programId, setProgramId] = useState("");
  const [customProgramName, setCustomProgramName] = useState("");
  const [customUniversityName, setCustomUniversityName] = useState("");
  const [customCountry, setCustomCountry] = useState("");
  const [customField, setCustomField] = useState("");
  const [evidence, setEvidence] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (!careerGoal && profile?.courseGoal) setCareerGoal(profile.courseGoal);
  }, [careerGoal, profile?.courseGoal]);

  const selectedProgram = availablePrograms.find((item) => item.id === programId) ?? null;
  const isCustomProgram = programId === CUSTOM_PROGRAM_ID;
  const customReady = Boolean(customProgramName.trim());
  const targetProgram = selectedProgram
    ? {
      id: selectedProgram.id,
      name: selectedProgram.name,
      field: selectedProgram.field,
      universityName: selectedProgram.university?.name ?? "Selected university",
      country: selectedProgram.university?.country ?? "Selected country",
    }
    : isCustomProgram && customReady
      ? {
        id: CUSTOM_PROGRAM_ID,
        name: customProgramName.trim(),
        field: customField.trim() || "Custom program",
        universityName: customUniversityName.trim() || "Selected university",
        country: customCountry.trim() || "Selected country",
      }
      : null;
  const insight = selectedProgram ? getCourseInsight(selectedProgram) : null;
  const readiness = generated ? 70 : 0;

  const generateDraft = () => {
    if (!targetProgram || !evidence.trim() || !careerGoal.trim()) {
      toast.error("Choose a program and add your evidence and career goal first.");
      return;
    }

    setGenerated(true);
    addDemoLedgerEvent({
      id: `ledger-sop-${targetProgram.id}-${Date.now()}`,
      source: "Applications",
      event: `SOP draft generated for ${targetProgram.name}`,
      studentView: "SOP draft, missing evidence, and consultant review status appear in the application packet.",
      consultantView: "SOP reviewer receives a program-specific review queue item.",
      revenue: "SOP review service",
      status: "Ready",
    });
    toast.success("SOP draft generated and review task queued.");
  };

  return (
    <div data-testid="sop-studio-page">
      <PageHeader
        eyebrow="Documents & Visa"
        title="SOP Studio"
        description="A student-facing SOP, LOR, and resume preparation flow that turns profile evidence into a consultant-reviewable document packet."
        actions={(
          <Link href="/documents">
            <Button className="rounded-full font-serif">Open document vault <ArrowRight className="h-3.5 w-3.5" /></Button>
          </Link>
        )}
      />

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <MetricCard label="Narrative readiness" value={generated ? `${readiness}%` : "Not started"} detail={generated ? "draft ready" : "add evidence"} />
        <MetricCard label="ELEE course fit" value={hasProfile && insight ? `${insight.fitScore}%` : isCustomProgram ? "Manual" : "Pending"} detail={hasProfile ? targetProgram?.country ?? "choose program" : "complete profile"} tone="good" />
        <MetricCard label="Missing evidence" value={generated ? "2" : "Not checked"} detail="review items" tone="watch" />
        <MetricCard label="Consultant status" value={generated ? "Queued" : "Not sent"} detail="SOP review" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card className="app-card p-4">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Target program</label>
                <Select value={programId} onValueChange={(value) => { setProgramId(value); setGenerated(false); }}>
                  <SelectTrigger><SelectValue placeholder="Choose or add a program" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CUSTOM_PROGRAM_ID}>+ Add program manually</SelectItem>
                    {availablePrograms.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name} · {item.university?.country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isCustomProgram && (
                  <div className="mt-3 grid gap-3 rounded-lg border border-border bg-muted/25 p-3">
                    <Input value={customProgramName} onChange={(event) => { setCustomProgramName(event.target.value); setGenerated(false); }} placeholder="Program name, e.g. MSc Finance" />
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input value={customUniversityName} onChange={(event) => { setCustomUniversityName(event.target.value); setGenerated(false); }} placeholder="University / institute" />
                      <Input value={customCountry} onChange={(event) => { setCustomCountry(event.target.value); setGenerated(false); }} placeholder="Country" />
                    </div>
                    <Input value={customField} onChange={(event) => { setCustomField(event.target.value); setGenerated(false); }} placeholder="Field, e.g. Finance, Business Analytics" />
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-primary/15 bg-primary/5 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-primary">ELEE alignment</div>
                <p className="mt-1 text-sm leading-6 text-foreground">
                  {!hasProfile
                    ? "Complete your profile first so ELEE can explain why a program fits your route."
                    : insight?.eleeReason ?? (isCustomProgram && customReady ? "Manual program added. ELEE will use your profile, evidence, country, and career goal to structure the SOP." : "Choose a target program to see the alignment note.")}
                </p>
              </div>
            </div>
          </Card>

          <Card className="app-card p-4">
            <div className="mb-4">
              <h2 className="font-serif text-xl font-bold text-foreground">Student evidence brief</h2>
              <p className="mt-1 text-sm text-muted-foreground">ELEE uses this to structure the first draft and the consultant review checklist.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Academic, project, or work evidence</label>
                <Textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} rows={7} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Career goal</label>
                <Textarea value={careerGoal} onChange={(event) => setCareerGoal(event.target.value)} rows={7} />
              </div>
            </div>
            <Button onClick={generateDraft} className="mt-4 rounded-full font-serif" disabled={!targetProgram || !evidence.trim() || !careerGoal.trim()}>
              Generate SOP draft
            </Button>
          </Card>

          <Card className="app-card overflow-hidden p-0">
            <div className="brand-gradient-bg h-1" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="eyebrow mb-2">Draft preview</div>
                  <h2 className="font-serif text-xl font-bold text-foreground">{targetProgram ? `${targetProgram.name} Statement of Purpose` : "Statement of Purpose"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{targetProgram ? `${targetProgram.universityName} · ${targetProgram.field}` : "Choose a program and add your evidence."}</p>
                </div>
                <Badge className="rounded-full">{generated ? "Draft ready" : "Awaiting generation"}</Badge>
              </div>

              {generated && targetProgram ? (
                <div className="mt-5 space-y-4 text-sm leading-7 text-foreground">
                  <p>
                    My interest in {targetProgram.field} has grown through practical exposure to {evidence}
                    This experience helped me see the gap between learning concepts and building reliable systems that real users trust.
                  </p>
                  <p>
                    I am applying to {targetProgram.name} at {targetProgram.universityName} because the program connects academic depth with the career route I want:
                    {careerGoal} {insight ? `ELEE recommends this route because ${insight.eleeReason.toLowerCase()}` : ""}
                  </p>
                  <p>
                    My next task is to strengthen the essay with measurable project outcomes, a clearer post-study plan, and funding context that supports the visa narrative.
                  </p>
                </div>
              ) : (
                <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/35 p-6 text-center text-sm text-muted-foreground">
                Choose a program, add your real evidence, and generate the first draft. The draft will include program fit, country rationale, career outcome, and consultant review notes.
                </div>
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="app-card p-4">
            <div className="font-serif text-lg font-bold text-foreground">SOP readiness</div>
            <Progress value={readiness} className="mt-3 h-2" />
            <div className="mt-2 text-sm text-muted-foreground">{readiness}% ready for consultant review</div>
          </Card>
          <Card className="app-card p-4">
            <div className="font-serif text-lg font-bold text-foreground">ELEE asks</div>
            <div className="mt-3 space-y-2">
              {SOP_QUESTIONS.map((question) => (
                <div key={question} className="rounded-lg border border-border bg-muted/35 p-3 text-sm leading-5 text-foreground">
                  {question}
                </div>
              ))}
            </div>
          </Card>
          <Card className="app-card border-accent/20 bg-accent/5 p-4">
            <div className="font-serif text-base font-bold text-foreground">Consultant handoff</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Generating the draft gives the consultant reviewer a structured queue item instead of a blank document.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
