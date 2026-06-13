import { useState } from "react";
import { Link } from "wouter";
import { useUser } from "@clerk/react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useGetLoyalty, useAddLoyaltyPoints,
  getGetLoyaltyQueryKey,
} from "@workspace/api-client-react";
import type { LoyaltyData, LoyaltyLedgerEntry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Star, Gift, Users, TrendingUp, Award, Zap, Copy, CheckCircle2, Lock, ShoppingBag } from "lucide-react";
import { isDemoMode } from "@/lib/demo-mode";
import { getStudentPackage } from "@/lib/student-packages";
import { useStudentJourneySnapshot } from "@/lib/student-journey-state";

const TIER_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  Explorer:   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   gradient: "from-blue-400 to-blue-600" },
  Pathfinder: { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  gradient: "from-green-400 to-green-600" },
  Achiever:   { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", gradient: "from-purple-400 to-purple-600" },
  Ambassador: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", gradient: "from-yellow-400 to-yellow-500" },
};

const HOW_TO_EARN = [
  { event: "profile_completed",     icon: TrendingUp, label: "Complete your profile",    points: 100, description: "Fill in all student profile fields" },
  { event: "university_shortlisted",icon: Star,       label: "Shortlist a university",   points: 10,  description: "Bookmark universities you're interested in" },
  { event: "application_submitted", icon: Award,      label: "Submit an application",    points: 50,  description: "Apply to a university through the platform" },
  { event: "document_uploaded",     icon: Gift,       label: "Upload a document",        points: 25,  description: "Add a file to your Document Vault" },
  { event: "test_score_logged",     icon: Zap,        label: "Log a test score",         points: 20,  description: "Record an IELTS, TOEFL, or GRE result" },
  { event: "student_package_selected", icon: ShoppingBag, label: "Choose a package",      points: 150, description: "Select Silver, Gold, or Platinum support" },
  { event: "daily_login",           icon: CheckCircle2,label: "Daily check-in",          points: 5,   description: "Visit EleevateOverseas each day" },
];

const TIERS = [
  { name: "Explorer",   minPoints: 0,    maxPoints: 499,  perks: ["University explorer", "Basic AI recommendations", "Document vault (5 docs)"] },
  { name: "Pathfinder", minPoints: 500,  maxPoints: 1999, perks: ["Everything in Explorer", "Priority support", "Document vault (20 docs)", "Visa checklist"] },
  { name: "Achiever",   minPoints: 2000, maxPoints: 4999, perks: ["Everything in Pathfinder", "Unlimited document storage", "Advanced AI shortlisting", "Monthly advisor session"] },
  { name: "Ambassador", minPoints: 5000, maxPoints: Infinity, perks: ["Everything in Achiever", "VIP support line", "Monthly 1:1 consultant", "Early access", "2× referral bonus"] },
];

const REWARDS_CATALOG: Array<{
  id: string;
  title: string;
  description: string;
  cost: number;
  category: string;
  requiredTier?: string;
}> = [
  { id: "free_cv_review",       title: "Free CV Review",               description: "Expert consultant reviews and annotates your CV",              cost: 300,  category: "Services" },
  { id: "sop_template_pack",    title: "SOP Template Pack",            description: "10 winning Statement of Purpose templates",                   cost: 150,  category: "Resources" },
  { id: "uni_shortlist_report", title: "AI Shortlist Report (PDF)",    description: "Branded PDF export of your personalized university matches",  cost: 100,  category: "Resources" },
  { id: "priority_support",     title: "Priority Support (1 week)",    description: "Jump the queue — 2-hour response guarantee for one week",     cost: 200,  category: "Services" },
  { id: "mock_interview",       title: "Mock Admission Interview",     description: "30-minute video mock interview with a consultant",             cost: 800,  category: "Sessions", requiredTier: "Achiever" },
  { id: "fee_waiver_10",        title: "10% Application Fee Waiver",   description: "Coupon reducing the EleevateOverseas application service fee", cost: 500, category: "Discount" },
  { id: "visa_walkthrough",     title: "1:1 Visa Walkthrough",         description: "Personal visa document audit and walkthrough with an advisor", cost: 600, category: "Sessions", requiredTier: "Achiever" },
  { id: "ambassador_badge",     title: "Ambassador Digital Badge",     description: "Exclusive verified Ambassador badge for LinkedIn profile",     cost: 1000, category: "Status", requiredTier: "Ambassador" },
];

const TIER_ORDER = ["Explorer", "Pathfinder", "Achiever", "Ambassador"];

function tierRank(name: string) { return TIER_ORDER.indexOf(name); }

function getTier(points: number) {
  if (points >= 5000) return "Ambassador";
  if (points >= 2000) return "Achiever";
  if (points >= 500) return "Pathfinder";
  return "Explorer";
}

const DEMO_LOYALTY: LoyaltyData = {
  total: 0,
  tier: "Explorer",
  tiers: TIER_ORDER.map((name) => ({ name, minPoints: TIERS.find((tier) => tier.name === name)?.minPoints ?? 0, color: name })),
  ledger: [],
};

export default function RewardsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const demoMode = isDemoMode();
  const [catalogFilter, setCatalogFilter] = useState<string>("All");
  const [redeemed, setRedeemed] = useState<Set<string>>(new Set());
  const [demoLoyalty, setDemoLoyalty] = useState<LoyaltyData>(DEMO_LOYALTY);
  const journeySnapshot = useStudentJourneySnapshot();
  const selectedPackage = getStudentPackage(journeySnapshot.packageId);

  const { data: loyalty, isLoading } = useGetLoyalty({
    query: { queryKey: getGetLoyaltyQueryKey(), enabled: !demoMode }
  });
  const addPoints = useAddLoyaltyPoints();

  const journeyLedger: LoyaltyLedgerEntry[] = journeySnapshot.rewardPoints > 0
    ? [
        {
          id: "journey-progress-points",
          userId: "student",
          event: "journey_progress",
          points: journeySnapshot.rewardPoints,
          description: selectedPackage
            ? `Automatic journey points with ${selectedPackage.shortName} ${selectedPackage.rewardMultiplier}x multiplier`
            : "Automatic points from completed journey steps",
          createdAt: new Date().toISOString(),
        },
      ]
    : [];
  const visibleDemoTotal = Math.max(0, demoLoyalty.total + journeySnapshot.rewardPoints);
  const data: LoyaltyData | undefined = demoMode
    ? {
        ...demoLoyalty,
        total: visibleDemoTotal,
        tier: getTier(visibleDemoTotal),
        ledger: [...journeyLedger, ...demoLoyalty.ledger],
      }
    : loyalty;
  const currentTier = data?.tier ?? "Explorer";
  const totalPoints = data?.total ?? 0;
  const ledger: LoyaltyLedgerEntry[] = data?.ledger ?? [];

  const tierColors = TIER_COLORS[currentTier] ?? TIER_COLORS.Explorer;
  const currentTierDef = TIERS.find(t => t.name === currentTier)!;
  const nextTierDef = TIERS.find(t => t.minPoints > totalPoints);
  const progress = nextTierDef
    ? Math.round(((totalPoints - currentTierDef.minPoints) / (nextTierDef.minPoints - currentTierDef.minPoints)) * 100)
    : 100;

  // Deterministic referral code from Clerk user ID (no random)
  const referralCode = demoMode ? "START2026" : user?.id ? user.id.slice(-8).toUpperCase() : "--------";
  const referralLink = `https://eleevate.app/ref/${referralCode}`;

  const handleEarnPoints = async (event: string, label: string, points: number) => {
    try {
      if (demoMode) {
        setDemoLoyalty((current) => {
          const total = current.total + points;
          const visibleTotal = Math.max(0, total + journeySnapshot.rewardPoints);
          return {
            ...current,
            total,
            tier: getTier(visibleTotal),
            ledger: [
              {
                id: `demo-loyalty-${Date.now()}`,
                userId: "demo-student",
                event,
                points,
                description: label,
                createdAt: new Date().toISOString(),
              },
              ...current.ledger,
            ],
          };
        });
        toast({ title: `+${points} points earned!`, description: label });
        return;
      }

      await addPoints.mutateAsync({ data: { event, description: label } });
      queryClient.invalidateQueries({ queryKey: getGetLoyaltyQueryKey() });
      toast({ title: `+${points} points earned!`, description: label });
    } catch {
      toast({ title: "Failed to add points", variant: "destructive" });
    }
  };

  const handleRedeem = (item: typeof REWARDS_CATALOG[number]) => {
    if (totalPoints < item.cost) {
      toast({ title: "Insufficient points", description: `You need ${item.cost - totalPoints} more points.`, variant: "destructive" });
      return;
    }
    if (item.requiredTier && tierRank(currentTier) < tierRank(item.requiredTier)) {
      toast({ title: `${item.requiredTier} tier required`, description: "Earn more points to unlock this reward.", variant: "destructive" });
      return;
    }
    setRedeemed(prev => new Set(prev).add(item.id));
    if (demoMode) {
      setDemoLoyalty((current) => {
        const total = current.total - item.cost;
        const visibleTotal = Math.max(0, total + journeySnapshot.rewardPoints);
        return {
          ...current,
          total,
          tier: getTier(visibleTotal),
          ledger: [
            {
              id: `demo-redemption-${Date.now()}`,
              userId: "demo-student",
              event: "reward_redeemed",
              points: -item.cost,
              description: item.title,
              createdAt: new Date().toISOString(),
            },
            ...current.ledger,
          ],
        };
      });
    }
    toast({ title: `"${item.title}" redeemed!`, description: "Our team will reach out within 24 hours." });
  };

  const catalogCategories = ["All", ...Array.from(new Set(REWARDS_CATALOG.map(r => r.category)))];
  const filteredCatalog = catalogFilter === "All" ? REWARDS_CATALOG : REWARDS_CATALOG.filter(r => r.category === catalogFilter);

  return (
    <AppLayout>
      <div data-testid="rewards-page">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-serif text-foreground">Rewards</h1>
          <p className="text-muted-foreground mt-1">Earn points as each study-abroad step is completed. Packages can boost your earning rate.</p>
        </div>

        {!demoMode && isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Status + Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className={`lg:col-span-2 p-6 border-2 ${tierColors.border} ${tierColors.bg}`} data-testid="tier-card">
                <div className="flex items-center gap-3 mb-2">
                  <Star className={`h-5 w-5 ${tierColors.text}`} />
                  <Badge className={`${tierColors.bg} ${tierColors.text} border ${tierColors.border} font-semibold`}>{currentTier}</Badge>
                </div>
                <div className="text-4xl font-bold text-foreground mt-2">{totalPoints.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total points earned</div>

                {nextTierDef && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>{totalPoints} pts</span>
                      <span>{nextTierDef.name} at {nextTierDef.minPoints.toLocaleString()} pts</span>
                    </div>
                    <div className="w-full bg-white/60 rounded-full h-2.5">
                      <div
                        className={`bg-gradient-to-r ${tierColors.gradient} h-2.5 rounded-full transition-all`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {nextTierDef.minPoints - totalPoints} more points to reach {nextTierDef.name}
                    </p>
                  </div>
                )}
                {!nextTierDef && (
                  <p className="text-sm text-muted-foreground mt-3">You've reached the highest tier — Ambassador!</p>
                )}

                <div className="mt-5 pt-5 border-t border-white/40">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Your perks</p>
                  <div className="flex flex-wrap gap-2">
                    {currentTierDef?.perks.map((perk, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 bg-white/50 rounded-full text-foreground font-medium">{perk}</span>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Referral — deterministic code */}
              <Card className="p-6 border border-border" data-testid="referral-card">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Refer & Earn</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Share your link. When a friend signs up and completes onboarding, you earn <span className="font-bold text-foreground">+200 points</span> automatically.
                </p>
                <div className="bg-muted rounded-lg px-3 py-2 text-xs font-mono text-foreground mb-3 truncate" data-testid="referral-code">
                  {referralLink}
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(referralLink);
                    toast({ title: "Referral link copied!" });
                  }}
                  data-testid="btn-copy-referral"
                >
                  <Copy className="h-4 w-4" /> Copy Link
                </Button>
                <p className="text-xs text-muted-foreground mt-3">Points are awarded automatically when your friend completes sign-up via your link.</p>
              </Card>
            </div>

            <Card className="mb-8 border border-primary/20 bg-primary/5 p-6" data-testid="package-rewards-card">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-primary">Package rewards</div>
                  <h2 className="mt-2 font-serif text-xl font-bold text-foreground">
                    {selectedPackage ? `${selectedPackage.name} is boosting your journey points` : "Choose a package to boost rewards"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {selectedPackage
                      ? `${selectedPackage.shortName} applies a ${selectedPackage.rewardMultiplier}x multiplier to eligible journey activity.`
                      : "Silver, Gold, and Platinum packages connect exam prep, applications, documents, finance prompts, and reward earning."}
                  </p>
                </div>
                <Link href="/packages">
                  <Button className="w-full rounded-full font-serif">
                    {selectedPackage ? "Manage package" : "Choose package"}
                  </Button>
                </Link>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* How to earn */}
              <Card className="p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> How to Earn Points
                </h3>
                <div className="space-y-2">
                  {HOW_TO_EARN.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/40" data-testid={`earn-item-${i}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{item.label}</div>
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="secondary" className="text-xs font-bold">+{item.points}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-primary hover:bg-primary/10"
                            onClick={() => handleEarnPoints(item.event, item.label, item.points)}
                          >
                            Earn
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Tier benefits */}
              <Card className="p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" /> Tier Benefits
                </h3>
                <div className="space-y-3">
                  {TIERS.map(tier => {
                    const c = TIER_COLORS[tier.name] ?? TIER_COLORS.Explorer;
                    const isActive = tier.name === currentTier;
                    const isUnlocked = tierRank(tier.name) <= tierRank(currentTier);
                    return (
                      <div key={tier.name} className={`p-4 rounded-xl border-2 transition-all ${isActive ? `${c.border} ${c.bg}` : "border-border"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`font-semibold text-sm flex items-center gap-1.5 ${isActive ? c.text : "text-foreground"}`}>
                            {!isUnlocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                            {tier.name}
                            {isActive && <Badge variant="default" className="text-xs ml-1">Current</Badge>}
                          </div>
                          <span className="text-xs text-muted-foreground">{tier.minPoints === 0 ? "0" : `${tier.minPoints.toLocaleString()}`}+ pts</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3">
                          {tier.perks.slice(0, 2).map((perk, i) => (
                            <span key={i} className="text-xs text-muted-foreground">• {perk}</span>
                          ))}
                          {tier.perks.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{tier.perks.length - 2} more</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Rewards Catalog */}
            <div className="mb-8" data-testid="rewards-catalog">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" /> Rewards Catalog
                </h2>
                <div className="flex gap-2">
                  {catalogCategories.map(cat => (
                    <Button key={cat} size="sm" variant={catalogFilter === cat ? "default" : "outline"} onClick={() => setCatalogFilter(cat)} className="text-xs">
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredCatalog.map(item => {
                  const isRedeemed = redeemed.has(item.id);
                  const canAfford = totalPoints >= item.cost;
                  const tierOk = !item.requiredTier || tierRank(currentTier) >= tierRank(item.requiredTier);
                  const canRedeem = canAfford && tierOk && !isRedeemed;
                  return (
                    <Card key={item.id} className="p-5 border border-border flex flex-col" data-testid={`reward-${item.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                        {item.requiredTier && (
                          <Badge variant="secondary" className="text-xs">
                            {tierRank(currentTier) < tierRank(item.requiredTier) ? <Lock className="h-3 w-3 mr-0.5 inline" /> : null}
                            {item.requiredTier}+
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-foreground mb-1">{item.title}</h3>
                      <p className="text-xs text-muted-foreground flex-1 mb-3">{item.description}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className={`font-bold text-sm ${canAfford ? "text-primary" : "text-muted-foreground"}`}>
                          {item.cost.toLocaleString()} pts
                        </span>
                        <Button
                          size="sm"
                          variant={isRedeemed ? "secondary" : "default"}
                          disabled={!canRedeem}
                          onClick={() => handleRedeem(item)}
                          className="text-xs"
                          data-testid={`btn-redeem-${item.id}`}
                        >
                          {isRedeemed ? "Redeemed" : canAfford && tierOk ? "Redeem" : "Locked"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Points Ledger */}
            <Card className="p-6 border border-border" data-testid="points-ledger">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Points History
              </h3>
              {ledger.length > 0 ? (
                <div className="space-y-2">
                  {ledger.slice(0, 20).map(entry => (
                    <div key={entry.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0" data-testid={`ledger-${entry.id}`}>
                      <div>
                        <div className="text-sm text-foreground font-medium">{entry.event}</div>
                        {entry.description && <div className="text-xs text-muted-foreground">{entry.description}</div>}
                        <div className="text-xs text-muted-foreground mt-0.5">{new Date(entry.createdAt).toLocaleDateString()}</div>
                      </div>
                      <Badge className={`${entry.points > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} font-bold`}>
                        {entry.points > 0 ? "+" : ""}{entry.points}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Star className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No points earned yet. Start exploring to earn your first points!</p>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
