import { DEMO_APPLICATION_STORAGE_KEY } from "@/lib/demo-catalog";
import { DEMO_AUTH_STORAGE_KEY } from "@/lib/demo-auth";
import { DEMO_SHORTLIST_STORAGE_KEY } from "@/lib/demo-flow";
import { DEMO_LEDGER_STORAGE_KEY, resetDemoLedgerEvents } from "@/lib/demo-journey";
import { STUDENT_GUIDE_WELCOME_STORAGE_KEY } from "@/lib/student-guide";
import { STUDENT_PROFILE_STORAGE_KEY } from "@/lib/student-workspace";

const STUDENT_RESET_VERSION_KEY = "eleevate.student-first.global.reset.v2";
const LEGACY_STUDENT_KEYS = [
  "eleevate.demo.applications",
  "eleevate.demo.auth",
  "eleevate.demo.journey.mode",
  "eleevate.demo.ledger.events",
  "eleevate.demo.shortlist",
  "eleevate.student.global.reset.v1",
  "eleevate.student.guide.welcome.v1",
  "eleevate.student.profile.v1",
];
const STUDENT_OWNED_EXTRA_KEYS = [
  "eleevate.student-first.test-prep.scores.v1",
  "eleevate.student-first.language-scores.v1",
];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function resetStudentOwnedSessionData() {
  if (!canUseStorage()) return;
  localStorage.removeItem(DEMO_APPLICATION_STORAGE_KEY);
  localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
  localStorage.removeItem(DEMO_SHORTLIST_STORAGE_KEY);
  localStorage.removeItem(DEMO_LEDGER_STORAGE_KEY);
  localStorage.removeItem(STUDENT_PROFILE_STORAGE_KEY);
  localStorage.removeItem(STUDENT_GUIDE_WELCOME_STORAGE_KEY);
  STUDENT_OWNED_EXTRA_KEYS.forEach((key) => localStorage.removeItem(key));
  LEGACY_STUDENT_KEYS.forEach((key) => localStorage.removeItem(key));
  resetDemoLedgerEvents();
}

export function resetLegacyStudentWorkspaceOnce() {
  if (!canUseStorage()) return;
  if (localStorage.getItem(STUDENT_RESET_VERSION_KEY) === "done") return;
  LEGACY_STUDENT_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.setItem(STUDENT_RESET_VERSION_KEY, "done");
}
