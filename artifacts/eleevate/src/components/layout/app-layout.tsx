import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Bell, LifeBuoy } from "lucide-react";
import { Sidebar } from "./sidebar";
import { EleeBuddy } from "@/components/common/elee-buddy";
import { StudentJourneyWelcomeDialog } from "@/components/common/student-journey-welcome";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { demoUser, isDemoMode } from "@/lib/demo-mode";
import { useDemoAuthState } from "@/lib/demo-auth";
import { resetLegacyStudentWorkspaceOnce } from "@/lib/student-session-reset";
import { useStudentJourneySnapshot } from "@/lib/student-journey-state";
import { getStudentPackage } from "@/lib/student-packages";
import { useStudentWorkspaceProfile } from "@/lib/student-workspace";

function notificationToneClass(tone: string) {
  return cn(
    tone === "action" && "border-red-200 bg-red-50 text-red-800",
    tone === "upgrade" && "border-amber-200 bg-amber-50 text-amber-900",
    tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
    tone === "info" && "border-sky-200 bg-sky-50 text-sky-800",
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const consultant = location.startsWith("/consultant");
  const demoSession = useDemoAuthState();
  const journeySnapshot = useStudentJourneySnapshot();
  const profile = useStudentWorkspaceProfile();
  const selectedPackage = getStudentPackage(journeySnapshot.packageId);
  const user = consultant ? demoUser.consultant : demoUser.student;
  const section = consultant ? "Consultant workbench" : "Student journey";
  const profileName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ");
  const emailName = demoSession?.email && !demoSession.email.endsWith("@eleevate.local")
    ? demoSession.email.split("@")[0]?.replace(/[._-]+/g, " ")
    : "";
  const userName = consultant
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Consultant"
    : profileName || emailName || "Student";
  const packageTier = selectedPackage?.shortName ?? "No tier";
  const showStudentWelcome = location === "/dashboard" && !consultant && (!isDemoMode() || demoSession?.role === "student");

  useEffect(() => {
    if (!consultant) resetLegacyStudentWorkspaceOnce();
  }, [consultant]);

  useEffect(() => {
    setNotificationsOpen(false);
  }, [location]);

  const notifications = consultant ? [] : journeySnapshot.notifications;

  return (
    <div className="app-shell-bg flex min-h-screen">
      <Sidebar />
      <main className="relative z-0 min-w-0 flex-1 overflow-y-auto" data-route-scroll-container>
        <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-14 max-w-[1180px] items-center gap-3 px-4 pl-16 sm:px-6 lg:px-6 lg:pl-6">
            <div className="min-w-0 flex-1">
              <Link href={consultant ? "/consultant/dashboard" : "/journey-map"}>
                <div className="inline-block cursor-pointer rounded-md transition-colors hover:text-primary" data-testid="header-journey-link">
                  <div className="eyebrow">{section}</div>
                  <div className="mt-0.5 truncate font-serif text-sm font-bold text-foreground">
                    {userName}
                  </div>
                </div>
              </Link>
            </div>

            {!consultant && (
              <Link href="/packages" className="hidden sm:block">
                <Badge variant="outline" className="max-w-32 truncate border-primary/25 bg-primary/5 px-4 py-1.5 font-serif text-sm font-bold text-primary">
                  {packageTier}
                </Badge>
              </Link>
            )}

            {!consultant && (
              <Link
                href="/support"
                className={cn(
                  "flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-2 font-serif text-sm font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary sm:px-3",
                  location === "/support" && "border-primary/40 bg-primary/5 text-primary",
                )}
                aria-label="Support"
                data-testid="header-support-link"
              >
                <LifeBuoy className="h-4 w-4" />
                <span className="hidden sm:inline">Support</span>
              </Link>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((value) => !value)}
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                )}
                aria-label="Notifications"
                data-testid="btn-journey-notifications"
              >
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
                    {notifications.length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-10 z-50 w-[min(calc(100vw-2rem),360px)] overflow-hidden rounded-lg border border-border bg-white shadow-xl" data-testid="journey-notifications-panel">
                  <div className="border-b border-border p-3">
                    <div className="font-serif text-sm font-bold text-foreground">Journey alerts</div>
                    <p className="mt-1 text-xs text-muted-foreground">Updated from your saved profile, package, shortlist, documents, and finance actions.</p>
                  </div>
                  <div className="max-h-80 space-y-2 overflow-y-auto p-2">
                    {notifications.length === 0 ? (
                      <div className="rounded-lg border border-border bg-muted/25 p-4 text-sm text-muted-foreground">
                        Nothing urgent right now.
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <Link key={item.id} href={item.href}>
                          <div className={cn("rounded-lg border p-3 transition-all hover:shadow-sm", notificationToneClass(item.tone))}>
                            <div className="font-serif text-sm font-bold">{item.title}</div>
                            <p className="mt-1 text-xs leading-5 opacity-85">{item.detail}</p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
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
