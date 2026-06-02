import { Link, useLocation } from "wouter";
import { Bell, Search, Sparkles, UserRoundCheck } from "lucide-react";
import { Sidebar } from "./sidebar";
import { EleeBuddy } from "@/components/common/elee-buddy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { demoUser, isDemoMode } from "@/lib/demo-mode";
import { useDemoJourneyState } from "@/lib/demo-journey";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const consultant = location.startsWith("/consultant");
  const user = consultant ? demoUser.consultant : demoUser.student;
  const section = consultant ? "Consultant workbench" : "Student journey";
  const userName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const demoJourney = useDemoJourneyState();

  return (
    <div className="app-shell-bg flex min-h-screen">
      <Sidebar />
      <main className="relative z-0 min-w-0 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-14 max-w-[1180px] items-center gap-3 px-4 pl-16 sm:px-6 lg:px-6 lg:pl-6">
            <div className="min-w-0 flex-1">
              <div className="eyebrow">{section}</div>
              <div className="mt-0.5 truncate font-serif text-sm font-bold text-foreground">
                {isDemoMode() ? userName : "EleevateOverseas"}
              </div>
            </div>

            <div className="hidden min-w-64 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground md:flex">
              <Search className="h-4 w-4" />
              <span className="truncate">Search students, documents, universities</span>
            </div>

            <div className="hidden items-center gap-2 xl:flex">
              <Link href={consultant ? "/dashboard" : "/consultant/dashboard"}>
                <Button variant="outline" size="sm">
                  <UserRoundCheck className="h-3.5 w-3.5" />
                  {consultant ? "Student view" : "Consultant view"}
                </Button>
              </Link>
              <Link href="/elee-report">
                <Button variant={consultant ? "outline" : "default"} size="sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  ELEE
                </Button>
              </Link>
            </div>

            <button
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              )}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>

            {isDemoMode() && (
              <Badge variant="outline" className="hidden border-emerald-200 bg-emerald-50 text-emerald-700 sm:inline-flex">
                {demoJourney.mode === "canada_locked" ? "Canada demo" : "Preliminary demo"}
              </Badge>
            )}
          </div>
        </header>

        {isDemoMode() && (
          <div className="border-b border-border bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-4 py-3 pl-16 text-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-6 lg:pl-6">
              <div className="min-w-0">
                <div className="font-serif text-sm font-bold text-foreground">
                  {demoJourney.countryLock ? demoJourney.countryLock.routeLabel : "Preliminary discovery mode"}
                </div>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  {demoJourney.countryLock
                    ? `${demoJourney.countryLock.countryName} only: ${demoJourney.countryLock.cities.join(", ")} city guides, ${demoJourney.countryLock.universityIds.length} selected universities, and ${demoJourney.ledgerEvents.length} live ledger events.`
                    : "Broad first-arrival demo: countries, universities, finance, services, and consultant tools stay open for exploration."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/demo/preliminary">
                  <Button variant={demoJourney.mode === "preliminary" ? "default" : "outline"} size="sm" className="rounded-full">
                    Preliminary
                  </Button>
                </Link>
                <Link href="/demo/canada">
                  <Button variant={demoJourney.mode === "canada_locked" ? "default" : "outline"} size="sm" className="rounded-full">
                    Canada locked
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-[1180px] p-4 sm:p-5 lg:p-6">
          {children}
        </div>
        <EleeBuddy compact />
      </main>
    </div>
  );
}
