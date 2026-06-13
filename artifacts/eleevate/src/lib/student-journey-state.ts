import { useEffect, useMemo, useState } from "react";
import type { Application, DocumentType } from "@workspace/api-client-react";
import { DEMO_APPLICATION_STORAGE_KEY } from "@/lib/demo-catalog";
import { readDemoShortlistIds } from "@/lib/demo-flow";
import { readDemoLedgerEvents } from "@/lib/demo-journey";
import { readStudentDocuments, STUDENT_DOCUMENTS_EVENT } from "@/lib/student-documents";
import { getStudentPackage, readStudentPackageSelection, STUDENT_PACKAGE_EVENT } from "@/lib/student-packages";
import { hasStudentWorkspaceProfile, readStudentWorkspaceProfile, STUDENT_WORKSPACE_EVENT } from "@/lib/student-workspace";

export const ELEE_REPORT_GENERATED_STORAGE_KEY = "eleevate.student-first.report.generated.v1";
export const STUDENT_JOURNEY_EVENT = "eleevate-student-journey";
export const TEST_PREP_SCORES_STORAGE_KEY = "eleevate.student-first.test-prep.scores.v1";
export const LANGUAGE_SCORES_STORAGE_KEY = "eleevate.student-first.language-scores.v1";

export interface StudentJourneyStepState {
  id: string;
  label: string;
  href: string;
  complete: boolean;
  status: "complete" | "current" | "incomplete";
  statusLabel: string;
  prompt: string;
  cta: string;
}

export interface StudentNotification {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: "action" | "info" | "success" | "upgrade";
}

export interface StudentJourneySnapshot {
  profileComplete: boolean;
  reportGenerated: boolean;
  shortlistedCount: number;
  applicationCount: number;
  documentCount: number;
  documentReadiness: number;
  testScoreCount: number;
  financeEventCount: number;
  packageName: string | null;
  packageId: string | null;
  rewardPoints: number;
  completedCount: number;
  progress: number;
  currentStep: StudentJourneyStepState;
  nextIncompleteStep: StudentJourneyStepState | null;
  steps: StudentJourneyStepState[];
  notifications: StudentNotification[];
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitJourneyChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STUDENT_JOURNEY_EVENT));
}

function readJsonArray<T>(key: string): T[] {
  if (!canUseStorage()) return [];
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]") as T[];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function markEleeReportGenerated() {
  if (!canUseStorage()) return;
  localStorage.setItem(ELEE_REPORT_GENERATED_STORAGE_KEY, new Date().toISOString());
  emitJourneyChange();
}

export function clearEleeReportGenerated() {
  if (!canUseStorage()) return;
  localStorage.removeItem(ELEE_REPORT_GENERATED_STORAGE_KEY);
  emitJourneyChange();
}

export function isEleeReportGenerated() {
  if (!canUseStorage()) return false;
  return Boolean(localStorage.getItem(ELEE_REPORT_GENERATED_STORAGE_KEY));
}

export function readStudentApplications(): Application[] {
  return readJsonArray<Application>(DEMO_APPLICATION_STORAGE_KEY);
}

export function readStudentTestScores() {
  return [
    ...readJsonArray<{ testType: string; score: number; takenAt: string }>(TEST_PREP_SCORES_STORAGE_KEY),
    ...readJsonArray<{ testType: string; score: number; takenAt?: string }>(LANGUAGE_SCORES_STORAGE_KEY),
  ];
}

function buildSteps(snapshot: {
  profileComplete: boolean;
  reportGenerated: boolean;
  shortlistedCount: number;
  applicationCount: number;
  documentReadiness: number;
  financeEventCount: number;
}) {
  const definitions = [
    {
      id: "profile",
      label: "Profile",
      href: "/profile",
      complete: snapshot.profileComplete,
      incomplete: "Add academics, course goal, country interests, budget, tests, and intake.",
      completeText: "Profile saved",
      cta: "Complete profile",
    },
    {
      id: "elee-report",
      label: "ELEE Report",
      href: "/elee-report",
      complete: snapshot.reportGenerated,
      incomplete: "Generate your report to see route ranking, gaps, and next actions.",
      completeText: "Report generated",
      cta: "Generate report",
    },
    {
      id: "country-fit",
      label: "Country & Course Fit",
      href: "/universities",
      complete: snapshot.shortlistedCount > 0,
      incomplete: "Compare countries and courses, then save at least one university.",
      completeText: "Route exploration started",
      cta: "Find country and course",
    },
    {
      id: "shortlist",
      label: "Shortlist",
      href: "/shortlist",
      complete: snapshot.shortlistedCount > 0,
      incomplete: "Save universities that match your budget, intake, and course goal.",
      completeText: `${snapshot.shortlistedCount} shortlisted`,
      cta: "Shortlist universities",
    },
    {
      id: "applications",
      label: "Applications",
      href: "/applications",
      complete: snapshot.applicationCount > 0,
      incomplete: "Move shortlisted universities into applications and track deadlines.",
      completeText: `${snapshot.applicationCount} application${snapshot.applicationCount === 1 ? "" : "s"}`,
      cta: "Open applications",
    },
    {
      id: "documents-visa",
      label: "Documents & Visa",
      href: "/documents",
      complete: snapshot.documentReadiness >= 100,
      incomplete: "Upload passport, transcript, SOP, LOR, finance proof, and test result.",
      completeText: "Document packet ready",
      cta: "Upload documents",
    },
    {
      id: "finance-arrival",
      label: "Finance & Arrival",
      href: "/financial-hub",
      complete: snapshot.financeEventCount > 0,
      incomplete: "Plan education loan, remittance, forex card, insurance, and arrival money.",
      completeText: "Finance activity started",
      cta: "Plan finance",
    },
  ];

  const firstIncompleteIndex = definitions.findIndex((item) => !item.complete);

  return definitions.map<StudentJourneyStepState>((item, index) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    complete: item.complete,
    status: item.complete ? "complete" : index === firstIncompleteIndex ? "current" : "incomplete",
    statusLabel: item.complete ? item.completeText : index === firstIncompleteIndex ? "Next" : "Pending",
    prompt: item.complete ? item.completeText : item.incomplete,
    cta: item.cta,
  }));
}

export function getStudentJourneySnapshot(): StudentJourneySnapshot {
  const profile = readStudentWorkspaceProfile();
  const profileComplete = hasStudentWorkspaceProfile(profile);
  const reportGenerated = profileComplete && isEleeReportGenerated();
  const shortlistedCount = readDemoShortlistIds().length;
  const applicationCount = readStudentApplications().length;
  const documents = readStudentDocuments();
  const requiredDocTypes: DocumentType[] = ["passport", "transcript", "sop", "lor", "financial_proof", "english_test"];
  const uploadedTypes = new Set(documents.map((doc) => doc.type));
  const documentReadiness = Math.round((requiredDocTypes.filter((type) => uploadedTypes.has(type)).length / requiredDocTypes.length) * 100);
  const testScoreCount = readStudentTestScores().length;
  const financeEventCount = readDemoLedgerEvents().filter((event) => ["Edu Loans", "Remittance", "Forex Card", "Forex", "Insurance", "Services"].includes(event.source)).length;
  const packageSelection = readStudentPackageSelection();
  const selectedPackage = getStudentPackage(packageSelection?.packageId);

  const steps = buildSteps({
    profileComplete,
    reportGenerated,
    shortlistedCount,
    applicationCount,
    documentReadiness,
    financeEventCount,
  });
  const completedCount = steps.filter((step) => step.complete).length;
  const nextIncompleteStep = steps.find((step) => !step.complete) ?? null;

  const basePoints =
    (profileComplete ? 100 : 0) +
    (reportGenerated ? 75 : 0) +
    shortlistedCount * 25 +
    applicationCount * 50 +
    documents.length * 20 +
    testScoreCount * 20 +
    financeEventCount * 30 +
    (selectedPackage ? 150 : 0);
  const rewardPoints = Math.round(basePoints * (selectedPackage?.rewardMultiplier ?? 1));

  const notifications: StudentNotification[] = [];
  if (nextIncompleteStep) {
    notifications.push({
      id: `next-${nextIncompleteStep.id}`,
      title: `Next: ${nextIncompleteStep.label}`,
      detail: nextIncompleteStep.prompt,
      href: nextIncompleteStep.href,
      tone: "action",
    });
  }
  if (!selectedPackage) {
    notifications.push({
      id: "package",
      title: "Choose a student package",
      detail: "Pick Silver, Gold, or Platinum so ELEE can show the right support level and rewards.",
      href: "/packages",
      tone: "upgrade",
    });
  } else {
    notifications.push({
      id: "package-active",
      title: `${selectedPackage.shortName} package active`,
      detail: "Your dashboard and rewards now use this support level.",
      href: "/packages",
      tone: "success",
    });
  }
  if (documentReadiness > 0 && documentReadiness < 100) {
    notifications.push({
      id: "documents",
      title: "Document packet incomplete",
      detail: `${documentReadiness}% ready. Upload missing admissions and visa evidence before applying.`,
      href: "/documents",
      tone: "info",
    });
  }

  return {
    profileComplete,
    reportGenerated,
    shortlistedCount,
    applicationCount,
    documentCount: documents.length,
    documentReadiness,
    testScoreCount,
    financeEventCount,
    packageName: selectedPackage?.name ?? null,
    packageId: selectedPackage?.id ?? null,
    rewardPoints,
    completedCount,
    progress: Math.round((completedCount / steps.length) * 100),
    currentStep: nextIncompleteStep ?? steps[steps.length - 1],
    nextIncompleteStep,
    steps,
    notifications,
  };
}

export function useStudentJourneySnapshot() {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const sync = () => setRevision((value) => value + 1);
    const events = [
      "storage",
      STUDENT_WORKSPACE_EVENT,
      STUDENT_PACKAGE_EVENT,
      STUDENT_DOCUMENTS_EVENT,
      STUDENT_JOURNEY_EVENT,
      "eleevate-demo-journey",
    ];
    events.forEach((event) => window.addEventListener(event, sync));
    return () => events.forEach((event) => window.removeEventListener(event, sync));
  }, []);

  return useMemo(() => getStudentJourneySnapshot(), [revision]);
}
