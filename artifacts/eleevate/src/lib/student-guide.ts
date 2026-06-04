export const STUDENT_GUIDE_WELCOME_STORAGE_KEY = "eleevate.student.guide.welcome.v1";

export type StudentGuideTone = "done" | "current" | "action" | "next";

export interface StudentGuideStep {
  id: string;
  label: string;
  status: string;
  detail: string;
  href: string;
  tone: StudentGuideTone;
  progress: number;
  whatStudentDoes: string;
  required: string;
  routePrefixes: string[];
}

export const STUDENT_GUIDE_STEPS: StudentGuideStep[] = [
  {
    id: "profile",
    label: "Profile",
    status: "Start",
    detail: "Academics, goals, budget",
    href: "/profile",
    tone: "done",
    progress: 100,
    whatStudentDoes: "Add academics, budget, preferred intake, test status, work experience, and family sponsor details.",
    required: "Academic marks, passport details, budget range, target course area.",
    routePrefixes: ["/profile"],
  },
  {
    id: "elee-report",
    label: "ELEE Report",
    status: "Generate",
    detail: "Generate your route",
    href: "/elee-report",
    tone: "done",
    progress: 82,
    whatStudentDoes: "Review country ranking, finance gap, document gaps, visa readiness, and next actions.",
    required: "Completed profile and basic finance information.",
    routePrefixes: ["/elee-report"],
  },
  {
    id: "country-fit",
    label: "Country & Course Fit",
    status: "Review",
    detail: "Compare global options",
    href: "/universities",
    tone: "current",
    progress: 76,
    whatStudentDoes: "Compare countries, courses, costs, cities, intakes, and career routes before locking a route.",
    required: "Country preference, course interest, budget comfort, work outcome goals.",
    routePrefixes: ["/universities", "/countries", "/course-finder"],
  },
  {
    id: "shortlist",
    label: "Shortlist",
    status: "Next",
    detail: "Save your best-fit universities",
    href: "/shortlist",
    tone: "done",
    progress: 72,
    whatStudentDoes: "Save suitable universities and check tuition, ranking, course fit, and application deadlines.",
    required: "At least 3 to 5 university options.",
    routePrefixes: ["/shortlist"],
  },
  {
    id: "applications",
    label: "Applications",
    status: "Start",
    detail: "Track applications after shortlisting",
    href: "/applications",
    tone: "current",
    progress: 58,
    whatStudentDoes: "Move shortlisted universities into applications and track each deadline, status, and offer condition.",
    required: "Selected universities, course choice, application documents.",
    routePrefixes: ["/applications"],
  },
  {
    id: "documents-visa",
    label: "Documents & Visa",
    status: "Prepare",
    detail: "Upload documents and visa evidence",
    href: "/documents",
    tone: "action",
    progress: 48,
    whatStudentDoes: "Upload passport, transcripts, SOP, LOR, resume, sponsor proof, loan proof, and visa files.",
    required: "Passport, transcripts, SOP, LOR, resume, financial proof, and visa files.",
    routePrefixes: ["/documents", "/visa-center"],
  },
  {
    id: "finance-arrival",
    label: "Finance & Arrival",
    status: "Next",
    detail: "Plan funding and arrival",
    href: "/financial-hub",
    tone: "next",
    progress: 36,
    whatStudentDoes: "Plan education loan, tuition payment, remittance, forex card, insurance, accommodation, and arrival checklist.",
    required: "Offer letter, fee timeline, sponsor documents, travel dates.",
    routePrefixes: ["/financial-hub", "/loans", "/remittance", "/forex-card", "/forex", "/insurance"],
  },
];

export function findStudentGuideStep(pathname: string) {
  return STUDENT_GUIDE_STEPS.find((step) =>
    step.routePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
  );
}

export function getNextStudentGuideStep(pathname: string) {
  if (pathname === "/dashboard" || pathname === "/") {
    return STUDENT_GUIDE_STEPS[0];
  }

  const current = findStudentGuideStep(pathname);
  if (!current) return STUDENT_GUIDE_STEPS[0];

  const index = STUDENT_GUIDE_STEPS.findIndex((step) => step.id === current.id);
  return STUDENT_GUIDE_STEPS[index + 1] ?? STUDENT_GUIDE_STEPS[0];
}
