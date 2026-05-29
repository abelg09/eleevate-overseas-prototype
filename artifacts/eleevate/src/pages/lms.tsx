import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@clerk/react";
import { Plus, BookOpen, PlayCircle, Trash2, Eye, EyeOff, GraduationCap, Save, ChevronDown, ChevronUp, HelpCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Course {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  level: string;
  examType?: string | null;
  category?: string | null;
  status: string;
  certificateEnabled: boolean;
  durationMinutes?: number | null;
  createdAt: string;
}

interface Chapter {
  id: string;
  title: string;
  videoUrl?: string | null;
  content?: string | null;
  orderIndex: number;
  quizQuestions?: QuizQuestion[] | null;
}

interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
}

export default function LmsPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [addChapterOpen, setAddChapterOpen] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const [form, setForm] = useState({ title: "", description: "", type: "student", level: "beginner", examType: "", category: "", certificateEnabled: false, durationMinutes: "" });
  const [chapterForm, setChapterForm] = useState({ title: "", videoUrl: "", content: "" });
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  const { data: myCourses } = useQuery<Course[]>({
    queryKey: ["my-courses"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/courses/admin`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      return data.data ?? [];
    },
  });

  const createCourse = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}/api/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined, examType: form.examType || undefined, category: form.category || undefined }),
      });
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-courses"] }); setCreateOpen(false); setForm({ title: "", description: "", type: "student", level: "beginner", examType: "", category: "", certificateEnabled: false, durationMinutes: "" }); },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = await getToken();
      await fetch(`${getBaseUrl()}/api/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-courses"] }),
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      await fetch(`${getBaseUrl()}/api/courses/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-courses"] }),
  });

  const loadChapters = async (courseId: string) => {
    const token = await getToken();
    const res = await fetch(`${getBaseUrl()}/api/courses/${courseId}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setChapters(data.chapters ?? []);
    setExpandedCourse(courseId);
  };

  const addChapter = useMutation({
    mutationFn: async (courseId: string) => {
      const token = await getToken();
      const payload = {
        ...chapterForm,
        orderIndex: chapters.length,
        quizQuestions: quizQuestions.length > 0 ? quizQuestions : undefined,
      };
      const res = await fetch(`${getBaseUrl()}/api/courses/${courseId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: async () => {
      if (expandedCourse) await loadChapters(expandedCourse);
      setAddChapterOpen(false);
      setChapterForm({ title: "", videoUrl: "", content: "" });
      setQuizQuestions([]);
    },
  });

  const deleteChapter = useMutation({
    mutationFn: async ({ courseId, chapterId }: { courseId: string; chapterId: string }) => {
      const token = await getToken();
      await fetch(`${getBaseUrl()}/api/courses/${courseId}/chapters/${chapterId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: async () => { if (expandedCourse) await loadChapters(expandedCourse); },
  });

  const statusColors: Record<string, string> = { draft: "bg-orange-100 text-orange-700", published: "bg-green-100 text-green-700" };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><GraduationCap className="h-8 w-8 text-primary" />LMS Course Builder</h1>
          <p className="text-muted-foreground mt-1">Create and manage e-learning courses for students and consultants</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" />New Course</Button>
      </div>

      {/* My courses */}
      <div className="space-y-3">
        {!myCourses || myCourses.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl text-muted-foreground">
            <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <div className="font-medium">No courses yet</div>
            <div className="text-sm mt-1">Create your first course to get started</div>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />Create Course</Button>
          </div>
        ) : (
          myCourses.map(course => (
            <Card key={course.id}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{course.title}</span>
                      <Badge className={`${statusColors[course.status]} border-0 text-xs`}>{course.status}</Badge>
                      <Badge variant="secondary" className="text-xs">{course.type}</Badge>
                      {course.examType && <Badge variant="outline" className="text-xs">{course.examType}</Badge>}
                    </div>
                    {course.description && <p className="text-xs text-muted-foreground mt-1 truncate">{course.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => expandedCourse === course.id ? setExpandedCourse(null) : loadChapters(course.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors">
                      {expandedCourse === course.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button onClick={() => toggleStatus.mutate({ id: course.id, status: course.status === "published" ? "draft" : "published" })}
                      className="text-muted-foreground hover:text-foreground transition-colors" title={course.status === "published" ? "Unpublish" : "Publish"}>
                      {course.status === "published" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button onClick={() => deleteCourse.mutate(course.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {expandedCourse === course.id && (
                  <div className="mt-4 space-y-2 border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Chapters ({chapters.length})</div>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setAddChapterOpen(true)}><Plus className="h-3 w-3" />Add Chapter</Button>
                    </div>
                    {chapters.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">No chapters yet</div>}
                    {chapters.map((ch, i) => (
                      <div key={ch.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                        <span className="text-xs font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{ch.title}</div>
                          {ch.videoUrl && <div className="text-xs text-muted-foreground flex items-center gap-1"><PlayCircle className="h-3 w-3" />Video attached</div>}
                        </div>
                        <button onClick={() => deleteChapter.mutate({ courseId: course.id, chapterId: ch.id })} className="text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Course Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create New Course</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input placeholder="e.g. IELTS Band 7 Complete Guide" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea placeholder="What will students learn?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 min-h-20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Audience</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Level</label>
                <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Exam Type (optional)</label>
                <Input placeholder="IELTS, GRE, GMAT…" value={form.examType} onChange={e => setForm(f => ({ ...f, examType: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Duration (min)</label>
                <Input type="number" placeholder="120" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.certificateEnabled} onCheckedChange={v => setForm(f => ({ ...f, certificateEnabled: v }))} />
              <label className="text-sm">Issue completion certificate</label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={() => createCourse.mutate()} disabled={!form.title || createCourse.isPending} className="gap-2"><Save className="h-4 w-4" />{createCourse.isPending ? "Creating…" : "Create Course"}</Button>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Chapter Dialog */}
      <Dialog open={addChapterOpen} onOpenChange={open => { setAddChapterOpen(open); if (!open) { setChapterForm({ title: "", videoUrl: "", content: "" }); setQuizQuestions([]); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Chapter</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Chapter Title *</label>
              <Input placeholder="e.g. IELTS Listening Strategies" value={chapterForm.title} onChange={e => setChapterForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Video URL (YouTube embed, optional)</label>
              <Input placeholder="https://www.youtube.com/embed/..." value={chapterForm.videoUrl} onChange={e => setChapterForm(f => ({ ...f, videoUrl: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Chapter Content</label>
              <Textarea placeholder="Key points, notes, or lesson summary…" value={chapterForm.content} onChange={e => setChapterForm(f => ({ ...f, content: e.target.value }))} className="mt-1 min-h-20" />
            </div>

            {/* Quiz Questions */}
            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Quiz Questions ({quizQuestions.length})</span>
                </div>
                <Button size="sm" variant="outline" className="text-xs gap-1"
                  onClick={() => setQuizQuestions(q => [...q, { question: "", options: ["", "", "", ""], correctIndex: 0 }])}>
                  <Plus className="h-3 w-3" />Add Question
                </Button>
              </div>
              {quizQuestions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No quiz questions yet — students can still read and watch this chapter.</p>
              )}
              {quizQuestions.map((q, qi) => (
                <div key={qi} className="bg-background border rounded-md p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-muted-foreground mt-2 shrink-0">Q{qi + 1}</span>
                    <Input
                      placeholder="Question text…"
                      value={q.question}
                      onChange={e => setQuizQuestions(qs => qs.map((item, i) => i === qi ? { ...item, question: e.target.value } : item))}
                      className="flex-1 text-sm"
                    />
                    <button onClick={() => setQuizQuestions(qs => qs.filter((_, i) => i !== qi))} className="text-muted-foreground hover:text-red-500 mt-2 shrink-0">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pl-6">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name={`correct-${qi}`}
                          checked={q.correctIndex === oi}
                          onChange={() => setQuizQuestions(qs => qs.map((item, i) => i === qi ? { ...item, correctIndex: oi } : item))}
                          className="accent-green-600 shrink-0"
                          title="Mark as correct answer"
                        />
                        <Input
                          placeholder={`Option ${oi + 1}`}
                          value={opt}
                          onChange={e => setQuizQuestions(qs => qs.map((item, i) => {
                            if (i !== qi) return item;
                            const opts = [...item.options] as [string, string, string, string];
                            opts[oi] = e.target.value;
                            return { ...item, options: opts };
                          }))}
                          className="text-xs h-7"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">Select the radio button next to the correct answer.</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => expandedCourse && addChapter.mutate(expandedCourse)} disabled={!chapterForm.title || addChapter.isPending} className="gap-2">
                <Plus className="h-4 w-4" />{addChapter.isPending ? "Adding…" : "Add Chapter"}
              </Button>
              <Button variant="outline" onClick={() => setAddChapterOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
