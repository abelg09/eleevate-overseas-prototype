import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@clerk/react";
import { TrendingUp, MapPin, Users, Briefcase, Globe, Rocket, MessageCircle, ChevronRight, CheckCircle, Star, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { isDemoMode } from "@/lib/demo-mode";

interface CareerPath {
  id: string;
  field: string;
  icon: string;
  careers: { title: string; salaryRange: string; skills: string[]; demand: string }[];
  topCountries: string[];
  topPrograms: string[];
  avgTimeToJob: string;
}

interface Mentor {
  id: string;
  name: string;
  field: string;
  currentRole: string;
  location: string;
  university: string;
  graduationYear: number;
  expertise: string[];
}

interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  duration: string;
  stipend: string;
  skills: string[];
  deadline: string;
}

const demandColors: Record<string, string> = {
  "Very High": "bg-green-100 text-green-700",
  "High": "bg-blue-100 text-blue-700",
  "Moderate": "bg-yellow-100 text-yellow-700",
};

const DEMO_CAREER_PATHS: CareerPath[] = [
  {
    id: "career-ai",
    field: "AI, Data and Product",
    icon: "AI",
    careers: [
      { title: "Machine Learning Engineer", salaryRange: "$95k-$160k", skills: ["Python", "ML Ops", "Cloud"], demand: "Very High" },
      { title: "Data Product Manager", salaryRange: "$90k-$150k", skills: ["Analytics", "Roadmaps", "SQL"], demand: "High" },
    ],
    topCountries: ["Canada", "UK", "Germany", "Singapore"],
    topPrograms: ["MSc Computer Science", "MSc Data Science", "MSc AI"],
    avgTimeToJob: "4-7 months",
  },
  {
    id: "career-finance",
    field: "Finance and Consulting",
    icon: "$",
    careers: [
      { title: "Investment Analyst", salaryRange: "$70k-$120k", skills: ["Valuation", "Excel", "Markets"], demand: "High" },
      { title: "Strategy Consultant", salaryRange: "$85k-$145k", skills: ["Cases", "Research", "Storytelling"], demand: "High" },
    ],
    topCountries: ["UK", "USA", "Singapore", "Ireland"],
    topPrograms: ["MSc Finance", "MBA", "MSc Management"],
    avgTimeToJob: "3-6 months",
  },
  {
    id: "career-health",
    field: "Healthcare and Public Policy",
    icon: "+",
    careers: [
      { title: "Health Data Analyst", salaryRange: "$65k-$110k", skills: ["Biostatistics", "R", "Dashboards"], demand: "High" },
      { title: "Policy Associate", salaryRange: "$55k-$95k", skills: ["Research", "Writing", "Evaluation"], demand: "Moderate" },
    ],
    topCountries: ["Canada", "Australia", "UK", "Netherlands"],
    topPrograms: ["Master of Public Health", "Health Informatics", "Public Policy"],
    avgTimeToJob: "5-8 months",
  },
];

const DEMO_MENTORS: Mentor[] = [
  { id: "mentor-neha", name: "Neha Kapoor", field: "AI", currentRole: "Product Data Scientist at Shopify", location: "Toronto", university: "University of Toronto", graduationYear: 2023, expertise: ["Canada jobs", "Co-op", "Data science"] },
  { id: "mentor-rahul", name: "Rahul Iyer", field: "Finance", currentRole: "Associate Consultant at Deloitte", location: "London", university: "University of Leeds", graduationYear: 2022, expertise: ["UK graduate route", "Consulting", "Case interviews"] },
  { id: "mentor-sara", name: "Sara Menon", field: "Cybersecurity", currentRole: "Security Analyst at Telstra", location: "Melbourne", university: "Monash University", graduationYear: 2024, expertise: ["Australia", "Cybersecurity", "Internships"] },
];

const DEMO_INTERNSHIPS: Internship[] = [
  { id: "intern-1", title: "Data Analyst Intern", company: "Maple Fintech", location: "Toronto / Hybrid", duration: "12 weeks", stipend: "CAD 2,400/mo", skills: ["SQL", "Power BI", "Python"], deadline: "2026-06-15" },
  { id: "intern-2", title: "Product Marketing Intern", company: "GlobalEd SaaS", location: "London", duration: "10 weeks", stipend: "GBP 1,800/mo", skills: ["Research", "SEO", "Analytics"], deadline: "2026-06-20" },
  { id: "intern-3", title: "Cybersecurity Trainee", company: "Southern Cloud", location: "Melbourne", duration: "16 weeks", stipend: "AUD 2,200/mo", skills: ["Networks", "SOC", "Linux"], deadline: "2026-07-01" },
];

export default function CareersPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const demoMode = isDemoMode();
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null);
  const [mentorDialog, setMentorDialog] = useState<Mentor | null>(null);
  const [message, setMessage] = useState("");
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const { data: careerPaths } = useQuery<CareerPath[]>({
    queryKey: ["career-paths"],
    enabled: !demoMode,
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/careers/paths`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      return data.data ?? [];
    },
  });

  const { data: mentors } = useQuery<Mentor[]>({
    queryKey: ["mentors"],
    enabled: !demoMode,
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/careers/mentors`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      return data.data ?? [];
    },
  });

  const { data: internships } = useQuery<Internship[]>({
    queryKey: ["internships"],
    enabled: !demoMode,
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/careers/internships`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      return data.data ?? [];
    },
  });

  const { data: myRequests } = useQuery({
    queryKey: ["mentorship-requests"],
    enabled: !demoMode,
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/careers/mentorship-requests`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
  });

  const sendRequest = useMutation({
    mutationFn: async ({ mentor, msg }: { mentor: Mentor; msg: string }) => {
      if (demoMode) return;
      const token = await getToken();
      await fetch(`${getBaseUrl()}/api/careers/mentorship-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mentorName: mentor.name, mentorEmail: `${mentor.id}@eleevate.com`, mentorField: mentor.field, message: msg }),
      });
    },
    onSuccess: () => {
      if (mentorDialog) setSentIds(s => new Set([...s, mentorDialog.id]));
      qc.invalidateQueries({ queryKey: ["mentorship-requests"] });
      setMentorDialog(null);
      setMessage("");
    },
  });

  const paths = demoMode ? DEMO_CAREER_PATHS : careerPaths ?? [];
  const mentorList = demoMode ? DEMO_MENTORS : mentors ?? [];
  const internshipList = demoMode ? DEMO_INTERNSHIPS : internships ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Rocket className="h-8 w-8 text-primary" />Careers Platform</h1>
        <p className="text-muted-foreground mt-1">Explore career paths, connect with mentors, and find internships</p>
      </div>

      <Tabs defaultValue="paths">
        <TabsList>
          <TabsTrigger value="paths">Career Paths</TabsTrigger>
          <TabsTrigger value="mentors">Mentorship</TabsTrigger>
          <TabsTrigger value="internships">Internships</TabsTrigger>
        </TabsList>

        {/* Career Paths */}
        <TabsContent value="paths" className="mt-4 space-y-4">
          {!selectedPath ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paths.map(path => (
                <Card key={path.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPath(path)}>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-4xl">{path.icon}</span>
                      <div>
                        <div className="font-bold text-base">{path.field}</div>
                        <div className="text-xs text-muted-foreground">{path.careers.length} career tracks</div>
                      </div>
                      <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {path.topCountries.slice(0, 4).map(c => <Badge key={c} variant="outline" className="text-xs"><Globe className="h-2.5 w-2.5 mr-0.5" />{c}</Badge>)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{path.avgTimeToJob} to hire</span>
                      <span>{path.topPrograms[0]}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <button onClick={() => setSelectedPath(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Back to all paths
              </button>
              <div className="flex items-center gap-3">
                <span className="text-5xl">{selectedPath.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold">{selectedPath.field}</h2>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedPath.topCountries.map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPath.careers.map(career => (
                  <Card key={career.title}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="font-semibold text-sm">{career.title}</div>
                        <Badge className={`${demandColors[career.demand] ?? ""} border-0 text-xs`}>{career.demand}</Badge>
                      </div>
                      <div className="text-sm font-medium text-primary mb-2">{career.salaryRange}</div>
                      <div className="flex flex-wrap gap-1">
                        {career.skills.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Recommended Programs</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {selectedPath.topPrograms.map(p => (
                      <div key={p} className="flex items-center gap-2 text-sm"><CheckCircle className="h-3.5 w-3.5 text-green-500" />{p}</div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Time to Employment</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{selectedPath.avgTimeToJob}</div>
                    <div className="text-sm text-muted-foreground">average after graduation</div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => window.location.href = "/universities"}>Find Universities</Button>
                <Button variant="outline" onClick={() => window.location.href = "/job-board"}>Browse Jobs</Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Mentorship */}
        <TabsContent value="mentors" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Connect with alumni who have studied abroad and built international careers.</p>
            {((Array.isArray(myRequests) && myRequests.length > 0) || sentIds.size > 0) && (
              <Badge variant="secondary">{demoMode ? sentIds.size : Array.isArray(myRequests) ? myRequests.length : 0} request{(demoMode ? sentIds.size : Array.isArray(myRequests) ? myRequests.length : 0) !== 1 ? "s" : ""} sent</Badge>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mentorList.map(mentor => (
              <Card key={mentor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl flex-shrink-0">
                      {mentor.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{mentor.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{mentor.currentRole}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />{mentor.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    <Star className="h-3 w-3 inline mr-1 text-yellow-500" />{mentor.university} · Class of {mentor.graduationYear}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {mentor.expertise.slice(0, 3).map(e => <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>)}
                  </div>
                  {sentIds.has(mentor.id) ? (
                    <Badge className="bg-green-100 text-green-700 border-0 gap-1 text-xs"><CheckCircle className="h-3 w-3" />Request Sent</Badge>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setMentorDialog(mentor)}>
                      <MessageCircle className="h-3 w-3" />Request Mentorship
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Internships */}
        <TabsContent value="internships" className="mt-4 space-y-3">
          {internshipList.map(intern => (
            <Card key={intern.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{intern.title}</div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{intern.company}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{intern.location}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Closes {new Date(intern.deadline).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {intern.skills.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-sm text-primary">{intern.stipend}</div>
                    <div className="text-xs text-muted-foreground">{intern.duration}</div>
                    <Button size="sm" className="mt-2 text-xs" onClick={() => window.location.href = "/job-board"}>Apply</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Mentor Request Dialog */}
      <Dialog open={!!mentorDialog} onOpenChange={o => !o && setMentorDialog(null)}>
        <DialogContent>
          {mentorDialog && (
            <>
              <DialogHeader>
                <DialogTitle>Request Mentorship from {mentorDialog.name}</DialogTitle>
                <DialogDescription>{mentorDialog.currentRole}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {mentorDialog.expertise.map(e => <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>)}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Your Message</label>
                  <Textarea
                    placeholder={`Hi ${mentorDialog.name.split(" ")[0]}, I'm interested in learning about your experience at ${mentorDialog.university}…`}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="min-h-28"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => sendRequest.mutate({ mentor: mentorDialog, msg: message })} disabled={!message.trim() || sendRequest.isPending} className="gap-2">
                    <MessageCircle className="h-4 w-4" />{sendRequest.isPending ? "Sending…" : "Send Request"}
                  </Button>
                  <Button variant="outline" onClick={() => setMentorDialog(null)}>Cancel</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
