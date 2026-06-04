import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, LockKeyhole, UserRoundCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { assetUrl, cn } from "@/lib/utils";
import { type DemoRole, writeDemoAuth } from "@/lib/demo-auth";
import { useDemoJourneyState } from "@/lib/demo-journey";

const roleCopy: Record<DemoRole, { title: string; description: string; redirect: string }> = {
  student: {
    title: "Student Journey",
    description: "Dashboard, profile, ELEE Report, universities, applications, documents, visa, finance, and arrival support.",
    redirect: "/dashboard",
  },
  consultant: {
    title: "Consultant Workbench",
    description: "CRM, counselling, AI assistant, document review, SOP workflow, invoicing, team, partners, and branding.",
    redirect: "/consultant/dashboard",
  },
};

function getInitialRole(): DemoRole {
  const params = new URLSearchParams(window.location.search);
  return params.get("role") === "consultant" ? "consultant" : "student";
}

function getRedirect(role: DemoRole) {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  if (redirect?.startsWith("/") && !redirect.startsWith("//") && redirect !== "/login") return redirect;
  return roleCopy[role].redirect;
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<DemoRole>(() => getInitialRole());
  const [email, setEmail] = useState("abel@metawareit.com");
  const activeCopy = roleCopy[role];
  const firstName = useMemo(() => email.split("@")[0]?.split(".")[0] || "there", [email]);
  const demoJourney = useDemoJourneyState();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    writeDemoAuth(role, email.trim() || "abel@metawareit.com");
    setLocation(getRedirect(role));
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f3f8fc_52%,#eef7f1_100%)] text-foreground" data-testid="login-page">
      <header className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <img src={assetUrl("logo.webp")} alt="EleevateOverseas" className="h-24 w-24 rounded-full object-cover shadow-sm ring-1 ring-border" />
        </Link>
        <Link href="/">
          <Button variant="outline" className="rounded-full border-secondary px-5 font-serif text-secondary">
            Back to site
          </Button>
        </Link>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl gap-8 px-4 pb-12 pt-4 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_460px] lg:items-center lg:px-8">
        <section>
          <Badge className="brand-gradient-bg rounded-full px-5 py-2 font-serif text-white">
            {demoJourney.mode === "canada_locked" ? "Canada route" : "Secure login"}
          </Badge>
          <h1 className="mt-6 max-w-3xl font-serif text-4xl font-bold leading-tight text-foreground md:text-6xl">
            Sign in to continue your study-abroad journey.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
            {demoJourney.countryLock ? "Your Canada route is already selected, so the portal opens with the right universities, documents, finance, and visa tasks." : "Start with broad country and university discovery, then lock the route that fits your profile and budget."}
          </p>

          <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              ["Public site", "Before login"],
              ["Student journey", "Main portal"],
              ["Workbench", "Consultant view"],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-lg border border-border bg-white/75 p-4 shadow-sm">
                <div className="font-serif text-sm font-bold text-foreground">{title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
              </div>
            ))}
          </div>

          {demoJourney.countryLock && (
            <div className="mt-5 max-w-3xl rounded-lg border border-primary/20 bg-white/80 p-4 shadow-sm">
              <div className="font-serif text-sm font-bold text-foreground">{demoJourney.countryLock.routeLabel}</div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{demoJourney.countryLock.reason}</p>
            </div>
          )}
        </section>

        <Card className="overflow-hidden border border-border bg-white p-0 shadow-xl">
          <div className="brand-gradient-bg p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <div className="font-serif text-xl font-bold">Welcome, {firstName}</div>
                <div className="mt-0.5 text-sm text-white/80">Choose the portal you want to review.</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            <div>
              <Label htmlFor="demo-email" className="text-sm font-semibold text-foreground">Email</Label>
              <Input
                id="demo-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 h-11 rounded-lg"
                data-testid="input-demo-email"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {([
                ["student", UserRoundCheck],
                ["consultant", UsersRound],
              ] as const).map(([itemRole, Icon]) => {
                const active = role === itemRole;
                return (
                  <button
                    key={itemRole}
                    type="button"
                    onClick={() => setRole(itemRole)}
                    className={cn(
                      "rounded-lg border p-4 text-left transition-all",
                      active ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-muted/30 hover:border-primary/40",
                    )}
                    data-testid={`role-${itemRole}`}
                  >
                    <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                    <div className="mt-3 font-serif text-sm font-bold text-foreground">{roleCopy[itemRole].title}</div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">{itemRole === "student" ? "Main student journey" : "Advisor operations"}</div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-lg border border-border bg-muted/35 p-4">
              <div className="font-serif text-sm font-bold text-foreground">{activeCopy.title}</div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{activeCopy.description}</p>
            </div>

            <Button type="submit" size="lg" className="w-full rounded-full font-serif" data-testid="btn-demo-login">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
