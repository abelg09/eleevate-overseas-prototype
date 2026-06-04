import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar, PlusCircle, Video, Clock, User, Mail, CheckCircle2,
  XCircle, AlertCircle, ExternalLink, ChevronDown, ChevronUp
} from "lucide-react";
import { isDemoMode } from "@/lib/demo-mode";

type SessionStatus = "scheduled" | "completed" | "cancelled" | "no_show";

interface CounsellingSession {
  id: string;
  studentName: string;
  studentEmail: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  meetLink?: string;
  preCallNotes?: string;
  postCallNotes?: string;
  status: SessionStatus;
  createdAt: string;
}

interface CreateSessionBody {
  studentName: string;
  studentEmail: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  preCallNotes?: string;
}

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700", icon: Clock },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
  no_show: { label: "No Show", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
};

const DEMO_SESSIONS: CounsellingSession[] = [
  {
    id: "demo-session-1",
    studentName: "Student",
    studentEmail: "jehan@example.com",
    title: "Canada finance and visa readiness call",
    scheduledAt: "2026-05-29T10:00:00.000Z",
    durationMinutes: 60,
    meetLink: "https://meet.google.com/demo-eleevate",
    preCallNotes: "Review sponsor funds, SOP progress, and University of Toronto application deadline.",
    status: "scheduled",
    createdAt: "2026-05-21T09:00:00.000Z",
  },
  {
    id: "demo-session-2",
    studentName: "Priya Nair",
    studentEmail: "priya.nair@example.com",
    title: "MBA profile building call",
    scheduledAt: "2026-05-20T14:00:00.000Z",
    durationMinutes: 45,
    postCallNotes: "Recommended GMAT target 680+, UK shortlist, and scholarship essay work.",
    status: "completed",
    createdAt: "2026-05-18T09:00:00.000Z",
  },
];

async function fetchSessions(): Promise<{ data: CounsellingSession[]; total: number }> {
  const res = await fetch("/api/consultant/sessions");
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json();
}

async function createSession(data: CreateSessionBody): Promise<CounsellingSession> {
  const res = await fetch("/api/consultant/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

async function updateSession(id: string, data: Partial<CounsellingSession>): Promise<CounsellingSession> {
  const res = await fetch(`/api/consultant/sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update session");
  return res.json();
}

function BookSessionDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    studentName: "", studentEmail: "", title: "Initial Consultation",
    scheduledAt: "", durationMinutes: 60, preCallNotes: "",
  });
  const { toast } = useToast();
  const qc = useQueryClient();

  const mut = useMutation<CounsellingSession, Error, CreateSessionBody>({
    mutationFn: createSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/consultant/sessions"] });
      setOpen(false);
      setForm({ studentName: "", studentEmail: "", title: "Initial Consultation", scheduledAt: "", durationMinutes: 60, preCallNotes: "" });
      toast({ title: "Session booked!", description: "A Google Meet link has been generated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to book session", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="btn-book-session"><PlusCircle className="mr-2 h-4 w-4" /> Book session</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Book counselling session</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Student name *</Label>
              <Input value={form.studentName} onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))} placeholder="Priya Sharma" data-testid="input-student-name" />
            </div>
            <div>
              <Label className="mb-1.5">Student email *</Label>
              <Input value={form.studentEmail} onChange={e => setForm(f => ({ ...f, studentEmail: e.target.value }))} placeholder="priya@email.com" data-testid="input-student-email" />
            </div>
          </div>
          <div>
            <Label className="mb-1.5">Session title</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Initial Consultation" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Date & time *</Label>
              <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} data-testid="input-scheduled-at" />
            </div>
            <div>
              <Label className="mb-1.5">Duration (minutes)</Label>
              <select value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5">Pre-call notes</Label>
            <Textarea value={form.preCallNotes} onChange={e => setForm(f => ({ ...f, preCallNotes: e.target.value }))} rows={3} placeholder="Topics to cover, student questions, intake form..." />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <Video className="h-4 w-4 inline mr-1.5" />A Google Meet link will be generated automatically.
          </div>
          <Button className="w-full" onClick={() => mut.mutate(form)} disabled={!form.studentName || !form.studentEmail || !form.scheduledAt || mut.isPending} data-testid="btn-submit-session">
            {mut.isPending ? "Booking..." : "Book session"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SessionCard({ session }: { session: CounsellingSession }) {
  const [expanded, setExpanded] = useState(false);
  const [postNotes, setPostNotes] = useState(session.postCallNotes ?? "");
  const { toast } = useToast();
  const qc = useQueryClient();
  const config = STATUS_CONFIG[session.status];

  const updateMut = useMutation({
    mutationFn: (data: Partial<CounsellingSession>) => updateSession(session.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/consultant/sessions"] }); toast({ title: "Session updated" }); },
  });

  const scheduled = new Date(session.scheduledAt);
  const isPast = scheduled < new Date();
  const Icon = config.icon;

  return (
    <Card className="border border-border overflow-hidden" data-testid={`session-${session.id}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`text-xs ${config.color}`}><Icon className="h-3 w-3 mr-1" />{config.label}</Badge>
            </div>
            <h3 className="font-semibold text-foreground">{session.title}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1"><User className="h-3.5 w-3.5" />{session.studentName}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" />{session.studentEmail}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 text-sm font-medium text-foreground"><Calendar className="h-4 w-4 text-primary" />{scheduled.toLocaleDateString()}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground justify-end"><Clock className="h-3.5 w-3.5" />{scheduled.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {session.durationMinutes}min</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          {session.meetLink && (
            <a href={session.meetLink} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="text-xs">
                <Video className="h-3.5 w-3.5 mr-1.5 text-blue-600" /> Join Meet <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </a>
          )}
          {session.status === "scheduled" && isPast && (
            <Button size="sm" variant="outline" className="text-xs text-green-700" onClick={() => updateMut.mutate({ status: "completed" })}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Mark done
            </Button>
          )}
          {session.status === "scheduled" && (
            <Button size="sm" variant="outline" className="text-xs text-red-700" onClick={() => updateMut.mutate({ status: "cancelled" })}>
              <XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancel
            </Button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="ml-auto text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border p-4 space-y-4 bg-muted/20">
          {session.preCallNotes && (
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Pre-call notes</Label>
              <p className="text-sm text-foreground">{session.preCallNotes}</p>
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Post-call notes</Label>
            <Textarea value={postNotes} onChange={e => setPostNotes(e.target.value)} rows={3} placeholder="What was discussed, next steps, action items..." className="text-sm" />
            <Button size="sm" className="mt-2" onClick={() => updateMut.mutate({ postCallNotes: postNotes })} disabled={updateMut.isPending}>
              {updateMut.isPending ? "Saving..." : "Save notes"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function CounsellingPage() {
  const demoMode = isDemoMode();
  const [filter, setFilter] = useState<SessionStatus | "all">("all");
  const { data, isLoading } = useQuery({
    queryKey: ["/api/consultant/sessions"],
    enabled: !demoMode,
    queryFn: fetchSessions,
  });

  const sessions = demoMode ? DEMO_SESSIONS : data?.data ?? [];
  const filtered = filter === "all" ? sessions : sessions.filter(s => s.status === filter);
  const upcoming = sessions.filter(s => s.status === "scheduled" && new Date(s.scheduledAt) >= new Date()).length;

  return (
    <AppLayout>
      <div data-testid="counselling-page">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground">Counselling Sessions</h1>
            <p className="text-muted-foreground mt-1">Schedule and manage virtual counselling sessions.</p>
          </div>
          <BookSessionDialog />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total sessions", value: sessions.length, color: "text-foreground" },
            { label: "Upcoming", value: upcoming, color: "text-blue-600" },
            { label: "Completed", value: sessions.filter(s => s.status === "completed").length, color: "text-green-600" },
            { label: "Cancelled", value: sessions.filter(s => s.status === "cancelled").length, color: "text-red-600" },
          ].map(stat => (
            <Card key={stat.label} className="p-4 border border-border">
              <div className={`text-2xl font-bold ${stat.color}`}>{isLoading ? "—" : stat.value}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{stat.label}</div>
            </Card>
          ))}
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {(["all", "scheduled", "completed", "cancelled", "no_show"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
            >{f === "all" ? "All" : STATUS_CONFIG[f].label}</button>
          ))}
        </div>

        {!demoMode && isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(session => <SessionCard key={session.id} session={session} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No sessions {filter !== "all" ? `with status "${STATUS_CONFIG[filter as SessionStatus]?.label}"` : "yet"}</h3>
            <p className="text-muted-foreground mb-6">Book your first counselling session to get started.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
