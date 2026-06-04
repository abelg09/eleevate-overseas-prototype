import { DEMO_APPLICATION_STORAGE_KEY } from "@/lib/demo-catalog";
import { DEMO_SHORTLIST_STORAGE_KEY } from "@/lib/demo-flow";
import { DEMO_LEDGER_STORAGE_KEY, resetDemoLedgerEvents } from "@/lib/demo-journey";
import { STUDENT_GUIDE_WELCOME_STORAGE_KEY } from "@/lib/student-guide";
import { STUDENT_PROFILE_STORAGE_KEY } from "@/lib/student-workspace";

const STUDENT_RESET_VERSION_KEY = "eleevate.student.global.reset.v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function resetStudentOwnedSessionData() {
  if (!canUseStorage()) return;
  localStorage.removeItem(DEMO_APPLICATION_STORAGE_KEY);
  localStorage.removeItem(DEMO_SHORTLIST_STORAGE_KEY);
  localStorage.removeItem(DEMO_LEDGER_STORAGE_KEY);
  localStorage.removeItem(STUDENT_PROFILE_STORAGE_KEY);
  localStorage.removeItem(STUDENT_GUIDE_WELCOME_STORAGE_KEY);
  resetDemoLedgerEvents();
}

export function resetLegacyStudentWorkspaceOnce() {
  if (!canUseStorage()) return;
  if (localStorage.getItem(STUDENT_RESET_VERSION_KEY) === "done") return;
  resetStudentOwnedSessionData();
  localStorage.setItem(STUDENT_RESET_VERSION_KEY, "done");
}
