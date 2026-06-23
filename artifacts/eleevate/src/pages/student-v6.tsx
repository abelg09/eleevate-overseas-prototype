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
  Home,
  MapPinned,
  PackageCheck,
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
  type StudentV6JourneyStep,
  type StudentV6Profile,
  type StudentV6RouteChoice,
  type StudentV6Snapshot,
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

type StudentV6NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  indicator?: "catalog" | "applications" | "documents" | "tasks" | "dot";
};

const STUDENT_V6_NAV_SECTIONS: Array<{ title: string; items: StudentV6NavItem[] }> = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/student-v6/dashboard", icon: Home },
      { label: "University Explorer", href: "/student-v6/explore", icon: GraduationCap, indicator: "catalog" },
      { label: "My Applications", href: "/student-v6/applications", icon: BookOpenCheck, indicator: "applications" },
      { label: "Scholarships", href: "/student-v6/finance", icon: Sparkles, indicator: "dot" },
    ],
  },
  {
    title: "Visa & Finance",
    items: [
      { label: "Visa Tracker", href: "/student-v6/documents", icon: ShieldCheck },
      { label: "Documents", href: "/student-v6/documents", icon: FileCheck2, indicator: "documents" },
      { label: "Loans & Finance", href: "/student-v6/finance", icon: HandCoins },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "My Counsellor", href: "/student-v6/support", icon: UserRound },
      { label: "My Tasks", href: "/student-v6/dashboard", icon: CheckCircle2, indicator: "tasks" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Packages", href: "/student-v6/packages", icon: PackageCheck },
      { label: "Support Center", href: "/student-v6/support", icon: HelpCircle },
    ],
  },
];

const STUDENT_V6_NAV_ITEMS = STUDENT_V6_NAV_SECTIONS.flatMap((section) => section.items);

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
  const [location] = useLocation();
  const snapshot = useStudentV6Snapshot();
  const avatar = profileInitials(snapshot.studentName);

  useEffect(() => setNotificationsOpen(false), [snapshot.currentStep.id]);

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#151d3d] lg:flex" data-testid="student-v6-shell">
      <aside className="hidden h-screen w-[260px] flex-shrink-0 bg-[#1b2444] text-white lg:sticky lg:top-0 lg:flex lg:flex-col" data-testid="student-v6-side-nav">
        <div className="flex h-20 items-center gap-4 border-b border-white/10 px-5">
          <Link href="/student-v6/dashboard" aria-label="Student V6 dashboard">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#35b64a] to-[#07a8e5] font-serif text-xl font-black text-white shadow-lg">
              E
            </div>
          </Link>
          <div>
            <div className="font-serif text-xl font-black leading-none text-white">Eleevate</div>
            <div className="mt-1 text-[11px] font-semibold text-white/45">Student Journey</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6" aria-label="Student V6 navigation">
          {STUDENT_V6_NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-7 last:mb-0">
              <div className="px-2 text-[12px] font-black uppercase tracking-[0.16em] text-white/35">{section.title}</div>
              <div className="mt-3 space-y-1.5">
                {section.items.map((item) => (
                  <StudentV6NavLink
                    key={`${section.title}-${item.label}`}
                    item={item}
                    active={isStudentV6ActiveRoute(location, item.href)}
                    snapshot={snapshot}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl bg-white/6 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#35b64a] to-[#07a8e5] font-serif text-sm font-black text-white">
                {avatar}
              </div>
              <div className="min-w-0">
                <div className="truncate font-serif text-sm font-bold text-white">{snapshot.studentName}</div>
                <div className="mt-0.5 text-xs text-white/50">{snapshot.packageLabel} plan</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="font-semibold text-white/45">Journey</span>
              <span className="font-serif font-bold text-[#79e49f]">{snapshot.progress}%</span>
            </div>
            <Progress value={snapshot.progress} className="mt-2 h-2 bg-white/10" />
            <Link href={snapshot.currentStep.href}>
              <Button size="sm" className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#31b63f] to-[#06a8e7] font-serif text-white shadow-lg">
                Continue next step
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#121a36] text-white shadow-sm">
          <div className="mx-auto flex min-h-20 max-w-[1480px] items-center gap-3 px-4 sm:px-6">
            <Link href="/student-v6/dashboard" aria-label="Student V6 dashboard" className="lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#35b64a] to-[#07a8e5] font-serif text-lg font-black text-white">
                E
              </div>
            </Link>
            <div className="min-w-0 flex-1 lg:hidden">
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#79e49f]">Student journey</div>
              <div className="truncate font-serif text-sm font-bold text-white">{snapshot.studentName}</div>
            </div>

            <div className="hidden rounded-xl bg-white/8 p-1 md:flex">
              <div className="rounded-lg bg-gradient-to-r from-[#31b63f] to-[#06a8e7] px-5 py-2 font-serif text-sm font-black text-white shadow">
                Student
              </div>
              <Link href="/student-v6/support">
                <div className="rounded-lg px-5 py-2 font-serif text-sm font-bold text-white/55 hover:text-white">Counsellor</div>
              </Link>
              <Link href="/student-v6/packages">
                <div className="rounded-lg px-5 py-2 font-serif text-sm font-bold text-white/55 hover:text-white">Plan</div>
              </Link>
            </div>

            <Link href="/student-v6/explore" className="ml-auto hidden min-w-0 flex-1 justify-end lg:flex">
              <div className="flex h-12 w-full max-w-sm items-center gap-3 rounded-xl border border-white/10 bg-white/8 px-4 text-white/45">
                <Search className="h-5 w-5" />
                <span className="truncate text-sm font-semibold">Search universities, programs, documents</span>
              </div>
            </Link>

            <Link href="/student-v6/packages">
              <Badge variant="outline" className="hidden rounded-xl border-white/10 bg-white/8 px-3 py-2 font-serif text-sm font-bold text-white sm:inline-flex">
                {snapshot.packageLabel}
              </Badge>
            </Link>

            <Link href="/student-v6/support">
              <Button variant="ghost" size="icon" className="hidden h-12 w-12 rounded-xl bg-white/8 text-white hover:bg-white/12 hover:text-white sm:inline-flex" data-testid="v6-support-top">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((value) => !value)}
                className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/8 text-white shadow-sm hover:bg-white/12"
                aria-label="Journey notifications"
              >
                <Bell className="h-5 w-5" />
                {snapshot.notifications.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#08aeea] px-1 text-[11px] font-black text-white">
                    {snapshot.notifications.length}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-14 z-50 w-[min(calc(100vw-2rem),360px)] overflow-hidden rounded-xl border border-border bg-white text-foreground shadow-xl">
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

            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#35b64a] to-[#07a8e5] font-serif font-black text-white ring-2 ring-white/15">
                {avatar}
              </div>
              <div className="hidden min-w-0 xl:block">
                <div className="truncate font-serif text-sm font-bold text-white">{snapshot.studentName}</div>
                <div className="text-xs text-white/50">Student · {snapshot.packageLabel} Plan</div>
              </div>
            </div>
          </div>

          <nav className="border-t border-white/10 bg-[#121a36] px-4 py-2 lg:hidden" aria-label="Student V6 quick navigation">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STUDENT_V6_NAV_ITEMS.slice(0, 6).map((item) => (
                <MobileV6NavPill key={`${item.label}-${item.href}`} item={item} active={isStudentV6ActiveRoute(location, item.href)} />
              ))}
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function getV6NavIndicator(item: StudentV6NavItem, snapshot: StudentV6Snapshot) {
  if (item.indicator === "catalog") return "450+";
  if (item.indicator === "applications" && snapshot.state.applications.length > 0) return String(snapshot.state.applications.length);
  if (item.indicator === "tasks" && snapshot.missing.length > 0) return String(snapshot.missing.length);
  if (item.indicator === "documents") {
    const pending = Math.max(0, getRequiredV6Documents().length - snapshot.state.documents.filter((doc) => doc.status === "uploaded").length);
    return pending > 0 ? String(pending) : null;
  }
  if (item.indicator === "dot") return "dot";
  return null;
}

function isStudentV6ActiveRoute(location: string, href: string) {
  if (href === "/student-v6/dashboard") return location === href;
  return location === href || location.startsWith(`${href}/`);
}

function StudentV6NavLink({
  item,
  active,
  snapshot,
}: {
  item: StudentV6NavItem;
  active: boolean;
  snapshot: StudentV6Snapshot;
}) {
  const Icon = item.icon;
  const indicator = getV6NavIndicator(item, snapshot);
  return (
    <Link href={item.href}>
      <div
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-3 font-serif text-[15px] font-bold transition-colors",
          active
            ? "bg-gradient-to-r from-[#22445f] to-[#224c4d] text-white shadow-lg"
            : "text-white/55 hover:bg-white/6 hover:text-white",
        )}
      >
        {active && <span className="absolute left-0 top-3 h-7 w-1 rounded-r-full bg-[#25d37b]" />}
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="min-w-0 flex-1">{item.label}</span>
        {indicator === "dot" && <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />}
        {indicator && indicator !== "dot" && (
          <span className="rounded-full bg-gradient-to-r from-[#35b64a] to-[#07a8e5] px-2 py-0.5 text-xs font-black text-white">
            {indicator}
          </span>
        )}
      </div>
    </Link>
  );
}

function MobileV6NavPill({
  item,
  active,
}: {
  item: StudentV6NavItem;
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link href={item.href}>
      <div
        className={cn(
          "flex min-w-max items-center gap-2 rounded-full border px-3 py-2 font-serif text-xs font-bold",
          active
            ? "border-transparent bg-gradient-to-r from-[#31b63f] to-[#06a8e7] text-white"
            : "border-white/10 bg-white/8 text-white/65",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{item.label}</span>
      </div>
    </Link>
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
  const next = snapshot.currentStep;
  const firstName = snapshot.studentName === "Student" ? "Student" : snapshot.studentName.split(" ")[0];
  const currentStepIndex = Math.max(0, snapshot.steps.findIndex((step) => step.id === next.id));
  const currentStepNumber = Math.min(snapshot.steps.length, currentStepIndex + 1);
  const allDone = snapshot.steps.every((step) => step.complete);
  const nextTitle = allDone ? "Main journey complete" : next.label;
  const nextText = allDone
    ? "You have finished the main setup. Ask Eleevate support to review your file before final submission."
    : next.studentTask;
  const nextRequirement = allDone ? "Final review with counsellor." : next.required;
  const appPreview = snapshot.state.applications.slice(0, 3);
  const visaChecks = [
    snapshot.state.visa.offerReceived,
    snapshot.state.visa.casOrAcceptance,
    snapshot.state.visa.tuitionDeposit,
    snapshot.state.visa.visaFormStarted,
    snapshot.state.visa.biometricsBooked,
  ];
  const visaProgress = Math.round((visaChecks.filter(Boolean).length / visaChecks.length) * 100);
  const requiredDocs = getRequiredV6Documents();
  const uploadedDocCount = snapshot.state.documents.filter((doc) => doc.status === "uploaded").length;
  const pendingDocs = Math.max(0, requiredDocs.length - uploadedDocCount);
  const selectedCountry = snapshot.selectedCountry ?? "Not chosen";
  const budgetMax = snapshot.state.profile.budgetMaxInr ?? 0;
  const packageSelected = snapshot.packageLabel !== "No tier";
  const counsellorTitle = snapshot.state.applications.length > 0 ? "Book application review" : "Book your first guidance call";

  return (
    <StudentV6Shell>
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-sm font-semibold text-muted-foreground">Home</div>
          <h1 className="mt-3 font-serif text-3xl font-black leading-tight text-[#172040] md:text-4xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 text-base font-medium text-muted-foreground">
            Here is what needs attention in your study abroad journey today.
          </p>
        </div>
        <Link href="/student-v6/explore">
          <Button className="rounded-lg bg-gradient-to-r from-[#31b63f] to-[#06a8e7] px-5 font-serif text-white shadow-lg">
            Explore Universities
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl bg-gradient-to-r from-[#31b63f] via-[#20ad7b] to-[#06a8e7] p-5 text-white shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/16">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-black">
                {packageSelected ? `${snapshot.packageLabel} plan active` : "Choose a student package"}
              </h2>
              <p className="mt-1 text-sm font-medium text-white/86">
                {packageSelected
                  ? "You can upgrade anytime for more counsellor review, document help, and application support."
                  : "Unlock guided applications, counsellor review, visa support, finance help, and rewards."}
              </p>
            </div>
          </div>
          <Link href="/student-v6/packages">
            <Button variant="secondary" className="rounded-lg bg-white px-5 font-serif text-[#172040] hover:bg-white/90">
              {packageSelected ? "Manage plan" : "View packages"}
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <ReferenceMetricCard icon={BookOpenCheck} label="Applications" value={String(snapshot.state.applications.length)} note={snapshot.state.applications.length ? "Active tracker items" : "Shortlist first"} tone="blue" />
        <ReferenceMetricCard icon={FileCheck2} label="Documents ready" value={`${uploadedDocCount}/${requiredDocs.length}`} note={pendingDocs ? `${pendingDocs} pending` : "All marked ready"} tone="neutral" />
        <ReferenceMetricCard icon={ShieldCheck} label="Visa progress" value={`${visaProgress}%`} note={visaProgress ? "Checklist started" : "Starts after offer"} tone="blue" />
        <ReferenceMetricCard icon={Sparkles} label="Scholarships found" value={snapshot.state.profile.targetCountries?.length ? "Ready" : "0"} note={snapshot.state.profile.targetCountries?.length ? "Open finance to check" : "Add country to match"} tone="gold" />
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <Card className="rounded-2xl border-0 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-serif text-2xl font-black text-[#172040]">My Applications</h2>
              <Link href="/student-v6/applications">
                <Button variant="outline" className="rounded-lg border-[#172040] font-serif text-[#172040]">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {appPreview.length ? (
                appPreview.map((application) => (
                  <div key={application.id} className="flex flex-col gap-3 rounded-xl border border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="font-serif text-lg font-bold text-[#172040]">{application.universityName}</div>
                      <div className="mt-1 text-sm font-medium text-muted-foreground">
                        {application.city}, {application.country}
                      </div>
                    </div>
                    <Badge className="w-fit rounded-full bg-cyan-50 px-4 py-1.5 font-serif text-cyan-800 hover:bg-cyan-50">
                      {application.status.replace("-", " ")}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-[#f8fafc] p-5">
                  <div className="font-serif text-lg font-black text-[#172040]">No applications yet</div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Shortlist a university and ELEE will create your application tracker here.</p>
                  <Link href="/student-v6/explore">
                    <Button className="mt-4 rounded-lg bg-gradient-to-r from-[#31b63f] to-[#06a8e7] font-serif text-white">
                      Find universities
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-2xl border-0 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-serif text-2xl font-black text-[#172040]">Your journey steps</h2>
              <p className="mt-1 text-sm text-muted-foreground">Green is done. Blue is what to do now. Grey can wait.</p>
            </div>
            <Link href="/student-v6/start">
              <Button variant="outline" size="sm" className="rounded-lg font-serif">Edit answers</Button>
            </Link>
          </div>
          <div className="mt-4 grid gap-2">
            {snapshot.steps.map((step, index) => (
              <JourneyStepLine key={step.id} step={step} index={index} />
            ))}
          </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-[#31b63f] to-[#06a8e7] p-6 text-white">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-white/75">Next counsellor session</div>
              <div className="mt-4 font-serif text-2xl font-black">{counsellorTitle}</div>
              <p className="mt-1 text-sm font-medium text-white/86">Available 10:00 AM - 7:00 PM IST</p>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#31b63f] to-[#06a8e7] font-serif font-black text-white">EO</div>
                <div>
                  <div className="font-serif font-black text-[#172040]">Eleevate Counsellor</div>
                  <div className="text-sm text-muted-foreground">Study abroad guidance</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Link href="/student-v6/support">
                  <Button className="w-full rounded-lg bg-gradient-to-r from-[#31b63f] to-[#06a8e7] font-serif text-white">Book call</Button>
                </Link>
                <Link href="/student-v6/support">
                  <Button variant="outline" className="w-full rounded-lg border-[#172040] font-serif text-[#172040]">Ask now</Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-0 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-black text-[#172040]">Documents</h2>
              <Badge className="rounded-full bg-amber-50 px-3 py-1 font-serif text-amber-800 hover:bg-amber-50">{pendingDocs} pending</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {requiredDocs.slice(0, 5).map((doc) => {
                const uploaded = snapshot.state.documents.some((item) => item.label === doc.label && item.status === "uploaded");
                return (
                  <Link key={doc.label} href="/student-v6/documents">
                    <div className="flex items-center justify-between rounded-xl border border-border bg-[#f8fafc] p-3">
                      <div className="min-w-0">
                        <div className="truncate font-serif text-sm font-bold text-[#172040]">{doc.label}</div>
                        <div className="text-xs text-muted-foreground">{doc.group}</div>
                      </div>
                      <Badge variant="outline" className={cn("rounded-full", uploaded ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800")}>
                        {uploaded ? "Ready" : "Pending"}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card className="rounded-2xl border-0 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-2xl font-black text-[#172040]">My Tasks</h2>
            <div className="mt-4 space-y-3">
              {snapshot.tasks.map((task, index) => (
                <Link key={task.id} href={task.href}>
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-[#f8fafc] p-3 hover:border-primary/35 hover:bg-primary/5">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#31b63f] to-[#06a8e7] font-serif text-xs font-black text-white">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-serif text-sm font-black text-[#172040]">{task.title}</div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{task.detail}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </div>
                </Link>
              ))}
              {snapshot.tasks.length === 0 && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">All main steps are complete.</div>}
            </div>
          </Card>
        </aside>
      </section>
    </StudentV6Shell>
  );
}

function ReferenceMetricCard({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  note: string;
  tone: "blue" | "neutral" | "gold";
}) {
  const iconClass = tone === "gold"
    ? "bg-amber-50 text-amber-700"
    : tone === "blue"
      ? "bg-sky-50 text-sky-700"
      : "bg-slate-50 text-slate-600";
  const noteClass = tone === "gold" ? "text-amber-600" : "text-teal-600";

  return (
    <Card className="rounded-2xl border-0 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
          <div className="mt-9 font-serif text-4xl font-black leading-none text-[#172040]">{value}</div>
          <div className={cn("mt-3 text-sm font-black", noteClass)}>{note}</div>
        </div>
        <div className={cn("flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl", iconClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/8 p-3 backdrop-blur">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">{label}</div>
      <div className="mt-1 break-words font-serif text-base font-bold leading-tight text-white">{value}</div>
    </div>
  );
}

function DarkFloatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-white/12 bg-white/10 p-4 text-white shadow-lg backdrop-blur">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{label}</div>
      <div className="mt-1 font-serif text-3xl font-bold">{value}</div>
      <p className="mt-1 text-xs leading-5 text-white/68">{detail}</p>
    </div>
  );
}

function FeatureTile({ icon: Icon, title, text, href }: { icon: React.ElementType; title: string; text: string; href: string }) {
  return (
    <Link href={href}>
      <Card className="h-full border border-border bg-white p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="mt-4 font-serif text-xl font-bold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
      </Card>
    </Link>
  );
}

function DashboardStatusCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-serif text-lg font-bold leading-tight text-foreground">{value}</div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>
    </div>
  );
}

function AnswerCard({ question, answer, detail, href }: { question: string; answer: string; detail: string; href?: string }) {
  const content = (
    <Card className="h-full border border-border bg-white p-4 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{question}</div>
      <div className="mt-2 font-serif text-xl font-bold leading-tight text-foreground">{answer}</div>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function JourneyStepLine({ step, index }: { step: StudentV6JourneyStep; index: number }) {
  const isDone = step.status === "done";
  const isCurrent = step.status === "current";
  const statusLabel = isDone ? "Done" : isCurrent ? "Do now" : "Later";

  return (
    <Link href={step.href}>
      <div className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-colors",
        isDone && "border-emerald-200 bg-emerald-50",
        isCurrent && "border-primary/30 bg-primary/5",
        !isDone && !isCurrent && "border-border bg-white hover:border-primary/25",
      )}>
        <div className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-serif text-xs font-bold",
          isDone ? "bg-emerald-600 text-white" : isCurrent ? "bg-primary text-white" : "bg-muted text-muted-foreground",
        )}>
          {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-serif text-base font-bold text-foreground">{step.label}</div>
            <Badge variant="outline" className={cn(
              "rounded-full px-2 py-0.5 text-[11px]",
              isDone && "border-emerald-200 bg-white text-emerald-800",
              isCurrent && "border-primary/20 bg-white text-primary",
            )}>{statusLabel}</Badge>
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{isDone ? "Completed" : step.studentTask}</p>
        </div>
        <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      </div>
    </Link>
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
