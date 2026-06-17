import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  Bell,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  FileCheck2,
  GraduationCap,
  HandCoins,
  HelpCircle,
  MapPinned,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { STUDENT_PACKAGES, type StudentPackageTier } from "@/lib/student-packages";
import {
  calculateV6Emi,
  clearStudentV6State,
  filterV6Programs,
  filterV6Universities,
  formatV6Inr,
  getRequiredV6Documents,
  getStudentV6CountryOptions,
  selectV6Package,
  setV6ApplicationStatus,
  shortlistV6University,
  toggleV6Document,
  updateStudentV6State,
  useStudentV6Snapshot,
  useStudentV6State,
  type StudentV6ApplicationStatus,
  type StudentV6Profile,
  type StudentV6RouteChoice,
} from "@/lib/student-v6";
import { assetUrl, cn } from "@/lib/utils";

const STUDY_LEVELS = ["Foundation", "Diploma", "Undergraduate", "Masters", "MBA", "PhD"];
const INTAKES = ["Jan 2027", "May 2027", "Sep 2027", "Jan 2028"];
const TESTS = ["Not started", "Preparing", "Booked", "Completed"];
const TEST_NAMES = ["IELTS", "PTE", "TOEFL", "Duolingo", "GRE", "GMAT", "SAT", "ACT"];
const PASSPORT_OPTIONS = [
  { value: "yes", label: "Yes, I have passport" },
  { value: "applied", label: "Applied, waiting" },
  { value: "no", label: "No passport yet" },
];
const COURSE_IDEAS = ["Business / Management", "Finance / Accounting", "Computer Science / AI", "Engineering", "Data Analytics", "Healthcare", "Hospitality", "Design", "Law", "Not sure"];

const WIZARD_STEPS = [
  "Student details",
  "Study goal",
  "Academics and test",
  "ELEE route",
  "Find options",
  "Apply and documents",
  "Finance and arrival",
];

function profileInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "S";
}

function StepPill({ number, label, active, done }: { number: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={cn(
      "flex min-w-[150px] items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold",
      done && "border-emerald-200 bg-emerald-50 text-emerald-800",
      active && !done && "border-primary/30 bg-primary/10 text-primary",
      !active && !done && "border-border bg-white text-muted-foreground",
    )}>
      <span className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full font-serif text-[11px]",
        done ? "bg-emerald-600 text-white" : active ? "bg-primary text-white" : "bg-muted text-muted-foreground",
      )}>
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : number}
      </span>
      <span className="truncate">{label}</span>
    </div>
  );
}

function StudentV6Shell({ children }: { children: React.ReactNode }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const snapshot = useStudentV6Snapshot();

  useEffect(() => setNotificationsOpen(false), [snapshot.currentStep.id]);

  return (
    <div className="min-h-screen bg-[#F7FAFC] text-foreground" data-testid="student-v6-shell">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-3 px-4 sm:px-5">
          <Link href="/student-v6/dashboard" aria-label="Student V6 dashboard">
            <img src={assetUrl("logo.webp")} alt="EleevateOverseas" className="h-12 w-12 rounded-full object-cover ring-1 ring-border" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Student journey</div>
            <div className="truncate font-serif text-sm font-bold text-foreground">{snapshot.studentName}</div>
          </div>
          <Link href="/student-v6/packages">
            <Badge variant="outline" className="hidden rounded-full border-primary/25 bg-primary/5 px-3 py-1.5 font-serif text-sm font-bold text-primary sm:inline-flex">
              {snapshot.packageLabel}
            </Badge>
          </Link>
          <Link href="/student-v6/support">
            <Button variant="outline" size="sm" className="rounded-full font-serif" data-testid="v6-support-top">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Support</span>
            </Button>
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((value) => !value)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm hover:text-foreground"
              aria-label="Journey notifications"
            >
              <Bell className="h-4 w-4" />
              {snapshot.notifications.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {snapshot.notifications.length}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-11 z-50 w-[min(calc(100vw-2rem),360px)] overflow-hidden rounded-lg border border-border bg-white shadow-xl">
                <div className="border-b border-border p-3">
                  <div className="font-serif text-sm font-bold">What needs attention?</div>
                  <p className="mt-1 text-xs text-muted-foreground">These change as you complete each step.</p>
                </div>
                <div className="space-y-2 p-2">
                  {snapshot.notifications.map((item) => (
                    <Link key={item.id} href={item.href}>
                      <div className="rounded-lg border border-border bg-muted/25 p-3 hover:border-primary/35 hover:bg-primary/5">
                        <div className="font-serif text-sm font-bold text-foreground">{item.title}</div>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-5 lg:py-7">{children}</main>
    </div>
  );
}

function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <div className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{eyebrow}</div>
        <h1 className="mt-2 font-serif text-2xl font-bold leading-tight text-foreground md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <Input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[] | Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options.map((option) => {
            const item = typeof option === "string" ? { value: option, label: option } : option;
            return <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>;
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

function ContinueButtons({
  canBack,
  onBack,
  onSave,
  saveLabel,
}: {
  canBack?: boolean;
  onBack?: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
      {canBack ? (
        <Button variant="outline" className="rounded-full font-serif" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      ) : <span />}
      <Button className="rounded-full px-6 font-serif" onClick={onSave}>
        {saveLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function StudentV6LandingPage() {
  return (
    <div className="min-h-screen bg-white text-foreground" data-testid="student-v6-landing">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between px-4 sm:px-5">
          <Link href="/student-v6">
            <img src={assetUrl("logo.webp")} alt="EleevateOverseas" className="h-14 w-14 rounded-full object-cover ring-1 ring-border" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/student-v6/support">
              <Button variant="outline" className="rounded-full font-serif">Need help?</Button>
            </Link>
            <Link href="/student-v6/start">
              <Button className="rounded-full font-serif">Start my journey</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-[linear-gradient(135deg,#EEF9FF_0%,#FFFFFF_55%,#F2FFF2_100%)] px-4 py-14 sm:px-5 lg:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
            <div>
              <Badge className="rounded-full bg-primary/10 px-4 py-2 text-primary hover:bg-primary/10">For students and families</Badge>
              <h1 className="mt-5 max-w-3xl font-serif text-4xl font-bold leading-tight text-foreground md:text-6xl">
                Study abroad, step by step.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                Eleevate helps you understand what to do first, what documents are missing, which country fits, and how to move from profile to visa and arrival.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/student-v6/start" data-testid="v6-start-journey">
                  <Button size="lg" className="rounded-full px-7 font-serif">Start my journey <ArrowRight className="h-4 w-4" /></Button>
                </Link>
                <Link href="/student-v6/dashboard">
                  <Button size="lg" variant="outline" className="rounded-full px-7 font-serif">Open my dashboard</Button>
                </Link>
              </div>
            </div>

            <Card className="border border-border bg-white p-5 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-serif text-lg font-bold">ELEE will guide you</div>
                  <p className="text-sm text-muted-foreground">One clear action at a time.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  "Tell us about you",
                  "Choose country and course",
                  "Shortlist universities",
                  "Prepare documents",
                  "Plan visa and finance",
                  "Arrive ready",
                ].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg border border-border bg-muted/25 p-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-serif text-xs font-bold text-primary">{index + 1}</span>
                    <span className="font-serif text-sm font-bold text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-5">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 max-w-3xl">
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Simple flow</div>
              <h2 className="mt-2 font-serif text-3xl font-bold text-foreground">No confusion. Only the next useful step.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: UserRound, title: "First, build your file", text: "Add details once. ELEE uses it for country, course, report, documents, and finance prompts." },
                { icon: MapPinned, title: "Then choose direction", text: "If you select UK, the course and university search starts with UK options." },
                { icon: ShieldCheck, title: "Then prepare properly", text: "Applications, documents, visa, loan, forex, insurance, and arrival stay connected." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="border border-border bg-white p-5 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
                    <h3 className="mt-4 font-serif text-xl font-bold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export function StudentV6StartPage() {
  const [, setLocation] = useLocation();
  const saved = useStudentV6State();
  const snapshot = useStudentV6Snapshot();
  const firstIncompleteIndex = Math.max(0, snapshot.steps.findIndex((step) => !step.complete));
  const [stepIndex, setStepIndex] = useState(firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0);
  const [draft, setDraft] = useState<StudentV6Profile>(saved.profile);
  const [routeChoice, setRouteChoice] = useState<StudentV6RouteChoice | undefined>(saved.routeChoice);
  const [budget, setBudget] = useState<number[]>([saved.profile.budgetMinInr ?? 0, saved.profile.budgetMaxInr ?? 0]);

  useEffect(() => {
    setDraft(saved.profile);
    setRouteChoice(saved.routeChoice);
    setBudget([saved.profile.budgetMinInr ?? 0, saved.profile.budgetMaxInr ?? 0]);
  }, [saved]);

  const updateDraft = (patch: Partial<StudentV6Profile>) => setDraft((current) => ({ ...current, ...patch }));
  const saveProfilePatch = (nextIndex?: number) => {
    updateStudentV6State((state) => ({
      ...state,
      profile: {
        ...state.profile,
        ...draft,
        budgetMinInr: budget[0] ?? 0,
        budgetMaxInr: budget[1] ?? 0,
      },
      routeChoice: routeChoice ?? state.routeChoice,
      reportGenerated: routeChoice ? true : state.reportGenerated,
      visa: {
        ...state.visa,
        country: state.visa.country ?? draft.targetCountries?.[0],
      },
      rewardPoints: state.rewardPoints + 15,
    }));
    if (typeof nextIndex === "number") {
      setStepIndex(Math.min(WIZARD_STEPS.length - 1, Math.max(0, nextIndex)));
      return;
    }
    setLocation("/student-v6/dashboard");
  };

  return (
    <StudentV6Shell>
      <PageIntro
        eyebrow="Start here"
        title="Answer one step at a time"
        description="No long portal menu. Fill what you know now; you can come back later."
        action={<Link href="/student-v6/dashboard"><Button variant="outline" className="rounded-full font-serif">Skip to dashboard</Button></Link>}
      />

      <div className="mb-5 overflow-x-auto pb-1">
        <div className="flex gap-2">
          {WIZARD_STEPS.map((label, index) => (
            <StepPill key={label} number={index + 1} label={label} active={index === stepIndex} done={snapshot.steps[index]?.complete ?? false} />
          ))}
        </div>
      </div>

      <Card className="border border-border bg-white p-5 shadow-sm md:p-6">
        {stepIndex === 0 && (
          <div>
            <SectionHeading icon={UserRound} title="Tell us about the student" text="This creates the student file. Keep it simple and accurate." />
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="First name" value={draft.firstName} onChange={(value) => updateDraft({ firstName: value })} placeholder="e.g. Riya" />
              <TextInput label="Last name" value={draft.lastName} onChange={(value) => updateDraft({ lastName: value })} placeholder="e.g. Sharma" />
              <TextInput label="Mobile number" value={draft.mobile} onChange={(value) => updateDraft({ mobile: value })} placeholder="+91 99999 99999" />
              <TextInput label="Email" value={draft.email} onChange={(value) => updateDraft({ email: value })} placeholder="student@email.com" type="email" />
              <TextInput label="City" value={draft.city} onChange={(value) => updateDraft({ city: value })} placeholder="e.g. Nashik, Rajkot, Indore" />
              <SelectInput label="Passport status" value={draft.passportStatus} onChange={(value) => updateDraft({ passportStatus: value as StudentV6Profile["passportStatus"] })} placeholder="Choose passport status" options={PASSPORT_OPTIONS} />
              <TextInput label="Parent / sponsor name" value={draft.parentName} onChange={(value) => updateDraft({ parentName: value })} placeholder="Who supports this journey?" />
              <TextInput label="Parent / sponsor mobile" value={draft.parentMobile} onChange={(value) => updateDraft({ parentMobile: value })} placeholder="+91 99999 99999" />
            </div>
          </div>
        )}

        {stepIndex === 1 && (
          <div>
            <SectionHeading icon={GraduationCap} title="What do you want to study?" text="Country and course choices will control what ELEE shows next." />
            <div className="grid gap-4 md:grid-cols-2">
              <SelectInput label="Study level" value={draft.studyLevel} onChange={(value) => updateDraft({ studyLevel: value })} placeholder="Select level" options={STUDY_LEVELS} />
              <SelectInput label="Course interest" value={draft.courseInterest} onChange={(value) => updateDraft({ courseInterest: value })} placeholder="Select course area" options={COURSE_IDEAS} />
              <SelectInput label="Preferred intake" value={draft.preferredIntake} onChange={(value) => updateDraft({ preferredIntake: value })} placeholder="Select intake" options={INTAKES} />
              <div>
                <Label className="mb-1.5 block">How much can your family plan per year?</Label>
                <div className="rounded-lg border border-border bg-muted/25 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3 font-serif text-sm font-bold">
                    <span>{formatV6Inr(budget[0])}</span>
                    <span>{formatV6Inr(budget[1])}</span>
                  </div>
                  <Slider min={0} max={10_000_000} step={50_000} value={budget} onValueChange={setBudget} />
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>₹0</span><span>₹1 crore</span></div>
                </div>
              </div>
            </div>
            <div className="mt-5">
              <Label className="mb-2 block">Which country are you thinking about?</Label>
              <div className="flex flex-wrap gap-2">
                {getStudentV6CountryOptions().map((country) => {
                  const active = draft.targetCountries?.includes(country);
                  return (
                    <button
                      key={country}
                      type="button"
                      onClick={() => {
                        const current = new Set(draft.targetCountries ?? []);
                        if (current.has(country)) current.delete(country);
                        else current.add(country);
                        updateDraft({ targetCountries: Array.from(current) });
                      }}
                      className={cn("rounded-full border px-3 py-2 text-sm font-semibold", active ? "border-primary bg-primary text-white" : "border-border bg-white text-muted-foreground")}
                    >
                      {country}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {stepIndex === 2 && (
          <div>
            <SectionHeading icon={BookOpenCheck} title="Add academics and tests" text="If you do not know exact scores, add approximate details now." />
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Highest degree / class" value={draft.degree} onChange={(value) => updateDraft({ degree: value })} placeholder="e.g. BCom, BE, 12th Commerce" />
              <TextInput label="Stream" value={draft.stream} onChange={(value) => updateDraft({ stream: value })} placeholder="e.g. Finance, Mechanical, Computer Science" />
              <TextInput label="Marks / GPA" value={draft.marks} onChange={(value) => updateDraft({ marks: value })} placeholder="e.g. 72% or 8.1 CGPA" />
              <TextInput label="Backlogs" value={draft.backlogs} onChange={(value) => updateDraft({ backlogs: value })} placeholder="e.g. 0, 2 cleared" />
              <TextInput label="Education gap" value={draft.educationGap} onChange={(value) => updateDraft({ educationGap: value })} placeholder="e.g. No gap, 1 year work gap" />
              <SelectInput label="Test name" value={draft.testName} onChange={(value) => updateDraft({ testName: value })} placeholder="Select test" options={TEST_NAMES} />
              <SelectInput label="Test status" value={draft.testStatus} onChange={(value) => updateDraft({ testStatus: value })} placeholder="Select status" options={TESTS} />
              <TextInput label="Score if available" value={draft.testScore} onChange={(value) => updateDraft({ testScore: value })} placeholder="e.g. IELTS 7.0, GRE 315" />
            </div>
          </div>
        )}

        {stepIndex === 3 && (
          <div>
            <SectionHeading icon={Sparkles} title="How should ELEE guide you?" text="Choose one path. You can change it later." />
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { value: "confused", title: "I am confused", text: "Use psychometric-style questions to choose country, course, and career direction." },
                { value: "known", title: "I know my path", text: "Generate the ELEE report from your profile and preferred country/course." },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRouteChoice(item.value as StudentV6RouteChoice)}
                  className={cn("rounded-lg border p-5 text-left transition-all", routeChoice === item.value ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-white hover:border-primary/35")}
                >
                  <div className="font-serif text-xl font-bold text-foreground">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {stepIndex === 4 && <SimpleStep icon={Search} title="Find course and university" text="Your country and course filters are ready. Open discovery and shortlist at least one university." href="/student-v6/explore" cta="Find options" />}
        {stepIndex === 5 && <SimpleStep icon={FileCheck2} title="Applications and documents" text="Every shortlisted university appears in Applications. Upload documents as they become ready." href="/student-v6/applications" cta="Open applications" />}
        {stepIndex === 6 && <SimpleStep icon={HandCoins} title="Finance and arrival" text="Plan your loan, scholarships, remittance, forex card, insurance, accommodation, and travel." href="/student-v6/finance" cta="Plan finance" />}

        <ContinueButtons
          canBack={stepIndex > 0}
          onBack={() => setStepIndex((index) => Math.max(0, index - 1))}
          onSave={() => {
            if (stepIndex >= 4) {
              saveProfilePatch();
              return;
            }
            saveProfilePatch(stepIndex + 1);
          }}
          saveLabel={stepIndex >= 4 ? "Save and go dashboard" : "Save and continue"}
        />
      </Card>
    </StudentV6Shell>
  );
}

function SectionHeading({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function SimpleStep({ icon: Icon, title, text, href, cta }: { icon: React.ElementType; title: string; text: string; href: string; cta: string }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
      <SectionHeading icon={Icon} title={title} text={text} />
      <Link href={href}>
        <Button className="rounded-full font-serif">{cta} <ArrowRight className="h-4 w-4" /></Button>
      </Link>
    </div>
  );
}

export function StudentV6DashboardPage() {
  const snapshot = useStudentV6Snapshot();
  const avatar = profileInitials(snapshot.studentName);
  const next = snapshot.currentStep;

  return (
    <StudentV6Shell>
      <PageIntro
        eyebrow="Dashboard"
        title="What should you do next?"
        description="This page changes as you complete each step. Keep following the main button."
        action={<Link href={next.href}><Button className="rounded-full font-serif">{next.cta}</Button></Link>}
      />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden border border-primary/20 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-primary to-accent" />
          <div className="p-5 md:p-6">
            <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">Next step</Badge>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight text-foreground">{next.label}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{next.studentTask}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={next.href}>
                <Button className="rounded-full font-serif">{next.cta} <ArrowRight className="h-4 w-4" /></Button>
              </Link>
              <Link href="/student-v6/support">
                <Button variant="outline" className="rounded-full font-serif">Ask for help</Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card className="border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-serif font-bold text-primary">{avatar}</div>
            <div>
              <div className="font-serif text-lg font-bold">{snapshot.studentName}</div>
              <div className="text-sm text-muted-foreground">{snapshot.packageLabel} package</div>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-sm"><span className="font-semibold text-muted-foreground">Journey progress</span><span className="font-serif font-bold">{snapshot.progress}%</span></div>
            <Progress value={snapshot.progress} className="h-2" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <MiniMetric label="Country" value={snapshot.selectedCountry ?? "Not chosen"} />
            <MiniMetric label="Shortlist" value={String(snapshot.state.shortlistedUniversityIds.length)} />
            <MiniMetric label="Docs" value={`${snapshot.documentReadiness}%`} />
            <MiniMetric label="Rewards" value={String(snapshot.state.rewardPoints)} />
          </div>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border border-border bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-bold">Your journey</h2>
          <p className="mt-1 text-sm text-muted-foreground">Done, missing, and locked steps are shown clearly.</p>
          <div className="mt-4 space-y-3">
            {snapshot.steps.map((step, index) => (
              <Link key={step.id} href={step.href}>
                <div className={cn("flex items-start gap-3 rounded-lg border p-3", step.status === "current" ? "border-primary/30 bg-primary/5" : "border-border bg-white")}>
                  <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-serif text-xs font-bold", step.status === "done" ? "bg-emerald-600 text-white" : step.status === "current" ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                    {step.status === "done" ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-base font-bold text-foreground">{step.label}</div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.status === "done" ? "Completed" : step.studentTask}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <aside className="space-y-5">
          <Card className="border border-border bg-white p-5 shadow-sm">
            <h2 className="font-serif text-xl font-bold">What is missing?</h2>
            <div className="mt-4 space-y-2">
              {snapshot.missing.slice(0, 4).map((item) => (
                <div key={item} className="rounded-lg border border-border bg-muted/25 p-3 text-sm leading-6 text-muted-foreground">{item}</div>
              ))}
              {snapshot.missing.length === 0 && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">All main steps are complete.</div>}
            </div>
          </Card>

          <Card className="border border-border bg-white p-5 shadow-sm">
            <h2 className="font-serif text-xl font-bold">Need help with more?</h2>
            <div className="mt-4 grid gap-2">
              {[
                ["Packages", "/student-v6/packages"],
                ["Documents", "/student-v6/documents"],
                ["Finance", "/student-v6/finance"],
                ["Support", "/student-v6/support"],
              ].map(([label, href]) => (
                <Link key={label} href={href}>
                  <div className="rounded-lg border border-border bg-white p-3 font-serif text-sm font-bold hover:border-primary/35 hover:bg-primary/5">{label}</div>
                </Link>
              ))}
            </div>
          </Card>
        </aside>
      </section>
    </StudentV6Shell>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/25 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-serif text-base font-bold text-foreground">{value}</div>
    </div>
  );
}

export function StudentV6ExplorePage() {
  const snapshot = useStudentV6Snapshot();
  const state = useStudentV6State();
  const [country, setCountry] = useState(snapshot.selectedCountry ?? "");
  const [query, setQuery] = useState(state.profile.courseInterest ?? "");
  const countryOptions = state.profile.targetCountries?.length ? state.profile.targetCountries : getStudentV6CountryOptions();
  const universities = filterV6Universities(state, country || null, query);
  const programs = filterV6Programs(state, country || null, query);
  const saved = new Set(state.shortlistedUniversityIds);

  useEffect(() => {
    if (!country && snapshot.selectedCountry) setCountry(snapshot.selectedCountry);
  }, [country, snapshot.selectedCountry]);

  return (
    <StudentV6Shell>
      <PageIntro
        eyebrow="Find options"
        title="Find the right country, course, and university"
        description="Filters follow your profile. If UK is selected in profile, UK options show first."
        action={<Link href="/student-v6/applications"><Button variant="outline" className="rounded-full font-serif">Open applications</Button></Link>}
      />

      <Card className="mb-5 border border-border bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search course, university, city, or subject" className="pl-9" />
          </div>
          <Select value={country || "all"} onValueChange={(value) => setCountry(value === "all" ? "" : value)}>
            <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All profile countries</SelectItem>
              {countryOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold">Universities</h2>
              <p className="text-sm text-muted-foreground">{universities.length} matches</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {universities.map((university) => (
              <Card key={university.id} className="border border-border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-lg font-bold leading-tight text-foreground">{university.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{university.city}, {university.country}</p>
                  </div>
                  <Badge variant="outline" className="rounded-full">#{university.ranking ?? "NA"}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <MiniMetric label="Tuition" value={`$${(university.avgTuitionUsd ?? 0).toLocaleString()}`} />
                  <MiniMetric label="Programs" value={String(university.programCount ?? 0)} />
                </div>
                <Button className="mt-4 w-full rounded-full font-serif" disabled={saved.has(university.id)} onClick={() => shortlistV6University(university)}>
                  {saved.has(university.id) ? "Added to applications" : "Shortlist this university"}
                </Button>
              </Card>
            ))}
          </div>
        </section>

        <aside>
          <Card className="border border-border bg-white p-4 shadow-sm">
            <h2 className="font-serif text-xl font-bold">Courses</h2>
            <p className="mt-1 text-sm text-muted-foreground">Course list follows selected country and course interest.</p>
            <div className="mt-4 space-y-3">
              {programs.slice(0, 7).map((program) => (
                <div key={program.id} className="rounded-lg border border-border bg-muted/25 p-3">
                  <div className="font-serif text-sm font-bold text-foreground">{program.name}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">{program.university?.name} · {program.university?.city}</div>
                </div>
              ))}
              {programs.length === 0 && <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">No courses found. Try a broader course word.</div>}
            </div>
          </Card>
        </aside>
      </div>
    </StudentV6Shell>
  );
}

export function StudentV6ApplicationsPage() {
  const state = useStudentV6State();
  const statusActions: Array<[StudentV6ApplicationStatus, string]> = [
    ["applying", "Start applying"],
    ["submitted", "Mark submitted"],
    ["offer", "Offer received"],
    ["visa", "Visa started"],
  ];

  return (
    <StudentV6Shell>
      <PageIntro
        eyebrow="Applications"
        title="Track your applications"
        description="Shortlisted universities appear here automatically."
        action={<Link href="/student-v6/documents"><Button className="rounded-full font-serif">Prepare documents</Button></Link>}
      />

      {state.applications.length === 0 ? (
        <EmptyAction title="No applications yet" text="Shortlist a university first. ELEE will create the application tracker." href="/student-v6/explore" cta="Find universities" />
      ) : (
        <div className="space-y-3">
          {state.applications.map((application) => (
            <Card key={application.id} className="border border-border bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-serif text-lg font-bold text-foreground">{application.universityName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{application.city}, {application.country}</p>
                </div>
                <Badge className="w-fit rounded-full bg-primary/10 text-primary hover:bg-primary/10">{application.status.replace("-", " ")}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {statusActions.map(([status, label]) => (
                  <Button key={status} variant="outline" size="sm" className="rounded-full" onClick={() => setV6ApplicationStatus(application.id, status)}>
                    {label}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </StudentV6Shell>
  );
}

export function StudentV6DocumentsPage() {
  const snapshot = useStudentV6Snapshot();
  const state = useStudentV6State();
  const uploaded = new Set(state.documents.filter((doc) => doc.status === "uploaded").map((doc) => doc.label));
  const selectedCountry = snapshot.selectedCountry ?? state.visa.country ?? "your selected country";

  return (
    <StudentV6Shell>
      <PageIntro
        eyebrow="Documents and visa"
        title="Prepare documents early"
        description="Mark documents as ready. This updates dashboard readiness and visa prompts."
        action={<Link href="/student-v6/finance"><Button variant="outline" className="rounded-full font-serif">Go to finance</Button></Link>}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border border-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold">Document checklist</h2>
              <p className="text-sm text-muted-foreground">{snapshot.documentReadiness}% ready</p>
            </div>
            <Progress value={snapshot.documentReadiness} className="h-2 w-32" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {getRequiredV6Documents().map((doc) => {
              const ready = uploaded.has(doc.label);
              return (
                <button
                  key={doc.label}
                  type="button"
                  onClick={() => toggleV6Document(doc.label, doc.group)}
                  className={cn("rounded-lg border p-3 text-left transition-all", ready ? "border-emerald-200 bg-emerald-50" : "border-border bg-white hover:border-primary/35")}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={cn("h-4 w-4", ready ? "text-emerald-600" : "text-muted-foreground")} />
                    <span className="font-serif text-sm font-bold text-foreground">{doc.label}</span>
                  </div>
                  <div className="mt-1 text-xs capitalize text-muted-foreground">{doc.group}</div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="border border-border bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-bold">Visa checklist</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">For {selectedCountry}. Complete these after offer stage.</p>
          <div className="mt-4 space-y-3">
            {[
              ["offerReceived", "Offer received"],
              ["casOrAcceptance", "CAS / I-20 / CoE ready"],
              ["tuitionDeposit", "Tuition deposit paid"],
              ["visaFormStarted", "Visa form started"],
              ["biometricsBooked", "Biometrics booked"],
            ].map(([key, label]) => {
              const active = Boolean(state.visa[key as keyof typeof state.visa]);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateStudentV6State((current) => ({ ...current, visa: { ...current.visa, [key]: !active, country: selectedCountry } }))}
                  className={cn("w-full rounded-lg border p-3 text-left font-serif text-sm font-bold", active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-white text-foreground")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </StudentV6Shell>
  );
}

export function StudentV6FinancePage() {
  const state = useStudentV6State();
  const [amount, setAmount] = useState(state.finance.loanAmountInr ?? 0);
  const [tenure, setTenure] = useState(state.finance.tenureMonths ?? 60);
  const [rate, setRate] = useState(state.finance.interestRate ?? 9);
  const emi = calculateV6Emi(amount, rate, tenure);

  const saveFinance = () => {
    updateStudentV6State((current) => ({
      ...current,
      finance: {
        ...current.finance,
        loanAmountInr: amount,
        tenureMonths: tenure,
        interestRate: rate,
        selectedLoan: amount > 0,
      },
      rewardPoints: current.rewardPoints + 30,
    }));
  };

  return (
    <StudentV6Shell>
      <PageIntro
        eyebrow="Finance and arrival"
        title="Plan money before visa"
        description="Use INR. Start from zero, estimate EMI, and mark services when ready."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border border-border bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-bold">Education loan EMI</h2>
          <p className="mt-1 text-sm text-muted-foreground">Estimate monthly EMI before choosing a lender.</p>
          <div className="mt-5 space-y-5">
            <RangeField label="Loan amount" value={amount} min={0} max={10_000_000} step={50_000} suffix={formatV6Inr(amount)} onChange={setAmount} />
            <RangeField label="Tenure" value={tenure} min={60} max={180} step={12} suffix={`${tenure} months`} onChange={setTenure} />
            <RangeField label="Interest rate" value={rate} min={7} max={15} step={0.1} suffix={`${rate.toFixed(1)}%`} onChange={setRate} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniMetric label="Estimated EMI" value={formatV6Inr(emi)} />
            <MiniMetric label="Total payable" value={formatV6Inr(emi * tenure)} />
          </div>
          <Button className="mt-5 rounded-full font-serif" onClick={saveFinance}>Save finance plan</Button>
        </Card>

        <Card className="border border-border bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-bold">Arrival services</h2>
          <p className="mt-1 text-sm text-muted-foreground">Mark what you want help with.</p>
          <div className="mt-4 space-y-3">
            {[
              ["remittance", "Remittance"],
              ["forexCard", "Forex card"],
              ["insurance", "Insurance"],
              ["accommodation", "Accommodation"],
            ].map(([key, label]) => {
              const active = Boolean(state.finance[key as keyof typeof state.finance]);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateStudentV6State((current) => ({ ...current, finance: { ...current.finance, [key]: !active }, rewardPoints: current.rewardPoints + (active ? 0 : 15) }))}
                  className={cn("w-full rounded-lg border p-3 text-left font-serif text-sm font-bold", active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-white text-foreground")}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <Link href="/student-v6/packages">
            <Button variant="outline" className="mt-5 w-full rounded-full font-serif">Choose package</Button>
          </Link>
        </Card>
      </div>
    </StudentV6Shell>
  );
}

function RangeField({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (value: number) => void }) {
  const formatBound = label === "Loan amount" ? formatV6Inr : (number: number) => String(number);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <span className="font-serif text-sm font-bold text-foreground">{suffix}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={(next) => onChange(next[0] ?? min)} />
      <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{formatBound(min)}</span><span>{formatBound(max)}</span></div>
    </div>
  );
}

export function StudentV6PackagesPage() {
  const state = useStudentV6State();

  return (
    <StudentV6Shell>
      <PageIntro
        eyebrow="Packages"
        title="Choose your support level"
        description="Silver, Gold, and Platinum update the dashboard tier and rewards."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {STUDENT_PACKAGES.map((pack) => {
          const active = state.packageSelection?.packageId === pack.id;
          return (
            <Card key={pack.id} className={cn("border bg-white p-5 shadow-sm", active ? "border-primary shadow-md" : "border-border")}>
              <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">{pack.badge}</Badge>
              <h2 className="mt-4 font-serif text-2xl font-bold">{pack.shortName}</h2>
              <div className="mt-1 font-serif text-xl font-bold text-primary">{formatV6Inr(pack.priceInr)}</div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{pack.summary}</p>
              <div className="mt-4 space-y-2">
                {pack.features.slice(0, 4).map((feature) => (
                  <div key={feature} className="flex gap-2 text-sm leading-6 text-muted-foreground"><CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-600" />{feature}</div>
                ))}
              </div>
              <Button className="mt-5 w-full rounded-full font-serif" disabled={active} onClick={() => selectV6Package(pack.id as StudentPackageTier)}>
                {active ? "Selected" : `Choose ${pack.shortName}`}
              </Button>
            </Card>
          );
        })}
      </div>
    </StudentV6Shell>
  );
}

export function StudentV6SupportPage() {
  return (
    <StudentV6Shell>
      <PageIntro
        eyebrow="Support"
        title="Get help anytime"
        description="Support stays upfront during the entire journey."
      />
      <div className="grid gap-5 md:grid-cols-3">
        {[
          { title: "Live chat", text: "Available 9am-6pm IST for quick student questions.", icon: HelpCircle },
          { title: "Call back", text: "Ask an advisor to call the student or parent.", icon: UserRound },
          { title: "Document help", text: "Get help with SOP, LOR, passport, finance proof, and visa documents.", icon: FileCheck2 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="border border-border bg-white p-5 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
              <h2 className="mt-4 font-serif text-xl font-bold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </Card>
          );
        })}
      </div>
      <Card className="mt-5 border border-border bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl font-bold">Common questions</h2>
        <div className="mt-4 divide-y divide-border">
          {[
            "Can I start without passport?",
            "Which country is best for my budget?",
            "What documents do I need first?",
            "How do I know if I need IELTS or PTE?",
            "When should I apply for education loan?",
          ].map((question) => (
            <div key={question} className="py-3 font-serif text-sm font-bold text-foreground">{question}</div>
          ))}
        </div>
      </Card>
    </StudentV6Shell>
  );
}

function EmptyAction({ title, text, href, cta }: { title: string; text: string; href: string; cta: string }) {
  return (
    <Card className="border border-dashed border-border bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"><Plane className="h-7 w-7" /></div>
      <h2 className="mt-4 font-serif text-2xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{text}</p>
      <Link href={href}>
        <Button className="mt-5 rounded-full font-serif">{cta}</Button>
      </Link>
    </Card>
  );
}

export function StudentV6ResetPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    clearStudentV6State();
    setLocation("/student-v6");
  }, [setLocation]);

  return null;
}
