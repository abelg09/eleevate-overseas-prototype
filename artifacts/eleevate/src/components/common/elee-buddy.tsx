import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, MessageCircle, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ROUTE_STEPS = [
  { match: ["/dashboard"], label: "Dashboard", next: "Complete AI Profile & Test", href: "/profile" },
  { match: ["/profile", "/assessment"], label: "AI Profile & Test", next: "Generate your ELEE Report", href: "/elee-report" },
  { match: ["/elee-report"], label: "ELEE Report", next: "Find and compare countries", href: "/countries" },
  { match: ["/countries", "/universities", "/course-finder", "/shortlist"], label: "University Finder", next: "Start applications", href: "/applications" },
  { match: ["/applications"], label: "Applications", next: "Prepare documents and visa", href: "/documents" },
  { match: ["/documents", "/visa-center"], label: "Docs & Visa", next: "Plan education loan and arrival costs", href: "/financial-hub" },
  { match: ["/financial-hub", "/loans", "/remittance", "/forex-card", "/forex", "/insurance"], label: "Financial Hub", next: "Prepare test scores and interviews", href: "/test-prep" },
  { match: ["/test-prep", "/mock-test", "/upskilling", "/careers", "/job-board", "/alumni", "/news"], label: "Career & Upskilling", next: "Review journey map", href: "/journey-map" },
];

function getRouteStep(location: string) {
  return ROUTE_STEPS.find((step) => step.match.some((path) => location === path || location.startsWith(`${path}/`))) ?? ROUTE_STEPS[0];
}

const STUDENT_ACTIONS = [
  { id: "report", label: "Generate ELEE report", prompt: "Turn your profile and assessment into country, document, finance, and next-step guidance.", href: "/elee-report" },
  { id: "countries", label: "Find and compare countries", prompt: "Compare destinations by budget, visa path, city fit, work options, and application readiness.", href: "/countries?compare=true" },
  { id: "courses", label: "Find my course", prompt: "Search programs by fit, tuition, intake, entry needs, and career outcome.", href: "/course-finder" },
  { id: "applications", label: "Applications", prompt: "Track saved universities, requirements, deadlines, offers, and next documents.", href: "/applications" },
  { id: "test-prep", label: "Test prep", prompt: "Plan IELTS, TOEFL, GRE, GMAT, SAT, PTE, mock tests, and score progress.", href: "/test-prep" },
  { id: "sop", label: "Draft SOP", prompt: "Turn your story, academics, projects, and goals into a stronger SOP draft.", href: "/sop-studio" },
  { id: "scholarships", label: "Find scholarship", prompt: "Find scholarships that match your profile, destination, deadline, and documents.", href: "/scholarships" },
  { id: "loan", label: "Education loan", prompt: "Plan your loan amount, sponsor proof, lender options, and fee-payment timeline.", href: "/loans" },
  { id: "interview", label: "Interview prep", prompt: "Practice university, visa, scholarship, and career interview answers with ELEE.", href: "/careers" },
];

export function EleeBuddy({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const routeStep = getRouteStep(location);
  const prompts = STUDENT_ACTIONS;

  return (
    <div className="fixed bottom-5 right-5 z-50" data-testid="elee-buddy">
      {open && (
        <div className="mb-3 w-[min(calc(100vw-2rem),390px)] overflow-hidden rounded-lg border border-border bg-white shadow-xl">
          <div className="brand-gradient-bg p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <div className="font-serif text-base font-bold">ELEE AI Guide</div>
                </div>
                <p className="mt-1 text-xs leading-5 text-white/80">Your study-abroad guide from profile to arrival.</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Close ELEE AI Buddy">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[calc(100vh-7rem)] overflow-y-auto p-4">
            <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">You are here</div>
                  <div className="mt-1 font-serif text-sm font-bold text-foreground">{routeStep.label}</div>
                </div>
                <Badge variant="outline" className="rounded-full border-primary/30 bg-white text-xs font-bold text-primary">
                  Guided
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Next: {routeStep.next}. ELEE keeps your tasks, applications, documents, finance, and interview prep in the right order.
              </p>
              <div className="mt-3 flex gap-2">
                <Link href={routeStep.href}>
                  <Button size="sm" className="h-8 rounded-full px-3 text-xs">Continue</Button>
                </Link>
                <Link href="/journey-map">
                  <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs">Journey Map</Button>
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              {prompts.map((prompt) => (
                <Link key={prompt.id} href={prompt.href}>
                  <div className="group rounded-lg border border-border bg-white p-3 transition-all hover:border-primary/35 hover:bg-primary/5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-serif text-sm font-bold text-foreground">{prompt.label}</div>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{prompt.prompt}</p>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={() => setOpen((value) => !value)}
        className="h-12 rounded-full px-5 font-serif shadow-lg"
        data-testid="btn-elee-buddy"
      >
        <MessageCircle className="h-4 w-4" />
        {compact ? "ELEE" : "Ask ELEE"}
      </Button>
    </div>
  );
}
