import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, MetricCard, SectionHeader } from "@/components/common/page-shell";
import { UniversityLogo } from "@/components/common/university-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEMO_COUNTRIES, DEMO_PROGRAMS } from "@/lib/demo-catalog";
import { ensureDemoApplicationForUniversity, readDemoShortlistIds, writeDemoShortlistIds } from "@/lib/demo-flow";
import { addDemoLedgerEvent } from "@/lib/demo-journey";
import { getCourseInsight } from "@/lib/product-demo";

const all = "All";

export default function CourseFinderPage() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState(all);
  const [field, setField] = useState(all);
  const [degree, setDegree] = useState(all);
  const [maxTuition, setMaxTuition] = useState("65000");
  const [savedIds, setSavedIds] = useState(() => readDemoShortlistIds());

  const fields = useMemo(() => Array.from(new Set(DEMO_PROGRAMS.map((program) => program.field))).sort(), []);
  const filteredPrograms = useMemo(() => {
    return DEMO_PROGRAMS.filter((program) => {
      const university = program.university;
      const matchesQuery = !query.trim()
        || program.name.toLowerCase().includes(query.toLowerCase())
        || program.field.toLowerCase().includes(query.toLowerCase())
        || university?.name.toLowerCase().includes(query.toLowerCase());
      const matchesCountry = country === all || university?.country === country;
      const matchesField = field === all || program.field === field;
      const matchesDegree = degree === all || program.degree === degree;
      const matchesTuition = !maxTuition || (program.tuitionUsd ?? 0) <= Number(maxTuition);
      return matchesQuery && matchesCountry && matchesField && matchesDegree && matchesTuition;
    }).sort((a, b) => getCourseInsight(b).fitScore - getCourseInsight(a).fitScore);
  }, [country, degree, field, maxTuition, query]);

  const shortlistProgram = (programId: string, universityId: string) => {
    const next = writeDemoShortlistIds([...savedIds, universityId]);
    setSavedIds(next);
    const application = ensureDemoApplicationForUniversity(universityId, "course-finder");
    const program = DEMO_PROGRAMS.find((item) => item.id === programId);
    addDemoLedgerEvent({
      id: `ledger-course-${programId}`,
      source: "Applications",
      event: `${program?.name ?? "Course"} shortlisted`,
      studentView: "Course appears in shortlist and application planning.",
      consultantView: "Counsellor receives course-fit review task with ELEE reason.",
      revenue: "Application service opportunity",
      status: application ? "Ready" : "Queued",
    });
    toast.success("Course shortlisted and application workflow prepared.");
  };

  const averageFit = Math.round(filteredPrograms.reduce((sum, program) => sum + getCourseInsight(program).fitScore, 0) / Math.max(filteredPrograms.length, 1));
  const topCountry = filteredPrograms[0]?.university?.country ?? "Global";

  return (
    <div data-testid="course-finder-page">
      <PageHeader
        eyebrow="Discovery"
        title="Course Finder"
        description="Search programs by fit, country, tuition, intake, visa signal, career pathway, and ELEE reasoning."
        actions={(
          <Link href="/applications">
            <Button className="rounded-full font-serif">Open applications <ArrowRight className="h-3.5 w-3.5" /></Button>
          </Link>
        )}
      />

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <MetricCard label="Matched courses" value={String(filteredPrograms.length)} detail="live filter" />
        <MetricCard label="Average ELEE fit" value={`${averageFit}%`} detail="profile weighted" tone="good" />
        <MetricCard label="Top route" value={topCountry} detail="dynamic" />
        <MetricCard label="Saved universities" value={String(savedIds.length)} detail="shortlist" tone="watch" />
      </div>

      <Card className="app-card mb-5 p-4">
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.9fr_0.9fr_0.8fr_0.8fr]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search course, field, or university" data-testid="course-search" />
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={all}>All countries</SelectItem>
              {DEMO_COUNTRIES.map((item) => <SelectItem key={item.code} value={item.name}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={field} onValueChange={setField}>
            <SelectTrigger><SelectValue placeholder="Field" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={all}>All fields</SelectItem>
              {fields.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={degree} onValueChange={setDegree}>
            <SelectTrigger><SelectValue placeholder="Degree" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={all}>All degrees</SelectItem>
              <SelectItem value="master">Master</SelectItem>
              <SelectItem value="mba">MBA</SelectItem>
            </SelectContent>
          </Select>
          <Input type="number" value={maxTuition} onChange={(event) => setMaxTuition(event.target.value)} placeholder="Max tuition" />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {filteredPrograms.map((program) => {
            const insight = getCourseInsight(program);
            const university = program.university;
            const saved = savedIds.includes(program.universityId);
            return (
              <Card key={program.id} className="app-card overflow-hidden p-0" data-testid={`course-card-${program.id}`}>
                <div className="brand-gradient-bg h-1" />
                <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div>
                    <div className="flex items-start gap-4">
                      <UniversityLogo name={university?.name ?? "University"} website={university?.website} className="h-14 w-14" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="rounded-full capitalize">{program.degree}</Badge>
                          <Badge variant="outline" className="rounded-full">{program.field}</Badge>
                        </div>
                        <h2 className="mt-2 font-serif text-xl font-bold leading-tight text-foreground">{program.name}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{university?.name} · {university?.city}, {university?.country}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      <div className="rounded-lg border border-border bg-muted/35 p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Tuition</div>
                        <div className="mt-1 font-serif text-sm font-bold text-foreground">${(program.tuitionUsd ?? 0).toLocaleString()}</div>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/35 p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Duration</div>
                        <div className="mt-1 font-serif text-sm font-bold text-foreground">{program.duration} {program.durationUnit}</div>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/35 p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">IELTS</div>
                        <div className="mt-1 font-serif text-sm font-bold text-foreground">{program.ieltsRequirement ?? "Review"}</div>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/35 p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Deadline</div>
                        <div className="mt-1 font-serif text-sm font-bold text-foreground">{program.applicationDeadline}</div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-primary/15 bg-primary/5 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-primary">Why ELEE recommends it</div>
                      <p className="mt-1 text-sm leading-6 text-foreground">{insight.eleeReason}</p>
                    </div>
                  </div>

                  <aside className="rounded-lg border border-border bg-white p-4">
                    <div className="font-serif text-4xl font-bold text-foreground">{insight.fitScore}%</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">ELEE fit</div>
                    <Progress value={insight.fitScore} className="mt-3 h-2" />
                    <div className="mt-4 space-y-3 text-xs leading-5 text-muted-foreground">
                      <div><span className="font-semibold text-foreground">Career: </span>{insight.careerSignal}</div>
                      <div><span className="font-semibold text-foreground">Visa: </span>{insight.visaSignal}</div>
                      <div><span className="font-semibold text-foreground">Funding: </span>{insight.scholarshipSignal}</div>
                    </div>
                    <div className="mt-4 grid gap-2">
                      <Button onClick={() => shortlistProgram(program.id, program.universityId)} className="rounded-full font-serif" disabled={saved}>
                        {saved ? "Saved" : "Shortlist course"}
                      </Button>
                      <Link href={`/universities/${program.universityId}`}>
                        <Button variant="outline" className="w-full rounded-full font-serif">View university</Button>
                      </Link>
                    </div>
                  </aside>
                </div>
              </Card>
            );
          })}
        </div>

        <aside className="space-y-4">
          <Card className="app-card p-4">
            <SectionHeader title="ELEE next best search" description="What ELEE would ask before narrowing the list." />
            <div className="space-y-2 text-sm leading-6 text-muted-foreground">
              <div className="rounded-lg border border-border bg-muted/35 p-3">Is the family comfortable showing first-year tuition plus living cost?</div>
              <div className="rounded-lg border border-border bg-muted/35 p-3">Does the student prefer PR-aware routes or fastest completion?</div>
              <div className="rounded-lg border border-border bg-muted/35 p-3">Is SOP evidence ready for AI/data or business narrative?</div>
            </div>
          </Card>
          <Card className="app-card border-primary/20 bg-primary/5 p-4">
            <div className="font-serif text-lg font-bold text-foreground">Course action updates</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Shortlisting a course updates the shortlist, creates the application checklist, and notifies the counsellor what to review next.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
