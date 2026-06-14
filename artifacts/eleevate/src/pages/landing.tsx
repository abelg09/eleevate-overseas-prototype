import { useState } from "react";
import {
  getGetFeaturedUniversitiesQueryKey,
  getListCountriesQueryKey,
  useGetFeaturedUniversities,
  useListCountries,
} from "@workspace/api-client-react";
import type { Country, University } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  ClipboardCheck,
  FileSearch,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  MessageCircle,
  Sparkles,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import { UniversityLogo } from "@/components/common/university-logo";
import { EleeBuddy } from "@/components/common/elee-buddy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isDemoMode, listFromApi } from "@/lib/demo-mode";
import { DEMO_COUNTRIES, DEMO_UNIVERSITIES } from "@/lib/demo-catalog";
import { assetUrl } from "@/lib/utils";

const STATS = [
  { value: "1200+", label: "Universities" },
  { value: "15+", label: "Countries" },
  { value: "50+", label: "Scholarships" },
  { value: "1", label: "ELEE" },
];

const PRODUCT_MODULES = [
  {
    title: "Your Study Abroad Dashboard",
    desc: "Build your profile, shortlist universities, manage applications, upload documents, track visa steps, explore city guides, get 24/7 support, and unlock rewards in one place.",
    meta: "Student app",
    icon: LayoutDashboard,
    gradient: "linear-gradient(135deg, #009FE3 0%, #1AB7CF 48%, #3AAA35 100%)",
    soft: "bg-[#EAF8FF]",
    accent: "text-[#009FE3]",
    proof: "Your dashboard keeps the full journey visible so you always know what is complete, blocked, and next.",
    updates: ["Profile progress", "Application tasks", "Visa timeline"],
  },
  {
    title: "Know Where You Stand",
    desc: "Complete your psychometric evaluation and ELEE Report to understand readiness, best routes, profile gaps, family readiness, finance planning, and next actions.",
    meta: "ELEE report",
    icon: FileSearch,
    gradient: "linear-gradient(135deg, #172A5A 0%, #285BD8 48%, #009FE3 100%)",
    soft: "bg-[#EEF5FF]",
    accent: "text-[#285BD8]",
    proof: "ELEE turns your academics, goals, personality signals, budget, tests, and family readiness into a clearer route plan.",
    updates: ["Psychometric fit", "Route clarity", "Action plan"],
  },
  {
    title: "AI Counsellor Connect",
    desc: "Stay connected with your AI counsellor for SOPs, LORs, test prep, document reviews, reminders, follow-ups, and every next step in your journey.",
    meta: "AI counsellor",
    icon: MessageCircle,
    gradient: "linear-gradient(135deg, #402B74 0%, #7C55C7 48%, #009FE3 100%)",
    soft: "bg-[#F5F0FF]",
    accent: "text-[#6B4BB7]",
    proof: "ELEE learns your goals, writing style, and personality so guidance feels personal, practical, and timely.",
    updates: ["SOP direction", "Interview prep", "Smart reminders"],
  },
  {
    title: "Everything You Need Abroad",
    desc: "Access education loans, remittance, forex cards, insurance, accommodation support, scholarships, career prep, and trusted services that make your move easier.",
    meta: "Finance & services",
    icon: WalletCards,
    gradient: "linear-gradient(135deg, #0B3A4B 0%, #009FE3 45%, #F6A623 100%)",
    soft: "bg-[#FFF7E8]",
    accent: "text-[#C77700]",
    proof: "Finance, accommodation, visa support, and career preparation stay connected to your application stage.",
    updates: ["Education loan", "Accommodation", "Career support"],
  },
];

const LIVE_UPDATES = [
  {
    number: "01",
    title: "Understands your profile",
    desc: "ELEE reads academics, budget, goals, family readiness, test status, personality signals, and study preferences before recommending a route.",
    icon: UserRound,
    surface: "AI profile",
    event: "Personal guidance",
    tone: "from-[#EAF8FF] to-[#ECFFF2]",
  },
  {
    number: "02",
    title: "Guides your writing",
    desc: "It helps shape SOPs, LOR points, resumes, emails, and application answers around your own voice and story.",
    icon: GraduationCap,
    surface: "SOP + LOR",
    event: "Writing support",
    tone: "from-[#ECFFF2] to-[#F5F0FF]",
  },
  {
    number: "03",
    title: "Prepares you for interviews",
    desc: "ELEE gives university, visa, scholarship, and career interview practice with feedback you can act on.",
    icon: BriefcaseBusiness,
    surface: "Interview prep",
    event: "Practice + feedback",
    tone: "from-[#FFF7E8] to-[#EAF8FF]",
  },
  {
    number: "04",
    title: "Connects you with support",
    desc: "When you need human help, ELEE routes you to counsellors, service partners, scholarship options, and career connections.",
    icon: Users,
    surface: "Connections",
    event: "Expert support",
    tone: "from-[#F5F0FF] to-[#EEF5FF]",
  },
];

const JOURNEY_MAP_STAGES = [
  {
    id: "create-profile",
    phase: "Create Profile",
    status: "Start",
    student: "Add academics, study level, course interests, budget, intake, tests, work experience, and sponsor details.",
    automation: "ELEE builds your student file and prepares your first recommended tasks.",
    handoff: "Passport, marksheets, budget range, target intake, course area.",
    impact: "Profile ready",
  },
  {
    id: "psychometric",
    phase: "Psychometric Evaluation",
    status: "Assess",
    student: "Complete the personality, readiness, and career-fit assessment.",
    automation: "ELEE connects your personality, learning style, goals, and route preferences.",
    handoff: "Career interests, strengths, decision style, study preferences.",
    impact: "Fit signals unlocked",
  },
  {
    id: "shortlisting",
    phase: "Shortlisting",
    status: "Choose",
    student: "Compare countries, universities, courses, costs, cities, scholarships, and outcomes.",
    automation: "ELEE ranks options by profile fit, affordability, intake, and visa readiness.",
    handoff: "Preferred destinations, saved universities, course matches.",
    impact: "Best-fit list saved",
  },
  {
    id: "application",
    phase: "Application",
    status: "Apply",
    student: "Prepare SOP, LOR, resume, application forms, deadlines, and document packets.",
    automation: "ELEE tracks missing requirements, drafts writing prompts, and keeps follow-ups visible.",
    handoff: "SOP draft, LOR inputs, resume, transcripts, application deadlines.",
    impact: "Applications moving",
  },
  {
    id: "finance",
    phase: "Finance",
    status: "Plan",
    student: "Plan education loan, scholarship, fee payment, remittance, forex card, insurance, and accommodation.",
    automation: "ELEE shows what is pending and which finance documents are needed.",
    handoff: "Funding plan, sponsor proof, loan interest, payment timeline.",
    impact: "Finance plan ready",
  },
  {
    id: "career",
    phase: "Career",
    status: "Grow",
    student: "Prepare interviews, build skills, join alumni networks, find companies, and plan your first career steps abroad.",
    automation: "ELEE suggests test prep, upskilling, interview practice, alumni connections, and career actions.",
    handoff: "Skills, interview notes, target roles, company connections.",
    impact: "Career path opened",
  },
];

const SERVICES = [
  { icon: MessageCircle, phase: "Guidance", title: "Book a Counsellor", desc: "Get human support when you need deeper clarity for country, course, visa, or family decisions." },
  { icon: BookOpenCheck, phase: "Prep", title: "Test Prep", desc: "Plan IELTS, TOEFL, GRE, GMAT, mock tests, and language practice around your timeline." },
  { icon: Landmark, phase: "Finance", title: "Education Loan", desc: "Understand funding documents, loan options, remittance, forex, insurance, and fee planning." },
  { icon: BriefcaseBusiness, phase: "Career", title: "Interview Prep", desc: "Practice university, visa, scholarship, internship, and early career interview questions." },
];

const DASHBOARD_ACTIONS = [
  "Generate ELEE Report",
  "Find and compare countries",
  "Find my course",
  "Applications",
  "Test prep",
  "Draft SOP",
  "Find scholarship",
  "Education loan",
  "Interview prep",
];

const COUNTRY_VISUALS: Record<string, string> = {
  US: "https://eleevateoverseas.com/wp-content/uploads/2025/05/Study-In-USA-Flag-Eleevate-Overseas.svg",
  GB: "https://eleevateoverseas.com/wp-content/uploads/2024/05/Study-In-UK-Flag-Eleevate-Overseas.svg",
  FR: "https://eleevateoverseas.com/wp-content/uploads/2024/05/Study-In-France-Flag-Eleevate-Overseas.svg",
  DE: "https://eleevateoverseas.com/wp-content/uploads/2024/05/Study-In-Germany-Flag-Eleevate-Overseas.svg",
  AU: "https://eleevateoverseas.com/wp-content/uploads/2024/05/Study-In-Australia-Flag-Eleevate-Overseas.svg",
  AE: "https://eleevateoverseas.com/wp-content/uploads/2025/07/Study-In-Dubai-Flag-Eleevate-Overseas.svg",
  CA: "https://eleevateoverseas.com/wp-content/uploads/2024/05/Study-In-Canada-Flag-Eleevate-Overseas.svg",
  IE: "https://eleevateoverseas.com/wp-content/uploads/2024/05/Study-In-Ireland-Flag-Eleevate-Overseas.svg",
  NL: "https://flagcdn.com/w640/nl.png",
  SG: "https://eleevateoverseas.com/wp-content/uploads/2024/05/Study-In-Singapore-Flag-Eleevate-Overseas.svg",
};

const COUNTRY_ROUTE_INSIGHTS: Record<string, {
  budget: string;
  visa: string;
  cities: string;
  bestFor: string;
  intake: string;
}> = {
  CA: { budget: "$38k-$46k", visa: "Medium", cities: "Toronto, Vancouver", bestFor: "PR-aware routes", intake: "Sep 2026" },
  GB: { budget: "$32k-$42k", visa: "Strong", cities: "London, Manchester", bestFor: "Fast master's", intake: "Sep 2026" },
  US: { budget: "$45k-$62k", visa: "Review", cities: "Boston, Phoenix", bestFor: "STEM + scale", intake: "Aug 2026" },
  AU: { budget: "$36k-$48k", visa: "Medium", cities: "Melbourne, Sydney", bestFor: "Work rights", intake: "Jul 2026" },
  DE: { budget: "$18k-$30k", visa: "Checklist", cities: "Munich, Berlin", bestFor: "Low tuition", intake: "Oct 2026" },
  NL: { budget: "$28k-$40k", visa: "Strong", cities: "Delft, Amsterdam", bestFor: "Applied tech", intake: "Sep 2026" },
  FR: { budget: "$24k-$36k", visa: "Strong", cities: "Paris, Lyon", bestFor: "Business + design", intake: "Sep 2026" },
  IE: { budget: "$30k-$44k", visa: "Strong", cities: "Dublin, Galway", bestFor: "Tech careers", intake: "Sep 2026" },
  SG: { budget: "$34k-$50k", visa: "Strong", cities: "Singapore", bestFor: "Asia hub", intake: "Aug 2026" },
  AE: { budget: "$20k-$32k", visa: "Strong", cities: "Dubai", bestFor: "Regional access", intake: "Sep 2026" },
};

export default function LandingPage() {
  const [flippedModule, setFlippedModule] = useState<string | null>(null);
  const [startDialog, setStartDialog] = useState<"profile" | "login" | null>(null);
  const [eleeGreetingVisible, setEleeGreetingVisible] = useState(false);
  const [, setLocation] = useLocation();
  const demoMode = isDemoMode();
  const { data: featuredUnis, isLoading: unisLoading } = useGetFeaturedUniversities({
    query: { enabled: !demoMode, queryKey: getGetFeaturedUniversitiesQueryKey() },
  });
  const { data: countries, isLoading: countriesLoading } = useListCountries({
    query: { enabled: !demoMode, queryKey: getListCountriesQueryKey() },
  });

  const apiUnis = listFromApi<University>(featuredUnis);
  const apiCountries = listFromApi<Country>(countries);
  const unis = demoMode || apiUnis.length === 0 ? DEMO_UNIVERSITIES.slice(0, 4) : apiUnis.slice(0, 4);
  const countriesList = demoMode || apiCountries.length === 0 ? DEMO_COUNTRIES.slice(0, 6) : apiCountries.slice(0, 6);
  const createProfileHref = "/dashboard";
  const studentLoginHref = "/dashboard";
  const journeyMapHref = demoMode ? "/login?redirect=/journey-map" : "/sign-up";
  const showUniversitySkeletons = !demoMode && unisLoading;
  const showCountries = demoMode || (!countriesLoading && countriesList.length > 0);

  const openStartDialog = (_mode: "profile" | "login") => {
    setLocation("/dashboard");
    setEleeGreetingVisible(true);
  };

  return (
    <div className="min-h-screen bg-white text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-xl" data-testid="nav-bar">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-3 px-3 sm:h-[112px] sm:px-6 lg:px-8">
          <Link href="/product" data-testid="nav-logo" aria-label="EleevateOverseas product landing">
            <img src={assetUrl("logo.webp")} alt="EleevateOverseas" className="h-20 w-20 rounded-full object-cover shadow-sm ring-1 ring-border sm:h-28 sm:w-28" />
          </Link>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              className="rounded-full px-3 font-serif text-xs sm:px-6 sm:text-sm"
              data-testid="nav-create-profile"
              onClick={() => openStartDialog("profile")}
            >
              Create Profile
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-secondary px-3 font-serif text-xs text-secondary sm:px-6 sm:text-sm"
              data-testid="nav-student-login"
              onClick={() => openStartDialog("login")}
            >
              Student Login
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden bg-secondary text-white" data-testid="hero-section">
          <img
            src={assetUrl("landing-hero.webp")}
            alt="Global study destinations"
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,18,38,0.96)_0%,rgba(11,18,38,0.82)_48%,rgba(11,18,38,0.28)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-secondary to-transparent" />

          <div className="relative mx-auto flex max-w-7xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-12 lg:min-h-[calc(100vh-150px)] lg:px-8 lg:py-14">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/85">
                <span className="h-2 w-2 rounded-full bg-accent" />
                EleevateOverseas Study-Abroad Journey
              </div>
              <p className="mt-7 font-serif text-sm font-extrabold uppercase tracking-[0.18em] text-[#8DE68A]">
                ELEE AI Counsellor
              </p>
              <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.05] text-white md:text-6xl lg:text-[68px]">
                From your first shortlist to your first day on campus and beyond, ELEE is with you.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/82 md:text-lg">
                ELEE AI transforms study-abroad planning into one intelligent, connected journey, guiding you across profile assessment, university discovery, applications, documentation, finance, visa, accommodation, careers, and integrated services.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="rounded-full px-7 font-serif" data-testid="hero-create-profile" onClick={() => openStartDialog("profile")}>
                  Create Profile <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="rounded-full border-white/45 bg-white/10 px-7 font-serif text-white hover:bg-white hover:text-foreground" data-testid="hero-student-login" onClick={() => openStartDialog("login")}>
                  Student Login
                </Button>
              </div>

              <div className="mt-8 overflow-hidden rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <svg viewBox="0 0 760 110" className="h-24 w-full" aria-label="AI journey route ribbon">
                  <path d="M18 72 C135 24 205 24 298 66 S480 110 560 54 S682 18 742 44" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="18" strokeLinecap="round" />
                  <path d="M18 72 C135 24 205 24 298 66 S480 110 560 54 S682 18 742 44" fill="none" stroke="#102044" strokeWidth="10" strokeLinecap="round" />
                  <path d="M300 66 C400 102 474 102 560 54" fill="none" stroke="#C9784A" strokeWidth="5" strokeLinecap="round" />
                  {["Profile", "Psychometric", "Shortlist", "Apply", "Finance", "Career"].map((label, index) => {
                    const x = [20, 165, 300, 445, 560, 720][index];
                    const y = [72, 35, 66, 88, 54, 44][index];
                    return (
                      <g key={label}>
                        <circle cx={x} cy={y} r="13" fill="#ffffff" />
                        <circle cx={x} cy={y} r="6" fill={index === 3 ? "#C9784A" : "#39B54A"} />
                        <text x={x} y={y - 22} textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">{label}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            <div className="mt-9 grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-4" aria-label="Eleevate proof points">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-white/16 bg-white/10 p-4 backdrop-blur-md">
                  <div className="font-serif text-2xl font-bold text-white md:text-3xl">{stat.value}</div>
                  <div className="mt-2 text-xs font-medium leading-5 text-white/72">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="product-modules" className="px-4 py-16 sm:px-6 lg:px-8" data-testid="product-modules-section">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <div className="eyebrow">Your student journey</div>
              <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">
                Everything you need to move from confusion to campus.
              </h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">
                ELEE keeps your profile, evaluation, shortlist, applications, documents, finance, visa, accommodation, and career preparation in one guided journey.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {PRODUCT_MODULES.map((module, index) => {
                const ModuleIcon = module.icon;
                const isFlipped = flippedModule === module.title;

                return (
                  <div
                    key={module.title}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isFlipped}
                    className="group min-h-[500px] cursor-pointer [perspective:1400px] xl:min-h-[520px]"
                    onClick={() => setFlippedModule(isFlipped ? null : module.title)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setFlippedModule(isFlipped ? null : module.title);
                      }
                    }}
                  >
                    <div className={`relative h-full min-h-[500px] rounded-lg transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] xl:min-h-[520px] ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}>
                      <Card className={`absolute inset-0 overflow-hidden border-border p-0 shadow-md [backface-visibility:hidden] ${module.soft}`}>
                        <div className="h-2" style={{ background: module.gradient }} />
                        <div className="flex h-full flex-col p-6">
                          <div className="mb-7 flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg text-white shadow-sm" style={{ background: module.gradient }}>
                                <ModuleIcon className="h-6 w-6" />
                              </div>
                              <div className="font-serif text-4xl font-bold text-foreground/10">{String(index + 1).padStart(2, "0")}</div>
                            </div>
                            <Badge variant="outline" className="rounded-full bg-white/80">{module.meta}</Badge>
                          </div>
                          <h3 className="font-serif text-2xl font-bold leading-tight text-foreground">{module.title}</h3>
                          <p className="mt-4 text-sm leading-6 text-muted-foreground">{module.desc}</p>
                          <div className="mt-auto flex items-center justify-between border-t border-border/70 pt-5">
                            <span className={`text-xs font-bold uppercase tracking-[0.16em] ${module.accent}`}>See how it helps</span>
                            <ArrowRight className={`h-4 w-4 ${module.accent}`} />
                          </div>
                        </div>
                      </Card>

                      <Card
                        className="absolute inset-0 overflow-hidden border-0 p-5 text-white shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-6"
                        style={{ background: module.gradient }}
                      >
                        <div className="flex h-full flex-col">
                          <div className="flex items-start justify-between gap-4">
                            <div className="rounded-full border border-white/22 bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white/82">
                              ELEE helps you
                            </div>
                            <ModuleIcon className="h-7 w-7 text-white" />
                          </div>
                          <h3 className="mt-6 font-serif text-2xl font-bold leading-tight">{module.title}</h3>
                          <p className="mt-3 text-sm leading-6 text-white/86">{module.proof}</p>
                          <div className="mt-5 space-y-2">
                            {module.updates.map((update) => (
                              <div key={update} className="flex items-center gap-3 rounded-lg border border-white/14 bg-white/12 px-3 py-2 text-sm font-semibold text-white">
                                <BadgeCheck className="h-4 w-4 flex-shrink-0 text-white" />
                                {update}
                              </div>
                            ))}
                          </div>
                          <div className="mt-auto rounded-lg border border-white/14 bg-white/12 p-3 text-xs leading-5 text-white/82">
                            Tap or press Enter again to return.
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {showCountries && (
          <section className="bg-[#F7FBFF] px-4 py-16 sm:px-6 lg:px-8" data-testid="countries-section">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="max-w-3xl">
                  <div className="eyebrow">Destinations</div>
                  <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">
                    Choose your destination with clarity.
                  </h2>
                  <p className="mt-4 text-base leading-8 text-muted-foreground">
                    ELEE helps you compare countries based on your profile, budget, visa path, city preferences, application readiness, and career goals, so every study-abroad decision feels more confident.
                  </p>
                </div>
                <Link href="/countries">
                  <Button variant="outline" className="rounded-full border-secondary px-6 font-serif text-secondary">
                    Explore destinations <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {countriesList.map((country) => {
                  const insight = COUNTRY_ROUTE_INSIGHTS[country.code] ?? {
                    budget: "Profile based",
                    visa: "Review",
                    cities: "Top student cities",
                    bestFor: "Route fit",
                    intake: "Next intake",
                  };

                  return (
                    <Link href="/countries" key={country.code} data-testid={`country-chip-${country.code}`}>
                      <Card className="app-card group h-full overflow-hidden p-0 transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-md">
                        <div className="h-1.5 bg-[linear-gradient(90deg,#102044_0%,#102044_55%,#C9784A_55%,#C9784A_72%,#39B54A_72%,#39B54A_100%)]" />
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-5">
                            <div className="min-w-0">
                              <div className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Public route signals</div>
                              <h3 className="mt-2 font-serif text-2xl font-bold leading-tight text-foreground">{country.name}</h3>
                              <p className="mt-2 text-sm text-muted-foreground">{insight.bestFor} · {insight.intake}</p>
                            </div>
                            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-white shadow-sm">
                              <img
                                src={COUNTRY_VISUALS[country.code] ?? `https://flagcdn.com/w160/${country.code.toLowerCase()}.png`}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </div>

                          <div className="mt-6">
                            <div className="flex items-end justify-between gap-4">
                              <div>
                                <div className="font-serif text-2xl font-bold text-foreground">Calculate after profile</div>
                                <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">ELEE match pending</div>
                              </div>
                              <Badge className="rounded-full bg-secondary text-white hover:bg-secondary">{insight.visa} visa signal</Badge>
                            </div>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                              <div className="h-full w-2/5 rounded-full bg-[linear-gradient(90deg,#102044,#C9784A)]" />
                            </div>
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-3">
                            <div className="rounded-lg border border-border bg-[#F7FBFF] p-3">
                              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Budget</div>
                              <div className="mt-1 font-serif text-sm font-bold text-foreground">{insight.budget}</div>
                            </div>
                            <div className="rounded-lg border border-border bg-[#F7FBFF] p-3">
                              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">City guide</div>
                              <div className="mt-1 font-serif text-sm font-bold text-foreground">{insight.cities}</div>
                            </div>
                          </div>

                          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                            <span className="text-xs font-semibold text-muted-foreground">Open country route</span>
                            <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section id="live-updates" className="px-4 py-16 sm:px-6 lg:px-8" data-testid="live-update-section">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <div className="eyebrow">ELEE AI Counsellor</div>
                <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">
                  What does ELEE do for you?
                </h2>
                <p className="mt-5 text-base leading-8 text-muted-foreground">
                  ELEE is your study-abroad buddy. It helps you understand yourself, choose better-fit destinations, prepare stronger applications, improve your writing, practice interviews, connect with counsellors and service partners, and keep every next step visible.
                </p>
                <p className="mt-4 text-base leading-8 text-muted-foreground">
                  The more you use it, the more personal it becomes: matching your personality, your writing style, your academic background, your finance situation, and your career ambition.
                </p>
                <div className="mt-6 grid max-w-xl grid-cols-2 gap-3">
                  {[
                    ["Profile", "Personal path"],
                    ["Writing", "SOP + LOR support"],
                    ["Interview", "Practice with feedback"],
                    ["Connections", "Counsellors + companies"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-border bg-[#F7FBFF] p-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                        {label}
                      </div>
                      <div className="mt-2 font-serif text-sm font-bold text-foreground">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button className="rounded-full px-6 font-serif" onClick={() => openStartDialog("profile")}>Create Profile</Button>
                  <Button variant="outline" className="rounded-full border-secondary px-6 font-serif text-secondary" onClick={() => openStartDialog("login")}>Student Login</Button>
                </div>
              </div>

              <div className="grid gap-3">
                {LIVE_UPDATES.map((item) => {
                  const UpdateIcon = item.icon;

                  return (
                    <div key={item.number} className={`group grid gap-4 rounded-lg border border-border bg-gradient-to-br ${item.tone} p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md sm:grid-cols-[84px_minmax(0,1fr)]`}>
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-lg bg-white shadow-sm">
                        <div className="absolute -right-2 -top-2 rounded-full bg-secondary px-2 py-1 font-serif text-[10px] font-bold text-white">
                          {item.number}
                        </div>
                        <div className="brand-gradient-bg flex h-11 w-11 items-center justify-center rounded-lg text-white">
                          <UpdateIcon className="h-5 w-5" />
                        </div>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="rounded-full bg-white/80">
                            {item.surface}
                          </Badge>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold text-primary">
                            <Activity className="h-3 w-3" />
                            {item.event}
                          </span>
                        </div>
                        <h3 className="mt-3 font-serif text-xl font-bold text-foreground">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/80">
                          <div className="brand-gradient-bg h-full w-3/4 rounded-full transition-all group-hover:w-full" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 sm:px-6 lg:px-8" data-testid="journey-section">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <div className="eyebrow">Journey stages</div>
                <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">
                  A simpler path from profile to career.
                </h2>
                <p className="mt-4 text-base leading-8 text-muted-foreground">
                  Each stage gives the student one clear job, one set of requirements, and one next action, so the journey feels guided instead of overwhelming.
                </p>
              </div>
              <Link href={journeyMapHref}>
                <Button variant="outline" className="rounded-full border-secondary px-6 font-serif text-secondary">
                  Open journey map <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-lg border border-border bg-[#F7FBFF] p-4 shadow-sm sm:p-5">
                <div className="mb-4 hidden grid-cols-[88px_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1fr)_150px] gap-3 px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground lg:grid">
                  <div>Step</div>
                  <div>Student action</div>
                  <div>ELEE helps with</div>
                  <div>Required</div>
                  <div>Outcome</div>
                </div>

                <div className="space-y-4">
                  {JOURNEY_MAP_STAGES.map((stage, index) => (
                    <div key={stage.id} className="group relative overflow-hidden rounded-lg border border-border bg-white p-4 shadow-sm transition-all hover:border-primary/35 hover:shadow-md">
                      {index < JOURNEY_MAP_STAGES.length - 1 && (
                        <div className="absolute left-8 top-[72px] hidden h-[calc(100%+18px)] w-px bg-border lg:block" />
                      )}
                      <div className="grid gap-4 lg:grid-cols-[88px_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1fr)_150px] lg:items-start">
                        <div className="flex items-start justify-between gap-3 lg:block">
                          <div className="brand-gradient-bg relative z-10 flex h-12 w-12 items-center justify-center rounded-lg font-serif text-sm font-bold text-white">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                          <Badge variant="outline" className="rounded-full lg:mt-4">{stage.status}</Badge>
                        </div>

                        <div>
                          <div className="font-serif text-lg font-bold leading-tight text-foreground">{stage.phase}</div>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{stage.student}</p>
                        </div>

                        <div className="rounded-lg border border-primary/15 bg-primary/5 p-3">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-primary">ELEE helps with</div>
                          <p className="mt-2 text-xs leading-5 text-foreground">{stage.automation}</p>
                        </div>

                        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-accent">Required</div>
                          <p className="mt-2 text-xs leading-5 text-foreground">{stage.handoff}</p>
                        </div>

                        <div className="rounded-lg border border-border bg-white p-3">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Impact</div>
                          <div className="mt-2 font-serif text-sm font-bold leading-5 text-foreground">{stage.impact}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-lg border border-border bg-secondary p-5 text-white shadow-sm">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#8DE68A]">ELEE stays with you</div>
                <h3 className="mt-3 font-serif text-2xl font-bold leading-tight">Your next step should always feel obvious.</h3>
                <p className="mt-4 text-sm leading-7 text-white/72">
                  ELEE keeps track of what you have done, what is missing, what needs expert review, and what you should handle next.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    ["Profile", "Academics, tests, goals, budget"],
                    ["Report", "Psychometric fit and route clarity"],
                    ["Applications", "Deadlines, SOP, LOR, offers"],
                    ["Finance", "Loans, scholarships, forex, insurance"],
                  ].map(([label, detail]) => (
                    <div key={label} className="rounded-lg border border-white/12 bg-white/[0.08] p-3">
                      <div className="font-serif text-sm font-bold text-white">{label}</div>
                      <div className="mt-1 text-xs leading-5 text-white/65">{detail}</div>
                    </div>
                  ))}
                </div>

                <Link href={journeyMapHref}>
                  <Button className="mt-6 w-full rounded-full bg-white font-serif text-secondary hover:bg-white/90">
                    Open Journey Map <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </aside>
            </div>
          </div>
        </section>

        <section className="bg-[#F7FBFF] px-4 py-16 sm:px-6 lg:px-8" data-testid="featured-universities-section">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="eyebrow">University discovery</div>
                <h2 className="mt-2 font-serif text-3xl font-bold text-foreground">World-class universities, clearer decisions.</h2>
                <p className="mt-2 text-muted-foreground">Explore institutions with fit, cost, application readiness, and outcome signals.</p>
              </div>
              <Link href="/universities" data-testid="view-all-universities">
                <Button variant="outline" className="rounded-full border-secondary px-6 font-serif text-secondary">View all <ArrowRight className="h-3.5 w-3.5" /></Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {showUniversitySkeletons
                ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="space-y-3 p-5">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </Card>
                ))
                : unis.map((uni) => (
                  <Link href={`/universities/${uni.id}`} key={uni.id} data-testid={`uni-card-${uni.id}`}>
                    <Card className="app-card h-full cursor-pointer p-5 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
                      <div className="flex items-start gap-4">
                        <UniversityLogo name={uni.name} website={uni.website} className="h-14 w-14" imageClassName="h-10 w-10" />
                        <div className="min-w-0">
                          <div className="font-serif text-lg font-bold leading-tight text-foreground">{uni.name}</div>
                          <div className="mt-2 text-sm text-muted-foreground">{uni.city}, {uni.country}</div>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Badge className="rounded-full bg-secondary text-white hover:bg-secondary">ELEE Match pending</Badge>
                        {uni.ranking && <Badge variant="outline">#{uni.ranking} QS</Badge>}
                        {uni.programCount && <Badge variant="outline">{uni.programCount}+ programs</Badge>}
                      </div>
                    </Card>
                  </Link>
                ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8" data-testid="elee-intents-section">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <div className="eyebrow">Student dashboard</div>
              <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">
                Your dashboard should feel like a command center for one student.
              </h2>
              <p className="mt-5 text-base leading-8 text-muted-foreground">
                The student does not need every module at once. They need the right next action, clear notifications, counsellor access, chats, requests, connections, test prep, SOP drafting, scholarships, loans, and interview preparation in one calm place.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button className="rounded-full px-6 font-serif" onClick={() => openStartDialog("profile")}>Create Profile</Button>
                <Button variant="outline" className="rounded-full border-secondary px-6 font-serif text-secondary" onClick={() => openStartDialog("login")}>Student Login</Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {DASHBOARD_ACTIONS.map((action) => (
                <div key={action} className="group rounded-lg border border-border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-serif text-base font-bold text-foreground">{action}</div>
                    <div className="brand-gradient-bg flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white">
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-secondary px-4 py-16 text-white sm:px-6 lg:px-8" data-testid="services-section">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 max-w-3xl">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#8DE68A]">Services</div>
              <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-5xl">Support for the moments students usually handle alone.</h2>
              <p className="mt-4 text-base leading-8 text-white/72">
                ELEE keeps the journey practical by connecting guidance, test prep, finance, documents, interviews, and career readiness to the stage the student is actually in.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {SERVICES.map((service) => (
                <div key={service.title} className="rounded-lg border border-white/12 bg-white/[0.08] p-5">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <Badge className="bg-white text-secondary hover:bg-white">{service.phase}</Badge>
                    <service.icon className="h-5 w-5 text-[#8DE68A]" />
                  </div>
                  <div className="font-serif text-lg font-bold">{service.title}</div>
                  <p className="mt-3 text-sm leading-6 text-white/70">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8" data-testid="cta-section">
          <div className="mx-auto max-w-4xl text-center">
            <BadgeCheck className="mx-auto h-10 w-10 text-accent" />
            <h2 className="mt-5 font-serif text-4xl font-bold text-foreground">Ready to write your future?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Start with your profile, meet ELEE, and move through the study-abroad journey with clearer decisions at every step.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="rounded-full px-8 font-serif" data-testid="cta-create-profile" onClick={() => openStartDialog("profile")}>Create Profile</Button>
              <Button variant="outline" size="lg" className="rounded-full border-secondary px-8 font-serif text-secondary" onClick={() => openStartDialog("login")}>Student Login</Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white px-4 py-10 sm:px-6 lg:px-8" data-testid="footer">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <img src={assetUrl("logo.webp")} alt="EleevateOverseas" className="h-24 w-24 rounded-full object-cover shadow-sm ring-1 ring-border" />
          <div className="text-center font-serif text-sm font-bold text-[#637199]">ELEE is with you from profile to arrival.</div>
          <div className="text-xs text-muted-foreground">2026 EleevateOverseas. Write Your Future.</div>
        </div>
      </footer>

      {startDialog && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-secondary/70 px-4 py-6 backdrop-blur-sm" data-testid="elee-start-popup">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="brand-gradient-bg px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">ELEE AI Counsellor</div>
                  <h2 className="mt-2 font-serif text-3xl font-bold leading-tight">Hi, I am ELEE. Let us start your journey.</h2>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white hover:text-secondary"
                  onClick={() => setStartDialog(null)}
                >
                  Close
                </Button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-base leading-7 text-muted-foreground">
                I will help you create your student file, understand your profile, compare countries and courses, prepare applications, track documents, plan finance, and get ready for interviews and arrival.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link href={createProfileHref} data-testid="popup-create-profile">
                  <div className="group h-full rounded-lg border border-primary/20 bg-[#F7FBFF] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-serif text-lg font-bold text-foreground">Create your profile</div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">Start with academics, goals, budget, tests, intake, and sponsor details.</p>
                      </div>
                      <ArrowRight className="mt-1 h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>

                <Link href={studentLoginHref} data-testid="popup-student-login">
                  <div className="group h-full rounded-lg border border-accent/20 bg-[#ECFFF2] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-serif text-lg font-bold text-foreground">Student login</div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">Return to your dashboard, chats, requests, applications, and next actions.</p>
                      </div>
                      <ArrowRight className="mt-1 h-5 w-5 text-accent transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </div>

              <div className="mt-5 rounded-lg border border-border bg-[#fffaf2] p-4">
                <div className="font-serif text-sm font-bold text-foreground">First, I will ask a few simple questions.</div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Then I will move to the right side of your screen as your journey buddy, ready whenever you need help.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {eleeGreetingVisible && !startDialog && (
        <div className="fixed bottom-24 right-5 z-[70] max-w-[300px] rounded-lg border border-primary/20 bg-white p-4 shadow-xl" data-testid="elee-greeting-bubble">
          <div className="flex items-start gap-3">
            <div className="brand-gradient-bg flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-serif text-sm font-bold text-foreground">ELEE is here.</div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Open the guide whenever you want help with your next study-abroad step.</p>
            </div>
          </div>
        </div>
      )}
      <EleeBuddy />
    </div>
  );
}
