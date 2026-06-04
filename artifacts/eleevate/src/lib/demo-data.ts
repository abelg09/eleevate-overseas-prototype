import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  GraduationCap,
  Handshake,
  Landmark,
  MailCheck,
  MessageSquareText,
  Mic2,
  Plane,
  Receipt,
  ShieldCheck,
  Sparkles,
  Trophy,
  UploadCloud,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ModuleStatus = "live" | "demo" | "preview" | "deferred";
export type JourneyTaskPriority = "high" | "medium" | "low";
export type JourneyTaskStatus = "due" | "in_progress" | "blocked" | "done";

export interface JourneyTask {
  id: string;
  title: string;
  owner: "student" | "consultant" | "system";
  priority: JourneyTaskPriority;
  status: JourneyTaskStatus;
  due: string;
  module: string;
}

export interface ModuleStatusItem {
  id: string;
  title: string;
  description: string;
  status: ModuleStatus;
  progress: number;
  href: string;
  icon: LucideIcon;
}

export interface FinancialReadiness {
  budgetUsd: number;
  confirmedFundsUsd: number;
  fundingGapUsd: number;
  sponsorStrength: number;
  remittanceReadiness: number;
  notes: string[];
}

export interface DocumentChecklist {
  id: string;
  label: string;
  status: "approved" | "review" | "missing" | "ai_check";
  owner: "student" | "consultant" | "system";
}

export interface EdgeReport {
  studentName: string;
  generatedAt: string;
  clarityScore: number;
  readinessBand: string;
  preferredCountries: Array<{ country: string; score: number; rationale: string }>;
  profileInsights: Array<{ label: string; value: string; tone: "good" | "watch" | "action" }>;
  familyReadiness: Array<{ label: string; status: string; detail: string }>;
  financialReadiness: FinancialReadiness;
  documentChecklist: DocumentChecklist[];
  actionPlan: JourneyTask[];
}

export interface ConsultantWorkflowStage {
  id: string;
  stage: string;
  studentImpact: string;
  teamImpact: string;
  status: ModuleStatus;
  icon: LucideIcon;
}

export interface DemystifiedJourneyStage {
  id: string;
  stage: string;
  promise: string;
  automation: string;
  teamAction: string;
  studentAction: string;
  progress: number;
  status: ModuleStatus;
  href: string;
}

export interface ServiceOrder {
  id: string;
  service: string;
  student: string;
  amount: string;
  status: "quoted" | "awaiting_payment" | "active" | "completed";
  owner: string;
}

export const demoEdgeReport: EdgeReport = {
  studentName: "Jehan",
  generatedAt: "21 May 2026",
  clarityScore: 82,
  readinessBand: "Strong fit, finance proof needed",
  preferredCountries: [
    {
      country: "Canada",
      score: 88,
      rationale: "Strong alignment on CS programs, post-study work options, and sponsor budget.",
    },
    {
      country: "United Kingdom",
      score: 81,
      rationale: "Best for one-year masters and university brand strength; visa finances need tighter proof.",
    },
    {
      country: "Germany",
      score: 74,
      rationale: "Excellent cost profile, but language and application timing need early planning.",
    },
  ],
  profileInsights: [
    { label: "Academic Fit", value: "MSc Computer Science / AI", tone: "good" },
    { label: "Test Readiness", value: "IELTS target 7.5, current mock 7.0", tone: "action" },
    { label: "Application Story", value: "Strong project base; SOP needs sharper motivation arc", tone: "watch" },
    { label: "Career Direction", value: "AI product engineering with startup interest", tone: "good" },
  ],
  familyReadiness: [
    {
      label: "Sponsor Alignment",
      status: "Confirmed",
      detail: "Primary sponsor and bank statements identified.",
    },
    {
      label: "Parent/Guardian Clarity",
      status: "Needs briefing",
      detail: "Share country comparison and cost timeline before application fee payments.",
    },
    {
      label: "Dependent Travel",
      status: "Not planned",
      detail: "No dependent pathway needed for this intake.",
    },
  ],
  financialReadiness: {
    budgetUsd: 46000,
    confirmedFundsUsd: 38000,
    fundingGapUsd: 8000,
    sponsorStrength: 78,
    remittanceReadiness: 64,
    notes: [
      "Prepare six-month bank statement bundle before offer acceptance.",
      "Compare education loan pre-approval against CAD/GBP tuition timing.",
      "Keep remittance and tuition payment receipts in the document vault.",
    ],
  },
  documentChecklist: [
    { id: "passport", label: "Passport", status: "approved", owner: "student" },
    { id: "transcripts", label: "Academic transcripts", status: "approved", owner: "student" },
    { id: "sop", label: "Statement of Purpose", status: "ai_check", owner: "consultant" },
    { id: "lor", label: "Letters of Recommendation", status: "review", owner: "consultant" },
    { id: "finance", label: "Financial proof", status: "missing", owner: "student" },
    { id: "resume", label: "Resume / CV", status: "ai_check", owner: "consultant" },
  ],
  actionPlan: [
    {
      id: "task-finance-proof",
      title: "Upload sponsor bank statement and loan pre-approval",
      owner: "student",
      priority: "high",
      status: "due",
      due: "Today",
      module: "Finance",
    },
    {
      id: "task-sop-review",
      title: "Review AI-generated SOP and add project outcomes",
      owner: "consultant",
      priority: "high",
      status: "in_progress",
      due: "Tomorrow",
      module: "SOP Builder",
    },
    {
      id: "task-ielts",
      title: "Complete IELTS writing mock and feedback loop",
      owner: "student",
      priority: "medium",
      status: "in_progress",
      due: "24 May",
      module: "Test Prep",
    },
    {
      id: "task-family",
      title: "Send family decision brief with cost and visa timeline",
      owner: "system",
      priority: "medium",
      status: "due",
      due: "25 May",
      module: "ELEE",
    },
  ],
};

export const studentJourneyTasks: JourneyTask[] = [
  ...demoEdgeReport.actionPlan,
  {
    id: "task-application",
    title: "Confirm University of Toronto application deadline",
    owner: "student",
    priority: "high",
    status: "blocked",
    due: "26 May",
    module: "Applications",
  },
  {
    id: "task-visa-checklist",
    title: "Generate Canada visa checklist after offer upload",
    owner: "system",
    priority: "low",
    status: "done",
    due: "Completed",
    module: "Visa Center",
  },
];

export const studentModules: ModuleStatusItem[] = [
  {
    id: "edge",
    title: "ELEE Clarity Report",
    description: "Readiness score, family clarity, finances, documents, and next best action.",
    status: "demo",
    progress: 82,
    href: "/elee-report",
    icon: Sparkles,
  },
  {
    id: "applications",
    title: "Application Pipeline",
    description: "Visual tracker from shortlist through offer, visa, and enrollment.",
    status: "live",
    progress: 58,
    href: "/applications",
    icon: FileText,
  },
  {
    id: "documents",
    title: "Document Vault",
    description: "Versioned uploads, AI checks, consultant review, and status history.",
    status: "live",
    progress: 67,
    href: "/documents",
    icon: UploadCloud,
  },
  {
    id: "visa",
    title: "Visa Strategy Engine",
    description: "Country-specific checklist, sponsor validation, and team approval workflow.",
    status: "demo",
    progress: 48,
    href: "/visa-center",
    icon: ShieldCheck,
  },
  {
    id: "learning",
    title: "Upskilling Hub",
    description: "IELTS, languages, job skills, soft skills, certifications, and profile enhancement.",
    status: "demo",
    progress: 61,
    href: "/upskilling",
    icon: BookOpen,
  },
  {
    id: "career",
    title: "Careers & Alumni",
    description: "Job matching, alumni mentors, local launch support, and post-landing community.",
    status: "preview",
    progress: 34,
    href: "/alumni",
    icon: BriefcaseBusiness,
  },
  {
    id: "news",
    title: "Live News & Newsletter",
    description: "Country updates, visa rule changes, intake alerts, and family-friendly briefs.",
    status: "preview",
    progress: 28,
    href: "/news",
    icon: MessageSquareText,
  },
  {
    id: "finance",
    title: "Finance Command Center",
    description: "Edu loans, remittance, forex card, insurance, subscriptions, and rewards.",
    status: "demo",
    progress: 64,
    href: "/financial-hub",
    icon: Landmark,
  },
];

export const consultantStages: ConsultantWorkflowStage[] = [
  {
    id: "day-one",
    stage: "Personalized Guidance",
    studentImpact: "Instant package, test, country, and intake clarity.",
    teamImpact: "Automates lead qualification and first-response guidance.",
    status: "demo",
    icon: Sparkles,
  },
  {
    id: "documents",
    stage: "Document Collection",
    studentImpact: "Clear checklist, samples, uploads, and immediate validation.",
    teamImpact: "Team performs final checks instead of repetitive first-pass review.",
    status: "live",
    icon: FileCheck2,
  },
  {
    id: "narratives",
    stage: "SOP / LOR / Resume",
    studentImpact: "AI drafts structured, plagiarism-safe narratives for review.",
    teamImpact: "Consultants shift from drafting to strategic refinement.",
    status: "live",
    icon: FileText,
  },
  {
    id: "university-inbox",
    stage: "University Inbox",
    studentImpact: "Offer/query updates never get lost in email.",
    teamImpact: "AI classifies messages, downloads attachments, and creates tasks.",
    status: "preview",
    icon: MailCheck,
  },
  {
    id: "interview",
    stage: "AI Interview Coach",
    studentImpact: "Country-specific voice mock interviews and feedback.",
    teamImpact: "Team focuses on final polish and risk areas.",
    status: "demo",
    icon: Mic2,
  },
  {
    id: "visa",
    stage: "Visa Strategy",
    studentImpact: "Dynamic checklist and finance validation before submission.",
    teamImpact: "Internal AI guidance supports strong country-specific files.",
    status: "demo",
    icon: ShieldCheck,
  },
  {
    id: "post-visa",
    stage: "Post-Visa Advocacy",
    studentImpact: "Pre-departure, reviews, referrals, and alumni connection.",
    teamImpact: "Captures insights and creates referral loops.",
    status: "preview",
    icon: Trophy,
  },
];

export const demystifiedJourneyStages: DemystifiedJourneyStage[] = [
  {
    id: "smart-start",
    stage: "Smart Start",
    promise: "The student sees the country, test, costing, intake, and package path immediately.",
    automation: "Profile, test-prep route, package recommendation, costing, mock-test link, and first checklist are generated from registration details.",
    teamAction: "Counsellor reviews fit and handles nuanced questions instead of repeating first-response information.",
    studentAction: "Register, choose target country/course, and book the first test or counselling slot.",
    progress: 100,
    status: "live",
    href: "/profile",
  },
  {
    id: "document-validation",
    stage: "Document Validation",
    promise: "No more guessing which documents are needed or whether uploads are correct.",
    automation: "Country and university-specific checklists, sample formats, missing-field checks, and first-pass validation.",
    teamAction: "Consultant performs final verification only after AI flags the packet as review-ready.",
    studentAction: "Upload passport, transcripts, finance proof, resume, and required templates into the vault.",
    progress: 67,
    status: "live",
    href: "/documents",
  },
  {
    id: "narrative-studio",
    stage: "SOP, LOR & Resume Studio",
    promise: "The application story becomes structured, specific, and ready for expert refinement.",
    automation: "SOP drafts, LOR checks, resume enhancement, plagiarism-safe structure, and course-aligned narrative prompts.",
    teamAction: "Consultant sharpens strategy, motivation, course fit, and final submission tone.",
    studentAction: "Add project outcomes, target course links, recommender details, and work evidence.",
    progress: 58,
    status: "demo",
    href: "/consultant/sop",
  },
  {
    id: "university-inbox",
    stage: "University Communication",
    promise: "Offer letters, queries, missing-document requests, and updates never get lost.",
    automation: "Email classification, attachment download, CRM update, student/team notification, and task creation.",
    teamAction: "Team acts only when judgement, approval, or university response is required.",
    studentAction: "Track every university message and respond to outstanding requests on time.",
    progress: 44,
    status: "preview",
    href: "/applications",
  },
  {
    id: "interview-coach",
    stage: "Interview Coach",
    promise: "Students rehearse with country, course, finance, and university-specific questions before the final mock.",
    automation: "Voice mock interviews, confidence scoring, weak-answer detection, and financial clarity feedback.",
    teamAction: "Counsellor focuses the final mock on polish, risk, and visa confidence.",
    studentAction: "Complete practice rounds and fix weak answers before the consultant interview.",
    progress: 36,
    status: "demo",
    href: "/mock-test",
  },
  {
    id: "offer-tracking",
    stage: "Offer Letter Control",
    promise: "The student understands conditions, deposits, refund rules, and acceptance deadlines.",
    automation: "Offer parsing, condition extraction, deposit tracking, refund-rule summary, and approval workflow.",
    teamAction: "Consultant approves the verified summary before it is shared with the student.",
    studentAction: "Accept the right offer, pay safely, and store proof in the application timeline.",
    progress: 41,
    status: "preview",
    href: "/applications",
  },
  {
    id: "visa-strategy",
    stage: "Visa Strategy Engine",
    promise: "Visa preparation becomes a proof-led file strategy, not a stressful last-minute checklist.",
    automation: "Dynamic country checklist, sponsor rules, fund-type checks, finance validation, and file-preparation order.",
    teamAction: "Visa specialist uses AI guidance to build the strongest country-specific file.",
    studentAction: "Upload sponsor evidence, loan approval, remittance proof, and required visa forms.",
    progress: 48,
    status: "demo",
    href: "/visa-center",
  },
  {
    id: "arrival-advocacy",
    stage: "Acceptance to Arrival",
    promise: "The journey continues through pre-departure, alumni support, reviews, referrals, and success insights.",
    automation: "Pre-departure checklists, review prompts, referral loops, birthday/milestone follow-ups, and insight capture.",
    teamAction: "Relationship team turns successful students into advocates and future guidance data.",
    studentAction: "Prepare arrival tasks, connect with alumni, and share feedback after visa success.",
    progress: 34,
    status: "preview",
    href: "/alumni",
  },
];

export const consultantTasks: JourneyTask[] = [
  {
    id: "c-task-1",
    title: "Verify Jehan's financial documents",
    owner: "consultant",
    priority: "high",
    status: "due",
    due: "09:30",
    module: "Doc Review",
  },
  {
    id: "c-task-2",
    title: "Review SOP draft for University of Toronto",
    owner: "consultant",
    priority: "high",
    status: "in_progress",
    due: "11:00",
    module: "SOP Builder",
  },
  {
    id: "c-task-3",
    title: "Schedule final mock interview for Sara",
    owner: "consultant",
    priority: "medium",
    status: "due",
    due: "14:00",
    module: "Counselling",
  },
  {
    id: "c-task-4",
    title: "Send visa success review request to Neil",
    owner: "system",
    priority: "low",
    status: "done",
    due: "Done",
    module: "Alumni",
  },
];

export const serviceOrders: ServiceOrder[] = [
  {
    id: "SO-1024",
    service: "IELTS premium prep",
    student: "Jehan",
    amount: "$280",
    status: "active",
    owner: "Upskilling Hub",
  },
  {
    id: "SO-1025",
    service: "Education loan review",
    student: "Sara Khan",
    amount: "$0",
    status: "quoted",
    owner: "Finance",
  },
  {
    id: "SO-1026",
    service: "Visa file review",
    student: "Neil Shah",
    amount: "$190",
    status: "awaiting_payment",
    owner: "Visa Center",
  },
];

export const architectureModules: ModuleStatusItem[] = [
  {
    id: "student-hub",
    title: "Student Experience Hub",
    description: "Profile, discovery, applications, finance, visa, upskilling, events, rewards, support.",
    status: "demo",
    progress: 64,
    href: "/dashboard",
    icon: GraduationCap,
  },
  {
    id: "consultant-suite",
    title: "Consultant & Partner Suite",
    description: "CRM, counselling, BOT assistance, SOP/LOR/resume, teams, partners, dashboards.",
    status: "demo",
    progress: 57,
    href: "/consultant/dashboard",
    icon: Users,
  },
  {
    id: "commerce",
    title: "Commerce & Financial Engine",
    description: "Edu loans, remittance, forex card, forex, insurance, subscriptions, and rewards.",
    status: "demo",
    progress: 53,
    href: "/financial-hub",
    icon: Banknote,
  },
  {
    id: "learning",
    title: "Upskilling, Tests & Careers",
    description: "Psychometrics, test prep, languages, job skills, soft skills, LMS, careers, and jobs.",
    status: "demo",
    progress: 52,
    href: "/upskilling",
    icon: BookOpen,
  },
  {
    id: "community",
    title: "Community & Alumni",
    description: "In-app messaging, alumni, forums, events, success stories, startup incubation.",
    status: "preview",
    progress: 31,
    href: "/alumni",
    icon: Handshake,
  },
  {
    id: "core",
    title: "Core Platform Services",
    description: "AI matching, workflow controls, analytics, roles, and security.",
    status: "preview",
    progress: 45,
    href: "/consultant/branding",
    icon: Building2,
  },
];

export const applicationTimeline = [
  { label: "Research", status: "done", icon: GraduationCap },
  { label: "Shortlist", status: "done", icon: CheckCircle2 },
  { label: "Documents", status: "current", icon: FileCheck2 },
  { label: "Apply", status: "next", icon: ClipboardCheck },
  { label: "Offer", status: "next", icon: BadgeCheck },
  { label: "Visa", status: "risk", icon: Plane },
  { label: "Enroll", status: "next", icon: Landmark },
];

export const financeSignals = [
  { label: "Tuition budget", value: "$46k", icon: Receipt, tone: "good" },
  { label: "Confirmed funds", value: "$38k", icon: Banknote, tone: "watch" },
  { label: "Funding gap", value: "$8k", icon: AlertTriangle, tone: "action" },
  { label: "Remittance readiness", value: "64%", icon: CircleDot, tone: "watch" },
];

export const communicationSignals = [
  { label: "Student replies", value: "12", icon: MessageSquareText },
  { label: "University emails", value: "8", icon: MailCheck },
  { label: "Tasks due today", value: "6", icon: Clock3 },
  { label: "Invoices pending", value: "3", icon: Receipt },
];
