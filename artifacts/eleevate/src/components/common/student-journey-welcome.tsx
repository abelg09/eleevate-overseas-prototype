import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, CheckCircle2, MapPinned, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STUDENT_GUIDE_STEPS, STUDENT_GUIDE_WELCOME_STORAGE_KEY } from "@/lib/student-guide";
import { assetUrl } from "@/lib/utils";

function hasSeenWelcome() {
  return localStorage.getItem(STUDENT_GUIDE_WELCOME_STORAGE_KEY) === "seen";
}

function markWelcomeSeen() {
  localStorage.setItem(STUDENT_GUIDE_WELCOME_STORAGE_KEY, "seen");
}

export function StudentJourneyWelcomeDialog({ enabled }: { enabled: boolean }) {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setOpen(false);
      return;
    }

    if (!enabled || hasSeenWelcome()) return;
    setOpen(true);
  }, [enabled]);

  const closeWelcome = () => {
    markWelcomeSeen();
    setOpen(false);
  };

  const viewJourneyMap = () => {
    markWelcomeSeen();
    setOpen(false);
    setLocation("/journey-map");
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) closeWelcome();
      else setOpen(value);
    }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-2xl" data-testid="student-journey-welcome">
        <div className="brand-gradient-bg h-1.5" />
        <div className="p-5 sm:p-6">
          <DialogHeader className="items-start text-left">
            <div className="mb-4 flex items-center gap-3">
              <img src={assetUrl("logo.webp")} alt="EleevateOverseas" className="h-16 w-16 rounded-full object-cover ring-1 ring-border" />
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <DialogTitle className="font-serif text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              Welcome to your study-abroad journey.
            </DialogTitle>
            <DialogDescription className="max-w-xl text-sm leading-6 text-muted-foreground">
              ELEE will guide you from profile to arrival, keeping your tasks, documents, applications, visa, and finance in order.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {STUDENT_GUIDE_STEPS.map((step, index) => (
              <Link key={step.id} href={step.href}>
                <div
                  className="group flex min-h-16 items-center gap-3 rounded-lg border border-border bg-muted/25 p-3 transition-all hover:border-primary/35 hover:bg-primary/5"
                  onClick={closeWelcome}
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-primary/15 bg-white font-serif text-xs font-bold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-sm font-bold text-foreground">{step.label}</div>
                    <div className="mt-0.5 text-xs leading-5 text-muted-foreground">{step.detail}</div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="rounded-full font-serif"
              onClick={viewJourneyMap}
              data-testid="btn-view-journey-map"
            >
              <MapPinned className="h-4 w-4" />
              View Journey Map
            </Button>
            <Button
              className="rounded-full font-serif"
              onClick={closeWelcome}
              data-testid="btn-start-journey"
            >
              Start Journey
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
