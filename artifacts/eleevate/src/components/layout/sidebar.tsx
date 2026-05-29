import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { useGetMe } from "@workspace/api-client-react";
import {
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { assetUrl, cn } from "@/lib/utils";
import { demoUser, isDemoMode } from "@/lib/demo-mode";
import { clearDemoAuth } from "@/lib/demo-auth";

interface NavItem {
  href: string;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const studentGroups: NavGroup[] = [
  {
    label: "Journey",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/profile", label: "Profile" },
      { href: "/elle-report", label: "ELLE Report" },
      { href: "/assessment", label: "Psychometric Test" },
      { href: "/applications", label: "Applications" },
    ],
  },
  {
    label: "Discovery",
    items: [
      { href: "/universities", label: "Universities" },
      { href: "/shortlist", label: "Shortlist" },
      { href: "/countries", label: "City Guides" },
      { href: "/news", label: "News & Newsletter" },
    ],
  },
  {
    label: "Docs & Visa",
    items: [
      { href: "/documents", label: "Document Vault" },
      { href: "/visa-center", label: "Visa Center" },
      { href: "/support", label: "Support" },
    ],
  },
  {
    label: "Upskilling & Careers",
    items: [
      { href: "/upskilling", label: "Upskilling Hub" },
      { href: "/test-prep", label: "Test Prep" },
      { href: "/mock-test", label: "Mock Test" },
      { href: "/language-hub", label: "Language Lab" },
      { href: "/careers", label: "Careers" },
      { href: "/job-board", label: "Job Board" },
      { href: "/alumni", label: "Alumni Network" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/loans", label: "Edu Loans" },
      { href: "/remittance", label: "Remittance" },
      { href: "/forex-card", label: "Forex Card" },
      { href: "/forex", label: "Forex" },
      { href: "/insurance", label: "Insurance" },
      { href: "/subscription", label: "Subscription" },
      { href: "/rewards", label: "Rewards" },
    ],
  },
];

const consultantGroups: NavGroup[] = [
  {
    label: "Workbench",
    items: [
      { href: "/consultant/dashboard", label: "Command Center" },
      { href: "/consultant/crm", label: "Lead Pipeline" },
      { href: "/consultant/counselling", label: "Counselling" },
      { href: "/consultant/chatbot", label: "AI Assistant" },
    ],
  },
  {
    label: "Applications",
    items: [
      { href: "/consultant/doc-review", label: "Doc Review" },
      { href: "/consultant/sop", label: "SOP Builder" },
      { href: "/consultant/lms", label: "LMS Builder" },
      { href: "/consultant/invoicing", label: "Invoicing" },
    ],
  },
  {
    label: "Network",
    items: [
      { href: "/universities", label: "Universities" },
      { href: "/forex", label: "Forex" },
      { href: "/upskilling", label: "Upskilling" },
      { href: "/alumni", label: "Alumni Network" },
      { href: "/news", label: "News & Newsletter" },
      { href: "/subscription", label: "Subscription" },
    ],
  },
  {
    label: "Admin & Settings",
    items: [
      { href: "/consultant/team", label: "Team" },
      { href: "/consultant/partners", label: "Partners" },
      { href: "/consultant/branding", label: "Branding" },
      { href: "/consultant/profile", label: "My Profile" },
    ],
  },
];

function useDemoRole(location: string): "student" | "consultant" {
  return location.startsWith("/consultant") ? "consultant" : "student";
}

export function Sidebar() {
  if (isDemoMode()) return <DemoSidebar />;
  return <LiveSidebar />;
}

function DemoSidebar() {
  const [location, setLocation] = useLocation();
  const role = useDemoRole(location);
  const user = role === "consultant" ? demoUser.consultant : demoUser.student;

  return (
    <SidebarShell
      location={location}
      groups={role === "consultant" ? consultantGroups : studentGroups}
      userName={`${user.firstName} ${user.lastName}`}
      userImageUrl=""
      initials={`${user.firstName[0]}${user.lastName[0]}`}
      role={role}
      onSignOut={() => {
        clearDemoAuth();
        setLocation("/");
      }}
      demo
    />
  );
}

function LiveSidebar() {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: me } = useGetMe();
  const isConsultant = me?.role === "consultant";
  const initials = [user?.firstName, user?.lastName].filter(Boolean).map((name) => name?.[0]).join("") || "U";

  return (
    <SidebarShell
      location={location}
      groups={isConsultant ? consultantGroups : studentGroups}
      userName={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "User"}
      userImageUrl={user?.imageUrl}
      initials={initials}
      role={isConsultant ? "consultant" : "student"}
      onSignOut={() => signOut()}
    />
  );
}

function SidebarShell({
  location,
  groups,
  userName,
  userImageUrl,
  initials,
  role,
  onSignOut,
  demo = false,
}: {
  location: string;
  groups: NavGroup[];
  userName: string;
  userImageUrl?: string;
  initials: string;
  role: "student" | "consultant";
  onSignOut?: () => void;
  demo?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <>
      <div className="border-b border-sidebar-border bg-white p-4">
        <Link href={role === "consultant" ? "/consultant/dashboard" : "/dashboard"}>
          <div className="flex cursor-pointer items-center gap-3" data-testid="sidebar-logo">
            <img src={assetUrl("logo.svg")} alt="EleevateOverseas" className="h-10 w-auto" />
          </div>
        </Link>
        <div className="mt-4 flex items-center gap-2">
          <Badge className="brand-gradient-bg rounded-full px-3 py-1 text-white hover:opacity-95">
            {role === "consultant" ? "Workbench" : "Journey OS"}
          </Badge>
          {demo && (
            <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
              Demo
            </Badge>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3" data-testid="sidebar-nav">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="mb-2 px-2 font-serif text-[11px] font-bold uppercase text-sidebar-foreground/50">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = location === item.href || (item.href !== "/" && location.startsWith(`${item.href}/`));
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                    <div
                      className={cn(
                        "group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
                        active
                          ? "brand-gradient-bg text-white shadow-sm"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                      data-testid={`nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 flex-shrink-0 rounded-full",
                          active ? "bg-white/90" : "bg-sidebar-foreground/25 group-hover:bg-primary",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border bg-white p-3">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3" data-testid="sidebar-user">
          <Avatar className="h-8 w-8 flex-shrink-0">
            {userImageUrl && <AvatarImage src={userImageUrl} />}
            <AvatarFallback className="brand-gradient-bg text-xs font-semibold text-white">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-sidebar-foreground">{userName}</div>
            <Badge variant="secondary" className="mt-1 rounded-full text-xs capitalize">
              {role}
            </Badge>
          </div>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="rounded-md p-1.5 text-sidebar-foreground/60 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
              data-testid="btn-sign-out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-sidebar-border bg-sidebar p-2 shadow-md lg:hidden"
        data-testid="sidebar-mobile-toggle"
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar shadow-sm lg:flex" data-testid="sidebar-desktop">
        <NavContent />
      </aside>

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        data-testid="sidebar-mobile"
      >
        <NavContent />
      </aside>
    </>
  );
}
