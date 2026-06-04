import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Bell, Search, Sparkles, UserRoundCheck } from "lucide-react";
import { Sidebar } from "./sidebar";
import { EleeBuddy } from "@/components/common/elee-buddy";
import { StudentJourneyWelcomeDialog } from "@/components/common/student-journey-welcome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { demoUser, isDemoMode } from "@/lib/demo-mode";
import { useDemoAuthState } from "@/lib/demo-auth";
import { resetLegacyStudentWorkspaceOnce } from "@/lib/student-session-reset";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const consultant = location.startsWith("/consultant");
  const demoSession = useDemoAuthState();
  const user = consultant ? demoUser.consultant : demoUser.student;
  const section = consultant ? "Consultant workbench" : "Student journey";
  const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || (consultant ? "Consultant" : "Student");
  const showStudentWelcome = location === "/dashboard" && !consultant && (!isDemoMode() || demoSession?.role === "student");

  useEffect(() => {
    if (!consultant) resetLegacyStudentWorkspaceOnce();
  }, [consultant]);

  return (
    <div className="app-shell-bg flex min-h-screen">
      <Sidebar />
      <main className="relative z-0 min-w-0 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-14 max-w-[1180px] items-center gap-3 px-4 pl-16 sm:px-6 lg:px-6 lg:pl-6">
            <div className="min-w-0 flex-1">
              <Link href={consultant ? "/consultant/dashboard" : "/journey-map"}>
                <div className="inline-block cursor-pointer rounded-md transition-colors hover:text-primary" data-testid="header-journey-link">
                  <div className="eyebrow">{section}</div>
                  <div className="mt-0.5 truncate font-serif text-sm font-bold text-foreground">
                    {isDemoMode() ? userName : "EleevateOverseas"}
                  </div>
                </div>
              </Link>
            </div>

            <div className="hidden min-w-64 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground md:flex">
              <Search className="h-4 w-4" />
              <span className="truncate">{consultant ? "Search students, documents, universities" : "Search universities, documents, tasks"}</span>
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

            <Badge variant="outline" className="hidden border-emerald-200 bg-emerald-50 text-emerald-700 sm:inline-flex">
              Global
            </Badge>
          </div>
        </header>

        <div className="mx-auto max-w-[1180px] p-4 sm:p-5 lg:p-6">
          {children}
        </div>
        <StudentJourneyWelcomeDialog enabled={showStudentWelcome} />
        <EleeBuddy compact />
      </main>
    </div>
  );
}
