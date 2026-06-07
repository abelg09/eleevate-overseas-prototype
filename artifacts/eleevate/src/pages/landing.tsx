import { useState } from "react";
import {
  getGetFeaturedUniversitiesQueryKey,
  getListCountriesQueryKey,
  useGetFeaturedUniversities,
  useListCountries,
} from "@workspace/api-client-react";
import type { Country, University } from "@workspace/api-client-react";
import { Link } from "wouter";
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
  ShieldCheck,
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
import { DEMO_AGENT_PROMPTS } from "@/lib/demo-journey";
import { assetUrl } from "@/lib/utils";

const STATS = [
  { value: "2 Apps", label: "Student + consultant" },
  { value: "7 Hubs", label: "Guided student lifecycle" },
  { value: "1 Ledger", label: "Finance and service sync" },
  { value: "ELEE AI", label: "Profile-led recommendations" },
];

const PRODUCT_MODULES = [
  {
    title: "Student Journey OS",
    desc: "Dashboard, profile, shortlist, applications, document vault, visa center, city guides, support, and rewards.",
    meta: "Student app",
    icon: LayoutDashboard,
    gradient: "linear-gradient(135deg, #009FE3 0%, #1AB7CF 48%, #3AAA35 100%)",
    soft: "bg-[#EAF8FF]",
    accent: "text-[#009FE3]",
    proof: "Actions create visible journey state across dashboard, applications, documents, and next best action.",
    updates: ["Profile status", "Shortlist tasks", "Visa timeline"],
  },
  {
    title: "ELEE Clarity Report",
    desc: "Readiness score, route decision, profile blockers, family readiness, financial gap, and action plan.",
    meta: "AI report",
    icon: FileSearch,
    gradient: "linear-gradient(135deg, #172A5A 0%, #285BD8 48%, #009FE3 100%)",
    soft: "bg-[#EEF5FF]",
    accent: "text-[#285BD8]",
    proof: "The report updates whenever country, course, finance, or document evidence changes.",
    updates: ["Route decision", "Funding gap", "Family readiness"],
  },
  {
    title: "Consultant Workbench",
    desc: "CRM, counselling queue, SOP/LOR/resume flow, document review, team tasks, partners, and invoicing.",
    meta: "Team ops",
    icon: BriefcaseBusiness,
    gradient: "linear-gradient(135deg, #402B74 0%, #7C55C7 48%, #009FE3 100%)",
    soft: "bg-[#F5F0FF]",
    accent: "text-[#6B4BB7]",
    proof: "Student actions become counsellor queues, review stages, interview prep, and partner follow-ups.",
    updates: ["Daily queue", "Document review", "Offer tracking"],
  },
  {
    title: "Unified Finance Ledger",
    desc: "Edu loans, remittance, forex card, forex, insurance, accommodation, and service commission events.",
    meta: "Revenue layer",
    icon: WalletCards,
    gradient: "linear-gradient(135deg, #0B3A4B 0%, #009FE3 45%, #F6A623 100%)",
    soft: "bg-[#FFF7E8]",
    accent: "text-[#C77700]",
    proof: "Service actions create student status updates and consultant-facing revenue/commission events.",
    updates: ["Loan event", "Forex card", "Insurance status"],
  },
];

const LIVE_UPDATES = [
  {
    number: "01",
    title: "Profile turns into clarity",
    desc: "ELEE reads academics, budget, goals, family readiness, test status, and risk signals.",
    icon: UserRound,
    surface: "ELEE report",
    event: "Readiness score recalculated",
    tone: "from-[#EAF8FF] to-[#ECFFF2]",
  },
  {
    number: "02",
    title: "Shortlist starts the workflow",
    desc: "A saved university creates application tasks, document requests, and consultant follow-up.",
    icon: GraduationCap,
    surface: "Applications",
    event: "Application packet opened",
    tone: "from-[#ECFFF2] to-[#F5F0FF]",
  },
  {
    number: "03",
    title: "Finance becomes a ledger",
    desc: "Loan, forex, insurance, remittance, and accommodation actions update student and consultant views.",
    icon: Landmark,
    surface: "Unified ledger",
    event: "Service revenue event queued",
    tone: "from-[#FFF7E8] to-[#EAF8FF]",
  },
  {
    number: "04",
    title: "Counsellors get the handoff",
    desc: "Daily queues show pending approvals, blockers, revenue events, and next best action.",
    icon: ClipboardCheck,
    surface: "Workbench",
    event: "Counsellor task assigned",
    tone: "from-[#F5F0FF] to-[#EEF5FF]",
  },
];

const JOURNEY_MAP_STAGES = [
  {
    id: "smart-start",
    phase: "Smart Start",
    status: "Live",
    student: "Creates profile, selects level, destination intent, budget, tests, and timeline.",
    automation: "ELEE generates readiness score, likely routes, first task queue, and family checklist.",
    handoff: "Counsellor sees priority, blockers, preferred countries, and first call agenda.",
    impact: "Profile ledger opened",
  },
  {
    id: "country-fit",
    phase: "Country Fit",
    status: "Live",
    student: "Compares Canada, UK, USA, Australia, Germany, and Netherlands with practical signals.",
    automation: "Budget, visa, city, employability, and intake signals update the route decision.",
    handoff: "Team gets a country-specific counselling script and risk notes.",
    impact: "Route readiness pending",
  },
  {
    id: "shortlist-apply",
    phase: "Shortlist to Apply",
    status: "Build",
    student: "Saves universities and opens program-level application flows.",
    automation: "Saved universities create applications, deadlines, document requests, and SOP prompts.",
    handoff: "Consultant receives review queue, university communication tasks, and offer-tracking stage.",
    impact: "Application pipeline created",
  },
  {
    id: "documents-visa",
    phase: "Documents & Visa",
    status: "Build",
    student: "Uploads marksheets, passport, finance proof, SOP/LOR/resume, and visa files.",
    automation: "Validation checks missing fields, country rules, sponsor proof, and interview readiness.",
    handoff: "Document reviewer approves packets and flags visa strategy blockers.",
    impact: "Readiness score changes",
  },
  {
    id: "finance-services",
    phase: "Finance & Services",
    status: "Preview",
    student: "Applies for loan, remittance, forex card, insurance, accommodation, and subscriptions.",
    automation: "Every service action writes a student-facing status and consultant commission event.",
    handoff: "Finance owner sees lender/service status, payout estimate, and pending follow-up.",
    impact: "Unified ledger updated",
  },
  {
    id: "arrival-alumni",
    phase: "Arrival & Alumni",
    status: "Preview",
    student: "Completes pre-departure, travel, city setup, alumni network, careers, and referrals.",
    automation: "Post-visa tasks, alumni groups, job board prompts, and rewards continue after arrival.",
    handoff: "Customer success tracks advocacy, success stories, referrals, and alumni outcomes.",
    impact: "Lifetime journey continues",
  },
];

const SERVICES = [
  { icon: MessageCircle, phase: "Guidance", title: "Counselling", desc: "Personalized student and family guidance from profile to departure." },
  { icon: ShieldCheck, phase: "Risk", title: "Visa Strategy", desc: "Document readiness, financial proof, interview prep, and route confidence." },
  { icon: BookOpenCheck, phase: "Growth", title: "Upskilling", desc: "IELTS, TOEFL, GRE, GMAT, mock tests, LMS, and skill progress insights." },
  { icon: Users, phase: "Ops", title: "Consultant OS", desc: "CRM, document review, SOP workflow, invoicing, team tasks, and partner tools." },
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
  const primaryCtaHref = demoMode ? "/login?redirect=/dashboard" : "/sign-up";
  const consultantHref = demoMode ? "/login?redirect=/consultant/dashboard" : "/sign-in";
  const journeyMapHref = demoMode ? "/login?redirect=/journey-map" : "/sign-up";
  const showUniversitySkeletons = !demoMode && unisLoading;
  const showCountries = demoMode || (!countriesLoading && countriesList.length > 0);

  return (
    <div className="min-h-screen bg-white text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-xl" data-testid="nav-bar">
        <div className="mx-auto flex h-[132px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/product" data-testid="nav-logo" aria-label="EleevateOverseas product landing">
            <img src={assetUrl("logo.webp")} alt="EleevateOverseas" className="h-28 w-28 rounded-full object-cover shadow-sm ring-1 ring-border" />
          </Link>
          <div className="hidden items-center gap-7 font-serif text-sm font-bold text-[#637199] lg:flex">
            <a href="#product-modules" className="transition-colors hover:text-foreground">Product</a>
            <a href="#entry" className="transition-colors hover:text-foreground">Entry</a>
            <a href="#live-updates" className="transition-colors hover:text-foreground">Autonomy</a>
            <Link href={journeyMapHref} className="transition-colors hover:text-foreground">Journey OS</Link>
            <Link href="/elee-report" className="transition-colors hover:text-foreground">ELEE Report</Link>
            <Link href="/consultant/dashboard" className="transition-colors hover:text-foreground">Consultants</Link>
          </div>
          <Link href={primaryCtaHref} data-testid="nav-get-started">
            <Button className="rounded-full px-6 font-serif">Start AI-guided portal</Button>
          </Link>
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
                EleevateOverseas Journey OS
              </div>
              <p className="mt-7 font-serif text-sm font-extrabold uppercase tracking-[0.18em] text-[#8DE68A]">
                Autonomous OS
              </p>
              <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.05] text-white md:text-6xl lg:text-[68px]">
                A global study-abroad operating system that starts blank and learns from every action.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/82 md:text-lg">
                ELEE AI turns profile, assessment, university discovery, applications, documents, visa, finance, services, and consultant operations into one connected journey without prefilled student assumptions.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={primaryCtaHref} data-testid="hero-cta-primary">
                  <Button size="lg" className="rounded-full px-7 font-serif">
                    Start AI-guided portal <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={consultantHref} data-testid="hero-cta-secondary">
                  <Button variant="outline" size="lg" className="rounded-full border-white/45 bg-white/10 px-7 font-serif text-white hover:bg-white hover:text-foreground">
                    View consultant command center
                  </Button>
                </Link>
              </div>

              <div className="mt-8 overflow-hidden rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <svg viewBox="0 0 760 110" className="h-24 w-full" aria-label="AI journey route ribbon">
                  <path d="M18 72 C135 24 205 24 298 66 S480 110 560 54 S682 18 742 44" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="18" strokeLinecap="round" />
                  <path d="M18 72 C135 24 205 24 298 66 S480 110 560 54 S682 18 742 44" fill="none" stroke="#102044" strokeWidth="10" strokeLinecap="round" />
                  <path d="M300 66 C400 102 474 102 560 54" fill="none" stroke="#C9784A" strokeWidth="5" strokeLinecap="round" />
                  {["Profile", "Match", "Apply", "Docs", "Finance", "Arrive"].map((label, index) => {
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

        <section id="entry" className="border-b border-border bg-[#fffaf2] px-4 py-8 sm:px-6 lg:px-8" data-testid="entry-section">
          <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
            <div className="rounded-lg border border-[#ead8c4] bg-white p-5 shadow-sm">
              <div className="eyebrow text-[#a85f36]">Blank-safe entry</div>
              <h2 className="mt-2 font-serif text-2xl font-bold leading-tight text-foreground">Start with no assumptions, then let actions create the journey.</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Student-owned data stays empty until the student completes profile, takes the assessment, shortlists universities, uploads documents, or requests finance/services.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: "Student AI workspace", detail: "Enter the blank student OS and let ELEE guide profile, report, university fit, applications, docs, visa, and finance.", href: primaryCtaHref, meta: "Student" },
                { label: "Consultant command center", detail: "Review how student actions become operational tasks, revenue events, document queues, and follow-up work.", href: consultantHref, meta: "Advisor" },
              ].map((tile) => (
                <Link key={tile.label} href={tile.href} data-testid={`entry-tile-${tile.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className="group h-full rounded-lg border border-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{tile.meta}</div>
                        <h3 className="mt-2 font-serif text-xl font-bold text-foreground">{tile.label}</h3>
                      </div>
                      <ArrowRight className="mt-1 h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{tile.detail}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="product-modules" className="px-4 py-16 sm:px-6 lg:px-8" data-testid="product-modules-section">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <div className="eyebrow">Autonomous architecture</div>
              <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">
                One connected OS, four visible proof layers.
              </h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">
                The AI version shows how student experience, ELEE intelligence, consultant workflow, and monetizable services stay connected without preloading private student values.
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
                    className="group min-h-[390px] cursor-pointer [perspective:1400px]"
                    onClick={() => setFlippedModule(isFlipped ? null : module.title)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setFlippedModule(isFlipped ? null : module.title);
                      }
                    }}
                  >
                    <div className={`relative h-full min-h-[390px] rounded-lg transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}>
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
                            <span className={`text-xs font-bold uppercase tracking-[0.16em] ${module.accent}`}>Flip for proof</span>
                            <ArrowRight className={`h-4 w-4 ${module.accent}`} />
                          </div>
                        </div>
                      </Card>

                      <Card
                        className="absolute inset-0 overflow-hidden border-0 p-6 text-white shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]"
                        style={{ background: module.gradient }}
                      >
                        <div className="flex h-full flex-col">
                          <div className="flex items-start justify-between gap-4">
                            <div className="rounded-full border border-white/22 bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white/82">
                              Product proof
                            </div>
                            <ModuleIcon className="h-7 w-7 text-white" />
                          </div>
                          <h3 className="mt-7 font-serif text-2xl font-bold leading-tight">{module.title}</h3>
                          <p className="mt-4 text-sm leading-6 text-white/82">{module.proof}</p>
                          <div className="mt-6 space-y-2">
                            {module.updates.map((update) => (
                              <div key={update} className="flex items-center gap-3 rounded-lg border border-white/14 bg-white/12 px-3 py-2 text-sm font-semibold text-white">
                                <BadgeCheck className="h-4 w-4 flex-shrink-0 text-white" />
                                {update}
                              </div>
                            ))}
                          </div>
                          <div className="mt-auto rounded-lg border border-white/14 bg-white/12 p-3 text-xs leading-5 text-white/76">
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
                  <div className="eyebrow">Route intelligence</div>
                  <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">
                    Destination discovery becomes a product workflow.
                  </h2>
                  <p className="mt-4 text-base leading-8 text-muted-foreground">
                    Country discovery becomes practical once ELEE connects route fit with budgets, city guides, visa signals, and application readiness.
                  </p>
                </div>
                <Link href="/countries">
                  <Button variant="outline" className="rounded-full border-secondary px-6 font-serif text-secondary">
                    Compare countries <ArrowRight className="h-3.5 w-3.5" />
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
                <div className="eyebrow">Autonomous proof</div>
                <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">
                  Every action changes the journey, not just the screen.
                </h2>
                <p className="mt-5 text-base leading-8 text-muted-foreground">
                  This is the product promise: ELEE AI is the guidance layer, and the Journey OS proves itself when each action updates reports, applications, finance, and counsellor operations.
                </p>
                <div className="mt-6 grid max-w-xl grid-cols-2 gap-3">
                  {[
                    ["Live state", "Student + team"],
                    ["Ledger sync", "Finance + services"],
                    ["AI handoff", "ELEE + counsellor"],
                    ["Proof trail", "Every decision"],
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
                  <Link href="/elee-report">
                    <Button className="rounded-full px-6 font-serif">Open ELEE Report</Button>
                  </Link>
                  <Link href="/consultant/dashboard">
                    <Button variant="outline" className="rounded-full border-secondary px-6 font-serif text-secondary">Consultant view</Button>
                  </Link>
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
                <div className="eyebrow">Journey map</div>
                <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">
                  One map from first intent to alumni advocacy.
                </h2>
                <p className="mt-4 text-base leading-8 text-muted-foreground">
                  The map shows what the student does, what ELEE updates, where the consultant steps in, and which ledger/status event changes in the background.
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
                  <div>ELEE automation</div>
                  <div>Consultant handoff</div>
                  <div>Status impact</div>
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
                          <div className="text-[10px] font-bold uppercase tracking-wide text-primary">ELEE updates</div>
                          <p className="mt-2 text-xs leading-5 text-foreground">{stage.automation}</p>
                        </div>

                        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-accent">Team handoff</div>
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
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#8DE68A]">Map logic</div>
                <h3 className="mt-3 font-serif text-2xl font-bold leading-tight">The journey is not a checklist. It is a state engine.</h3>
                <p className="mt-4 text-sm leading-7 text-white/72">
                  Each stage changes multiple product surfaces: the student dashboard, ELEE report, application tracker, consultant queue, and unified ledger.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    ["Report", "Score, blockers, route decision"],
                    ["Applications", "Deadlines, university tasks, offers"],
                    ["Documents", "Validation, missing proof, review status"],
                    ["Ledger", "Loan, forex, insurance, remittance events"],
                  ].map(([label, detail]) => (
                    <div key={label} className="rounded-lg border border-white/12 bg-white/[0.08] p-3">
                      <div className="font-serif text-sm font-bold text-white">{label}</div>
                      <div className="mt-1 text-xs leading-5 text-white/65">{detail}</div>
                    </div>
                  ))}
                </div>

                <Link href={journeyMapHref}>
                  <Button className="mt-6 w-full rounded-full bg-white font-serif text-secondary hover:bg-white/90">
                    Open full Journey OS <ArrowRight className="h-3.5 w-3.5" />
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
              <div className="eyebrow">ELEE AI counsellor</div>
              <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">
                Start with a student question. End with a changed plan.
              </h2>
              <p className="mt-5 text-base leading-8 text-muted-foreground">
                Inspired by AI buddy patterns, ELEE stays practical: it routes the student into real actions that update the dashboard, report, ledger, and consultant queue.
              </p>
            </div>

            <div className="grid gap-3">
              {DEMO_AGENT_PROMPTS.map((prompt) => (
                <Link key={prompt.id} href={demoMode ? `/login?redirect=${encodeURIComponent(prompt.href)}` : prompt.href}>
                  <div className="group rounded-lg border border-border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-serif text-base font-bold text-foreground">{prompt.label}</div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{prompt.prompt}</p>
                      </div>
                      <ArrowRight className="mt-1 h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-secondary px-4 py-16 text-white sm:px-6 lg:px-8" data-testid="services-section">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 max-w-3xl">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#8DE68A]">Services</div>
              <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-5xl">Everything needed from clarity to arrival.</h2>
              <p className="mt-4 text-base leading-8 text-white/72">
                The public site promise becomes a product workflow: counselling, visa, upskilling, finance, services, and consultant operations.
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
              Start inside a blank AI-guided workspace, then let each real student action create profile clarity, applications, documents, finance status, and consultant handoffs.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={primaryCtaHref} data-testid="cta-get-started">
                <Button size="lg" className="rounded-full px-8 font-serif">Start Your Journey Today</Button>
              </Link>
              <Link href="/consultant/dashboard">
                <Button variant="outline" size="lg" className="rounded-full border-secondary px-8 font-serif text-secondary">Open Consultant OS</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white px-4 py-10 sm:px-6 lg:px-8" data-testid="footer">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <img src={assetUrl("logo.webp")} alt="EleevateOverseas" className="h-24 w-24 rounded-full object-cover shadow-sm ring-1 ring-border" />
          <div className="flex flex-wrap items-center justify-center gap-6 font-serif text-sm font-bold text-[#637199]">
            <Link href="/universities" className="hover:text-foreground">Universities</Link>
            <Link href="/elee-report" className="hover:text-foreground">ELEE Report</Link>
            <Link href="/services" className="hover:text-foreground">Services</Link>
            <Link href="/consultant/dashboard" className="hover:text-foreground">Consultant OS</Link>
          </div>
          <div className="text-xs text-muted-foreground">2026 EleevateOverseas. Write Your Future.</div>
        </div>
      </footer>
      <EleeBuddy />
    </div>
  );
}
