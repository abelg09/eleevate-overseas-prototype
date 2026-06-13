import { Link } from "wouter";
import { Check, Crown, GraduationCap, Sparkles, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import {
  getPackageRank,
  getStudentPackage,
  STUDENT_PACKAGES,
  useStudentPackageSelection,
  writeStudentPackageSelection,
  type StudentPackage,
} from "@/lib/student-packages";
import { useStudentJourneySnapshot } from "@/lib/student-journey-state";
import { cn } from "@/lib/utils";

const tierStyles: Record<string, string> = {
  silver: "border-slate-200 bg-slate-50 text-slate-800",
  gold: "border-amber-200 bg-amber-50 text-amber-900",
  platinum: "border-sky-200 bg-sky-50 text-sky-900",
};

const tierIcons: Record<string, React.ElementType> = {
  silver: GraduationCap,
  gold: Trophy,
  platinum: Crown,
};

function priceInr(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function PackageCard({
  pack,
  currentPackageId,
}: {
  pack: StudentPackage;
  currentPackageId?: string | null;
}) {
  const Icon = tierIcons[pack.id] ?? Sparkles;
  const currentRank = getPackageRank(currentPackageId);
  const packageRank = getPackageRank(pack.id);
  const selected = currentPackageId === pack.id;
  const upgrade = currentRank >= 0 && packageRank > currentRank;

  return (
    <Card className={cn("app-card flex h-full flex-col overflow-hidden p-0", selected && "border-primary/45 ring-1 ring-primary/25")}>
      <div className={cn("h-1.5", pack.id === "silver" && "bg-slate-400", pack.id === "gold" && "bg-amber-400", pack.id === "platinum" && "brand-gradient-bg")} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg border", tierStyles[pack.id])}>
            <Icon className="h-5 w-5" />
          </div>
          <Badge className={cn("rounded-full border", tierStyles[pack.id])}>{pack.badge}</Badge>
        </div>

        <div className="mt-5">
          <h2 className="font-serif text-2xl font-bold text-foreground">{pack.name}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{pack.summary}</p>
        </div>

        <div className="mt-5 rounded-lg border border-border bg-muted/25 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Best for</div>
          <p className="mt-1 text-sm leading-6 text-foreground">{pack.bestFor}</p>
        </div>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <div className="font-serif text-3xl font-bold text-foreground">{priceInr(pack.priceInr)}</div>
            <div className="text-xs font-semibold text-muted-foreground">{pack.duration}</div>
          </div>
          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {pack.rewardMultiplier}x rewards
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {pack.features.map((feature) => (
            <div key={feature} className="flex gap-2 text-sm leading-5 text-foreground">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Journey support</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {pack.journeySupport.map((item) => (
              <Badge key={item} variant="outline" className="rounded-full">{item}</Badge>
            ))}
          </div>
        </div>

        <Button
          className="mt-5 w-full rounded-full font-serif"
          variant={selected ? "secondary" : pack.id === "platinum" ? "default" : "outline"}
          disabled={selected}
          onClick={() => writeStudentPackageSelection(pack.id)}
          data-testid={`btn-select-package-${pack.id}`}
        >
          {selected ? "Current package" : upgrade ? `Upgrade to ${pack.shortName}` : `Choose ${pack.shortName}`}
        </Button>
      </div>
    </Card>
  );
}

export default function SubscriptionPage() {
  const selection = useStudentPackageSelection();
  const snapshot = useStudentJourneySnapshot();
  const selectedPackage = getStudentPackage(selection?.packageId);
  const nextUpgrade = selectedPackage
    ? STUDENT_PACKAGES.find((pack) => getPackageRank(pack.id) > getPackageRank(selectedPackage.id))
    : STUDENT_PACKAGES[0];

  return (
    <div data-testid="student-packages-page">
      <PageHeader
        eyebrow="Student Packages"
        title="Choose the support level for your journey"
        description="Pick Silver, Gold, or Platinum. ELEE will update the dashboard, rewards, notifications, and next prompts based on the package you choose."
        actions={
          <>
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-full font-serif">Back to dashboard</Button>
            </Link>
            <Link href="/rewards">
              <Button className="rounded-full font-serif">Open rewards</Button>
            </Link>
          </>
        }
      />

      <Card className="app-card mb-5 overflow-hidden p-0">
        <div className="brand-gradient-bg h-1.5" />
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="p-5">
            <Badge className="mb-3 rounded-full bg-primary/10 text-primary hover:bg-primary/10">
              {selectedPackage ? `${selectedPackage.shortName} active` : "No package selected"}
            </Badge>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              {selectedPackage ? selectedPackage.name : "Start with the package that matches your support needs."}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {selectedPackage
                ? `${selectedPackage.summary} Your reward multiplier is now ${selectedPackage.rewardMultiplier}x.`
                : "Packages are based on Eleevate's exam-prep model: structured lessons, mock tests, live coaching, expert feedback, and broader study-abroad support as you upgrade."}
            </p>
          </div>
          <div className="border-t border-border bg-muted/25 p-5 lg:border-l lg:border-t-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Dashboard impact</div>
            <div className="mt-2 font-serif text-3xl font-bold text-foreground">{snapshot.rewardPoints}</div>
            <div className="text-sm text-muted-foreground">current reward points</div>
            {nextUpgrade && (
              <Button
                className="mt-4 w-full rounded-full font-serif"
                onClick={() => writeStudentPackageSelection(nextUpgrade.id)}
              >
                {selectedPackage ? `Upgrade to ${nextUpgrade.shortName}` : `Choose ${nextUpgrade.shortName}`}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {STUDENT_PACKAGES.map((pack) => (
          <PackageCard key={pack.id} pack={pack} currentPackageId={selection?.packageId} />
        ))}
      </div>

      <Card className="app-card mt-5 p-5">
        <SectionHeader
          title="How package selection changes the portal"
          description="The selected package is not just a card. It affects rewards, dashboard prompts, and upgrade nudges."
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            ["Dashboard", "Shows active package and next upgrade."],
            ["ELEE", "Prioritizes prompts based on support level."],
            ["Rewards", "Applies package multiplier to earned points."],
            ["Notifications", "Shows upgrade or next-step nudges."],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-lg border border-border bg-muted/25 p-4">
              <div className="font-serif text-base font-bold text-foreground">{title}</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
