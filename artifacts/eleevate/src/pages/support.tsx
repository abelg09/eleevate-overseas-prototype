import { useState } from "react";
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
  useGetSupportTickets, useCreateSupportTicket,
  getGetSupportTicketsQueryKey,
} from "@workspace/api-client-react";
import type { SupportTicket } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MessageCircle, PlusCircle, ChevronDown, ChevronUp, Clock,
  CheckCircle2, AlertCircle, XCircle, Loader2, HelpCircle,
  MessageSquare, Zap, Mail, Phone
} from "lucide-react";
import { isDemoMode, listFromApi } from "@/lib/demo-mode";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  open:        { label: "Open",        className: "bg-blue-700 text-white",   icon: Clock },
  in_progress: { label: "In Progress", className: "bg-yellow-600 text-white", icon: AlertCircle },
  resolved:    { label: "Resolved",    className: "bg-green-700 text-white", icon: CheckCircle2 },
  closed:      { label: "Closed",      className: "bg-slate-700 text-white", icon: XCircle },
};

const FAQ = [
  {
    q: "How do I apply to a university through EleevateOverseas?",
    a: "Browse universities via the Universities page, find a program you like, and click 'Apply'. This adds it to your Application Tracker. You can manage status, upload documents, and track deadlines all in one place.",
  },
  {
    q: "What documents do I need to upload?",
    a: "Required documents vary but typically include: Statement of Purpose (SOP), Letters of Recommendation (LOR), Academic Transcripts, Passport copy, English language test results (IELTS/TOEFL), and Financial proof. Upload them to your Document Vault.",
  },
  {
    q: "How does the AI shortlisting work?",
    a: "Our AI analyzes your profile — GPA, test scores, target countries, budget, and study level — against university profiles. It returns ranked universities with a match score and personalized reasons. Complete your profile for the best results.",
  },
  {
    q: "How long does a UK Student Visa take?",
    a: "A UK Student Visa typically takes 3–8 weeks. Apply up to 3 months before your course start date. You'll need a CAS number, financial evidence, and IELTS scores. Check our Visa Center for a full checklist.",
  },
  {
    q: "Can I track multiple university applications at once?",
    a: "Yes! Your Application Tracker lets you manage unlimited applications. Each has its own status (Researching → Applied → Offer → Enrolled), deadlines, and notes. Drag cards on the Kanban board or switch to Timeline view.",
  },
  {
    q: "How do I earn loyalty points?",
    a: "Earn points for: completing your profile (+100), shortlisting universities (+10), submitting applications (+50), uploading documents (+25), logging test scores (+20), daily check-ins (+5), and referring friends (+200 when they sign up). See the Rewards page.",
  },
  {
    q: "Is my data secure on EleevateOverseas?",
    a: "Yes. All documents are stored in encrypted cloud storage with per-user ownership access controls. We never share your personal information without your explicit consent. You can delete your data at any time.",
  },
  {
    q: "What is the Duolingo English Test and is it accepted?",
    a: "The Duolingo English Test (DET) is accepted by 4,000+ universities worldwide. Results come in 48 hours and cost $59 USD — much cheaper than IELTS or TOEFL. Check your target university's requirements in our Visa Center.",
  },
];

const DEMO_TICKETS: SupportTicket[] = [];

export default function SupportPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const demoMode = isDemoMode();
  const [tab, setTab] = useState<"faq" | "tickets" | "live">("faq");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [demoTickets, setDemoTickets] = useState<SupportTicket[]>(DEMO_TICKETS);

  const { data: tickets, isLoading } = useGetSupportTickets({
    query: { queryKey: getGetSupportTicketsQueryKey(), enabled: !demoMode }
  });
  const createTicket = useCreateSupportTicket();

  const ticketList = demoMode ? demoTickets : listFromApi<SupportTicket>(tickets);
  const openCount = ticketList.filter(t => t.status === "open").length;

  const handleSubmit = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      if (demoMode) {
        setDemoTickets((items) => [
          {
            id: `demo-ticket-${Date.now()}`,
            userId: "demo-student",
            subject: subject.trim(),
            body: body.trim(),
            status: "open",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...items,
        ]);
        setSubject("");
        setBody("");
        setTab("tickets");
        toast({ title: "Support ticket submitted!", description: "Ticket added to your support queue." });
        return;
      }

      await createTicket.mutateAsync({ data: { subject: subject.trim(), body: body.trim() } });
      queryClient.invalidateQueries({ queryKey: getGetSupportTicketsQueryKey() });
      setSubject("");
      setBody("");
      setTab("tickets");
      toast({ title: "Support ticket submitted!", description: "We'll get back to you within 24 hours." });
    } catch {
      toast({ title: "Failed to submit ticket", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div data-testid="support-page">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-serif text-foreground">Support Center</h1>
          <p className="text-muted-foreground mt-1">Get help, view your tickets, and find answers to common questions.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button variant={tab === "faq" ? "default" : "outline"} onClick={() => setTab("faq")} data-testid="tab-faq">
            <HelpCircle className="h-4 w-4 mr-2" /> FAQ
          </Button>
          <Button variant={tab === "tickets" ? "default" : "outline"} onClick={() => setTab("tickets")} data-testid="tab-tickets">
            <MessageCircle className="h-4 w-4 mr-2" /> My Tickets
            {openCount > 0 && <Badge className="ml-2 text-xs">{openCount}</Badge>}
          </Button>
          <Button variant={tab === "live" ? "default" : "outline"} onClick={() => setTab("live")} data-testid="tab-live-chat">
            <MessageSquare className="h-4 w-4 mr-2" /> Live Chat
          </Button>
        </div>

        {/* FAQ */}
        {tab === "faq" && (
          <div className="space-y-3" data-testid="faq-section">
            {FAQ.map((item, i) => (
              <Card key={i} className="border border-border overflow-hidden" data-testid={`faq-${i}`}>
                <button
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                >
                  <span className="font-medium text-foreground pr-4">{item.q}</span>
                  {expandedFaq === i
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  }
                </button>
                {expandedFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                    {item.a}
                  </div>
                )}
              </Card>
            ))}
            <Card className="p-6 border-2 border-primary/20 bg-primary/5 mt-6">
              <h3 className="font-semibold text-foreground mb-2">Didn't find your answer?</h3>
              <p className="text-sm text-muted-foreground mb-4">Our support team typically responds within 24 hours.</p>
              <div className="flex gap-3">
                <Button onClick={() => setTab("tickets")} data-testid="btn-open-ticket">
                  <PlusCircle className="mr-2 h-4 w-4" /> Open a Ticket
                </Button>
                <Button variant="outline" onClick={() => setTab("live")}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Live Chat
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Tickets */}
        {tab === "tickets" && (
          <div className="space-y-6" data-testid="tickets-section">
            <Card className="p-6 border border-border">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-primary" /> New Support Ticket
              </h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-1.5 block">Subject</Label>
                  <Input placeholder="Brief description of your issue" value={subject} onChange={e => setSubject(e.target.value)} data-testid="input-subject" />
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">Message</Label>
                  <Textarea placeholder="Describe your issue in detail..." rows={5} value={body} onChange={e => setBody(e.target.value)} data-testid="input-body" />
                </div>
                <Button onClick={handleSubmit} disabled={submitting} data-testid="btn-submit-ticket">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </Card>

            <div>
              <h2 className="font-semibold text-foreground mb-4">Your Tickets</h2>
              {!demoMode && isLoading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
              ) : ticketList.length > 0 ? (
                <div className="space-y-3" data-testid="ticket-list">
                  {ticketList.map((ticket: SupportTicket) => {
                    const cfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
                    const StatusIcon = cfg.icon;
                    return (
                      <Card key={ticket.id} className="p-5 border border-border hover:border-primary/20 transition-all" data-testid={`ticket-${ticket.id}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground text-sm">{ticket.subject}</div>
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{ticket.body}</div>
                            <div className="text-xs text-muted-foreground mt-2">{new Date(ticket.createdAt).toLocaleDateString()}</div>
                          </div>
                          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${cfg.className}`}>
                            <StatusIcon className="h-3 w-3" />{cfg.label}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-border rounded-xl">
                  <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No support tickets yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Chat */}
        {tab === "live" && (
          <div data-testid="live-chat-section">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-5 border border-border text-center" data-testid="contact-card-chat">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Live Chat</h3>
                <p className="text-xs text-muted-foreground mb-3">Instant answers during business hours (9am–6pm GMT)</p>
                <Badge variant="secondary" className="text-xs text-green-700 bg-green-100">● Online Now</Badge>
              </Card>
              <Card className="p-5 border border-border text-center" data-testid="contact-card-email">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Email Support</h3>
                <p className="text-xs text-muted-foreground mb-3">support@eleevate.app — response within 24 hours</p>
                <a href="mailto:support@eleevate.app">
                  <Button variant="outline" size="sm" className="text-xs">Send Email</Button>
                </a>
              </Card>
              <Card className="p-5 border border-border text-center" data-testid="contact-card-priority">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Priority Support</h3>
                <p className="text-xs text-muted-foreground mb-3">2-hour guaranteed response for Achiever+ tier</p>
                <Badge variant="secondary" className="text-xs">Achiever+ required</Badge>
              </Card>
            </div>

            {/* Live chat widget */}
            <Card className="border border-border overflow-hidden" data-testid="chat-widget">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/40">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">EleevateOverseas Support</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    Available — typical reply in under 3 minutes
                  </div>
                </div>
              </div>
              <div className="p-8 flex flex-col items-center justify-center text-center min-h-[300px] bg-muted/10" data-testid="chat-cta">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Start a Live Chat</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Chat with our support team in real time. We're here to help with applications, documents, visa questions, and anything else.
                </p>
                <Button size="lg" className="gap-2" data-testid="btn-start-chat">
                  <MessageSquare className="h-4 w-4" />
                  Start Chat
                </Button>
                <p className="text-xs text-muted-foreground mt-4">Live chat is available Monday–Friday, 9am–6pm GMT</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
