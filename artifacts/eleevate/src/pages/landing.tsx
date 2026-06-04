import {
  getGetFeaturedUniversitiesQueryKey,
  getListCountriesQueryKey,
  useGetFeaturedUniversities,
  useListCountries,
} from "@workspace/api-client-react";
import type { Country, University } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  ArrowRight,
  BadgeCheck,
  BookmarkCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  ClipboardCheck,
  FileCheck2,
  Globe2,
  HandCoins,
  MessagesSquare,
  Plane,
  Send,
  UserRound,
} from "lucide-react";
import { UniversityLogo } from "@/components/common/university-logo";
import { EleeBuddy } from "@/components/common/elee-buddy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DEMO_COUNTRIES, DEMO_UNIVERSITIES } from "@/lib/demo-catalog";
import { isDemoMode, listFromApi } from "@/lib/demo-mode";
import { assetUrl } from "@/lib/utils";

const STATS = [
  { value: "5,000+", label: "Students counselled" },
  { value: "1,200+", label: "Partner universities" },
  { value: "98%", label: "Visa success ratio" },
  { value: "4.7/5", label: "Student rating" },
];

const JOURNEY_STEPS = [
  {
    title: "Profile",
    detail: "Add academics, budget, tests, goals, intake, and family support.",
    action: "Build your student file",
    icon: UserRound,
    tone: "from-sky-500 to-emerald-500",
  },
  {
    title: "ELEE Report",
    detail: "Generate a readable route report with gaps, risks, and next actions.",
    action: "Get your route view",
    icon: ClipboardCheck,
    tone: "from-violet-500 to-sky-500",
  },
  {
    title: "Country & Course Fit",
    detail: "Compare countries, cities, courses, costs, visas, and careers.",
    action: "Choose direction",
    icon: Globe2,
    tone: "from-emerald-500 to-teal-500",
  },
  {
    title: "Shortlist",
    detail: "Save universities that match your profile, budget, and deadline.",
    action: "Save best fits",
    icon: BookmarkCheck,
    tone: "from-amber-500 to-orange-500",
  },
  {
    title: "Applications",
    detail: "Track submissions, requirements, deadlines, offers, and conditions.",
    action: "Submit with clarity",
    icon: Send,
    tone: "from-blue-600 to-indigo-500",
  },
  {
    title: "Documents & Visa",
    detail: "Prepare SOP, LOR, resume, finance proof, and visa checklist early.",
    action: "Upload and verify",
    icon: FileCheck2,
    tone: "from-rose-500 to-red-500",
  },
  {
    title: "Finance & Arrival",
    detail: "Plan loans, remittance, forex, insurance, stay, and arrival.",
    action: "Arrive ready",
    icon: Plane,
    tone: "from-cyan-500 to-green-500",
  },
];

const SUPPORT_AREAS = [
  {
    title: "Counselling",
    detail: "Personal guidance for the student and family from first call to departure.",
    action: "Talk to an advisor",
    icon: MessagesSquare,
    tone: "from-sky-500 to-emerald-500",
  },
  {
    title: "Upskilling",
    detail: "IELTS, TOEFL, GRE, language support, mock tests, and course readiness.",
    action: "Prepare for tests",
    icon: BookOpenCheck,
    tone: "from-violet-500 to-indigo-500",
  },
  {
    title: "Finance",
    detail: "Education loans, remittance, forex card, forex, insurance, and rewards.",
    action: "Plan money steps",
    icon: HandCoins,
    tone: "from-amber-500 to-orange-500",
  },
  {
    title: "Consultant Workbench",
    detail: "A separate advisor view for student queues, documents, SOP review, and applications.",
    action: "For the team",
    icon: BriefcaseBusiness,
    tone: "from-slate-700 to-sky-600",
  },
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

const COUNTRY_ROUTE_INSIGHTS: Record<string, { fit: number; budget: string; cities: string; focus: string }> = {
  CA: { fit: 88, budget: "$38k-$46k", cities: "Toronto, Vancouver", focus: "CS, AI, PGWP" },
  GB: { fit: 84, budget: "$32k-$42k", cities: "London, Manchester", focus: "Fast master's" },
  US: { fit: 81, budget: "$45k-$62k", cities: "Boston, Phoenix", focus: "STEM scale" },
  AU: { fit: 79, budget: "$36k-$48k", cities: "Melbourne, Sydney", focus: "Work rights" },
  DE: { fit: 76, budget: "$18k-$30k", cities: "Munich, Berlin", focus: "Low tuition" },
  NL: { fit: 73, budget: "$28k-$40k", cities: "Delft, Amsterdam", focus: "Applied tech" },
  IE: { fit: 78, budget: "$30k-$44k", cities: "Dublin, Galway", focus: "Tech careers" },
  SG: { fit: 75, budget: "$34k-$50k", cities: "Singapore", focus: "Asia hub" },
};

export default function LandingPage() {
  const demoMode = isDemoMode();
  const { data: featuredUnis, isLoading: unisLoading } = useGetFeaturedUniversities({
    query: { enabled: !demoMode, queryKey: getGetFeaturedUniversitiesQueryKey() },
  });
  const { data: countries, isLoading: countriesLoading } = useListCountries({
    query: { enabled: !demoMode, queryKey: getListCountriesQueryKey() },
  });

  const apiUnis = listFromApi<University>(featuredUnis);
  const apiCountries = listFromApi<Country>(countries);
  const universities = demoMode || apiUnis.length === 0 ? DEMO_UNIVERSITIES.slice(0, 4) : apiUnis.slice(0, 4);
  const countriesList = demoMode || apiCountries.length === 0 ? DEMO_COUNTRIES.slice(0, 6) : apiCountries.slice(0, 6);
  const primaryCtaHref = demoMode ? "/login?redirect=/dashboard" : "/sign-up";
  const consultantHref = demoMode ? "/login?role=consultant&redirect=/consultant/dashboard" : "/sign-in";
  const showCountries = demoMode || (!countriesLoading && countriesList.length > 0);
  const showUniversitySkeletons = !demoMode && unisLoading;

  return (
    <div className="min-h-screen bg-white text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-xl" data-testid="nav-bar">
        <div className="mx-auto flex min-h-24 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/product" data-testid="nav-logo" aria-label="EleevateOverseas">
            <img src={assetUrl("logo.webp")} alt="EleevateOverseas" className="h-20 w-20 object-contain" />
          </Link>
          <div className="hidden items-center gap-7 font-serif text-sm font-bold text-[#637199] lg:flex">
            <a href="#journey" className="transition-colors hover:text-foreground">How It Works</a>
            <a href="#countries" className="transition-colors hover:text-foreground">Countries</a>
            <a href="#universities" className="transition-colors hover:text-foreground">Universities</a>
            <Link href="/elee-report" className="transition-colors hover:text-foreground">ELEE Report</Link>
            <Link href="/login" className="transition-colors hover:text-foreground">Login</Link>
          </div>
          <Link href={primaryCtaHref} data-testid="nav-get-started">
            <Button className="rounded-full px-6 font-serif">Start Student Journey</Button>
          </Link>
        </div>
      </nav>

      <main>
        <section className="relative min-h-[calc(100vh-6rem)] overflow-hidden bg-secondary text-white" data-testid="hero-section">
          <img
            src={assetUrl("landing-hero.webp")}
            alt="Students planning international education"
            className="absolute inset-0 h-full w-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,18,38,0.96)_0%,rgba(11,18,38,0.84)_54%,rgba(11,18,38,0.30)_100%)]" />
          <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <Badge className="rounded-full bg-white px-4 py-2 font-serif text-secondary hover:bg-white">
                Write Your Future
              </Badge>
              <h1 className="mt-6 font-serif text-4xl font-bold leading-[1.04] text-white md:text-6xl lg:text-[68px]">
                Global study-abroad guidance from profile to arrival.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/82 md:text-lg">
                ELEE helps students choose countries, find universities, prepare documents, apply, track visa and finance, and arrive ready.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={primaryCtaHref} data-testid="hero-cta-primary">
                  <Button size="lg" className="rounded-full px-7 font-serif">
                    Start Student Journey <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={consultantHref} data-testid="hero-cta-secondary">
                  <Button variant="outline" size="lg" className="rounded-full border-white/45 bg-white/10 px-7 font-serif text-white hover:bg-white hover:text-foreground">
                    View Consultant Workbench
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-10 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-white/16 bg-white/10 p-4 backdrop-blur-md">
                  <div className="font-serif text-2xl font-bold text-white md:text-3xl">{stat.value}</div>
                  <div className="mt-2 text-xs font-medium leading-5 text-white/72">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="journey" className="px-4 py-16 sm:px-6 lg:px-8" data-testid="journey-section">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <div className="eyebrow">Student Journey</div>
                <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">
                  Seven clear steps from first profile to arrival.
                </h2>
                <p className="mt-4 text-base leading-8 text-muted-foreground">
                  The main portal stays focused on what the student needs to do next. Deeper services are available when needed, without crowding the journey.
                </p>
              </div>
              <Link href="/journey-map">
                <Button variant="outline" className="rounded-full border-secondary px-6 font-serif text-secondary">
                  Open journey checklist <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-7">
              {JOURNEY_STEPS.map((step, index) => {
                const StepIcon = step.icon;

                return (
                  <Card
                    key={step.title}
                    className="group relative h-full min-h-72 overflow-hidden rounded-lg border border-border bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${step.tone}`} />
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br ${step.tone} text-white shadow-sm transition-transform group-hover:scale-105`}>
                        <StepIcon className="h-6 w-6" strokeWidth={2.2} />
                      </div>
                      <div className="rounded-full border border-border bg-muted/40 px-2.5 py-1 font-serif text-[11px] font-bold text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                    </div>
                    <div className="mt-6 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Step {index + 1}</div>
                    <h3 className="mt-2 font-serif text-lg font-bold leading-tight text-foreground">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.detail}</p>
                    <div className="absolute inset-x-4 bottom-4">
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/25 px-3 py-2">
                        <span className="text-[11px] font-semibold text-foreground">{step.action}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {showCountries && (
          <section id="countries" className="bg-[#F7FBFF] px-4 py-16 sm:px-6 lg:px-8" data-testid="countries-section">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="max-w-3xl">
                  <div className="eyebrow">Country Discovery</div>
                  <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">
                    Pick a route with cost, city, visa, and career clarity.
                  </h2>
                  <p className="mt-4 text-base leading-8 text-muted-foreground">
                    Start broad, then choose the destination that fits the student's profile, budget, family readiness, and career plan.
                  </p>
                </div>
                <Link href="/countries">
                  <Button variant="outline" className="rounded-full border-secondary px-6 font-serif text-secondary">
                    Compare countries <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {countriesList.map((country) => {
                  const insight = COUNTRY_ROUTE_INSIGHTS[country.code] ?? {
                    fit: 70,
                    budget: "Profile based",
                    cities: "Top student cities",
                    focus: "Route fit",
                  };

                  return (
                    <Link href="/countries" key={country.code} data-testid={`country-chip-${country.code}`}>
                      <Card className="app-card group h-full overflow-hidden p-0 transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-md">
                        <div className="grid min-h-56 grid-cols-[150px_minmax(0,1fr)]">
                          <div className="relative overflow-hidden bg-white">
                            <img
                              src={COUNTRY_VISUALS[country.code] ?? `https://flagcdn.com/w320/${country.code.toLowerCase()}.png`}
                              alt={`${country.name} flag`}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">Study route</div>
                                <h3 className="mt-1 font-serif text-2xl font-bold leading-tight text-foreground">{country.name}</h3>
                              </div>
                              <Badge className="rounded-full bg-secondary text-white hover:bg-secondary">{insight.fit}% fit</Badge>
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                              <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Budget</div>
                                <div className="mt-1 font-serif text-sm font-bold text-foreground">{insight.budget}</div>
                              </div>
                              <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Best for</div>
                                <div className="mt-1 font-serif text-sm font-bold text-foreground">{insight.focus}</div>
                              </div>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-muted-foreground">{insight.cities}</p>
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

        <section className="px-4 py-16 sm:px-6 lg:px-8" data-testid="elee-report-section">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <div className="eyebrow">ELEE Report</div>
              <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">
                A readable readiness report before big decisions.
              </h2>
              <p className="mt-5 text-base leading-8 text-muted-foreground">
                ELEE turns a student's profile into country fit, university direction, document gaps, finance clarity, visa readiness, and the next three actions.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/elee-report">
                  <Button className="rounded-full px-6 font-serif">View ELEE Report</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="rounded-full border-secondary px-6 font-serif text-secondary">Open dashboard</Button>
                </Link>
              </div>
            </div>

            <Card className="app-card overflow-hidden p-0">
              <div className="brand-gradient-bg p-5 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-serif text-xl font-bold">Your ELEE Report</div>
                    <div className="mt-1 text-sm text-white/80">Generated after profile completion</div>
                  </div>
                  <div className="rounded-full bg-white px-4 py-2 font-serif text-xl font-bold text-primary">--</div>
                </div>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                {[
                  ["Country fit", "Pending", "Compare destinations after profile completion."],
                  ["Documents", "Pending", "Upload required files when applications begin."],
                  ["Visa readiness", "Pending", "Prepared after offer and funding details."],
                  ["Next action", "Profile", "Start by adding academics, budget, and goals."],
                ].map(([label, value, detail]) => (
                  <div key={label} className="rounded-lg border border-border bg-muted/25 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
                    <div className="mt-2 font-serif text-2xl font-bold text-foreground">{value}</div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section id="universities" className="bg-[#F7FBFF] px-4 py-16 sm:px-6 lg:px-8" data-testid="featured-universities-section">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="eyebrow">University Discovery</div>
                <h2 className="mt-2 font-serif text-3xl font-bold text-foreground md:text-4xl">World-class universities, clearer choices.</h2>
                <p className="mt-2 text-muted-foreground">Review ranking, city, tuition, programs, deadlines, and shortlist fit.</p>
              </div>
              <Link href="/universities" data-testid="view-all-universities">
                <Button variant="outline" className="rounded-full border-secondary px-6 font-serif text-secondary">
                  View all universities <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {showUniversitySkeletons
                ? Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="space-y-3 p-5">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </Card>
                ))
                : universities.map((university) => (
                  <Link href={`/universities/${university.id}`} key={university.id} data-testid={`uni-card-${university.id}`}>
                    <Card className="app-card h-full cursor-pointer p-5 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
                      <div className="flex items-start gap-4">
                        <UniversityLogo name={university.name} website={university.website} className="h-14 w-14" imageClassName="h-10 w-10" />
                        <div className="min-w-0">
                          <div className="font-serif text-lg font-bold leading-tight text-foreground">{university.name}</div>
                          <div className="mt-2 text-sm text-muted-foreground">{university.city}, {university.country}</div>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {university.ranking && <Badge variant="secondary" className="rounded-full">#{university.ranking} QS</Badge>}
                        {university.programCount && <Badge variant="outline" className="rounded-full">{university.programCount}+ programs</Badge>}
                      </div>
                    </Card>
                  </Link>
                ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8" data-testid="support-section">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 max-w-3xl">
              <div className="eyebrow">Support Around The Journey</div>
              <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">
                Keep the main path simple. Add deeper help when needed.
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {SUPPORT_AREAS.map((area) => {
                const AreaIcon = area.icon;

                return (
                  <Card key={area.title} className="group relative overflow-hidden rounded-lg border border-border bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${area.tone}`} />
                    <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br ${area.tone} text-white shadow-sm transition-transform group-hover:scale-105`}>
                      <AreaIcon className="h-6 w-6" strokeWidth={2.2} />
                    </div>
                    <div className="font-serif text-lg font-bold text-foreground">{area.title}</div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{area.detail}</p>
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted/25 px-3 py-1.5 text-xs font-semibold text-foreground">
                      {area.action}
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-secondary px-4 py-16 text-white sm:px-6 lg:px-8" data-testid="cta-section">
          <div className="mx-auto max-w-4xl text-center">
            <BadgeCheck className="mx-auto h-10 w-10 text-accent" />
            <h2 className="mt-5 font-serif text-4xl font-bold">Ready to write your future?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/72">
              Start with the student journey, then move step by step through country fit, applications, documents, visa, finance, and arrival.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={primaryCtaHref} data-testid="cta-get-started">
                <Button size="lg" className="rounded-full px-8 font-serif">Start Student Journey</Button>
              </Link>
              <Link href={consultantHref}>
                <Button variant="outline" size="lg" className="rounded-full border-white/45 bg-white/10 px-8 font-serif text-white hover:bg-white hover:text-foreground">
                  View Consultant Workbench
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white px-4 py-10 sm:px-6 lg:px-8" data-testid="footer">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <img src={assetUrl("logo.webp")} alt="EleevateOverseas" className="h-20 w-20 object-contain" />
          <div className="flex flex-wrap items-center justify-center gap-6 font-serif text-sm font-bold text-[#637199]">
            <Link href="/universities" className="hover:text-foreground">Universities</Link>
            <Link href="/elee-report" className="hover:text-foreground">ELEE Report</Link>
            <Link href="/applications" className="hover:text-foreground">Applications</Link>
            <Link href="/more" className="hover:text-foreground">More</Link>
            <Link href={consultantHref} className="hover:text-foreground">Consultants</Link>
          </div>
          <div className="text-xs text-muted-foreground">2026 EleevateOverseas. Write Your Future.</div>
        </div>
      </footer>
      <EleeBuddy />
    </div>
  );
}
