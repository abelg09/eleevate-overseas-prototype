import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, MessageCircle, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEMO_AGENT_PROMPTS, useDemoJourneyState } from "@/lib/demo-journey";

const ROUTE_STEPS = [
  { match: ["/dashboard"], label: "Dashboard", next: "Complete AI Profile & Test", href: "/profile" },
  { match: ["/profile", "/assessment"], label: "AI Profile & Test", next: "Generate ELEE Report", href: "/elee-report" },
  { match: ["/elee-report"], label: "ELEE Report", next: "Find matching universities", href: "/universities" },
  { match: ["/universities", "/countries", "/course-finder", "/shortlist"], label: "University Finder", next: "Track applications", href: "/applications" },
  { match: ["/applications"], label: "Applications", next: "Prepare documents and visa", href: "/documents" },
  { match: ["/documents", "/visa-center"], label: "Docs & Visa", next: "Plan finance and arrival", href: "/financial-hub" },
  { match: ["/financial-hub", "/loans", "/remittance", "/forex-card", "/forex", "/insurance"], label: "Financial Hub", next: "Review journey map", href: "/journey-map" },
];

function getRouteStep(location: string) {
  return ROUTE_STEPS.find((step) => step.match.some((path) => location === path || location.startsWith(`${path}/`))) ?? ROUTE_STEPS[0];
}

const PRODUCT_PROMPTS = [
  { id: "courses", label: "Find my course", prompt: "Search programs by fit, tuition, intake, and career signal.", href: "/course-finder" },
  { id: "compare", label: "Compare countries", prompt: "Compare Canada, UK, USA, Australia, Germany, and Netherlands.", href: "/countries?compare=true" },
  { id: "scholarships", label: "Find scholarships", prompt: "Match scholarships to my route, deadline, and missing documents.", href: "/scholarships" },
  { id: "sop", label: "Draft my SOP", prompt: "Turn profile evidence into a program-specific SOP brief.", href: "/sop-studio" },
];

export function EleeBuddy({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const demoJourney = useDemoJourneyState();
  const routeStep = getRouteStep(location);
  const prompts = useMemo(() => {
    const base = location === "/product" || location === "/" ? PRODUCT_PROMPTS : [...PRODUCT_PROMPTS, ...DEMO_AGENT_PROMPTS].slice(0, 6);
    return base;
  }, [location]);

  return (
    <div className="fixed bottom-5 right-5 z-50" data-testid="elee-buddy">
      {open && (
        <div className="mb-3 w-[min(calc(100vw-2rem),390px)] overflow-hidden rounded-lg border border-border bg-white shadow-xl">
          <div className="brand-gradient-bg p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <div className="font-serif text-base font-bold">ELEE AI Buddy</div>
                </div>
                <p className="mt-1 text-xs leading-5 text-white/80">A page-aware guide for the global student journey.</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Close ELEE AI Buddy">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">You are here</div>
                  <div className="mt-1 font-serif text-sm font-bold text-foreground">{routeStep.label}</div>
                </div>
                <Badge variant="outline" className="rounded-full border-primary/30 bg-white text-xs font-bold text-primary">
                  {demoJourney.ledgerEvents.length} events
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Next: {routeStep.next}. Each action can update applications, ledger status, and consultant work queues.</p>
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
