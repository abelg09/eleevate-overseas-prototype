import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { Link } from "wouter";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, ClipboardList, FileText, GraduationCap, HeartHandshake, IdCard, Languages } from "lucide-react";
import { isDemoMode } from "@/lib/demo-mode";
import { useDemoAuthState } from "@/lib/demo-auth";
import {
  clearStudentWorkspaceProfile,
  hasStudentWorkspaceProfile,
  readStudentWorkspaceProfile,
  writeStudentWorkspaceProfile,
  type StudentWorkspaceProfile,
} from "@/lib/student-workspace";

const INTAKES = ["Fall 2026", "Spring 2027", "Fall 2027", "Spring 2028"];
const COUNTRY_OPTIONS = ["India", "United Kingdom", "United States", "Canada", "Australia", "Germany", "Netherlands", "Singapore", "Ireland", "New Zealand", "France", "United Arab Emirates"];
const STUDY_LEVELS = ["Foundation", "Diploma", "Undergraduate", "Masters", "MBA", "PhD"];
const CAREER_GOALS = ["Business Analytics / Management", "Computer Science / AI", "Data Science", "Finance / Accounting", "Healthcare Management", "Engineering", "Hospitality", "Design / Creative", "Law / Public Policy", "Undecided"];
const BUDGET_MIN = 10_000;
const BUDGET_MAX = 120_000;

function numberFrom(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function budgetLabel(range: number[]) {
  return `$${range[0].toLocaleString()} - $${range[1].toLocaleString()} / year`;
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value || "Not set"}</div>
    </div>
  );
}

function FieldTable({ title, columns, values }: { title: string; columns: string[]; values: string[] }) {
  const hasAny = values.some(Boolean);

  return (
    <Card className="overflow-hidden border border-border bg-white">
      <div className="border-b border-border bg-muted/35 px-4 py-3">
        <h3 className="font-serif text-base font-bold text-foreground">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-white text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">No</th>
              {columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {hasAny ? (
              <tr className="border-t border-border">
                <td className="px-4 py-4 font-semibold text-muted-foreground">1</td>
                {values.map((value, index) => (
                  <td key={columns[index]} className="px-4 py-4 font-medium text-foreground">{value || "-"}</td>
                ))}
              </tr>
            ) : (
              <tr className="border-t border-border">
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted-foreground">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

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
  const workspaceProfile = p as StudentWorkspaceProfile | null | undefined;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [preferredCountry, setPreferredCountry] = useState("");
  const [address, setAddress] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [studyLevel, setStudyLevel] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [courseGoal, setCourseGoal] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [gpa, setGpa] = useState("");
  const [ielts, setIelts] = useState("");
  const [toefl, setToefl] = useState("");
  const [gre, setGre] = useState("");
  const [gmat, setGmat] = useState("");
  const [nationality, setNationality] = useState("");
  const [intake, setIntake] = useState("");
  const [budgetRange, setBudgetRange] = useState<number[]>([20_000, 45_000]);
  const [highestEducation, setHighestEducation] = useState("");
  const [stream, setStream] = useState("");
  const [passingYear, setPassingYear] = useState("");
  const [boardOrUniversity, setBoardOrUniversity] = useState("");
  const [languageTestName, setLanguageTestName] = useState("");
  const [languageTestDate, setLanguageTestDate] = useState("");
  const [languageTestExpiry, setLanguageTestExpiry] = useState("");
  const [readingScore, setReadingScore] = useState("");
  const [writingScore, setWritingScore] = useState("");
  const [speakingScore, setSpeakingScore] = useState("");
  const [listeningScore, setListeningScore] = useState("");
  const [aptitudeTestName, setAptitudeTestName] = useState("");
  const [aptitudeTestDate, setAptitudeTestDate] = useState("");
  const [verbalReasoningScore, setVerbalReasoningScore] = useState("");
  const [quantitativeReasoningScore, setQuantitativeReasoningScore] = useState("");
  const [analyticalWritingScore, setAnalyticalWritingScore] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [designation, setDesignation] = useState("");
  const [jobType, setJobType] = useState("");
  const [profileRemarks, setProfileRemarks] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyEmail, setEmergencyEmail] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");
  const [, setLocalRevision] = useState(0);

  useEffect(() => {
    if (p) {
      setFirstName(demoMode ? (workspaceProfile?.firstName ?? "") : (user?.firstName ?? ""));
      setLastName(demoMode ? (workspaceProfile?.lastName ?? "") : (user?.lastName ?? ""));
      setEmail(demoMode ? (workspaceProfile?.email ?? (demoSession?.email.endsWith("@eleevate.local") ? "" : demoSession?.email ?? "")) : (user?.primaryEmailAddress?.emailAddress ?? ""));
      setMobileNumber(workspaceProfile?.mobileNumber ?? "");
      setDob(workspaceProfile?.dob ?? "");
      setCountry(workspaceProfile?.country ?? "");
      setCity(workspaceProfile?.city ?? "");
      setPreferredCountry(workspaceProfile?.preferredCountry ?? "");
      setAddress(workspaceProfile?.address ?? "");
      setPassportNumber(workspaceProfile?.passportNumber ?? "");
      setStudyLevel(p.studyLevel ?? "");
      setSelectedCountries(p.targetCountries ?? []);
      setCourseGoal(workspaceProfile?.courseGoal ?? "");
      setCareerGoal(workspaceProfile?.careerGoal ?? workspaceProfile?.courseGoal ?? "");
      setGpa(p.gpa?.toString() ?? "");
      setIelts(p.ieltsScore?.toString() ?? "");
      setToefl(p.toeflScore?.toString() ?? "");
      setGre(p.greScore?.toString() ?? "");
      setGmat(p.gmatScore?.toString() ?? "");
      setNationality(p.nationality ?? "");
      setIntake(p.preferredIntake ?? "");
      setBudgetRange([
        numberFrom(workspaceProfile?.budgetMin, 20_000),
        numberFrom(workspaceProfile?.budgetMax ?? workspaceProfile?.budget ?? p.budget, 45_000),
      ]);
      setHighestEducation(workspaceProfile?.highestEducation ?? "");
      setStream(workspaceProfile?.stream ?? "");
      setPassingYear(workspaceProfile?.passingYear ?? "");
      setBoardOrUniversity(workspaceProfile?.boardOrUniversity ?? "");
      setLanguageTestName(workspaceProfile?.languageTestName ?? "");
      setLanguageTestDate(workspaceProfile?.languageTestDate ?? "");
      setLanguageTestExpiry(workspaceProfile?.languageTestExpiry ?? "");
      setReadingScore(workspaceProfile?.readingScore ?? "");
      setWritingScore(workspaceProfile?.writingScore ?? "");
      setSpeakingScore(workspaceProfile?.speakingScore ?? "");
      setListeningScore(workspaceProfile?.listeningScore ?? "");
      setAptitudeTestName(workspaceProfile?.aptitudeTestName ?? "");
      setAptitudeTestDate(workspaceProfile?.aptitudeTestDate ?? "");
      setVerbalReasoningScore(workspaceProfile?.verbalReasoningScore ?? "");
      setQuantitativeReasoningScore(workspaceProfile?.quantitativeReasoningScore ?? "");
      setAnalyticalWritingScore(workspaceProfile?.analyticalWritingScore ?? "");
      setCompanyName(workspaceProfile?.companyName ?? "");
      setCompanyAddress(workspaceProfile?.companyAddress ?? "");
      setDesignation(workspaceProfile?.designation ?? "");
      setJobType(workspaceProfile?.jobType ?? "");
      setProfileRemarks(workspaceProfile?.profileRemarks ?? "");
      setEmergencyName(workspaceProfile?.emergencyName ?? "");
      setEmergencyContact(workspaceProfile?.emergencyContact ?? "");
      setEmergencyEmail(workspaceProfile?.emergencyEmail ?? "");
      setEmergencyRelationship(workspaceProfile?.emergencyRelationship ?? "");
    } else {
      setFirstName(demoMode ? "" : user?.firstName ?? "");
      setLastName(demoMode ? "" : user?.lastName ?? "");
      setEmail(demoMode ? (demoSession?.email.endsWith("@eleevate.local") ? "" : demoSession?.email ?? "") : user?.primaryEmailAddress?.emailAddress ?? "");
      setMobileNumber("");
      setDob("");
      setCountry("");
      setCity("");
      setPreferredCountry("");
      setAddress("");
      setPassportNumber("");
      setStudyLevel("");
      setSelectedCountries([]);
      setCourseGoal("");
      setCareerGoal("");
      setGpa("");
      setIelts("");
      setToefl("");
      setGre("");
      setGmat("");
      setNationality("");
      setIntake("");
      setBudgetRange([20_000, 45_000]);
      setHighestEducation("");
      setStream("");
      setPassingYear("");
      setBoardOrUniversity("");
      setLanguageTestName("");
      setLanguageTestDate("");
      setLanguageTestExpiry("");
      setReadingScore("");
      setWritingScore("");
      setSpeakingScore("");
      setListeningScore("");
      setAptitudeTestName("");
      setAptitudeTestDate("");
      setVerbalReasoningScore("");
      setQuantitativeReasoningScore("");
      setAnalyticalWritingScore("");
      setCompanyName("");
      setCompanyAddress("");
      setDesignation("");
      setJobType("");
      setProfileRemarks("");
      setEmergencyName("");
      setEmergencyContact("");
      setEmergencyEmail("");
      setEmergencyRelationship("");
    }
  }, [JSON.stringify(p), demoMode, demoSession?.email, user?.firstName, user?.lastName, user?.primaryEmailAddress?.emailAddress]);

  const handleSave = async () => {
    const budgetMax = String(budgetRange[1]);

    if (demoMode) {
      writeStudentWorkspaceProfile({
        firstName,
        lastName,
        email,
        mobileNumber,
        dob,
        country,
        city,
        preferredCountry,
        address,
        passportNumber,
        studyLevel,
        targetCountries: selectedCountries,
        courseGoal,
        careerGoal,
        gpa,
        ieltsScore: ielts,
        toeflScore: toefl,
        greScore: gre,
        gmatScore: gmat,
        nationality,
        preferredIntake: intake,
        budget: budgetMax,
        budgetMin: String(budgetRange[0]),
        budgetMax,
        highestEducation,
        stream,
        passingYear,
        boardOrUniversity,
        languageTestName,
        languageTestDate,
        languageTestExpiry,
        readingScore,
        writingScore,
        speakingScore,
        listeningScore,
        aptitudeTestName,
        aptitudeTestDate,
        verbalReasoningScore,
        quantitativeReasoningScore,
        analyticalWritingScore,
        companyName,
        companyAddress,
        designation,
        jobType,
        profileRemarks,
        emergencyName,
        emergencyContact,
        emergencyEmail,
        emergencyRelationship,
      });
      setLocalRevision(revision => revision + 1);
      toast({ title: "Profile saved", description: "Your student file is saved in this browser session." });
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
        budget: budgetRange[1] || undefined,
      }
    });
    queryClient.invalidateQueries({ queryKey: getGetMyStudentProfileQueryKey() });
    toast({ title: "Profile updated", description: "Your core study preferences have been saved." });
  };

  const handleClear = () => {
    clearStudentWorkspaceProfile();
    setLocalRevision(revision => revision + 1);
    toast({ title: "Profile cleared", description: "The local profile has been reset for a fresh student test." });
  };

  const savedProfile = demoMode ? readStudentWorkspaceProfile() : null;
  const hasSavedProfile = hasStudentWorkspaceProfile(savedProfile);
  const profileReady = demoMode ? hasSavedProfile : hasStudentWorkspaceProfile(profile as unknown as StudentWorkspaceProfile | null | undefined);
  const currentFullName = [firstName, lastName].filter(Boolean).join(" ") || "New student";

  return (
    <AppLayout>
      <div data-testid="student-profile-page">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="eyebrow mb-2">Student file</div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Build your profile</h1>
            <p className="mt-1 text-muted-foreground">Add the details ELEE needs for your report, course search, applications, finance, and visa plan.</p>
          </div>
          <Button onClick={handleSave} disabled={updateProfile.isPending} data-testid="btn-save-profile" className="rounded-full font-serif">
            {updateProfile.isPending ? "Saving..." : "Save profile"}
          </Button>
        </div>

        {!demoMode && isLoading ? (
          <Card className="p-6 border border-border"><Skeleton className="h-72 w-full" /></Card>
        ) : (
          <div className="space-y-6">
            <Card className="overflow-hidden border border-border bg-white shadow-sm" data-testid="account-info">
              <div className="brand-gradient-bg h-1" />
              <div className="p-5">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-foreground">{currentFullName}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Complete the student information before selecting courses or applying.</p>
                  </div>
                  <Badge variant="outline" className="w-fit rounded-full">Recommendations appear after assessment</Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <Label className="mb-1.5">First name</Label>
                    <Input value={firstName} onChange={event => setFirstName(event.target.value)} disabled={!demoMode} className={!demoMode ? "bg-muted/40" : undefined} placeholder="Student first name" data-testid="input-first-name" />
                  </div>
                  <div>
                    <Label className="mb-1.5">Last name</Label>
                    <Input value={lastName} onChange={event => setLastName(event.target.value)} disabled={!demoMode} className={!demoMode ? "bg-muted/40" : undefined} placeholder="Student last name" data-testid="input-last-name" />
                  </div>
                  <div>
                    <Label className="mb-1.5">Email</Label>
                    <Input value={email} onChange={event => setEmail(event.target.value)} disabled={!demoMode} className={!demoMode ? "bg-muted/40" : undefined} placeholder="student@example.com" data-testid="input-email" />
                  </div>
                  <div>
                    <Label className="mb-1.5">Mobile number</Label>
                    <Input value={mobileNumber} onChange={event => setMobileNumber(event.target.value)} placeholder="+91 99999 99999" data-testid="input-mobile-number" />
                  </div>
                  <div>
                    <Label className="mb-1.5">Date of birth</Label>
                    <Input type="date" value={dob} onChange={event => setDob(event.target.value)} data-testid="input-dob" />
                  </div>
                  <div>
                    <Label className="mb-1.5">Passport number</Label>
                    <Input value={passportNumber} onChange={event => setPassportNumber(event.target.value)} placeholder="Add passport number" data-testid="input-passport-number" />
                  </div>
                  <div>
                    <Label className="mb-1.5">Country</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger data-testid="select-country"><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent>{COUNTRY_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5">City</Label>
                    <Input value={city} onChange={event => setCity(event.target.value)} placeholder="e.g. Mumbai" data-testid="input-city" />
                  </div>
                  <div>
                    <Label className="mb-1.5">Preferred country</Label>
                    <Select value={preferredCountry} onValueChange={(value) => {
                      setPreferredCountry(value);
                      setSelectedCountries((current) => current.includes(value) ? current : [...current, value]);
                    }}>
                      <SelectTrigger data-testid="select-preferred-country"><SelectValue placeholder="Select preferred route" /></SelectTrigger>
                      <SelectContent>{COUNTRY_OPTIONS.filter((item) => item !== "India").map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="xl:col-span-3">
                    <Label className="mb-1.5">Address</Label>
                    <Textarea value={address} onChange={event => setAddress(event.target.value)} placeholder="Home address for student file" data-testid="input-address" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden border border-border bg-white shadow-sm" data-testid="profile-inputs">
              <div className="p-5">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2"><IdCard className="h-5 w-5 text-primary" /> Tell ELEE about you</h2>
                  <Badge className="w-fit rounded-full border-[#C67452]/30 bg-[#FFF5ED] text-[#8F4A2F] hover:bg-[#FFF5ED]">Used for report and recommendations</Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <Label className="mb-1.5">Study level interest</Label>
                    <Select value={studyLevel} onValueChange={setStudyLevel}>
                      <SelectTrigger data-testid="select-study-level"><SelectValue placeholder="Select study level" /></SelectTrigger>
                      <SelectContent>{STUDY_LEVELS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5">Nationality</Label>
                    <Select value={nationality} onValueChange={setNationality}>
                      <SelectTrigger data-testid="select-nationality"><SelectValue placeholder="Select nationality" /></SelectTrigger>
                      <SelectContent>{["Indian", "Sri Lankan", "Nepalese", "Bangladeshi", "Emirati", "Other"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="lg:col-span-2">
                    <Label className="mb-3 block">Preferred intake</Label>
                    <div className="flex flex-wrap gap-2">
                      {INTAKES.map(i => (
                        <button key={i} onClick={() => setIntake(i)} data-testid={`intake-${i}`}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${intake === i ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                        >{i}</button>
                      ))}
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <Label>Budget range</Label>
                      <Badge variant="outline" className="rounded-full">{budgetLabel(budgetRange)}</Badge>
                    </div>
                    <Slider value={budgetRange} min={BUDGET_MIN} max={BUDGET_MAX} step={5_000} minStepsBetweenThumbs={1} onValueChange={setBudgetRange} data-testid="slider-budget-range" />
                    <div className="mt-2 flex justify-between text-xs font-semibold text-muted-foreground">
                      <span>$10k</span>
                      <span>$120k</span>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1.5">Career goal</Label>
                    <Select value={careerGoal} onValueChange={(value) => {
                      setCareerGoal(value);
                      if (!courseGoal) setCourseGoal(value);
                    }}>
                      <SelectTrigger data-testid="select-career-goal"><SelectValue placeholder="Select career direction" /></SelectTrigger>
                      <SelectContent>{CAREER_GOALS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5">Course goal</Label>
                    <Input value={courseGoal} onChange={e => setCourseGoal(e.target.value)} placeholder="e.g. MSc Business Analytics" data-testid="input-course-goal" />
                  </div>
                  <div className="lg:col-span-2">
                    <Label className="mb-3 block">Target countries</Label>
                    <div className="flex flex-wrap gap-2">
                      {COUNTRY_OPTIONS.filter((item) => item !== "India").map((item) => {
                        const selected = selectedCountries.includes(item);
                        return (
                          <button key={item} onClick={() => setSelectedCountries((current) => selected ? current.filter((countryItem) => countryItem !== item) : [...current, item])}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${selected ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                          >{item}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className={profileReady ? "border border-primary/20 bg-primary/5 p-5 shadow-sm" : "border border-border bg-white p-5 shadow-sm"} data-testid="profile-next-step">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className={profileReady ? "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white" : "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"}>
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2 rounded-full">{profileReady ? "Stage 1 complete" : "Stage 1"}</Badge>
                    <h2 className="font-serif text-xl font-bold text-foreground">
                      {profileReady ? "Profile saved. Generate your ELEE Report next." : "Complete and save your profile first."}
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {profileReady
                        ? "ELEE can now use your student file to create route guidance, country/course fit, document gaps, and finance prompts."
                        : "Your dashboard, ELEE Report, university matches, document checklist, and finance prompts stay blank until this profile is saved."}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileReady ? (
                    <>
                      <Link href="/elee-report">
                        <Button className="rounded-full font-serif">Generate ELEE Report <ArrowRight className="h-4 w-4" /></Button>
                      </Link>
                      <Link href="/journey-map">
                        <Button variant="outline" className="rounded-full font-serif">View journey map</Button>
                      </Link>
                    </>
                  ) : (
                    <Button onClick={handleSave} disabled={updateProfile.isPending} className="rounded-full font-serif">
                      {updateProfile.isPending ? "Saving..." : "Save profile"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {demoMode && hasSavedProfile && savedProfile && (
              <Card className="border border-primary/20 bg-primary/5 p-5" data-testid="saved-profile-summary">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-foreground">Saved student file</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Last saved {savedProfile.lastSavedAt ? new Date(savedProfile.lastSavedAt).toLocaleString() : "in this browser"}
                    </p>
                  </div>
                  <Button variant="outline" className="rounded-full font-serif" onClick={handleClear} data-testid="btn-clear-profile">
                    Clear saved profile
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <InfoRow label="Name" value={[savedProfile.firstName, savedProfile.lastName].filter(Boolean).join(" ")} />
                  <InfoRow label="Email" value={savedProfile.email} />
                  <InfoRow label="Mobile" value={savedProfile.mobileNumber} />
                  <InfoRow label="Study level" value={savedProfile.studyLevel} />
                  <InfoRow label="Preferred route" value={savedProfile.preferredCountry || savedProfile.targetCountries?.join(", ")} />
                  <InfoRow label="Budget" value={savedProfile.budgetMin && savedProfile.budgetMax ? `$${Number(savedProfile.budgetMin).toLocaleString()} - $${Number(savedProfile.budgetMax).toLocaleString()}` : undefined} />
                </div>
              </Card>
            )}

            <Tabs defaultValue="education" className="space-y-4">
              <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
                {[
                  ["education", GraduationCap, "Education"],
                  ["language", Languages, "Language Entrance Exam"],
                  ["aptitude", ClipboardList, "Aptitude Exam"],
                  ["work", BriefcaseBusiness, "Work Experience"],
                  ["remarks", FileText, "Remarks"],
                  ["emergency", HeartHandshake, "Emergency Details"],
                ].map(([value, Icon, label]) => {
                  const TabIcon = Icon as typeof GraduationCap;
                  return (
                    <TabsTrigger key={String(value)} value={String(value)} className="rounded-full border border-border bg-white px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                      <TabIcon className="mr-2 h-4 w-4" />
                      {String(label)}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value="education" className="space-y-4">
                <Card className="border border-border bg-white p-5">
                  <h2 className="mb-4 font-serif text-lg font-bold text-foreground">Education details</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><Label className="mb-1.5">Degree</Label><Input value={highestEducation} onChange={e => setHighestEducation(e.target.value)} placeholder="e.g. BCom, BE, BBA" /></div>
                    <div><Label className="mb-1.5">Stream</Label><Input value={stream} onChange={e => setStream(e.target.value)} placeholder="e.g. Finance, Computer Science" /></div>
                    <div><Label className="mb-1.5">GPA / percentage</Label><Input value={gpa} onChange={e => setGpa(e.target.value)} placeholder="e.g. 3.4 or 82%" data-testid="input-gpa" /></div>
                    <div><Label className="mb-1.5">Passing year</Label><Input value={passingYear} onChange={e => setPassingYear(e.target.value)} placeholder="e.g. 2025" /></div>
                    <div className="md:col-span-2"><Label className="mb-1.5">Board / university</Label><Input value={boardOrUniversity} onChange={e => setBoardOrUniversity(e.target.value)} placeholder="Institution name" /></div>
                  </div>
                </Card>
                <FieldTable title="Education details" columns={["Degree", "Stream", "Score", "Passing year", "Board / University", "Uploaded document"]} values={[highestEducation, stream, gpa, passingYear, boardOrUniversity, "-"]} />
              </TabsContent>

              <TabsContent value="language" className="space-y-4">
                <Card className="border border-border bg-white p-5">
                  <h2 className="mb-4 font-serif text-lg font-bold text-foreground">Language entrance exam</h2>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label className="mb-1.5">Test name</Label>
                      <Select value={languageTestName} onValueChange={setLanguageTestName}>
                        <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                        <SelectContent>{["IELTS", "TOEFL", "PTE", "Duolingo"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label className="mb-1.5">Test date</Label><Input type="date" value={languageTestDate} onChange={e => setLanguageTestDate(e.target.value)} /></div>
                    <div><Label className="mb-1.5">Expiry date</Label><Input type="date" value={languageTestExpiry} onChange={e => setLanguageTestExpiry(e.target.value)} /></div>
                    <div><Label className="mb-1.5">Reading score</Label><Input value={readingScore} onChange={e => setReadingScore(e.target.value)} placeholder="Reading" /></div>
                    <div><Label className="mb-1.5">Writing score</Label><Input value={writingScore} onChange={e => setWritingScore(e.target.value)} placeholder="Writing" /></div>
                    <div><Label className="mb-1.5">Speaking score</Label><Input value={speakingScore} onChange={e => setSpeakingScore(e.target.value)} placeholder="Speaking" /></div>
                    <div><Label className="mb-1.5">Listening score</Label><Input value={listeningScore} onChange={e => setListeningScore(e.target.value)} placeholder="Listening" /></div>
                    <div><Label className="mb-1.5">IELTS overall</Label><Input value={ielts} onChange={e => setIelts(e.target.value)} placeholder="e.g. 7.0" data-testid="input-ielts" /></div>
                    <div><Label className="mb-1.5">TOEFL overall</Label><Input value={toefl} onChange={e => setToefl(e.target.value)} placeholder="e.g. 100" data-testid="input-toefl" /></div>
                  </div>
                </Card>
                <FieldTable title="Language entrance exam" columns={["Test name", "Test date", "Expire date", "Read", "Write", "Speak", "Listen", "Overall", "Uploaded document"]} values={[languageTestName, languageTestDate, languageTestExpiry, readingScore, writingScore, speakingScore, listeningScore, ielts || toefl, "-"]} />
              </TabsContent>

              <TabsContent value="aptitude" className="space-y-4">
                <Card className="border border-border bg-white p-5">
                  <h2 className="mb-4 font-serif text-lg font-bold text-foreground">Aptitude exam</h2>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label className="mb-1.5">Test name</Label>
                      <Select value={aptitudeTestName} onValueChange={setAptitudeTestName}>
                        <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                        <SelectContent>{["GRE", "GMAT", "SAT", "ACT", "MAT"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label className="mb-1.5">Test date</Label><Input type="date" value={aptitudeTestDate} onChange={e => setAptitudeTestDate(e.target.value)} /></div>
                    <div><Label className="mb-1.5">Overall score</Label><Input value={gre || gmat} onChange={e => aptitudeTestName === "GMAT" ? setGmat(e.target.value) : setGre(e.target.value)} placeholder="e.g. 320 or 700" /></div>
                    <div><Label className="mb-1.5">Verbal reasoning</Label><Input value={verbalReasoningScore} onChange={e => setVerbalReasoningScore(e.target.value)} /></div>
                    <div><Label className="mb-1.5">Quantitative reasoning</Label><Input value={quantitativeReasoningScore} onChange={e => setQuantitativeReasoningScore(e.target.value)} /></div>
                    <div><Label className="mb-1.5">Analytical writing</Label><Input value={analyticalWritingScore} onChange={e => setAnalyticalWritingScore(e.target.value)} /></div>
                  </div>
                </Card>
                <FieldTable title="Aptitude exam" columns={["Test name", "Test date", "Verbal", "Quantitative", "Analytical writing", "Overall", "Uploaded document"]} values={[aptitudeTestName, aptitudeTestDate, verbalReasoningScore, quantitativeReasoningScore, analyticalWritingScore, gre || gmat, "-"]} />
              </TabsContent>

              <TabsContent value="work" className="space-y-4">
                <Card className="border border-border bg-white p-5">
                  <h2 className="mb-4 font-serif text-lg font-bold text-foreground">Work experience</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><Label className="mb-1.5">Company</Label><Input value={companyName} onChange={e => setCompanyName(e.target.value)} /></div>
                    <div><Label className="mb-1.5">Designation</Label><Input value={designation} onChange={e => setDesignation(e.target.value)} /></div>
                    <div><Label className="mb-1.5">Job type</Label><Input value={jobType} onChange={e => setJobType(e.target.value)} placeholder="Full-time, internship, part-time" /></div>
                    <div><Label className="mb-1.5">Company address</Label><Input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} /></div>
                  </div>
                </Card>
                <FieldTable title="Occupation" columns={["Company", "Company address", "Designation", "Job type", "Uploaded document"]} values={[companyName, companyAddress, designation, jobType, "-"]} />
              </TabsContent>

              <TabsContent value="remarks" className="space-y-4">
                <Card className="border border-border bg-white p-5">
                  <h2 className="mb-4 font-serif text-lg font-bold text-foreground">Personal details remarks</h2>
                  <Textarea value={profileRemarks} onChange={e => setProfileRemarks(e.target.value)} placeholder="Anything counsellors should know: gaps, refusals, family constraints, preferred intake reason, scholarships needed." />
                </Card>
                <FieldTable title="Personal details remarks" columns={["Remark", "Created by", "Updated by"]} values={[profileRemarks, "Student", "Student"]} />
              </TabsContent>

              <TabsContent value="emergency" className="space-y-4">
                <Card className="border border-border bg-white p-5">
                  <h2 className="mb-4 font-serif text-lg font-bold text-foreground">Emergency details</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><Label className="mb-1.5">Person name</Label><Input value={emergencyName} onChange={e => setEmergencyName(e.target.value)} /></div>
                    <div><Label className="mb-1.5">Relationship</Label><Input value={emergencyRelationship} onChange={e => setEmergencyRelationship(e.target.value)} /></div>
                    <div><Label className="mb-1.5">Contact number</Label><Input value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} /></div>
                    <div><Label className="mb-1.5">Email</Label><Input value={emergencyEmail} onChange={e => setEmergencyEmail(e.target.value)} /></div>
                  </div>
                </Card>
                <FieldTable title="Emergency details" columns={["Person name", "Contact number", "Email", "Relationship"]} values={[emergencyName, emergencyContact, emergencyEmail, emergencyRelationship]} />
              </TabsContent>
            </Tabs>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {demoMode && (
                <Button variant="outline" onClick={handleClear} data-testid="btn-clear-profile-bottom" className="rounded-full font-serif">
                  Clear profile
                </Button>
              )}
              <Button onClick={handleSave} disabled={updateProfile.isPending} data-testid="btn-save-profile-bottom" className="rounded-full font-serif">
                {updateProfile.isPending ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
