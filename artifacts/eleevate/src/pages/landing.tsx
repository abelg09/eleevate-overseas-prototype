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
  BookOpenCheck,
  FileText,
  Globe2,
  GraduationCap,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isDemoMode, listFromApi } from "@/lib/demo-mode";
import { DEMO_COUNTRIES, DEMO_UNIVERSITIES } from "@/lib/demo-catalog";
import { demystifiedJourneyStages } from "@/lib/demo-data";
import { assetUrl, cn } from "@/lib/utils";

const STEPS = [
  { icon: Sparkles, title: "Clarity", desc: "ELLE turns profile, family, finance, and goals into one readiness snapshot." },
  { icon: GraduationCap, title: "Shortlist", desc: "Compare countries, universities, courses, costs, and career outcomes with confidence." },
  { icon: FileText, title: "Apply", desc: "Move documents, SOPs, LORs, applications, visa, payments, and services through one journey OS." },
];

const STATS = [
  { value: "5,000+", label: "Students counselled" },
  { value: "1,200+", label: "Partner universities" },
  { value: "98%", label: "Visa success ratio" },
  { value: "4.7/5", label: "Student rating" },
];

const SERVICES = [
  { icon: MessageCircle, title: "Counselling", desc: "Personalized student and family guidance from profile to departure." },
  { icon: ShieldCheck, title: "Visa Strategy", desc: "Document readiness, financial proof, interview prep, and risk tracking." },
  { icon: BookOpenCheck, title: "Test Prep", desc: "IELTS, TOEFL, GRE, GMAT, mock tests, LMS, and progress insights." },
  { icon: Users, title: "Consultant OS", desc: "CRM, doc review, SOP workflow, invoicing, team tasks, and partner tools." },
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
  NL: "https://eleevateoverseas.com/wp-content/uploads/2024/05/Study-In-Netherlands-Flag-Eleevate-Overseas.svg",
  SG: "https://eleevateoverseas.com/wp-content/uploads/2024/05/Study-In-Singapore-Flag-Eleevate-Overseas.svg",
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
  const unis = demoMode || apiUnis.length === 0 ? DEMO_UNIVERSITIES.slice(0, 4) : apiUnis.slice(0, 4);
  const countriesList = demoMode || apiCountries.length === 0 ? DEMO_COUNTRIES.slice(0, 6) : apiCountries.slice(0, 6);
  const primaryCtaHref = demoMode ? "/login" : "/sign-up";
  const elleCtaHref = demoMode ? "/login?redirect=/elle-report" : "/universities";
  const journeyMapHref = demoMode ? "/login?redirect=/journey-map" : "/sign-up";
  const showUniversitySkeletons = !demoMode && unisLoading;
  const showCountries = demoMode || (!countriesLoading && countriesList.length > 0);

  return (
    <div className="min-h-screen bg-white text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur-xl" data-testid="nav-bar">
        <div className="mx-auto flex h-[86px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" data-testid="nav-logo">
            <img src={assetUrl("logo.svg")} alt="EleevateOverseas" className="h-[60px] w-auto" />
          </Link>
          <div className="hidden items-center gap-8 font-serif text-sm font-bold text-[#8193c6] lg:flex">
            <Link href="/universities" className="transition-colors hover:text-foreground">Study Abroad</Link>
            <Link href="/test-prep" className="transition-colors hover:text-foreground">Exam Prep</Link>
            <Link href="/services" className="transition-colors hover:text-foreground">Services</Link>
            <Link href={journeyMapHref} className="transition-colors hover:text-foreground">Journey Map</Link>
            <Link href="/elle-report" className="transition-colors hover:text-foreground">ELLE</Link>
            <Link href="/consultant/dashboard" className="transition-colors hover:text-foreground">Consultants</Link>
          </div>
          <Link href={primaryCtaHref} data-testid="nav-get-started">
            <Button className="rounded-full px-6 font-serif">Book A Free Counselling</Button>
          </Link>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden px-4 pb-20 pt-20 sm:px-6 lg:px-8" data-testid="hero-section">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,159,227,0.10),transparent_34%),linear-gradient(90deg,transparent,rgba(58,170,53,0.08),transparent)]" />
          <div className="relative mx-auto max-w-5xl text-center">
            <Badge className="brand-gradient-bg rounded-full px-10 py-3 font-serif text-sm text-white hover:opacity-95">
              Study Abroad
            </Badge>
            <h2 className="brand-gradient-text mt-7 font-serif text-4xl font-extrabold uppercase leading-tight md:text-5xl">
              Write Your Future
            </h2>
            <h1 className="mx-auto mt-7 max-w-4xl font-serif text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-[56px]">
              With India&apos;s Most Trusted & Transparent Overseas Education Consultant
            </h1>
            <div className="mx-auto mt-7 inline-flex items-center gap-2 rounded-xl bg-muted px-5 py-3 text-sm font-bold text-foreground">
              <span className="flex -space-x-2">
                {["S", "A", "M"].map((letter) => (
                  <span key={letter} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-secondary text-xs text-white">{letter}</span>
                ))}
              </span>
              <Star className="h-4 w-4 fill-[#F8B133] text-[#F8B133]" />
              <span>4.7 Google | 144 reviews</span>
            </div>
            <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-foreground/80 md:text-lg">
              Your global education dreams deserve more than promises. EleevateOverseas turns confusion into clarity, anxiety into confidence, and aspirations into achievements.
            </p>

            <div className="brand-rule mx-auto mt-10 max-w-4xl" />
            <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <div className="font-serif text-xl font-bold text-accent md:text-2xl">{stat.value}</div>
                  <div className="mt-2 text-sm leading-6 text-foreground/80">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={primaryCtaHref} data-testid="hero-cta-primary">
                <Button size="lg" className="rounded-full px-8 font-serif">Start Your Journey <ArrowRight className="h-4 w-4" /></Button>
              </Link>
              <Link href={elleCtaHref} data-testid="hero-cta-secondary">
                <Button variant="outline" size="lg" className="rounded-full border-secondary px-8 font-serif text-secondary">{demoMode ? "View ELLE Report" : "Explore Top Countries"}</Button>
              </Link>
            </div>
          </div>
        </section>

        {showCountries && (
          <section className="px-4 py-16 sm:px-6 lg:px-8" data-testid="countries-section">
            <div className="mx-auto max-w-7xl">
              <div className="text-center">
                <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">Top Countries Indian Students&apos; Aspire To Go</h2>
                <p className="mt-3 font-semibold text-foreground/80">Embark on your personalised education journey with EleevateOverseas.</p>
                <div className="brand-rule mx-auto mt-7 max-w-6xl" />
              </div>
              <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
                {countriesList.map((country) => (
                  <Link href="/countries" key={country.code} data-testid={`country-chip-${country.code}`}>
                    <Card className="app-card group overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-md">
                      <div className="relative aspect-[4/4.5] overflow-hidden bg-muted">
                        <img
                          src={COUNTRY_VISUALS[country.code] ?? COUNTRY_VISUALS.US}
                          alt={`${country.name} study destination`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-white/95 to-transparent p-5 text-center">
                          <div className="font-serif text-lg font-bold text-foreground">{country.name}</div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-muted/50 px-4 py-16 sm:px-6 lg:px-8" data-testid="journey-section">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="eyebrow">Overseas Education OS</div>
              <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">A complete journey platform, not a loose set of forms.</h2>
              <p className="mt-5 text-base leading-8 text-muted-foreground">
                The UX prototype brings student readiness, consultant workflows, documents, visa, finance, learning, services, and communication into one operating system.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {STEPS.map((step, index) => (
                  <div key={step.title} className="rounded-lg border border-border bg-white p-4 shadow-sm">
                    <div className="brand-gradient-bg mb-4 flex h-10 w-10 items-center justify-center rounded-lg text-white">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div className="font-serif font-bold text-foreground">{index + 1}. {step.title}</div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <Card className="app-card overflow-hidden p-0">
              <div className="brand-gradient-bg p-5 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-serif text-xl font-bold">Student Journey OS</div>
                    <div className="mt-1 text-sm text-white/80">ELLE score, timeline, tasks, documents, finance, visa</div>
                  </div>
                  <Badge className="bg-white text-secondary hover:bg-white">82 ELLE</Badge>
                </div>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                {[
                  { label: "Document readiness", value: "67%", icon: FileText, tone: "text-[#F8B133]" },
                  { label: "Country fit", value: "88%", icon: Globe2, tone: "text-accent" },
                  { label: "Visa confidence", value: "Medium", icon: ShieldCheck, tone: "text-primary" },
                  { label: "Applications", value: "7 active", icon: TrendingUp, tone: "text-secondary" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-white p-4">
                    <item.icon className={cn("mb-3 h-5 w-5", item.tone)} />
                    <div className="font-serif text-2xl font-bold text-foreground">{item.value}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8" data-testid="demystified-section">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <div className="eyebrow">Study Abroad, Demystified</div>
                <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-5xl">
                  Your biggest dream, turned into a clear operating checklist.
                </h2>
                <p className="mt-4 text-base leading-8 text-muted-foreground">
                  Every stage has a student action, an automation layer, and a consultant approval point, so families know what is done, what is blocked, and what comes next.
                </p>
              </div>
              <Link href={journeyMapHref}>
                <Button variant="outline" className="rounded-full border-secondary px-6 font-serif text-secondary">
                  Open journey map <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {demystifiedJourneyStages.map((stage, index) => (
                <Card key={stage.id} className="app-card h-full p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="brand-gradient-bg flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg font-serif text-sm font-bold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <Badge variant="outline" className="rounded-full capitalize">{stage.status}</Badge>
                  </div>
                  <div className="mt-4 font-serif text-lg font-bold leading-tight text-foreground">{stage.stage}</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{stage.promise}</p>
                  <div className="mt-4 rounded-lg border border-border bg-muted/35 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">What happens</div>
                    <div className="mt-1 line-clamp-3 text-xs leading-5 text-foreground">{stage.automation}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8" data-testid="featured-universities-section">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="eyebrow">University discovery</div>
                <h2 className="mt-2 font-serif text-3xl font-bold text-foreground">World-class universities</h2>
                <p className="mt-2 text-muted-foreground">Explore top-ranked institutions with fit, cost, and outcome signals.</p>
              </div>
              <Link href="/universities" data-testid="view-all-universities">
                <Button variant="outline" className="rounded-full border-secondary px-6 font-serif text-secondary">View all <ArrowRight className="h-3.5 w-3.5" /></Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {showUniversitySkeletons
                ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="space-y-3 p-5">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </Card>
                ))
                : unis.map((uni) => (
                  <Link href={`/universities/${uni.id}`} key={uni.id} data-testid={`uni-card-${uni.id}`}>
                    <Card className="app-card h-full cursor-pointer p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <div className="brand-gradient-bg mb-4 flex h-11 w-11 items-center justify-center rounded-lg text-white">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div className="font-serif text-lg font-bold leading-tight text-foreground">{uni.name}</div>
                      <div className="mt-2 text-sm text-muted-foreground">{uni.city}, {uni.country}</div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {uni.ranking && <Badge variant="secondary">#{uni.ranking} QS</Badge>}
                        {uni.programCount && <Badge variant="outline">{uni.programCount}+ programs</Badge>}
                      </div>
                    </Card>
                  </Link>
                ))}
            </div>
          </div>
        </section>

        <section className="bg-secondary px-4 py-16 text-white sm:px-6 lg:px-8" data-testid="services-section">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              <Badge className="brand-gradient-bg rounded-full px-8 py-2 font-serif text-white">Services</Badge>
              <h2 className="mt-5 font-serif text-3xl font-bold md:text-4xl">Everything needed from clarity to arrival</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {SERVICES.map((service) => (
                <div key={service.title} className="rounded-lg border border-white/10 bg-white/10 p-5">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-secondary">
                    <service.icon className="h-5 w-5" />
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
            <h2 className="mt-5 font-serif text-4xl font-bold text-foreground">Ready to elevate?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Start with the demo Journey OS now, then connect the final database once the product flow is locked.</p>
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
          <img src={assetUrl("logo.svg")} alt="EleevateOverseas" className="h-12 w-auto" />
          <div className="flex flex-wrap items-center justify-center gap-6 font-serif text-sm font-bold text-[#8193c6]">
            <Link href="/universities" className="hover:text-foreground">Universities</Link>
            <Link href="/elle-report" className="hover:text-foreground">ELLE</Link>
            <Link href="/services" className="hover:text-foreground">Services</Link>
            <Link href="/consultant/dashboard" className="hover:text-foreground">Consultant OS</Link>
          </div>
          <div className="text-xs text-muted-foreground">2026 EleevateOverseas. Write Your Future.</div>
        </div>
      </footer>
    </div>
  );
}
