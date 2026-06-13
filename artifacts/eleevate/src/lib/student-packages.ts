import { useEffect, useState } from "react";

export type StudentPackageTier = "silver" | "gold" | "platinum";

export interface StudentPackage {
  id: StudentPackageTier;
  name: string;
  shortName: string;
  priceInr: number;
  duration: string;
  badge: string;
  summary: string;
  bestFor: string;
  features: string[];
  journeySupport: string[];
  rewardMultiplier: number;
}

export interface StudentPackageSelection {
  packageId: StudentPackageTier;
  selectedAt: string;
}

export const STUDENT_PACKAGE_STORAGE_KEY = "eleevate.student-first.package.v1";
export const STUDENT_PACKAGE_EVENT = "eleevate-student-package";

export const STUDENT_PACKAGES: StudentPackage[] = [
  {
    id: "silver",
    name: "Silver Prep",
    shortName: "Silver",
    priceInr: 9999,
    duration: "90 days",
    badge: "Self-prep",
    summary: "Structured exam preparation for students who want guided practice before counselling starts.",
    bestFor: "Students starting IELTS, PTE, TOEFL, SAT, GRE, GMAT, Duolingo, French, or German prep.",
    features: [
      "100+ recorded lessons and study videos",
      "Exam-wise study planner and practice tracker",
      "Mock tests with instant score visibility",
      "Weekly analysis prompts and ELEE reminders",
      "Vocabulary, grammar, reading, writing, listening, and speaking drills",
    ],
    journeySupport: [
      "Profile completion prompts",
      "Test score logging",
      "Basic university discovery",
      "Rewards earning",
    ],
    rewardMultiplier: 1,
  },
  {
    id: "gold",
    name: "Gold Champion",
    shortName: "Gold",
    priceInr: 24999,
    duration: "6 weeks",
    badge: "Live coaching",
    summary: "Live exam coaching with feedback, stronger accountability, and support for active applicants.",
    bestFor: "Students who need trainer support, live classes, and faster score improvement.",
    features: [
      "Live foundation and advanced classes",
      "Mock tests and full mock exams with feedback",
      "Personalized trainer feedback for weak areas",
      "Weekly score analysis and study corrections",
      "Document and application readiness reminders",
    ],
    journeySupport: [
      "Everything in Silver",
      "SOP and resume prompts",
      "Application tracker support",
      "Priority support nudges",
    ],
    rewardMultiplier: 1.35,
  },
  {
    id: "platinum",
    name: "Platinum Journey",
    shortName: "Platinum",
    priceInr: 59999,
    duration: "Profile to arrival",
    badge: "Full journey",
    summary: "Premium study-abroad support from profile and test prep through applications, visa, finance, and arrival.",
    bestFor: "Students and families who want a guided end-to-end pathway with consultant handoff.",
    features: [
      "Gold exam-prep support included",
      "ELEE report review and country/course planning",
      "SOP, LOR, resume, document, and visa readiness guidance",
      "Education loan, forex, insurance, and remittance planning",
      "Arrival checklist, alumni network, and success follow-up",
    ],
    journeySupport: [
      "Everything in Gold",
      "Consultant priority handoff",
      "Finance and visa readiness prompts",
      "Higher rewards earning",
    ],
    rewardMultiplier: 1.75,
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitPackageChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STUDENT_PACKAGE_EVENT));
}

export function getStudentPackage(packageId?: string | null) {
  return STUDENT_PACKAGES.find((item) => item.id === packageId);
}

export function getPackageRank(packageId?: string | null) {
  const index = STUDENT_PACKAGES.findIndex((item) => item.id === packageId);
  return index < 0 ? -1 : index;
}

export function readStudentPackageSelection(): StudentPackageSelection | null {
  if (!canUseStorage()) return null;
  try {
    const stored = JSON.parse(localStorage.getItem(STUDENT_PACKAGE_STORAGE_KEY) ?? "null") as StudentPackageSelection | null;
    if (stored?.packageId && getStudentPackage(stored.packageId)) return stored;
  } catch {
    return null;
  }
  return null;
}

export function writeStudentPackageSelection(packageId: StudentPackageTier) {
  const selection: StudentPackageSelection = {
    packageId,
    selectedAt: new Date().toISOString(),
  };
  if (!canUseStorage()) return selection;
  localStorage.setItem(STUDENT_PACKAGE_STORAGE_KEY, JSON.stringify(selection));
  emitPackageChange();
  return selection;
}

export function clearStudentPackageSelection() {
  if (!canUseStorage()) return;
  localStorage.removeItem(STUDENT_PACKAGE_STORAGE_KEY);
  emitPackageChange();
}

export function useStudentPackageSelection() {
  const [selection, setSelection] = useState<StudentPackageSelection | null>(() => readStudentPackageSelection());

  useEffect(() => {
    const sync = () => setSelection(readStudentPackageSelection());
    window.addEventListener(STUDENT_PACKAGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STUDENT_PACKAGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return selection;
}
