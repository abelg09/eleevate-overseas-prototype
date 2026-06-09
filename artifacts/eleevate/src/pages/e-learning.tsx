import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@clerk/react";
import { isDemoMode } from "@/lib/demo-mode";

// Static starter courses so the page is populated on fresh install
const STARTER_COURSES = [
  { id: "sc5", title: "Power BI for International Careers", description: "Build dashboards, model data, and present insights for part-time and graduate job readiness.", type: "student", examType: null, level: "intermediate", category: "Job Skills", thumbnailUrl: "", durationMinutes: 210, status: "published", certificateEnabled: true, createdById: "system", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), chapters: [
    { id: "c5a", courseId: "sc5", title: "Data cleaning and modelling", content: "Create a clean student employment dataset and prepare it for reporting.", orderIndex: 0, quizQuestions: [] },
    { id: "c5b", courseId: "sc5", title: "Dashboard storytelling", content: "Turn charts into a short, interview-ready portfolio story.", orderIndex: 1, quizQuestions: [] },
  ]},
  { id: "sc6", title: "Interview Skills and Country-Wise Resume", description: "Adapt your CV, LinkedIn, and interview examples for Canada, UK, Germany, and Australia.", type: "student", examType: null, level: "beginner", category: "Soft Skills", thumbnailUrl: "", durationMinutes: 150, status: "published", certificateEnabled: true, createdById: "system", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), chapters: [
    { id: "c6a", courseId: "sc6", title: "Resume positioning by country", content: "Rewrite academic and project experience into country-specific hiring language.", orderIndex: 0, quizQuestions: [] },
    { id: "c6b", courseId: "sc6", title: "Interview answer bank", content: "Build STAR examples for projects, teamwork, conflict, and career motivation.", orderIndex: 1, quizQuestions: [] },
  ]},
  { id: "sc7", title: "Digital Marketing and LinkedIn Skills", description: "Use social media, research, and portfolio signals to improve employability abroad.", type: "student", examType: null, level: "beginner", category: "Job Skills", thumbnailUrl: "", durationMinutes: 135, status: "published", certificateEnabled: false, createdById: "system", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), chapters: [
    { id: "c7a", courseId: "sc7", title: "LinkedIn profile foundation", content: "Create a search-friendly profile for university networking and part-time job discovery.", orderIndex: 0, quizQuestions: [] },
    { id: "c7b", courseId: "sc7", title: "Portfolio and content signals", content: "Publish simple evidence of learning, projects, and market awareness.", orderIndex: 1, quizQuestions: [] },
  ]},
];

interface Chapter {
  id: string;
  title: string;
  videoUrl?: string;
  content?: string;
  quizQuestions?: { question: string; options: string[]; correctIndex: number; explanation: string }[];
  orderIndex: number;
}

interface CourseWithChapters {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  examType?: string | null;
  level: string;
  category?: string | null;
  durationMinutes?: number | null;
  status: string;
  certificateEnabled: boolean;
  chapters: Chapter[];
  createdAt: string;
}

interface Enrollment {
  courseId: string;
  completedChapterIds: string[];
  completedAt?: string | null;
  certificateIssued: boolean;
}

export default function ELearningPage() {
  const { getToken } = useAuth();
  const demoMode = isDemoMode();
  const [selectedCourse, setSelectedCourse] = useState<CourseWithChapters | null>(null);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: apiCourses } = useQuery<CourseWithChapters[]>({
    queryKey: ["courses"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/courses`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      return data.data ?? [];
    },
    enabled: !demoMode,
  });

  const allCourses: CourseWithChapters[] = [
    ...STARTER_COURSES as CourseWithChapters[],
    ...(apiCourses?.filter(c => !STARTER_COURSES.find(s => s.id === c.id)) ?? []),
  ];

  const skillCourses = allCourses.filter((course) => {
    if (course.type !== "student") return false;
    if (course.examType) return false;
    if (course.category === "Language" || course.category === "Test Prep" || course.category === "Certification") return false;
    return true;
  });

  const filtered = skillCourses.filter(c => {
    if (filterCategory !== "all" && c.category !== filterCategory) return false;
    return true;
  });
  const categories = ["all", ...Array.from(new Set(skillCourses.map((course) => course.category).filter(Boolean)))] as string[];

  const enroll = useMutation({
    mutationFn: async (courseId: string) => {
      if (demoMode) {
        return {
          courseId,
          completedChapterIds: [],
          certificateIssued: false,
        } satisfies Enrollment;
      }
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/courses/${courseId}/enroll`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      return res.json() as Promise<Enrollment>;
    },
    onSuccess: (data) => setEnrollment(data),
  });

  const markChapterDone = useMutation({
    mutationFn: async ({ courseId, chapterId }: { courseId: string; chapterId: string }) => {
      if (demoMode) {
        const current = enrollment?.completedChapterIds ?? [];
        return {
          courseId,
          completedChapterIds: current.includes(chapterId) ? current : [...current, chapterId],
          certificateIssued: false,
        } satisfies Enrollment;
      }
      const token = await getToken();
      const current = enrollment?.completedChapterIds ?? [];
      const updated = current.includes(chapterId) ? current : [...current, chapterId];
      const res = await fetch(`${getBaseUrl()}/api/courses/${courseId}/enrollment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ completedChapterIds: updated }),
      });
      return res.json() as Promise<Enrollment>;
    },
    onSuccess: (data) => setEnrollment(data),
  });

  const openCourse = async (course: CourseWithChapters) => {
    setQuizAnswer(null);
    if (demoMode) {
      setSelectedCourse(course);
      setActiveChapter(course.chapters?.[0] ?? null);
      setEnrollment(null);
      return;
    }
    const token = await getToken();
    // Fetch full course detail so API-created courses get their chapters from the DB
    try {
      const r = await fetch(`${getBaseUrl()}/api/courses/${course.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const full = await r.json() as CourseWithChapters;
        const chapters = full.chapters?.length ? full.chapters : (course.chapters ?? []);
        const merged: CourseWithChapters = { ...course, ...full, chapters };
        setSelectedCourse(merged);
        setActiveChapter(chapters[0] ?? null);
      } else {
        setSelectedCourse(course);
        setActiveChapter(course.chapters?.[0] ?? null);
      }
    } catch {
      setSelectedCourse(course);
      setActiveChapter(course.chapters?.[0] ?? null);
    }
    try {
      const r = await fetch(`${getBaseUrl()}/api/courses/${course.id}/enrollment`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      setEnrollment(data);
    } catch { setEnrollment(null); }
  };

  const levelColors: Record<string, string> = { beginner: "bg-green-100 text-green-700", intermediate: "bg-yellow-100 text-yellow-700", advanced: "bg-red-100 text-red-700" };

  if (selectedCourse) {
    const chapters = selectedCourse.chapters ?? [];
    const completedIds = enrollment?.completedChapterIds ?? [];
    const isCompleted = (id: string) => (completedIds as string[]).includes(id);
    const progress = chapters.length ? Math.round(((completedIds as string[]).filter(id => chapters.find(c => c.id === id)).length / chapters.length) * 100) : 0;
    const quiz = activeChapter?.quizQuestions?.[0];

    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <button onClick={() => { setSelectedCourse(null); setActiveChapter(null); setEnrollment(null); }} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Back to skills
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{selectedCourse.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">{selectedCourse.description}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {!enrollment ? (
              <Button onClick={() => enroll.mutate(selectedCourse.id)} disabled={enroll.isPending}>Enrol Now</Button>
            ) : (
              <Badge className="bg-green-100 text-green-700 border-0 text-sm px-3 py-1.5">Enrolled</Badge>
            )}
          </div>
        </div>

        {enrollment && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm"><span>Course Progress</span><span className="font-semibold">{progress}%</span></div>
            <Progress value={progress} className="h-2" />
            {enrollment.certificateIssued && (
              <div className="mt-1 text-sm font-medium text-green-600">
                Certificate earned. Congratulations!
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chapter list */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Chapters</div>
            {chapters.map((ch, i) => (
              <button key={ch.id} onClick={() => { setActiveChapter(ch); setQuizAnswer(null); }}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3 text-sm ${activeChapter?.id === ch.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted(ch.id) ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  {isCompleted(ch.id) ? "OK" : i + 1}
                </span>
                <span className="flex-1 truncate">{ch.title}</span>
              </button>
            ))}
          </div>

          {/* Chapter content */}
          <div className="lg:col-span-2 space-y-4">
            {activeChapter && (
              <>
                <div className="text-lg font-semibold">{activeChapter.title}</div>
                {activeChapter.videoUrl && (
                  <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                      src={activeChapter.videoUrl}
                      title={activeChapter.title}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
                {activeChapter.content && (
                  <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground leading-relaxed">{activeChapter.content}</p></CardContent></Card>
                )}
                {quiz && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-semibold">Chapter Quiz</CardTitle></CardHeader>
                    <CardContent className="space-y-2.5">
                      <p className="text-sm font-medium">{quiz.question}</p>
                      {quiz.options.map((opt, idx) => {
                        let cls = "w-full text-left p-3 rounded-lg border text-sm transition-all ";
                        if (quizAnswer === null) cls += "hover:border-primary cursor-pointer";
                        else if (idx === quiz.correctIndex) cls += "border-green-500 bg-green-50 text-green-800";
                        else if (idx === quizAnswer) cls += "border-red-400 bg-red-50 text-red-700";
                        else cls += "opacity-50";
                        return (
                          <button key={idx} className={cls} onClick={() => quizAnswer === null && setQuizAnswer(idx)} disabled={quizAnswer !== null}>
                            {opt}
                            {quizAnswer !== null && idx === quiz.correctIndex && <span className="ml-2 text-xs font-semibold text-green-700">Correct</span>}
                          </button>
                        );
                      })}
                      {quizAnswer !== null && (
                        <div className={`p-3 rounded-lg text-xs ${quizAnswer === quiz.correctIndex ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
                          {quiz.explanation}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                {enrollment && (
                  <Button
                    onClick={() => markChapterDone.mutate({ courseId: selectedCourse.id, chapterId: activeChapter.id })}
                    disabled={isCompleted(activeChapter.id) || markChapterDone.isPending}
                    variant={isCompleted(activeChapter.id) ? "outline" : "default"}
                    className="gap-2"
                  >
                    {isCompleted(activeChapter.id) ? "Completed" : "Mark as Complete"}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Upskilling</h1>
        <p className="mt-1 text-muted-foreground">Build practical student skills for projects, portfolios, communication, and stronger applications.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button key={category} onClick={() => setFilterCategory(category)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${filterCategory === category ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}>
            {category === "all" ? "All skills" : category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(course => (
          <Card key={course.id} className="hover:shadow-md transition-shadow cursor-pointer flex flex-col" onClick={() => openCourse(course)}>
            <div className="flex h-28 flex-col justify-end rounded-t-lg border-b border-border bg-muted/60 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">{course.category ?? course.examType ?? "Upskilling"}</div>
              <div className="mt-1 font-serif text-lg font-bold text-foreground">{course.level}</div>
            </div>
            <CardContent className="flex-1 flex flex-col pt-4">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <Badge variant="outline" className={`text-xs ${levelColors[course.level]}`}>{course.level}</Badge>
                {course.category && <Badge variant="secondary" className="text-xs">{course.category}</Badge>}
              </div>
              <div className="font-semibold text-sm mb-1 flex-1">{course.title}</div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{course.chapters?.length ?? 0} chapters</span>
                {course.durationMinutes && <span>{course.durationMinutes} min</span>}
                {course.certificateEnabled && <span className="font-medium text-[#9A6A00]">Certificate</span>}
              </div>
              <Button size="sm" className="mt-3 w-full">Start upskilling</Button>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">No skill courses match your filters.</div>
        )}
      </div>
    </div>
  );
}
