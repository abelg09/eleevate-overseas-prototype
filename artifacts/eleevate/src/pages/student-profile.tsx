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
import { isDemoMode } from "@/lib/demo-mode";
import { useDemoAuthState } from "@/lib/demo-auth";
import {
  clearStudentWorkspaceProfile,
  hasStudentWorkspaceProfile,
  readStudentWorkspaceProfile,
  writeStudentWorkspaceProfile,
  type StudentWorkspaceProfile,
} from "@/lib/student-workspace";

const INTAKES = ["Fall 2025", "Spring 2026", "Fall 2026", "Spring 2027"];
const COUNTRY_OPTIONS = ["United Kingdom", "United States", "Canada", "Australia", "Germany", "Netherlands", "Singapore", "Ireland"];

export default function StudentProfilePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const demoMode = isDemoMode();
  const demoSession = useDemoAuthState();

  const { data: profile, isLoading } = useGetMyStudentProfile({
    query: { queryKey: getGetMyStudentProfileQueryKey(), enabled: !demoMode }
  });

  const updateProfile = useUpdateMyStudentProfile();
  const storedProfile = demoMode ? readStudentWorkspaceProfile() : null;
  const p: StudentProfile | StudentWorkspaceProfile | null | undefined = demoMode ? storedProfile : profile;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [studyLevel, setStudyLevel] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [courseGoal, setCourseGoal] = useState("");
  const [gpa, setGpa] = useState("");
  const [ielts, setIelts] = useState("");
  const [toefl, setToefl] = useState("");
  const [gre, setGre] = useState("");
  const [gmat, setGmat] = useState("");
  const [nationality, setNationality] = useState("");
  const [intake, setIntake] = useState("");
  const [budget, setBudget] = useState("");
  const [, setLocalRevision] = useState(0);

  useEffect(() => {
    if (p) {
      setFirstName(demoMode ? (storedProfile?.firstName ?? "") : (user?.firstName ?? ""));
      setLastName(demoMode ? (storedProfile?.lastName ?? "") : (user?.lastName ?? ""));
      setEmail(demoMode ? (storedProfile?.email ?? (demoSession?.email.endsWith("@eleevate.local") ? "" : demoSession?.email ?? "")) : (user?.primaryEmailAddress?.emailAddress ?? ""));
      setStudyLevel(p.studyLevel ?? "");
      setSelectedCountries(p.targetCountries ?? []);
      setCourseGoal("courseGoal" in p ? p.courseGoal ?? "" : "");
      setGpa(p.gpa?.toString() ?? "");
      setIelts(p.ieltsScore?.toString() ?? "");
      setToefl(p.toeflScore?.toString() ?? "");
      setGre(p.greScore?.toString() ?? "");
      setGmat(p.gmatScore?.toString() ?? "");
      setNationality(p.nationality ?? "");
      setIntake(p.preferredIntake ?? "");
      setBudget(p.budget?.toString() ?? "");
    } else {
      setFirstName(demoMode ? "" : user?.firstName ?? "");
      setLastName(demoMode ? "" : user?.lastName ?? "");
      setEmail(demoMode ? (demoSession?.email.endsWith("@eleevate.local") ? "" : demoSession?.email ?? "") : user?.primaryEmailAddress?.emailAddress ?? "");
      setStudyLevel("");
      setSelectedCountries([]);
      setCourseGoal("");
      setGpa("");
      setIelts("");
      setToefl("");
      setGre("");
      setGmat("");
      setNationality("");
      setIntake("");
      setBudget("");
    }
  }, [JSON.stringify(p), demoMode, demoSession?.email, storedProfile?.email, storedProfile?.firstName, storedProfile?.lastName, user?.firstName, user?.lastName, user?.primaryEmailAddress?.emailAddress]);

  const handleSave = async () => {
    if (demoMode) {
      writeStudentWorkspaceProfile({
        firstName,
        lastName,
        email,
        studyLevel,
        targetCountries: selectedCountries,
        courseGoal,
        gpa,
        ieltsScore: ielts,
        toeflScore: toefl,
        greScore: gre,
        gmatScore: gmat,
        nationality,
        preferredIntake: intake,
        budget,
      });
      setLocalRevision(revision => revision + 1);
      toast({ title: "Profile saved", description: "Your study preferences are saved in this browser session." });
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

  const handleClear = () => {
    clearStudentWorkspaceProfile();
    setLocalRevision(revision => revision + 1);
    toast({ title: "Profile cleared", description: "The local profile has been reset for a fresh student test." });
  };

  const savedProfile = demoMode ? readStudentWorkspaceProfile() : null;
  const hasSavedProfile = hasStudentWorkspaceProfile(savedProfile);

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
              <Input
                value={firstName}
                onChange={event => setFirstName(event.target.value)}
                disabled={!demoMode}
                className={!demoMode ? "bg-muted/40" : undefined}
                placeholder="Student first name"
                data-testid="input-first-name"
              />
            </div>
            <div>
              <Label className="mb-1.5">Last name</Label>
              <Input
                value={lastName}
                onChange={event => setLastName(event.target.value)}
                disabled={!demoMode}
                className={!demoMode ? "bg-muted/40" : undefined}
                placeholder="Student last name"
                data-testid="input-last-name"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Email</Label>
              <Input
                value={email}
                onChange={event => setEmail(event.target.value)}
                disabled={!demoMode}
                className={!demoMode ? "bg-muted/40" : undefined}
                placeholder="student@example.com"
                data-testid="input-email"
              />
            </div>
          </div>
        </Card>

        {demoMode && hasSavedProfile && savedProfile && (
          <Card className="mb-6 border border-primary/20 bg-primary/5 p-6" data-testid="saved-profile-summary">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Saved profile</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Last saved {savedProfile.lastSavedAt ? new Date(savedProfile.lastSavedAt).toLocaleString() : "in this browser"}
                </p>
              </div>
              <Button variant="outline" className="rounded-full font-serif" onClick={handleClear} data-testid="btn-clear-profile">
                Clear saved profile
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                ["Name", [savedProfile.firstName, savedProfile.lastName].filter(Boolean).join(" ") || "Not set"],
                ["Email", savedProfile.email || "Not set"],
                ["Study level", savedProfile.studyLevel || "Not set"],
                ["Course goal", savedProfile.courseGoal || "Not set"],
                ["Countries", savedProfile.targetCountries?.join(", ") || "Not set"],
                ["Budget", savedProfile.budget ? `$${Number(savedProfile.budget).toLocaleString()}` : "Not set"],
                ["Nationality", savedProfile.nationality || "Not set"],
                ["GPA", savedProfile.gpa || "Not set"],
                ["IELTS", savedProfile.ieltsScore || "Not set"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border bg-white p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Study preferences */}
        {!demoMode && isLoading ? (
          <Card className="p-6 border border-border"><Skeleton className="h-48 w-full" /></Card>
        ) : (
          <Card className="p-6 border border-border mb-6" data-testid="study-preferences">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Study Preferences</h2>
              <Badge className="rounded-full border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">Used by ELEE</Badge>
            </div>
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Study level</Label>
                <div className="flex flex-wrap gap-2">
                  {["undergraduate", "postgraduate", "phd", "diploma"].map((level) => (
                    <button key={level} onClick={() => setStudyLevel(level)} data-testid={`study-level-${level}`}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${studyLevel === level ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                    >{level}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-3 block">Target countries</Label>
                <div className="flex flex-wrap gap-2">
                  {COUNTRY_OPTIONS.map((country) => {
                    const selected = selectedCountries.includes(country);
                    return (
                      <button key={country} onClick={() => setSelectedCountries((current) => selected ? current.filter((item) => item !== country) : [...current, country])}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selected ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                      >{country}</button>
                    );
                  })}
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
                <div className="col-span-2">
                  <Label className="mb-1.5">Course goal</Label>
                  <Input value={courseGoal} onChange={e => setCourseGoal(e.target.value)} placeholder="e.g. Business Analytics / Management" data-testid="input-course-goal" />
                </div>
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
