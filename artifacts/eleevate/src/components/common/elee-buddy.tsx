import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Compass, MapPinned, MessageCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_AGENT_PROMPTS } from "@/lib/demo-journey";
import { findStudentGuideStep, getNextStudentGuideStep, STUDENT_GUIDE_STEPS } from "@/lib/student-guide";
import { useStudentJourneySnapshot } from "@/lib/student-journey-state";

const PRODUCT_PROMPTS = [
  { id: "courses", label: "Find my course", prompt: "Search programs by fit, tuition, intake, and career signal.", href: "/course-finder" },
  { id: "compare", label: "Compare countries", prompt: "Compare Canada, UK, USA, Australia, Germany, and Netherlands.", href: "/countries?compare=true" },
  { id: "scholarships", label: "Find scholarships", prompt: "Match scholarships to my route, deadline, and missing documents.", href: "/scholarships" },
  { id: "sop", label: "Draft my SOP", prompt: "Turn profile evidence into a program-specific SOP brief.", href: "/sop-studio" },
];

export function EleeBuddy({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const consultant = location.startsWith("/consultant");
  const publicPage = location === "/product" || location === "/";
  const currentStep = findStudentGuideStep(location);
  const journeySnapshot = useStudentJourneySnapshot();
  const routeNextStep = getNextStudentGuideStep(location);
  const nextStep = !consultant && !publicPage && journeySnapshot.nextIncompleteStep
    ? journeySnapshot.nextIncompleteStep
    : routeNextStep;
  const nextStepDetail = "prompt" in nextStep ? nextStep.prompt : nextStep.detail;
  const dashboardContext = location === "/dashboard";
  const showStudentGuide = !consultant && !publicPage;
  const prompts = useMemo(() => {
    if (publicPage) return PRODUCT_PROMPTS;
    if (consultant) return DEMO_AGENT_PROMPTS.slice(0, 4);
    const notificationPrompts = journeySnapshot.notifications.slice(0, 3).map((item) => ({
      id: item.id,
      label: item.title,
      prompt: item.detail,
      href: item.href,
    }));
    const journeyPrompts = STUDENT_GUIDE_STEPS
      .filter((step) => step.id !== currentStep?.id)
      .slice(0, 4)
      .map((step) => ({
        id: step.id,
        label: step.label,
        prompt: step.detail,
        href: step.href,
      }));
    const seen = new Set<string>();
    return [...notificationPrompts, ...journeyPrompts, ...PRODUCT_PROMPTS]
      .filter((item) => {
        if (seen.has(item.href)) return false;
        seen.add(item.href);
        return true;
      })
      .slice(0, 6);
  }, [consultant, currentStep?.id, journeySnapshot.notifications, publicPage]);

  return (
    <div className="fixed bottom-5 right-5 z-50" data-testid="elee-buddy">
      {open && (
        <div className="mb-3 w-[min(calc(100vw-2rem),390px)] overflow-hidden rounded-lg border border-border bg-white shadow-xl">
          <div className="brand-gradient-bg p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <div className="font-serif text-base font-bold">ELEE Guide</div>
                </div>
                <p className="mt-1 text-xs leading-5 text-white/80">
                  Ask a question or continue your journey.
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Close ELEE AI Buddy">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-4">
            {showStudentGuide && (
              <div className="mb-3 space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    <Compass className="h-3.5 w-3.5" />
                    You are here
                  </div>
                  <div className="mt-1 font-serif text-sm font-bold text-foreground" data-testid="elee-guide-current-step">
                    {dashboardContext ? "Dashboard overview" : currentStep?.label ?? "Student journey"}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {dashboardContext
                      ? "This is your home base for tasks, universities, documents, visa, and finance."
                      : currentStep?.whatStudentDoes ?? "ELEE keeps the path simple and shows the next useful action."}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-white p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Next recommended step</div>
                  <div className="mt-1 font-serif text-sm font-bold text-foreground" data-testid="elee-guide-next-step">{nextStep.label}</div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{nextStepDetail}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={nextStep.href}>
                      <Button size="sm" className="rounded-full font-serif">
                        Continue
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Link href="/journey-map">
                      <Button size="sm" variant="outline" className="rounded-full font-serif">
                        <MapPinned className="h-3.5 w-3.5" />
                        Journey Map
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {showStudentGuide && (
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Quick jumps</div>
              )}
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
