import { Link } from "wouter";
import {
  ArrowRight,
  BookOpenCheck,
  GraduationCap,
  HelpCircle,
  MapPinned,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const universityRows = [
  { country: "UK", name: "University of Manchester", course: "MSc Computer Science", status: "Offer" },
  { country: "UK", name: "University College London", course: "MSc Artificial Intelligence", status: "In review" },
  { country: "UK", name: "University of Edinburgh", course: "MSc Data Science", status: "Applying" },
];

const featureCards = [
  {
    icon: GraduationCap,
    title: "University Explorer",
    text: "Find programs by country, course, fees, intake, and profile fit.",
    metric: "450+",
    href: "/student-v6/explore",
  },
  {
    icon: BookOpenCheck,
    title: "My Applications",
    text: "Shortlist a university and ELEE turns it into an application tracker.",
    metric: "Live",
    href: "/student-v6/applications",
  },
  {
    icon: Sparkles,
    title: "Scholarships",
    text: "Match funding options after your profile and destination are clear.",
    metric: "INR",
    href: "/student-v6/finance",
  },
  {
    icon: ShieldCheck,
    title: "Visa Tracker",
    text: "Country-wise visa checklist, documents, funds, and reminders.",
    metric: "Stepwise",
    href: "/student-v6/documents",
  },
];

const journeySteps = [
  { title: "Create your profile", text: "Name, city, parent contact, passport, marks, tests, budget, and country interest." },
  { title: "Get your ELEE report", text: "Understand route fit, missing documents, finance gaps, and next action." },
  { title: "Explore universities", text: "Country and course filters follow what you selected in your profile." },
  { title: "Apply with clarity", text: "Every shortlisted university becomes an application with tasks and status." },
  { title: "Prepare visa and finance", text: "Upload documents, plan loans, remittance, forex, insurance, and arrival." },
];

const destinations = [
  { country: "United Kingdom", note: "CAS, tuition deposit, funds proof" },
  { country: "Canada", note: "LOA, PAL where required, GIC, medical" },
  { country: "Australia", note: "CoE, GS, OSHC, finance evidence" },
  { country: "Germany", note: "APS, blocked account, visa appointment" },
  { country: "United States", note: "I-20, SEVIS, interview preparation" },
  { country: "Ireland", note: "Offer, fee receipt, finance proof" },
];

const pricing = [
  { tier: "Silver", label: "Start", text: "Guided profile, ELEE report, university shortlist, and basic reminders." },
  { tier: "Gold", label: "Upgrade", text: "Adds application guidance, document review, scholarships, and support." },
  { tier: "Platinum", label: "Best", text: "Full journey help across applications, visa, finance, arrival, and rewards." },
];

export function StudentV6MarketingLanding() {
  return (
    <div className="min-h-screen bg-[#f4f5f8] text-[#111a37]" data-testid="student-v6-reference-landing">
      <style>{`
        @keyframes studentV6Float {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -16px, 0); }
        }

        @keyframes studentV6Drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.34; }
          50% { transform: translate3d(-18px, 14px, 0) scale(1.06); opacity: 0.5; }
        }

        @keyframes studentV6Progress {
          0% { width: 18%; }
          100% { width: 72%; }
        }

        @keyframes studentV6FadeUp {
          0% { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .student-v6-float { animation: studentV6Float 7s ease-in-out infinite; }
        .student-v6-orb { animation: studentV6Drift 9s ease-in-out infinite; }
        .student-v6-progress { animation: studentV6Progress 2.4s ease-out forwards; }
        .student-v6-fade-up { animation: studentV6FadeUp 0.75s ease-out both; }

        @media (prefers-reduced-motion: reduce) {
          .student-v6-float,
          .student-v6-orb,
          .student-v6-progress,
          .student-v6-fade-up {
            animation: none !important;
          }
        }
      `}</style>

      <header className="sticky top-0 z-50 border-b border-[#dfe4ee] bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex min-h-[88px] max-w-[1440px] items-center justify-between gap-5 px-4 sm:px-8">
          <Link href="/student-v6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#2dbb42] to-[#03a9e6] font-serif text-2xl font-black text-white shadow-md">
                E
              </div>
              <div className="font-serif text-xl font-black tracking-tight text-[#111a37] sm:text-2xl">
                Eleevate Overseas
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-9 font-serif text-sm font-black text-[#111a37]/70 lg:flex">
            <a className="transition hover:text-[#07a8e7]" href="#features">Features</a>
            <a className="transition hover:text-[#07a8e7]" href="#universities">Universities</a>
            <a className="transition hover:text-[#07a8e7]" href="#scholarships">Scholarships</a>
            <a className="transition hover:text-[#07a8e7]" href="#consultants">For Consultants</a>
            <a className="transition hover:text-[#07a8e7]" href="#pricing">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/student-v6/dashboard">
              <Button variant="outline" className="rounded-lg border-2 border-[#111a37] bg-white px-5 font-serif font-black text-[#111a37] shadow-sm hover:bg-[#f5f7fb]">
                Log In
              </Button>
            </Link>
            <Link href="/student-v6/start">
              <Button className="hidden rounded-lg bg-gradient-to-r from-[#2fb841] to-[#05a9e7] px-5 font-serif font-black text-white shadow-lg shadow-cyan-500/15 hover:brightness-105 sm:inline-flex">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#11162f] px-4 py-16 text-white sm:px-8 md:py-20 lg:min-h-[760px]">
          <div className="student-v6-orb absolute -left-10 top-52 h-44 w-44 rounded-full bg-[#2fb841]/15 blur-sm" />
          <div className="student-v6-orb absolute right-10 top-12 h-[420px] w-[420px] rounded-full bg-[#05a9e7]/10 blur-sm [animation-delay:1.3s]" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#13354b]/50 to-transparent" />

          <div className="relative mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[minmax(0,1fr)_560px] lg:items-center">
            <div className="student-v6-fade-up max-w-[760px]">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-5 py-3 font-serif text-xs font-black uppercase tracking-[0.18em] text-white shadow-inner">
                <span className="h-2.5 w-2.5 rounded-full bg-[#2fb841]" />
                Powered by ELEE - guided AI
              </div>

              <h1 className="mt-11 font-serif text-[3.4rem] font-black leading-[0.98] tracking-tight text-white sm:text-7xl lg:text-[5.6rem]">
                Your Study Abroad
                <span className="mt-4 block bg-gradient-to-r from-[#31b63f] via-[#22bd91] to-[#05a9e7] bg-clip-text text-transparent">
                  Done For You.
                </span>
              </h1>

              <p className="mt-9 max-w-3xl text-lg font-semibold leading-9 text-white/70 sm:text-xl">
                Eleevate helps students and families move from first question to university, visa, finance, and arrival. ELEE keeps the next task clear while counsellors support the important decisions.
              </p>

              <div className="mt-12 flex flex-col gap-4 sm:flex-row">
                <Link href="/student-v6/start">
                  <Button size="lg" className="h-16 rounded-2xl bg-gradient-to-r from-[#2fb841] to-[#05a9e7] px-9 font-serif text-lg font-black text-white shadow-2xl shadow-cyan-500/20 hover:brightness-105">
                    <GraduationCap className="h-5 w-5" />
                    Start Your Journey
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline" className="h-16 rounded-2xl border-2 border-[#05a9e7] bg-white px-9 font-serif text-lg font-black text-[#20a95a] shadow-xl hover:bg-white hover:text-[#05a9e7]">
                    Watch Demo
                  </Button>
                </a>
              </div>

              <div className="mt-20 h-px max-w-[640px] bg-white/10" />
              <div className="mt-12 grid max-w-[760px] grid-cols-2 gap-7 sm:grid-cols-4">
                {[
                  ["12,000+", "Students placed abroad"],
                  ["450+", "Partner universities"],
                  ["98%", "Visa success rate"],
                  ["10+", "Countries supported"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <div className="font-serif text-4xl font-black tracking-tight text-[#27bd78] sm:text-5xl">{value}</div>
                    <div className="mt-3 text-sm font-semibold leading-5 text-white/50">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[560px]">
              <Card className="student-v6-float absolute left-0 right-0 top-24 overflow-hidden rounded-[28px] border border-white/10 bg-white/10 p-7 text-white shadow-2xl backdrop-blur md:left-auto md:w-[500px]">
                <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/10 via-transparent to-[#05a9e7]/10" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#2fb841] to-[#05a9e7] font-serif text-xl font-black">
                        AS
                      </div>
                      <div>
                        <div className="font-serif text-xl font-black">Arjun Sharma</div>
                        <div className="text-sm font-semibold text-white/50">B.Tech, IELTS 7.5 - Target: UK MSc CS</div>
                      </div>
                    </div>
                    <Badge className="rounded-full bg-emerald-100 px-4 py-2 font-serif text-emerald-800 hover:bg-emerald-100">Active</Badge>
                  </div>

                  <div className="mt-10">
                    <div className="flex items-center justify-between text-sm font-semibold text-white/60">
                      <span>Application Progress</span>
                      <span>72%</span>
                    </div>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/20">
                      <div className="student-v6-progress h-full rounded-full bg-gradient-to-r from-[#31b63f] to-[#05a9e7]" />
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    {universityRows.map((row) => (
                      <div key={row.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-4">
                        <div>
                          <div className="font-serif text-base font-black">{row.name}</div>
                          <div className="mt-1 text-sm font-semibold text-white/50">{row.course}</div>
                        </div>
                        <Badge className={cn("rounded-full px-4 py-2 font-serif", row.status === "Offer" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : row.status === "In review" ? "bg-cyan-100 text-cyan-800 hover:bg-cyan-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100")}>
                          {row.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="student-v6-float absolute right-3 top-4 w-56 rounded-2xl border-0 bg-white p-6 text-[#111a37] shadow-2xl [animation-delay:0.8s]">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Scholarship found</div>
                <div className="mt-3 font-serif text-3xl font-black">Rs 14.2L</div>
                <div className="mt-2 font-serif text-sm font-black text-[#16a861]">Chevening 2026</div>
              </Card>

              <Card className="student-v6-float absolute bottom-4 left-0 w-48 rounded-2xl border-0 bg-white p-5 text-[#111a37] shadow-2xl [animation-delay:1.5s]">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Visa status</div>
                <div className="mt-3 font-serif text-3xl font-black">82%</div>
                <div className="mt-2 text-sm font-black text-[#14ad76]">3 docs remaining</div>
              </Card>
            </div>
          </div>
        </section>

        <section id="features" className="px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.26em] text-[#06a8e7]">Features</div>
                <h2 className="mt-3 font-serif text-4xl font-black tracking-tight text-[#111a37] md:text-5xl">Everything in one student dashboard.</h2>
                <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-muted-foreground">The portal is simple for the student, but every action connects to applications, documents, visa, scholarships, finance, and counsellor follow-up.</p>
              </div>
              <Link href="/student-v6/dashboard">
                <Button className="rounded-xl bg-gradient-to-r from-[#2fb841] to-[#05a9e7] px-7 font-serif font-black text-white shadow-lg">Open dashboard</Button>
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {featureCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.title} href={item.href}>
                    <Card className="group h-full rounded-3xl border-0 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2fb841] to-[#05a9e7] text-white shadow-lg">
                          <Icon className="h-7 w-7" />
                        </div>
                        <Badge className="rounded-full bg-[#eff6ff] px-3 py-1 font-serif text-[#0678b8] hover:bg-[#eff6ff]">{item.metric}</Badge>
                      </div>
                      <h3 className="mt-7 font-serif text-2xl font-black text-[#111a37]">{item.title}</h3>
                      <p className="mt-3 min-h-[96px] text-base font-semibold leading-7 text-muted-foreground">{item.text}</p>
                      <div className="mt-5 flex items-center gap-2 font-serif text-sm font-black text-[#08aeea]">
                        Continue
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section id="universities" className="bg-white px-4 py-16 sm:px-8">
          <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.26em] text-[#06a8e7]">Universities</div>
              <h2 className="mt-3 font-serif text-4xl font-black leading-tight tracking-tight text-[#111a37] md:text-5xl">Search once. ELEE keeps the country, course, and documents connected.</h2>
              <p className="mt-5 text-lg font-semibold leading-8 text-muted-foreground">
                If a student chooses UK and finance, the explorer should show UK options first, course finder should show related programs, and documents should switch to UK requirements.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/student-v6/explore">
                  <Button className="rounded-xl bg-gradient-to-r from-[#2fb841] to-[#05a9e7] px-7 font-serif font-black text-white shadow-lg">Explore Universities</Button>
                </Link>
                <Link href="/student-v6/start">
                  <Button variant="outline" className="rounded-xl border-[#111a37] px-7 font-serif font-black text-[#111a37]">Create profile</Button>
                </Link>
              </div>
            </div>

            <Card className="rounded-[28px] border border-[#dfe4ee] bg-[#f8fafc] p-5 shadow-sm">
              <div className="flex items-center gap-3 rounded-2xl border border-[#dfe4ee] bg-white p-4">
                <Search className="h-5 w-5 text-muted-foreground" />
                <div className="text-base font-semibold text-muted-foreground">Search universities, programs, documents</div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {destinations.map((item) => (
                  <div key={item.country} className="rounded-2xl border border-[#dfe4ee] bg-white p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2fb841] to-[#05a9e7] text-white">
                        <MapPinned className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-serif text-lg font-black text-[#111a37]">{item.country}</div>
                        <div className="text-xs font-black uppercase tracking-wide text-muted-foreground">Study route</div>
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-semibold leading-6 text-muted-foreground">{item.note}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section id="scholarships" className="px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[32px] bg-gradient-to-r from-[#2fb841] via-[#17b78f] to-[#05a9e7] p-8 text-white shadow-xl md:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Scholarships and funding</div>
                <h2 className="mt-3 font-serif text-4xl font-black leading-tight md:text-5xl">Find funding before the student applies blindly.</h2>
                <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-white/80">ELEE can turn budget, country, course, intake, and documents into a clean finance plan: scholarships, loan EMI in INR, remittance, forex card, insurance, and arrival checklist.</p>
              </div>
              <Card className="rounded-3xl border-0 bg-white p-6 text-[#111a37] shadow-2xl">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Scholarship found</div>
                <div className="mt-3 font-serif text-5xl font-black">Rs 14.2L</div>
                <div className="mt-2 font-serif text-lg font-black text-[#16a861]">Chevening 2026</div>
                <Link href="/student-v6/finance">
                  <Button className="mt-6 w-full rounded-xl bg-[#111a37] font-serif font-black text-white">Open Finance</Button>
                </Link>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 sm:px-8">
          <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[430px_minmax(0,1fr)] lg:items-start">
            <div className="lg:sticky lg:top-32">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-[#06a8e7]">Student journey</div>
              <h2 className="mt-3 font-serif text-4xl font-black leading-tight tracking-tight text-[#111a37] md:text-5xl">One path from first question to arrival.</h2>
              <p className="mt-4 text-lg font-semibold leading-8 text-muted-foreground">For tier 3 and tier 4 city students, the portal should feel guided, not overwhelming. Every screen tells the student what is done, what is missing, and what to do now.</p>
              <Link href="/student-v6/start">
                <Button className="mt-7 rounded-xl bg-gradient-to-r from-[#2fb841] to-[#05a9e7] px-7 font-serif font-black text-white shadow-lg">Start step 1</Button>
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {journeySteps.map((step, index) => (
                <Card key={step.title} className="rounded-3xl border border-[#dfe4ee] bg-[#f8fafc] p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#111a37] p-4 font-serif text-sm font-black text-white">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-black text-[#111a37]">{step.title}</h3>
                      <p className="mt-2 text-sm font-semibold leading-7 text-muted-foreground">{step.text}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="consultants" className="px-4 py-16 sm:px-8">
          <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
            <Card className="rounded-[32px] border-0 bg-[#111a37] p-8 text-white shadow-xl md:p-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                <UserRound className="h-8 w-8" />
              </div>
              <h2 className="mt-8 font-serif text-4xl font-black leading-tight md:text-5xl">For Consultants</h2>
              <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-white/70">Counsellors get a separate workbench for student files, pending documents, SOP review, loan follow-up, visa tasks, and application stages.</p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {["Student pipeline", "Document review", "Visa and finance queue"].map((label) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4 font-serif font-black">{label}</div>
                ))}
              </div>
            </Card>
            <Card className="rounded-[32px] border-0 bg-white p-8 shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2fb841] to-[#05a9e7] text-white">
                <HelpCircle className="h-8 w-8" />
              </div>
              <h3 className="mt-8 font-serif text-3xl font-black text-[#111a37]">Support should always be one tap away.</h3>
              <p className="mt-4 text-base font-semibold leading-8 text-muted-foreground">FAQ, live chat, email support, and counsellor help are available from the student journey, not hidden at the end.</p>
              <Link href="/student-v6/support">
                <Button className="mt-7 w-full rounded-xl bg-gradient-to-r from-[#2fb841] to-[#05a9e7] font-serif font-black text-white">Open support</Button>
              </Link>
            </Card>
          </div>
        </section>

        <section id="pricing" className="bg-white px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-9 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.26em] text-[#06a8e7]">Pricing</div>
                <h2 className="mt-3 font-serif text-4xl font-black tracking-tight text-[#111a37] md:text-5xl">Start free. Upgrade when the family needs help.</h2>
              </div>
              <Link href="/student-v6/packages">
                <Button variant="outline" className="rounded-xl border-[#111a37] px-7 font-serif font-black text-[#111a37]">View all packages</Button>
              </Link>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {pricing.map((item) => (
                <Card key={item.tier} className={cn("rounded-3xl border p-7 shadow-sm", item.tier === "Platinum" ? "border-[#05a9e7] bg-[#111a37] text-white" : "border-[#dfe4ee] bg-[#f8fafc] text-[#111a37]")}>
                  <div className={cn("inline-flex rounded-full px-4 py-2 font-serif text-sm font-black", item.tier === "Platinum" ? "bg-white text-[#111a37]" : "bg-white text-[#08aeea]")}>{item.label}</div>
                  <h3 className="mt-7 font-serif text-3xl font-black">{item.tier}</h3>
                  <p className={cn("mt-4 min-h-[96px] text-base font-semibold leading-8", item.tier === "Platinum" ? "text-white/70" : "text-muted-foreground")}>{item.text}</p>
                  <Link href="/student-v6/packages">
                    <Button className={cn("mt-7 w-full rounded-xl font-serif font-black", item.tier === "Platinum" ? "bg-white text-[#111a37] hover:bg-white/90" : "bg-gradient-to-r from-[#2fb841] to-[#05a9e7] text-white")}>
                      Choose {item.tier}
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-[1440px] rounded-[34px] bg-gradient-to-r from-[#2fb841] to-[#05a9e7] p-8 text-white shadow-2xl md:p-12">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <div className="font-serif text-4xl font-black leading-tight md:text-5xl">Ready to start the journey?</div>
                <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-white/80">Create the student file, answer simple questions, and let ELEE show what to do next.</p>
              </div>
              <Link href="/student-v6/start">
                <Button className="h-14 rounded-2xl bg-white px-9 font-serif text-lg font-black text-[#111a37] hover:bg-white/90">Get Started Free</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
