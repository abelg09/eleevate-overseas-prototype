import { useState, useEffect } from "react";
import { useUser } from "@clerk/react";
import {
  useGetMyConsultantProfile, useUpdateMyConsultantProfile,
  getGetMyConsultantProfileQueryKey
} from "@workspace/api-client-react";
import type { ConsultantProfile } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { User, Briefcase, Award } from "lucide-react";
import { demoUser, isDemoMode } from "@/lib/demo-mode";

const SPECIALIZATIONS = ["Undergraduate Admissions", "Postgraduate Admissions", "MBA", "PhD Programs", "Scholarships", "Visa Guidance", "Language Tests"];
const COUNTRIES = ["USA", "UK", "Canada", "Australia", "Germany", "Netherlands", "Singapore", "Ireland", "France", "Sweden"];

interface CourseEnrollment { courseId: string; completedAt: string | null; certificateIssued: boolean; }
interface Course { id: string; title: string; type: string; }
interface EnrollmentsData { enrollments: CourseEnrollment[]; courses: Course[]; }

const DEMO_CONSULTANT_PROFILE: ConsultantProfile = {
  id: "demo-consultant-profile",
  userId: "demo-consultant",
  agencyName: "Eleevate Overseas Advisory",
  licenseNumber: "EO-ADV-2026",
  yearsExperience: 9,
  bio: "Senior consultant specializing in Canada, UK, and Germany routes with a focus on profile clarity, document quality, and visa risk reduction.",
  specializations: ["Postgraduate Admissions", "Scholarships", "Visa Guidance", "Language Tests"],
  countriesServed: ["Canada", "UK", "Germany", "Australia"],
  rating: 4.8,
  totalClients: 420,
  updatedAt: "2026-05-21",
};

const DEMO_ENROLLMENTS: EnrollmentsData = {
  enrollments: [
    { courseId: "consultant-doc-review", completedAt: "2026-04-18", certificateIssued: true },
    { courseId: "visa-strategy", completedAt: "2026-05-02", certificateIssued: true },
  ],
  courses: [
    { id: "consultant-doc-review", title: "Document Review Excellence", type: "certification" },
    { id: "visa-strategy", title: "Visa Strategy and Risk Flags", type: "certification" },
  ],
};

export default function ConsultantProfilePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const demoMode = isDemoMode();

  const { data: apiEnrollmentsData } = useQuery<EnrollmentsData>({
    queryKey: ["my-enrollments"],
    enabled: !demoMode,
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch("/api/courses/my-enrollments", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return { enrollments: [], courses: [] };
      return res.json();
    },
  });

  const { data: profile, isLoading } = useGetMyConsultantProfile({
    query: { queryKey: getGetMyConsultantProfileQueryKey(), enabled: !demoMode }
  });

  const updateProfile = useUpdateMyConsultantProfile();
  const p: ConsultantProfile | undefined = demoMode ? DEMO_CONSULTANT_PROFILE : profile;
  const enrollmentsData = demoMode ? DEMO_ENROLLMENTS : apiEnrollmentsData;

  const [agencyName, setAgencyName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [bio, setBio] = useState("");
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  useEffect(() => {
    if (p) {
      setAgencyName(p.agencyName ?? "");
      setLicenseNumber(p.licenseNumber ?? "");
      setYearsExperience(p.yearsExperience?.toString() ?? "");
      setBio(p.bio ?? "");
      setSelectedSpecs(p.specializations ?? []);
      setSelectedCountries(p.countriesServed ?? []);
    }
  }, [JSON.stringify(p)]);

  const toggleSpec = (s: string) => setSelectedSpecs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleCountry = (c: string) => setSelectedCountries(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const handleSave = async () => {
    if (demoMode) {
      toast({ title: "Profile updated!", description: "Consultant preferences are saved for this review session." });
      return;
    }

    await updateProfile.mutateAsync({
      data: {
        agencyName: agencyName || undefined,
        licenseNumber: licenseNumber || undefined,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : undefined,
        bio: bio || undefined,
        specializations: selectedSpecs,
        countriesServed: selectedCountries,
      }
    });
    queryClient.invalidateQueries({ queryKey: getGetMyConsultantProfileQueryKey() });
    toast({ title: "Profile updated!", description: "Your consultant profile has been saved." });
  };

  return (
    <AppLayout>
      <div data-testid="consultant-profile-page">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-serif text-foreground">Consultant Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your professional profile and specializations.</p>
        </div>

        <Card className="p-6 border border-border mb-6" data-testid="account-info">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Account</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label className="mb-1.5">First name</Label><Input value={demoMode ? demoUser.consultant.firstName : user?.firstName ?? ""} disabled className="bg-muted/40" /></div>
            <div><Label className="mb-1.5">Last name</Label><Input value={demoMode ? demoUser.consultant.lastName : user?.lastName ?? ""} disabled className="bg-muted/40" /></div>
            <div className="sm:col-span-2"><Label className="mb-1.5">Email</Label><Input value={demoMode ? demoUser.consultant.email : user?.primaryEmailAddress?.emailAddress ?? ""} disabled className="bg-muted/40" /></div>
          </div>
        </Card>

        {!demoMode && isLoading ? (
          <Card className="p-6 border border-border mb-6"><Skeleton className="h-48 w-full" /></Card>
        ) : (
          <Card className="p-6 border border-border mb-6" data-testid="professional-info">
            <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Professional Details</h2>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5">Agency / Company</Label>
                  <Input value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="Global Study Advisors" data-testid="input-agency" />
                </div>
                <div>
                  <Label className="mb-1.5">License number</Label>
                  <Input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="e.g. ED-12345" data-testid="input-license" />
                </div>
                <div>
                  <Label className="mb-1.5">Years of experience</Label>
                  <Input value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} type="number" placeholder="e.g. 5" data-testid="input-experience" />
                </div>
              </div>
              <div>
                <Label className="mb-1.5">Bio</Label>
                <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell students about your expertise and approach..." rows={4} data-testid="input-bio" />
              </div>
              <div>
                <Label className="mb-3 block">Specializations</Label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map(s => (
                    <button key={s} onClick={() => toggleSpec(s)} data-testid={`spec-${s.toLowerCase().replace(/ /g, "-")}`}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedSpecs.includes(s) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-3 block">Countries served</Label>
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map(c => (
                    <button key={c} onClick={() => toggleCountry(c)} data-testid={`country-served-${c}`}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedCountries.includes(c) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                    >{c}</button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        <Button onClick={handleSave} disabled={updateProfile.isPending} data-testid="btn-save-profile" className="w-full sm:w-auto">
          {updateProfile.isPending ? "Saving..." : "Save changes"}
        </Button>

        {/* Certification Badges */}
        {(() => {
          const certifiedEnrollments = (enrollmentsData?.enrollments ?? []).filter(e => e.certificateIssued && e.completedAt);
          const courses = enrollmentsData?.courses ?? [];
          if (certifiedEnrollments.length === 0) return null;
          return (
            <Card className="p-6 border border-border mt-6" data-testid="certification-badges">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Certifications Earned</h2>
              <div className="flex flex-wrap gap-3">
                {certifiedEnrollments.map(enr => {
                  const course = courses.find(c => c.id === enr.courseId);
                  return (
                    <div key={enr.courseId} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Award className="h-4 w-4 text-primary flex-shrink-0" />
                      <div>
                        <div className="text-sm font-semibold text-primary">{course?.title ?? "Course Certificate"}</div>
                        <div className="text-xs text-muted-foreground">
                          Completed {enr.completedAt ? new Date(enr.completedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : ""}
                        </div>
                      </div>
                      <Badge className="ml-1 text-xs bg-primary/20 text-primary border-0">Certified</Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })()}
      </div>
    </AppLayout>
  );
}
