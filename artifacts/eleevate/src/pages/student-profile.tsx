import { useState, useEffect } from "react";
import { useUser } from "@clerk/react";
import {
  useGetMyStudentProfile, useUpdateMyStudentProfile,
  getGetMyStudentProfileQueryKey
} from "@workspace/api-client-react";
import type { StudentProfile } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { User, BookOpen, FileText } from "lucide-react";
import { demoUser, isDemoMode } from "@/lib/demo-mode";

const INTAKES = ["Fall 2025", "Spring 2026", "Fall 2026", "Spring 2027"];
const DEMO_PROFILE: StudentProfile = {
  id: "demo-profile",
  userId: "demo-student",
  studyLevel: "postgraduate",
  targetCountries: ["Canada", "UK", "Germany"],
  gpa: 3.72,
  ieltsScore: 7.5,
  toeflScore: 104,
  greScore: 318,
  preferredIntake: "Fall 2026",
  budget: 46000,
  nationality: "Indian",
  updatedAt: "2026-05-21",
};

export default function StudentProfilePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const demoMode = isDemoMode();

  const { data: profile, isLoading } = useGetMyStudentProfile({
    query: { queryKey: getGetMyStudentProfileQueryKey(), enabled: !demoMode }
  });

  const updateProfile = useUpdateMyStudentProfile();
  const p: StudentProfile | undefined = demoMode ? DEMO_PROFILE : profile;

  const [studyLevel, setStudyLevel] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [gpa, setGpa] = useState("");
  const [ielts, setIelts] = useState("");
  const [toefl, setToefl] = useState("");
  const [gre, setGre] = useState("");
  const [gmat, setGmat] = useState("");
  const [nationality, setNationality] = useState("");
  const [intake, setIntake] = useState("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    if (p) {
      setStudyLevel(p.studyLevel ?? "postgraduate");
      setSelectedCountries(p.targetCountries ?? []);
      setGpa(p.gpa?.toString() ?? "");
      setIelts(p.ieltsScore?.toString() ?? "");
      setToefl(p.toeflScore?.toString() ?? "");
      setGre(p.greScore?.toString() ?? "");
      setGmat(p.gmatScore?.toString() ?? "");
      setNationality(p.nationality ?? "");
      setIntake(p.preferredIntake ?? "");
      setBudget(p.budget?.toString() ?? "");
    }
  }, [JSON.stringify(p)]);

  const handleSave = async () => {
    if (demoMode) {
      toast({ title: "Profile updated!", description: "Demo preferences are saved for this review session." });
      return;
    }

    await updateProfile.mutateAsync({
      data: {
        studyLevel,
        targetCountries: selectedCountries,
        gpa: gpa ? parseFloat(gpa) : undefined,
        ieltsScore: ielts ? parseFloat(ielts) : undefined,
        toeflScore: toefl ? parseInt(toefl) : undefined,
        greScore: gre ? parseInt(gre) : undefined,
        gmatScore: gmat ? parseInt(gmat) : undefined,
        nationality: nationality || undefined,
        preferredIntake: intake || undefined,
        budget: budget ? parseInt(budget) : undefined,
      }
    });
    queryClient.invalidateQueries({ queryKey: getGetMyStudentProfileQueryKey() });
    toast({ title: "Profile updated!", description: "Your study preferences have been saved." });
  };

  return (
    <AppLayout>
      <div data-testid="student-profile-page">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-serif text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your study preferences and academic background.</p>
        </div>

        {/* Account info */}
        <Card className="p-6 border border-border mb-6" data-testid="account-info">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Account</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5">First name</Label>
              <Input value={demoMode ? demoUser.student.firstName : user?.firstName ?? ""} disabled className="bg-muted/40" data-testid="input-first-name" />
            </div>
            <div>
              <Label className="mb-1.5">Last name</Label>
              <Input value={demoMode ? demoUser.student.lastName : user?.lastName ?? ""} disabled className="bg-muted/40" data-testid="input-last-name" />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Email</Label>
              <Input value={demoMode ? demoUser.student.email : user?.primaryEmailAddress?.emailAddress ?? ""} disabled className="bg-muted/40" data-testid="input-email" />
            </div>
          </div>
        </Card>

        {/* Study preferences */}
        {!demoMode && isLoading ? (
          <Card className="p-6 border border-border"><Skeleton className="h-48 w-full" /></Card>
        ) : (
          <Card className="p-6 border border-border mb-6" data-testid="study-preferences">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> AI Profile & Study Preferences</h2>
              <Badge className="rounded-full border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">Locked by ELEE Assessment</Badge>
            </div>
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Study level</Label>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-serif text-lg font-bold capitalize text-foreground">{studyLevel || "Postgraduate"}</div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">Auto-populated from Jehan&apos;s psychometric profile, academic record, and career direction.</p>
                    </div>
                    <Badge variant="outline" className="rounded-full border-primary/30 text-primary">AI recommended</Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label className="mb-3 block">Target countries</Label>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex flex-wrap gap-2">
                    {selectedCountries.map((country) => (
                      <Badge key={country} className="rounded-full bg-emerald-700 text-white hover:bg-emerald-700">{country}</Badge>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-emerald-900">
                    Countries are generated by the AI Career Predictor using budget, test score, academic fit, work-rights pathway, and visa resilience.
                  </p>
                </div>
              </div>
              <div>
                <Label className="mb-3 block">Preferred intake</Label>
                <div className="flex flex-wrap gap-2">
                  {INTAKES.map(i => (
                    <button key={i} onClick={() => setIntake(i)} data-testid={`intake-${i}`}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${intake === i ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                    >{i}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5">Budget (USD/year)</Label>
                  <Input value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 40000" type="number" data-testid="input-budget" />
                </div>
                <div>
                  <Label className="mb-1.5">Nationality</Label>
                  <Input value={nationality} onChange={e => setNationality(e.target.value)} placeholder="e.g. Indian" data-testid="input-nationality" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Test scores */}
        <Card className="p-6 border border-border mb-6" data-testid="test-scores">
          <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Test Scores</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "GPA", value: gpa, onChange: setGpa, id: "input-gpa", placeholder: "e.g. 3.8" },
              { label: "IELTS", value: ielts, onChange: setIelts, id: "input-ielts", placeholder: "e.g. 7.5" },
              { label: "TOEFL", value: toefl, onChange: setToefl, id: "input-toefl", placeholder: "e.g. 110" },
              { label: "GRE", value: gre, onChange: setGre, id: "input-gre", placeholder: "e.g. 320" },
              { label: "GMAT", value: gmat, onChange: setGmat, id: "input-gmat", placeholder: "e.g. 700" },
            ].map(({ label, value, onChange, id, placeholder }) => (
              <div key={id}>
                <Label className="mb-1.5">{label}</Label>
                <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type="number" data-testid={id} />
              </div>
            ))}
          </div>
        </Card>

        <Button onClick={handleSave} disabled={updateProfile.isPending} data-testid="btn-save-profile" className="w-full sm:w-auto">
          {updateProfile.isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </AppLayout>
  );
}
