import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { useCompleteOnboarding } from "@workspace/api-client-react";
import type { OnboardingBodyRole } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Briefcase, Building2, ShieldCheck, Check } from "lucide-react";
import { assetUrl } from "@/lib/utils";

const COUNTRIES = ["USA", "UK", "Canada", "Australia", "Germany", "Netherlands", "Singapore", "Ireland", "France", "Sweden"];
const STUDY_LEVELS = ["undergraduate", "postgraduate", "phd", "diploma", "certificate"] as const;
const SPECIALIZATIONS = ["Undergraduate Admissions", "Postgraduate Admissions", "MBA", "PhD Programs", "Scholarships", "Visa Guidance", "Language Tests"];

type Step = "role" | "profile" | "preferences";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<OnboardingBodyRole | undefined>(undefined);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [studyLevel, setStudyLevel] = useState<typeof STUDY_LEVELS[number]>("postgraduate");
  const [agencyName, setAgencyName] = useState("");
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);

  const completeOnboarding = useCompleteOnboarding();

  const toggleCountry = (c: string) => setSelectedCountries(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleSpec = (s: string) => setSelectedSpecs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleFinish = async () => {
    if (!role) return;
    try {
      await completeOnboarding.mutateAsync({
        data: {
          role,
          firstName,
          lastName,
          targetCountries: selectedCountries,
          studyLevel,
          agencyName,
          specializations: selectedSpecs,
        }
      });
    } catch {
      // Non-fatal — navigate regardless so the user is never stuck
    }
    if (role === "consultant") {
      setLocation("/consultant/dashboard");
    } else {
      setLocation("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-10">
        <img src={assetUrl("logo.svg")} alt="EleevateOverseas" className="h-auto w-[150px]" />
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10" data-testid="onboarding-steps">
        {(["role", "profile", "preferences"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
              step === s ? "bg-primary text-primary-foreground" :
              ["role", "profile", "preferences"].indexOf(step) > i ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
            }`}>
              {["role", "profile", "preferences"].indexOf(step) > i ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < 2 && <div className="w-12 h-0.5 bg-border" />}
          </div>
        ))}
      </div>

      <Card className="w-full max-w-lg p-8 shadow-lg border border-border">
        {/* Step 1: Role */}
        {step === "role" && (
          <div data-testid="step-role">
            <h1 className="text-2xl font-bold font-serif text-foreground mb-2">Welcome to EleevateOverseas</h1>
            <p className="text-muted-foreground mb-8">How are you using the platform?</p>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => setRole("student")}
                data-testid="role-student"
                className={`p-5 rounded-xl border-2 text-left transition-all ${role === "student" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">I'm a Student</div>
                    <div className="text-sm text-muted-foreground">Discover programs and manage my applications</div>
                  </div>
                  {role === "student" && <Check className="ml-auto h-5 w-5 text-primary" />}
                </div>
              </button>
              <button
                onClick={() => setRole("consultant")}
                data-testid="role-consultant"
                className={`p-5 rounded-xl border-2 text-left transition-all ${role === "consultant" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">I'm a Consultant</div>
                    <div className="text-sm text-muted-foreground">Help students with their overseas journey</div>
                  </div>
                  {role === "consultant" && <Check className="ml-auto h-5 w-5 text-primary" />}
                </div>
              </button>
              <button
                onClick={() => setRole("partner")}
                data-testid="role-partner"
                className={`p-5 rounded-xl border-2 text-left transition-all ${role === "partner" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">I'm a Partner</div>
                    <div className="text-sm text-muted-foreground">Institution or agency partner on the platform</div>
                  </div>
                  {role === "partner" && <Check className="ml-auto h-5 w-5 text-primary" />}
                </div>
              </button>
              <button
                onClick={() => setRole("admin")}
                data-testid="role-admin"
                className={`p-5 rounded-xl border-2 text-left transition-all ${role === "admin" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">I'm an Admin</div>
                    <div className="text-sm text-muted-foreground">Platform administrator with full access</div>
                  </div>
                  {role === "admin" && <Check className="ml-auto h-5 w-5 text-primary" />}
                </div>
              </button>
            </div>
            <Button
              className="w-full mt-8"
              disabled={!role}
              onClick={() => setStep("profile")}
              data-testid="btn-next-profile"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Profile */}
        {step === "profile" && (
          <div data-testid="step-profile">
            <h1 className="text-2xl font-bold font-serif text-foreground mb-2">Tell us about yourself</h1>
            <p className="text-muted-foreground mb-8">We'll personalize your experience.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="mb-1.5">First name</Label>
                  <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" data-testid="input-first-name" />
                </div>
                <div>
                  <Label htmlFor="lastName" className="mb-1.5">Last name</Label>
                  <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" data-testid="input-last-name" />
                </div>
              </div>
              {role === "consultant" && (
                <div>
                  <Label htmlFor="agencyName" className="mb-1.5">Agency / Company name</Label>
                  <Input id="agencyName" value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="e.g. Global Study Advisors" data-testid="input-agency-name" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => setStep("role")} data-testid="btn-back-role">Back</Button>
              <Button className="flex-1" onClick={() => setStep("preferences")} disabled={!firstName.trim()} data-testid="btn-next-preferences">Continue</Button>
            </div>
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === "preferences" && (
          <div data-testid="step-preferences">
            {role === "student" ? (
              <>
                <h1 className="text-2xl font-bold font-serif text-foreground mb-2">Your study goals</h1>
                <p className="text-muted-foreground mb-6">Help us show you the most relevant programs.</p>
                <div className="space-y-6">
                  <div>
                    <Label className="mb-3 block">Target countries</Label>
                    <div className="flex flex-wrap gap-2">
                      {COUNTRIES.map(c => (
                        <button
                          key={c}
                          onClick={() => toggleCountry(c)}
                          data-testid={`country-chip-${c}`}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedCountries.includes(c) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-3 block">Study level</Label>
                    <div className="flex flex-wrap gap-2">
                      {STUDY_LEVELS.map(l => (
                        <button
                          key={l}
                          onClick={() => setStudyLevel(l)}
                          data-testid={`level-${l}`}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${studyLevel === l ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold font-serif text-foreground mb-2">Your specializations</h1>
                <p className="text-muted-foreground mb-6">What areas do you advise students in?</p>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleSpec(s)}
                      data-testid={`spec-${s.toLowerCase().replace(/ /g, "-")}`}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedSpecs.includes(s) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => setStep("profile")} data-testid="btn-back-profile">Back</Button>
              <Button
                className="flex-1"
                onClick={handleFinish}
                disabled={completeOnboarding.isPending}
                data-testid="btn-finish-onboarding"
              >
                {completeOnboarding.isPending ? "Setting up..." : "Go to dashboard"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
