import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@clerk/react";
import { Briefcase, MapPin, Clock, Search, Building, ExternalLink, SendHorizonal, CheckCircle, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Seeded job listings visible on fresh install
const SEED_JOBS = [
  { id: "j1", title: "Junior Software Engineer", company: "CloudTech London", location: "London, UK", country: "UK", type: "full-time", salary: "£35,000–£45,000", skillsRequired: ["JavaScript", "React", "Node.js"], status: "active", logoUrl: "", companyWebsite: "https://cloudtech.example.com", description: "Join our fast-growing engineering team. We are looking for a junior software engineer passionate about building scalable web applications. You will work on React frontends and Node.js backends, contributing to products used by thousands of students across the UK.", expiresAt: "2026-07-01", postedById: "system", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z" },
  { id: "j2", title: "Data Analyst Intern", company: "FinanceEdge", location: "Toronto, Canada", country: "Canada", type: "internship", salary: "CAD $2,200/month", skillsRequired: ["Python", "SQL", "Tableau"], status: "active", logoUrl: "", companyWebsite: "", description: "A 6-month paid internship for students or recent graduates. You will analyse financial datasets, build dashboards, and present insights to senior management. Strong SQL and Excel skills required.", expiresAt: "2026-06-15", postedById: "system", createdAt: "2026-05-02T00:00:00Z", updatedAt: "2026-05-02T00:00:00Z" },
  { id: "j3", title: "Marketing Associate", company: "GlobalStudy Agency", location: "Sydney, Australia", country: "Australia", type: "full-time", salary: "AUD $55,000–$70,000", skillsRequired: ["Digital Marketing", "SEO", "Content Writing"], status: "active", logoUrl: "", companyWebsite: "", description: "We are an overseas education agency seeking a marketing associate to manage our social media, content calendar, and paid campaigns. Prior experience in education marketing is a plus.", expiresAt: "2026-06-30", postedById: "system", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z" },
  { id: "j4", title: "UX Designer", company: "DesignHive Berlin", location: "Berlin, Germany", country: "Germany", type: "full-time", salary: "€42,000–€55,000", skillsRequired: ["Figma", "User Research", "Prototyping"], status: "active", logoUrl: "", companyWebsite: "", description: "Join a creative product team designing enterprise SaaS products. You will own the design process from discovery to final handoff, working closely with product managers and developers.", expiresAt: "2026-07-15", postedById: "system", createdAt: "2026-05-02T00:00:00Z", updatedAt: "2026-05-02T00:00:00Z" },
  { id: "j5", title: "Business Development Intern", company: "EduConsult SG", location: "Singapore", country: "Singapore", type: "internship", salary: "SGD $1,800/month", skillsRequired: ["Communication", "Excel", "Research"], status: "active", logoUrl: "", companyWebsite: "", description: "Support our BD team in identifying and onboarding new university partners across South East Asia. Strong research and communication skills required.", expiresAt: "2026-06-01", postedById: "system", createdAt: "2026-05-03T00:00:00Z", updatedAt: "2026-05-03T00:00:00Z" },
  { id: "j6", title: "ML Engineer", company: "AILabs Netherlands", location: "Amsterdam, Netherlands", country: "Netherlands", type: "full-time", salary: "€60,000–€80,000", skillsRequired: ["Python", "PyTorch", "MLOps"], status: "active", logoUrl: "", companyWebsite: "", description: "Build and deploy machine learning models at scale. You will work on NLP and recommendation systems, collaborating with research scientists and product engineers.", expiresAt: "2026-08-01", postedById: "system", createdAt: "2026-05-02T00:00:00Z", updatedAt: "2026-05-02T00:00:00Z" },
];

interface Job {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  country?: string | null;
  type: string;
  salary?: string | null;
  skillsRequired: string[];
  status: string;
  description: string;
  expiresAt?: string | null;
  companyWebsite?: string | null;
  createdAt: string;
}

interface Application {
  id: string;
  jobId: string;
  status: string;
  createdAt: string;
}

const jobMatchScores: Record<string, number> = {
  j1: 95,
  j2: 93,
  j3: 62,
  j4: 81,
  j5: 68,
  j6: 90,
};

function getJobMatchScore(job: Job): number {
  if (jobMatchScores[job.id]) return jobMatchScores[job.id];
  const skills = job.skillsRequired.join(" ").toLowerCase();
  if (skills.includes("python") || skills.includes("react") || skills.includes("ml")) return 86;
  return 72;
}

export default function JobBoardPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const { data: apiJobs } = useQuery<Job[]>({
    queryKey: ["jobs"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/jobs`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      return data.data ?? [];
    },
  });

  const { data: myApplications } = useQuery<Application[]>({
    queryKey: ["my-job-applications"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/my-job-applications`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
  });

  const allJobs: Job[] = [
    ...SEED_JOBS as Job[],
    ...(apiJobs?.filter(j => !SEED_JOBS.find(s => s.id === j.id)) ?? []),
  ];

  const filtered = allJobs.filter(j => {
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !j.company.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && j.type !== typeFilter) return false;
    return true;
  });

  const apply = useMutation({
    mutationFn: async ({ jobId, cl }: { jobId: string; cl: string }) => {
      const token = await getToken();
      await fetch(`${getBaseUrl()}/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ coverLetter: cl }),
      });
    },
    onSuccess: () => {
      if (selectedJob) setAppliedIds(s => new Set([...s, selectedJob.id]));
      qc.invalidateQueries({ queryKey: ["my-job-applications"] });
      setApplyDialogOpen(false);
      setCoverLetter("");
    },
  });

  const myAppSet = new Set([
    ...(myApplications?.map(a => a.jobId) ?? []),
    ...appliedIds,
  ]);

  const typeColors: Record<string, string> = {
    "full-time": "bg-blue-100 text-blue-700",
    "internship": "bg-green-100 text-green-700",
    "part-time": "bg-orange-100 text-orange-700",
    "contract": "bg-purple-100 text-purple-700",
  };

  const statusColors: Record<string, string> = {
    applied: "bg-blue-100 text-blue-700",
    reviewing: "bg-yellow-100 text-yellow-700",
    shortlisted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    hired: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Briefcase className="h-8 w-8 text-primary" />Job Board</h1>
        <p className="text-muted-foreground mt-1">Explore jobs and internships from partner employers worldwide</p>
      </div>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse Jobs</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="applications">My Applications {myApplications && myApplications.length > 0 && `(${myApplications.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4 mt-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search jobs or companies…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(job => (
              <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedJob(job)}>
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-base">{job.title}</div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                        <Building className="h-3.5 w-3.5" />{job.company}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge className="border-0 bg-secondary text-white text-xs flex-shrink-0">{getJobMatchScore(job)}% ELEE Match</Badge>
                      <Badge className={`${typeColors[job.type] ?? ""} border-0 text-xs flex-shrink-0`}>{job.type}</Badge>
                    </div>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
                    Match with Student&apos;s MSc Computer Science profile and AI product career direction.
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                    {job.salary && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.salary}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(job.skillsRequired as string[]).slice(0, 4).map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                  </div>
                  <div className="flex items-center justify-between">
                    {job.expiresAt && <span className="text-xs text-muted-foreground">Closes {new Date(job.expiresAt).toLocaleDateString()}</span>}
                    {myAppSet.has(job.id) ? (
                      <Badge className="bg-green-100 text-green-700 border-0 gap-1 text-xs"><CheckCircle className="h-3 w-3" />Applied</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setSelectedJob(job); setApplyDialogOpen(true); }} className="gap-1.5 text-xs">
                        <SendHorizonal className="h-3 w-3" />Apply
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && <div className="col-span-full text-center py-16 text-muted-foreground">No jobs found matching your criteria.</div>}
          </div>
        </TabsContent>

        <TabsContent value="companies" className="mt-4 space-y-4">
          {(() => {
            const companyMap = new Map<string, { name: string; jobs: Job[]; website?: string | null; locations: string[] }>();
            allJobs.forEach(j => {
              if (!companyMap.has(j.company)) companyMap.set(j.company, { name: j.company, jobs: [], website: j.companyWebsite, locations: [] });
              const c = companyMap.get(j.company)!;
              c.jobs.push(j);
              if (j.location && !c.locations.includes(j.location)) c.locations.push(j.location);
            });
            const companies = [...companyMap.values()];
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companies.map(c => (
                  <Card key={c.name} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCompany(c.name)}>
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{c.name}</div>
                          {c.locations[0] && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{c.locations[0]}</div>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{c.jobs.length} open {c.jobs.length === 1 ? "position" : "positions"}</span>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {[...new Set(c.jobs.map(j => j.type))].map(t => (
                            <Badge key={t} className={`${typeColors[t] ?? ""} border-0 text-xs`}>{t}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="applications" className="mt-4">
          {!myApplications || myApplications.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">You haven't applied to any jobs yet.</div>
          ) : (
            <div className="space-y-3">
              {myApplications.map(app => {
                const job = allJobs.find(j => j.id === app.jobId);
                return (
                  <Card key={app.id}>
                    <CardContent className="py-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{job?.title ?? "Job"}</div>
                        <div className="text-xs text-muted-foreground">{job?.company} · Applied {new Date(app.createdAt).toLocaleDateString()}</div>
                      </div>
                      <Badge className={`${statusColors[app.status] ?? ""} border-0 text-xs`}>{app.status}</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Company Profile Dialog */}
      {(() => {
        const companyJobs = selectedCompany ? allJobs.filter(j => j.company === selectedCompany) : [];
        const companyWebsite = companyJobs[0]?.companyWebsite;
        const companyLocations = [...new Set(companyJobs.map(j => j.location).filter(Boolean))];
        const allSkills = [...new Set(companyJobs.flatMap(j => j.skillsRequired as string[]))];
        return (
          <Dialog open={!!selectedCompany} onOpenChange={open => !open && setSelectedCompany(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              {selectedCompany && (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <DialogTitle className="text-xl">{selectedCompany}</DialogTitle>
                        <DialogDescription className="flex items-center gap-1.5 mt-0.5">
                          {companyLocations[0] && <><MapPin className="h-3.5 w-3.5" />{companyLocations.join(", ")}</>}
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="space-y-5">
                    {companyWebsite && (
                      <a href={companyWebsite} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <Globe className="h-4 w-4" />Visit Website <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {allSkills.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold mb-2">Skills They Hire For</div>
                        <div className="flex flex-wrap gap-1.5">
                          {allSkills.slice(0, 12).map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold mb-3">Open Positions ({companyJobs.length})</div>
                      <div className="space-y-2">
                        {companyJobs.map(job => (
                          <Card key={job.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setSelectedCompany(null); setSelectedJob(job); }}>
                            <CardContent className="py-3 flex items-center justify-between gap-3">
                              <div>
                                <div className="font-medium text-sm">{job.title}</div>
                                <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                                  {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                                  {job.salary && <span>{job.salary}</span>}
                                </div>
                              </div>
                              <Badge className={`${typeColors[job.type] ?? ""} border-0 text-xs flex-shrink-0`}>{job.type}</Badge>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob && !applyDialogOpen} onOpenChange={open => !open && setSelectedJob(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedJob.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2"><Building className="h-4 w-4" />{selectedJob.company}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-0 bg-secondary text-white">{getJobMatchScore(selectedJob)}% Match with MSc Computer Science profile</Badge>
                  <Badge className={`${typeColors[selectedJob.type] ?? ""} border-0`}>{selectedJob.type}</Badge>
                  {selectedJob.location && <Badge variant="outline" className="gap-1"><MapPin className="h-3 w-3" />{selectedJob.location}</Badge>}
                  {selectedJob.salary && <Badge variant="secondary">{selectedJob.salary}</Badge>}
                </div>
                <div>
                  <div className="text-sm font-semibold mb-1">Skills Required</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedJob.skillsRequired as string[]).map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2">Job Description</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedJob.description}</p>
                </div>
                {selectedJob.companyWebsite && (
                  <a href={selectedJob.companyWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Globe className="h-4 w-4" />Company Website <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <div className="flex gap-2 pt-2">
                  {myAppSet.has(selectedJob.id) ? (
                    <Badge className="bg-green-100 text-green-700 border-0 gap-1"><CheckCircle className="h-3.5 w-3.5" />Already Applied</Badge>
                  ) : (
                    <Button onClick={() => setApplyDialogOpen(true)} className="gap-2"><SendHorizonal className="h-4 w-4" />Apply Now</Button>
                  )}
                  <Button variant="outline" onClick={() => setSelectedJob(null)}>Close</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={o => { if (!o) { setApplyDialogOpen(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription>{selectedJob?.company}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Cover Letter (optional)</label>
              <Textarea placeholder="Tell us why you're a great fit for this role…" value={coverLetter} onChange={e => setCoverLetter(e.target.value)} className="min-h-28" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => selectedJob && apply.mutate({ jobId: selectedJob.id, cl: coverLetter })} disabled={apply.isPending} className="gap-2">
                <SendHorizonal className="h-4 w-4" />{apply.isPending ? "Submitting…" : "Submit Application"}
              </Button>
              <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
