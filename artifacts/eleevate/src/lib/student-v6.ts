import { useEffect, useMemo, useState } from "react";
import type { Program, University } from "@workspace/api-client-react";
import { DEMO_COUNTRIES, DEMO_PROGRAMS, DEMO_UNIVERSITIES } from "@/lib/demo-catalog";
import type { StudentPackageTier } from "@/lib/student-packages";

export const STUDENT_V6_STORAGE_KEY = "eleevate.student-v6.state.v1";
export const STUDENT_V6_EVENT = "eleevate-student-v6";

export type StudentV6RouteChoice = "confused" | "known";
export type StudentV6PassportStatus = "yes" | "applied" | "no" | "";
export type StudentV6ApplicationStatus = "shortlisted" | "applying" | "submitted" | "offer" | "visa" | "done";

export interface StudentV6Profile {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  city?: string;
  parentName?: string;
  parentMobile?: string;
  passportStatus?: StudentV6PassportStatus;
  studyLevel?: string;
  courseInterest?: string;
  preferredIntake?: string;
  targetCountries?: string[];
  budgetMinInr?: number;
  budgetMaxInr?: number;
  degree?: string;
  stream?: string;
  marks?: string;
  backlogs?: string;
  educationGap?: string;
  testName?: string;
  testStatus?: string;
  testScore?: string;
}

export interface StudentV6Application {
  id: string;
  universityId: string;
  universityName: string;
  country: string;
  city: string;
  status: StudentV6ApplicationStatus;
  createdAt: string;
}

export interface StudentV6Document {
  id: string;
  label: string;
  group: "identity" | "academic" | "application" | "finance" | "visa";
  status: "missing" | "uploaded";
  updatedAt: string;
}

export interface StudentV6VisaState {
  country?: string;
  offerReceived?: boolean;
  casOrAcceptance?: boolean;
  tuitionDeposit?: boolean;
  visaFormStarted?: boolean;
  biometricsBooked?: boolean;
  decision?: "waiting" | "approved" | "refused" | "";
}

export interface StudentV6FinanceState {
  loanAmountInr?: number;
  tenureMonths?: number;
  interestRate?: number;
  selectedLoan?: boolean;
  remittance?: boolean;
  forexCard?: boolean;
  insurance?: boolean;
  accommodation?: boolean;
}

export interface StudentV6PackageSelection {
  packageId: StudentPackageTier;
  selectedAt: string;
}

export interface StudentV6State {
  profile: StudentV6Profile;
  routeChoice?: StudentV6RouteChoice;
  reportGenerated?: boolean;
  shortlistedUniversityIds: string[];
  applications: StudentV6Application[];
  documents: StudentV6Document[];
  visa: StudentV6VisaState;
  finance: StudentV6FinanceState;
  packageSelection?: StudentV6PackageSelection;
  rewardPoints: number;
  updatedAt?: string;
}

export interface StudentV6JourneyStep {
  id: string;
  label: string;
  href: string;
  complete: boolean;
  status: "done" | "current" | "locked";
  studentTask: string;
  required: string;
  cta: string;
}

export interface StudentV6Task {
  id: string;
  title: string;
  detail: string;
  href: string;
  priority: "high" | "medium" | "low";
}

export interface StudentV6Notification {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: "action" | "success" | "info";
}

export interface StudentV6Snapshot {
  state: StudentV6State;
  studentName: string;
  packageLabel: string;
  progress: number;
  currentStep: StudentV6JourneyStep;
  steps: StudentV6JourneyStep[];
  tasks: StudentV6Task[];
  notifications: StudentV6Notification[];
  missing: string[];
  completed: string[];
  documentReadiness: number;
  selectedCountry: string | null;
}

const EMPTY_STATE: StudentV6State = {
  profile: {
    budgetMinInr: 0,
    budgetMaxInr: 0,
    targetCountries: [],
  },
  shortlistedUniversityIds: [],
  applications: [],
  documents: [],
  visa: {},
  finance: {
    loanAmountInr: 0,
    tenureMonths: 60,
    interestRate: 9,
  },
  rewardPoints: 0,
};

const REQUIRED_DOCUMENTS: Array<Omit<StudentV6Document, "id" | "status" | "updatedAt">> = [
  { group: "identity", label: "Passport" },
  { group: "identity", label: "Passport-size photo" },
  { group: "academic", label: "10th marksheet" },
  { group: "academic", label: "12th marksheet" },
  { group: "academic", label: "Degree marksheets" },
  { group: "academic", label: "English test score" },
  { group: "application", label: "SOP" },
  { group: "application", label: "LOR" },
  { group: "application", label: "Resume" },
  { group: "finance", label: "Bank statement" },
  { group: "finance", label: "Sponsor income proof" },
  { group: "finance", label: "Loan sanction letter" },
  { group: "visa", label: "Offer / CAS / I-20 / CoE" },
  { group: "visa", label: "Visa application receipt" },
  { group: "visa", label: "Biometric appointment proof" },
];

const COUNTRY_ALIASES: Record<string, string> = {
  uk: "United Kingdom",
  "u.k.": "United Kingdom",
  england: "United Kingdom",
  britain: "United Kingdom",
  "great britain": "United Kingdom",
  us: "United States",
  usa: "United States",
  "u.s.": "United States",
  "united states of america": "United States",
  uae: "United Arab Emirates",
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitV6Change() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STUDENT_V6_EVENT));
}

function withDefaults(state: Partial<StudentV6State> | null | undefined): StudentV6State {
  return {
    ...EMPTY_STATE,
    ...state,
    profile: {
      ...EMPTY_STATE.profile,
      ...(state?.profile ?? {}),
      targetCountries: state?.profile?.targetCountries ?? [],
    },
    shortlistedUniversityIds: state?.shortlistedUniversityIds ?? [],
    applications: state?.applications ?? [],
    documents: state?.documents ?? [],
    visa: state?.visa ?? {},
    finance: {
      ...EMPTY_STATE.finance,
      ...(state?.finance ?? {}),
    },
    rewardPoints: state?.rewardPoints ?? 0,
  };
}

export function readStudentV6State(): StudentV6State {
  if (!canUseStorage()) return withDefaults(null);
  try {
    return withDefaults(JSON.parse(localStorage.getItem(STUDENT_V6_STORAGE_KEY) ?? "null") as StudentV6State | null);
  } catch {
    return withDefaults(null);
  }
}

export function writeStudentV6State(state: StudentV6State) {
  const next = withDefaults({ ...state, updatedAt: new Date().toISOString() });
  if (canUseStorage()) {
    localStorage.setItem(STUDENT_V6_STORAGE_KEY, JSON.stringify(next));
    emitV6Change();
  }
  return next;
}

export function updateStudentV6State(updater: (state: StudentV6State) => StudentV6State) {
  return writeStudentV6State(updater(readStudentV6State()));
}

export function clearStudentV6State() {
  if (!canUseStorage()) return;
  localStorage.removeItem(STUDENT_V6_STORAGE_KEY);
  emitV6Change();
}

export function useStudentV6State() {
  const [state, setState] = useState<StudentV6State>(() => readStudentV6State());

  useEffect(() => {
    const sync = () => setState(readStudentV6State());
    window.addEventListener(STUDENT_V6_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STUDENT_V6_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return state;
}

function hasValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return value > 0;
  return Boolean(String(value ?? "").trim());
}

export function normalizeV6Country(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  const alias = COUNTRY_ALIASES[normalized];
  if (alias) return alias;
  const byName = DEMO_COUNTRIES.find((country) => country.name.toLowerCase() === normalized);
  if (byName) return byName.name;
  const byCode = DEMO_COUNTRIES.find((country) => country.code.toLowerCase() === normalized);
  return byCode?.name ?? null;
}

export function getStudentV6CountryOptions() {
  return DEMO_COUNTRIES.map((country) => country.name);
}

function getSelectedCountry(profile: StudentV6Profile) {
  return normalizeV6Country(profile.targetCountries?.[0]);
}

function queryTokens(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !["and", "the", "for"].includes(token));
}

function matchesV6Query(haystack: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  const normalizedHaystack = haystack.toLowerCase();
  if (normalizedHaystack.includes(normalizedQuery)) return true;
  const tokens = queryTokens(normalizedQuery);
  return tokens.length === 0 || tokens.some((token) => normalizedHaystack.includes(token));
}

function getStepDefinitions(state: StudentV6State): StudentV6JourneyStep[] {
  const profile = state.profile;
  const detailsComplete = [
    profile.firstName,
    profile.mobile,
    profile.email,
    profile.city,
    profile.parentMobile,
    profile.passportStatus,
  ].every(hasValue);
  const goalComplete = [
    profile.studyLevel,
    profile.courseInterest,
    profile.preferredIntake,
    profile.targetCountries,
    profile.budgetMaxInr,
  ].every(hasValue);
  const academicComplete = [profile.degree, profile.stream, profile.marks, profile.testStatus].every(hasValue);
  const routeComplete = Boolean(state.routeChoice && state.reportGenerated);
  const exploreComplete = state.shortlistedUniversityIds.length > 0;
  const applicationComplete = state.applications.length > 0 && (state.documents.length >= 2 || Boolean(state.visa.visaFormStarted));
  const financeComplete = Boolean(
    (state.finance.loanAmountInr ?? 0) > 0 ||
    state.finance.remittance ||
    state.finance.forexCard ||
    state.finance.insurance ||
    state.packageSelection,
  );

  const definitions = [
    {
      id: "details",
      label: "Student details",
      href: "/student-v6/start",
      complete: detailsComplete,
      studentTask: "Add your basic details and parent/sponsor contact.",
      required: "Name, mobile, email, city, parent mobile, passport status.",
      cta: "Add student details",
    },
    {
      id: "study-goal",
      label: "Study goal",
      href: "/student-v6/start",
      complete: goalComplete,
      studentTask: "Tell us what you want to study and how much your family can plan.",
      required: "Study level, course interest, intake, country, INR budget.",
      cta: "Add study goal",
    },
    {
      id: "academics",
      label: "Academics and test",
      href: "/student-v6/start",
      complete: academicComplete,
      studentTask: "Add marks, stream, backlogs/gap, and test status.",
      required: "Degree, stream, score, IELTS/PTE/TOEFL/GRE/GMAT status.",
      cta: "Add academics",
    },
    {
      id: "route",
      label: "ELEE route",
      href: "/student-v6/start",
      complete: routeComplete,
      studentTask: "Choose psychometric help if confused, or generate ELEE report if you know your path.",
      required: "One route choice.",
      cta: "Choose route",
    },
    {
      id: "explore",
      label: "Find course and university",
      href: "/student-v6/explore",
      complete: exploreComplete,
      studentTask: "Compare only relevant countries, courses, and universities.",
      required: "Shortlist at least one university.",
      cta: "Find universities",
    },
    {
      id: "apply-docs",
      label: "Applications and documents",
      href: "/student-v6/applications",
      complete: applicationComplete,
      studentTask: "Move shortlist into applications and prepare documents.",
      required: "Application tracker and first documents.",
      cta: "Open applications",
    },
    {
      id: "finance-arrival",
      label: "Finance and arrival",
      href: "/student-v6/finance",
      complete: financeComplete,
      studentTask: "Plan loan, scholarship, remittance, forex card, insurance, stay, and arrival.",
      required: "One finance or package action.",
      cta: "Plan finance",
    },
  ];

  const firstIncomplete = definitions.findIndex((step) => !step.complete);
  return definitions.map((step, index) => ({
    ...step,
    status: step.complete ? "done" : index === firstIncomplete ? "current" : "locked",
  }));
}

export function getStudentV6Snapshot(state = readStudentV6State()): StudentV6Snapshot {
  const steps = getStepDefinitions(state);
  const currentStep = steps.find((step) => !step.complete) ?? steps[steps.length - 1];
  const completed = steps.filter((step) => step.complete).map((step) => step.label);
  const missing = steps.filter((step) => !step.complete).map((step) => step.required);
  const studentName = [state.profile.firstName, state.profile.lastName].filter(Boolean).join(" ") || "Student";
  const packageLabel = state.packageSelection?.packageId
    ? state.packageSelection.packageId[0].toUpperCase() + state.packageSelection.packageId.slice(1)
    : "No tier";
  const requiredLabels = new Set(REQUIRED_DOCUMENTS.map((doc) => doc.label));
  const uploadedLabels = new Set(state.documents.filter((doc) => doc.status === "uploaded").map((doc) => doc.label));
  const documentReadiness = Math.round((Array.from(requiredLabels).filter((label) => uploadedLabels.has(label)).length / requiredLabels.size) * 100);
  const notifications: StudentV6Notification[] = [
    {
      id: `next-${currentStep.id}`,
      title: `Next: ${currentStep.label}`,
      detail: currentStep.studentTask,
      href: currentStep.href,
      tone: "action",
    },
  ];
  if (state.shortlistedUniversityIds.length > 0) {
    notifications.push({
      id: "shortlist",
      title: "Shortlist saved",
      detail: "Your application tracker is ready for the saved universities.",
      href: "/student-v6/applications",
      tone: "success",
    });
  }
  if (state.documents.length > 0 && documentReadiness < 100) {
    notifications.push({
      id: "documents",
      title: "Documents pending",
      detail: `${documentReadiness}% of required documents are marked uploaded.`,
      href: "/student-v6/documents",
      tone: "info",
    });
  }

  return {
    state,
    studentName,
    packageLabel,
    progress: Math.round((completed.length / steps.length) * 100),
    currentStep,
    steps,
    tasks: steps.filter((step) => !step.complete).slice(0, 3).map((step, index) => ({
      id: step.id,
      title: step.label,
      detail: step.studentTask,
      href: step.href,
      priority: index === 0 ? "high" : "medium",
    })),
    notifications,
    missing,
    completed,
    documentReadiness,
    selectedCountry: getSelectedCountry(state.profile),
  };
}

export function useStudentV6Snapshot() {
  const state = useStudentV6State();
  return useMemo(() => getStudentV6Snapshot(state), [state]);
}

export function getRequiredV6Documents() {
  return REQUIRED_DOCUMENTS;
}

export function filterV6Universities(state: StudentV6State, countryOverride?: string | null, query = ""): University[] {
  const selectedCountry = normalizeV6Country(countryOverride) ?? getSelectedCountry(state.profile);
  return DEMO_UNIVERSITIES.filter((university) => {
    const matchesCountry = selectedCountry ? university.country === selectedCountry : true;
    const haystack = [university.name, university.city, university.country, university.description ?? ""].join(" ").toLowerCase();
    return matchesCountry && matchesV6Query(haystack, query);
  });
}

export function filterV6Programs(state: StudentV6State, countryOverride?: string | null, query = ""): Program[] {
  const selectedCountry = normalizeV6Country(countryOverride) ?? getSelectedCountry(state.profile);
  const interest = query.trim() || state.profile.courseInterest || "";
  const normalizedInterest = interest.toLowerCase();
  return DEMO_PROGRAMS.filter((program) => {
    const university = program.university;
    const matchesCountry = selectedCountry ? university?.country === selectedCountry : true;
    const haystack = [program.name, program.field, university?.name ?? "", university?.city ?? ""].join(" ").toLowerCase();
    return matchesCountry && (
      matchesV6Query(haystack, normalizedInterest) ||
      matchesV6Query(normalizedInterest, program.field)
    );
  });
}

export function shortlistV6University(university: University) {
  return updateStudentV6State((state) => {
    const alreadyShortlisted = state.shortlistedUniversityIds.includes(university.id);
    const shortlistedUniversityIds = alreadyShortlisted
      ? state.shortlistedUniversityIds
      : [...state.shortlistedUniversityIds, university.id];
    const hasApplication = state.applications.some((application) => application.universityId === university.id);
    const applications: StudentV6Application[] = hasApplication
      ? state.applications
      : [
          ...state.applications,
          {
            id: `v6-app-${university.id}`,
            universityId: university.id,
            universityName: university.name,
            country: university.country,
            city: university.city,
            status: "shortlisted",
            createdAt: new Date().toISOString(),
          },
        ];
    return {
      ...state,
      shortlistedUniversityIds,
      applications,
      rewardPoints: state.rewardPoints + (alreadyShortlisted ? 0 : 25),
    };
  });
}

export function setV6ApplicationStatus(applicationId: string, status: StudentV6ApplicationStatus) {
  return updateStudentV6State((state) => ({
    ...state,
    applications: state.applications.map((application) => (
      application.id === applicationId ? { ...application, status } : application
    )),
    rewardPoints: state.rewardPoints + 20,
  }));
}

export function toggleV6Document(label: string, group: StudentV6Document["group"]) {
  return updateStudentV6State((state) => {
    const existing = state.documents.find((doc) => doc.label === label);
    const documents: StudentV6Document[] = existing
      ? state.documents.map((doc) => (
          doc.label === label
            ? { ...doc, status: doc.status === "uploaded" ? "missing" : "uploaded", updatedAt: new Date().toISOString() }
            : doc
        ))
      : [
          ...state.documents,
          {
            id: `v6-doc-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            label,
            group,
            status: "uploaded",
            updatedAt: new Date().toISOString(),
          },
        ];
    return {
      ...state,
      documents,
      rewardPoints: state.rewardPoints + (existing?.status === "uploaded" ? 0 : 10),
    };
  });
}

export function selectV6Package(packageId: StudentPackageTier) {
  return updateStudentV6State((state) => ({
    ...state,
    packageSelection: { packageId, selectedAt: new Date().toISOString() },
    rewardPoints: state.rewardPoints + 100,
  }));
}

export function formatV6Inr(value: number | undefined | null) {
  return `₹${Math.round(value ?? 0).toLocaleString("en-IN")}`;
}

export function calculateV6Emi(amount: number, annualRate: number, months: number) {
  if (!amount || !months) return 0;
  const monthlyRate = annualRate / 12 / 100;
  if (!monthlyRate) return amount / months;
  return amount * monthlyRate * ((1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months) - 1);
}
