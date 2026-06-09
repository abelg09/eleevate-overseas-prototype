import { useEffect, useState } from "react";
import type { University } from "@workspace/api-client-react";
import { DEMO_UNIVERSITIES } from "@/lib/demo-catalog";

export type DemoJourneyMode = "global";

export interface DemoCountryLock {
  countryCode: string;
  countryName: string;
  currency: string;
  routeLabel: string;
  universityIds: string[];
  cities: string[];
  reason: string;
}

export interface DemoLedgerEvent {
  id: string;
  source: "ELEE Report" | "Edu Loans" | "Accommodation" | "Remittance" | "Forex Card" | "Forex" | "Insurance" | "Applications" | "Documents" | "Services";
  event: string;
  studentView: string;
  consultantView: string;
  revenue: string;
  status: "Live sync" | "Processing" | "Ready" | "Queued" | "Next";
  createdAt: string;
}

export interface DemoServiceConnection {
  serviceId: string;
  label: string;
  country: string;
  studentStatus: string;
  consultantStatus: string;
  revenueStream: string;
}

export interface DemoCounsellorAction {
  id: string;
  owner: "ELEE AI" | "Consultant" | "Student" | "Family";
  title: string;
  module: string;
  status: "done" | "active" | "waiting";
}

export interface DemoAgentPrompt {
  id: string;
  label: string;
  prompt: string;
  href: string;
}

export const DEMO_JOURNEY_STORAGE_KEY = "eleevate.ai.journey.mode.v2";
export const DEMO_LEDGER_STORAGE_KEY = "eleevate.ai.ledger.events.v2";
export const DEMO_JOURNEY_EVENT = "eleevate-demo-journey";

export const DEMO_AGENT_PROMPTS: DemoAgentPrompt[] = [
  { id: "report", label: "Generate ELEE report", prompt: "Turn your profile and assessment into country, document, finance, and next-step guidance.", href: "/elee-report" },
  { id: "countries", label: "Find and compare countries", prompt: "Compare destinations by budget, visa path, city fit, work options, and application readiness.", href: "/countries?compare=true" },
  { id: "courses", label: "Find my course", prompt: "Search programs by fit, tuition, intake, entry needs, and career outcome.", href: "/course-finder" },
  { id: "applications", label: "Applications", prompt: "Track saved universities, requirements, deadlines, offers, and next documents.", href: "/applications" },
  { id: "test-prep", label: "Test prep", prompt: "Plan IELTS, TOEFL, GRE, GMAT, SAT, PTE, mock tests, and score progress.", href: "/test-prep" },
  { id: "sop", label: "Draft SOP", prompt: "Turn your story, academics, projects, and goals into a stronger SOP draft.", href: "/sop-studio" },
  { id: "scholarships", label: "Find scholarship", prompt: "Find scholarships that match your profile, destination, deadline, and documents.", href: "/scholarships" },
  { id: "loan", label: "Education loan", prompt: "Plan your loan amount, sponsor proof, lender options, and fee-payment timeline.", href: "/loans" },
  { id: "interview", label: "Interview prep", prompt: "Practice university, visa, scholarship, and career interview answers with ELEE.", href: "/careers" },
];

export const DEFAULT_DEMO_LEDGER_EVENTS: DemoLedgerEvent[] = [];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitDemoJourneyChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(DEMO_JOURNEY_EVENT));
}

export function readDemoJourneyMode(): DemoJourneyMode {
  return "global";
}

export function writeDemoJourneyMode(mode: DemoJourneyMode) {
  if (!canUseStorage()) return mode;
  localStorage.setItem(DEMO_JOURNEY_STORAGE_KEY, mode);
  emitDemoJourneyChange();
  return mode;
}

export function isRouteScopedMode() {
  return false;
}

export function getDemoCountryLock(): DemoCountryLock | null {
  return null;
}

export function getScopedDemoUniversities(universities: University[] = DEMO_UNIVERSITIES) {
  const lock = getDemoCountryLock();
  if (!lock) return universities;
  const selectedIds = new Set(lock.universityIds);
  return universities.filter((university) => university.country === lock.countryName || selectedIds.has(university.id));
}

export function getScopedDemoCities() {
  return null;
}

export function getDemoModeLabel() {
  return "Global AI journey";
}

export function readDemoLedgerEvents(): DemoLedgerEvent[] {
  if (!canUseStorage()) return DEFAULT_DEMO_LEDGER_EVENTS;
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_LEDGER_STORAGE_KEY) ?? "null") as DemoLedgerEvent[] | null;
    if (Array.isArray(stored)) return stored;
  } catch {
    return DEFAULT_DEMO_LEDGER_EVENTS;
  }
  return DEFAULT_DEMO_LEDGER_EVENTS;
}

export function writeDemoLedgerEvents(events: DemoLedgerEvent[]) {
  if (!canUseStorage()) return events;
  localStorage.setItem(DEMO_LEDGER_STORAGE_KEY, JSON.stringify(events));
  emitDemoJourneyChange();
  return events;
}

export function addDemoLedgerEvent(event: Omit<DemoLedgerEvent, "id" | "createdAt"> & { id?: string }) {
  const id = event.id ?? `ledger-${Date.now()}`;
  const nextEvent: DemoLedgerEvent = {
    ...event,
    id,
    createdAt: new Date().toISOString(),
  };
  const existing = readDemoLedgerEvents().filter((item) => item.id !== id);
  return writeDemoLedgerEvents([nextEvent, ...existing]);
}

export function resetDemoLedgerEvents() {
  return writeDemoLedgerEvents(DEFAULT_DEMO_LEDGER_EVENTS);
}

export function useDemoJourneyState() {
  const [state, setState] = useState(() => ({
    mode: readDemoJourneyMode(),
    countryLock: getDemoCountryLock(),
    ledgerEvents: readDemoLedgerEvents(),
  }));

  useEffect(() => {
    const sync = () => setState({
      mode: readDemoJourneyMode(),
      countryLock: getDemoCountryLock(),
      ledgerEvents: readDemoLedgerEvents(),
    });
    window.addEventListener(DEMO_JOURNEY_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DEMO_JOURNEY_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return state;
}
