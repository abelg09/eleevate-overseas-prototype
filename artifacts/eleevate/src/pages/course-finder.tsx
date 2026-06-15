import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight, Globe2, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-shell";
import { UniversityLogo } from "@/components/common/university-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEMO_COUNTRIES, DEMO_PROGRAMS, DEMO_UNIVERSITIES } from "@/lib/demo-catalog";
import { ensureDemoApplicationForUniversity, readDemoShortlistIds, writeDemoShortlistIds } from "@/lib/demo-flow";
import { addDemoLedgerEvent } from "@/lib/demo-journey";
import { getCourseInsight } from "@/lib/product-demo";
import {
  readStudentWorkspaceProfile,
  useStudentWorkspaceProfile,
  type StudentWorkspaceProfile,
} from "@/lib/student-workspace";

const all = "All";
const DEGREE_LABELS: Record<string, string> = {
  bachelor: "Undergraduate",
  diploma: "Diploma",
  certificate: "Certificate",
  master: "Master's",
  mba: "MBA",
  phd: "PhD",
};
const DEGREE_OPTIONS = ["bachelor", "diploma", "certificate", "master", "mba", "phd"];

function normalizeCourseCountry(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "all") return all;
  const aliases: Record<string, string> = {
    uk: "United Kingdom",
    "u.k.": "United Kingdom",
    "great britain": "United Kingdom",
    britain: "United Kingdom",
    england: "United Kingdom",
    usa: "United States",
    us: "United States",
    "u.s.": "United States",
    "united states of america": "United States",
    uae: "United Arab Emirates",
  };
  const alias = aliases[normalized];
  if (alias) return DEMO_COUNTRIES.some((country) => country.name === alias) ? alias : null;
  const match = DEMO_COUNTRIES.find((country) => country.name.toLowerCase() === normalized || country.code.toLowerCase() === normalized);
  return match?.name ?? null;
}

function getProfileCourseCountry(profile: StudentWorkspaceProfile | null | undefined) {
  return normalizeCourseCountry(profile?.targetCountries?.[0] ?? profile?.preferredCountry);
}

function hasCountryQueryParam() {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).has("country");
}

function getInitialCourseCountry() {
  if (typeof window === "undefined") return all;
  const queryCountry = normalizeCourseCountry(new URLSearchParams(window.location.search).get("country"));
  if (queryCountry) return queryCountry;
  return getProfileCourseCountry(readStudentWorkspaceProfile()) ?? all;
}

function profileCountryWasInitialFilter() {
  return !hasCountryQueryParam() && Boolean(getProfileCourseCountry(readStudentWorkspaceProfile()));
}

export default function CourseFinderPage() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState(() => getInitialCourseCountry());
  const [state, setState] = useState(all);
  const [institute, setInstitute] = useState(all);
  const [degree, setDegree] = useState(all);
  const [savedIds, setSavedIds] = useState(() => readDemoShortlistIds());
  const [profileFilterApplied, setProfileFilterApplied] = useState(() => profileCountryWasInitialFilter());
  const profile = useStudentWorkspaceProfile();
  const profileCourseCountry = getProfileCourseCountry(profile);

  useEffect(() => {
    if (hasCountryQueryParam() || profileFilterApplied || country !== all || !profileCourseCountry) return;
    setCountry(profileCourseCountry);
    setState(all);
    setInstitute(all);
    setProfileFilterApplied(true);
  }, [country, profileCourseCountry, profileFilterApplied]);

  const countryUniversities = useMemo(() => (
    DEMO_UNIVERSITIES.filter((university) => country === all || university.country === country)
  ), [country]);
  const states = useMemo(() => Array.from(new Set(countryUniversities.map((university) => university.city))).sort(), [countryUniversities]);
  const cityUniversities = useMemo(() => (
    countryUniversities.filter((university) => state === all || university.city === state)
  ), [countryUniversities, state]);
  const institutes = useMemo(() => cityUniversities.map((university) => university.name).sort(), [cityUniversities]);
  const availableDegreeOptions = useMemo(() => {
    const universityIds = new Set(cityUniversities.map((university) => university.id));
    return DEGREE_OPTIONS.filter((option) => DEMO_PROGRAMS.some((program) => universityIds.has(program.universityId) && program.degree === option));
  }, [cityUniversities]);

  useEffect(() => {
    if (state !== all && !states.includes(state)) setState(all);
  }, [state, states]);

  useEffect(() => {
    if (institute !== all && !institutes.includes(institute)) setInstitute(all);
  }, [institute, institutes]);

  useEffect(() => {
    if (degree !== all && !availableDegreeOptions.includes(degree)) setDegree(all);
  }, [availableDegreeOptions, degree]);

  const filteredPrograms = useMemo(() => {
    return DEMO_PROGRAMS.filter((program) => {
      const university = program.university;
      const matchesQuery = !query.trim()
        || program.name.toLowerCase().includes(query.toLowerCase())
        || program.field.toLowerCase().includes(query.toLowerCase())
        || university?.name.toLowerCase().includes(query.toLowerCase());
      const matchesCountry = country === all || university?.country === country;
      const matchesState = state === all || university?.city === state;
      const matchesInstitute = institute === all || university?.name === institute;
      const matchesDegree = degree === all || program.degree === degree;
      return matchesQuery && matchesCountry && matchesState && matchesInstitute && matchesDegree;
    }).sort((a, b) => getCourseInsight(b).fitScore - getCourseInsight(a).fitScore);
  }, [country, degree, institute, query, state]);

  const resetFilters = () => {
    setQuery("");
    setCountry(all);
    setState(all);
    setInstitute(all);
    setDegree(all);
  };

  const applyProgram = (programId: string, universityId: string) => {
    const next = writeDemoShortlistIds([...savedIds, universityId]);
    setSavedIds(next);
    const application = ensureDemoApplicationForUniversity(universityId, "course-finder");
    const program = DEMO_PROGRAMS.find((item) => item.id === programId);
    addDemoLedgerEvent({
      id: `ledger-course-${programId}`,
      source: "Applications",
      event: `${program?.name ?? "Course"} application started`,
      studentView: "Course is saved and the application tracker is ready.",
      consultantView: "Counsellor receives course-fit review and application follow-up task.",
      revenue: "Application service opportunity",
      status: application ? "Ready" : "Queued",
    });
    toast.success("Course saved and application tracker prepared.");
  };

  return (
    <div data-testid="course-finder-page">
      <PageHeader
        eyebrow="Discovery"
        title="Course Finder"
        description="Search global programs by course, country, institution, intake, tuition, and application path."
        actions={(
          <Link href="/applications">
            <Button className="rounded-full font-serif">My applications <ArrowRight className="h-3.5 w-3.5" /></Button>
          </Link>
        )}
      />

      <Card className="app-card mb-5 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px_140px]">
          <div>
            <LabelText>What would you like to study?</LabelText>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search course, field, or university" data-testid="course-search" />
            </div>
          </div>
          <Button className="mt-6 rounded-full font-serif" onClick={() => toast.success(`${filteredPrograms.length} course matches found.`)}>
            <Search className="h-4 w-4" />
            Search
          </Button>
          <Button variant="outline" className="mt-6 rounded-full font-serif" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <LabelText>Country</LabelText>
            <Select value={country} onValueChange={(value) => { setCountry(value); setState(all); setInstitute(all); }}>
              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={all}>All countries</SelectItem>
                {DEMO_COUNTRIES.map((item) => <SelectItem key={item.code} value={item.name}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <LabelText>City</LabelText>
            <Select value={state} onValueChange={(value) => { setState(value); setInstitute(all); }}>
              <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={all}>All cities</SelectItem>
                {states.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <LabelText>Institute</LabelText>
            <Select value={institute} onValueChange={setInstitute}>
              <SelectTrigger><SelectValue placeholder="Select institute" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={all}>All institutes</SelectItem>
                {institutes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <LabelText>Level</LabelText>
            <Select value={degree} onValueChange={setDegree}>
              <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={all}>All levels</SelectItem>
                {DEGREE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option} disabled={!availableDegreeOptions.includes(option)}>
                    {DEGREE_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <Button variant="outline" className="rounded-full font-serif" onClick={() => toast.success("Advanced search fields are already visible in this prototype.")}>
            Advanced Search <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <Card className="mb-5 border border-border bg-white p-4 shadow-sm" data-testid="course-next-step">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-2 rounded-full">{savedIds.length > 0 ? "Course path active" : "Stage 3"}</Badge>
            <h2 className="font-serif text-lg font-bold text-foreground">
              {savedIds.length > 0 ? "Courses saved. Review your application tracker next." : "Choose a course to connect discovery with applications."}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              {savedIds.length > 0
                ? "Every Apply Now action saves the university, starts a research-stage application, and creates a counsellor review event."
                : "Search by subject, level, country, or institute. When you click Apply Now, ELEE saves the option and prepares the next application step."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/applications">
              <Button className="rounded-full font-serif">Open applications <ArrowRight className="h-4 w-4" /></Button>
            </Link>
            <Link href="/universities">
              <Button variant="outline" className="rounded-full font-serif">Compare universities</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold text-foreground">Course Finder</h2>
          <p className="text-sm text-muted-foreground">Total records: {filteredPrograms.length}</p>
        </div>
        <Badge variant="outline" className="w-fit rounded-full">Apply from the course card</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {filteredPrograms.map((program) => {
          const insight = getCourseInsight(program);
          const university = program.university;
          const saved = savedIds.includes(program.universityId);
          const startDate = program.startDate ? new Date(program.startDate) : null;
          return (
            <Card key={program.id} className="app-card flex min-h-[440px] flex-col overflow-hidden p-0" data-testid={`course-card-${program.id}`}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <UniversityLogo name={university?.name ?? "University"} website={university?.website} className="h-12 w-12" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-muted-foreground">{DEGREE_LABELS[program.degree] ?? program.degree}</div>
                    <h3 className="mt-1 line-clamp-2 font-serif text-base font-bold leading-tight text-foreground">{program.name}</h3>
                  </div>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Globe2 className="h-4 w-4 text-primary" />
                  {university?.country}, {university?.city}
                </p>

                <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <CourseInfo label="Application fee" value="0" />
                  <CourseInfo label="Yearly tuition fee" value={`$${(program.tuitionUsd ?? 0).toLocaleString()}`} />
                  <CourseInfo label="Duration" value={`${program.duration} ${program.durationUnit}`} />
                  <CourseInfo label="Intake months" value={startDate ? startDate.toLocaleString("en", { month: "short" }) : "Review"} />
                  <CourseInfo label="Intake years" value={startDate ? startDate.getFullYear().toString() : "Review"} />
                  <CourseInfo label="Level" value={DEGREE_LABELS[program.degree] ?? program.degree} />
                  <CourseInfo label="Requirements" value={program.ieltsRequirement ? `IELTS ${program.ieltsRequirement}` : "Review"} />
                </div>
              </div>

              <div className="mt-auto border-t border-border bg-muted/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">ELEE match {insight.fitScore}%</Badge>
                  <Link href={`/universities/${program.universityId}`}>
                    <Button variant="outline" size="sm" className="rounded-full">Details</Button>
                  </Link>
                </div>
                <Button className="w-full rounded-full font-serif" onClick={() => applyProgram(program.id, program.universityId)} disabled={saved}>
                  {saved ? "Added to applications" : "Apply Now"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredPrograms.length === 0 && (
        <Card className="app-card border-dashed p-10 text-center">
          <div className="font-serif text-lg font-bold text-foreground">No courses found</div>
          <p className="mt-2 text-sm text-muted-foreground">Reset filters or search a broader subject area.</p>
          <Button className="mt-4 rounded-full font-serif" onClick={resetFilters}>Reset search</Button>
        </Card>
      )}
    </div>
  );
}

function LabelText({ children }: { children: ReactNode }) {
  return <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">{children}</div>;
}

function CourseInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}
