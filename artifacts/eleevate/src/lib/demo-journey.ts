import { useEffect, useState } from "react";
import type { University } from "@workspace/api-client-react";
import { DEMO_COUNTRIES, DEMO_UNIVERSITIES } from "@/lib/demo-catalog";

export type DemoJourneyMode = "preliminary" | "canada_locked";

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
  source: "ELEE Report" | "Edu Loans" | "Accommodation" | "Remittance" | "Forex Card" | "Forex" | "Insurance" | "Applications" | "Services";
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

export const DEMO_JOURNEY_STORAGE_KEY = "eleevate.demo.journey.mode";
export const DEMO_LEDGER_STORAGE_KEY = "eleevate.demo.ledger.events";
export const DEMO_JOURNEY_EVENT = "eleevate-demo-journey";

export const CANADA_COUNTRY_LOCK: DemoCountryLock = {
  countryCode: "CA",
  countryName: "Canada",
  currency: "CAD",
  routeLabel: "Canada route locked",
  universityIds: ["demo-uoft", "demo-ubc"],
  cities: ["Toronto", "Vancouver"],
  reason: "Jehan selected Canada after ELEE ranked it highest for CS fit, PGWP pathway, sponsor budget, and visa evidence confidence.",
};

export const DEMO_AGENT_PROMPTS: DemoAgentPrompt[] = [
  { id: "country", label: "Find my country", prompt: "Compare countries by profile, budget, visa risk, and future career route.", href: "/countries" },
  { id: "report", label: "Generate ELEE report", prompt: "Turn my profile, family readiness, and finance details into a readable action report.", href: "/elee-report" },
  { id: "finance", label: "Check finance gap", prompt: "Show my funding gap, matching lenders, remittance, forex card, and insurance steps.", href: "/financial-hub" },
  { id: "applications", label: "Start applications", prompt: "Move my saved universities into a tracked application workflow.", href: "/universities" },
];

export const DEFAULT_DEMO_LEDGER_EVENTS: DemoLedgerEvent[] = [
  {
    id: "ledger-elee-gap",
    source: "ELEE Report",
    event: "Funding gap detected",
    studentView: "$8k gap appears on dashboard, ELEE report, and Edu Loans.",
    consultantView: "Finance task created for Jehan with sponsor proof required.",
    revenue: "Loan referral opportunity",
    status: "Live sync",
    createdAt: "2026-05-30T10:00:00.000Z",
  },
  {
    id: "ledger-loan-started",
    source: "Edu Loans",
    event: "HDFC Credila application started",
    studentView: "Loan amount, Canada route, and University of Toronto are pre-filled.",
    consultantView: "NBFC commission line appears in the consultant ledger.",
    revenue: "NBFC Commission",
    status: "Processing",
    createdAt: "2026-05-30T10:05:00.000Z",
  },
  {
    id: "ledger-remittance-planned",
    source: "Remittance",
    event: "Tuition deposit planned",
    studentView: "Payment milestone added to fee timeline and visa proof stack.",
    consultantView: "Receipt reminder routed to document vault.",
    revenue: "Forex Margin",
    status: "Ready",
    createdAt: "2026-05-30T10:10:00.000Z",
  },
  {
    id: "ledger-forex-card",
    source: "Forex Card",
    event: "Initial CAD load recommended",
    studentView: "Card load amount is based on Toronto and Vancouver arrival budgets.",
    consultantView: "Family spending controls and alerts prepared.",
    revenue: "Card Partner Fee",
    status: "Queued",
    createdAt: "2026-05-30T10:12:00.000Z",
  },
  {
    id: "ledger-insurance",
    source: "Insurance",
    event: "Visa-stage insurance package queued",
    studentView: "Insurance prompt appears after offer upload.",
    consultantView: "Post-offer checklist updates without manual entry.",
    revenue: "Insurance Commission",
    status: "Next",
    createdAt: "2026-05-30T10:15:00.000Z",
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitDemoJourneyChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(DEMO_JOURNEY_EVENT));
}

export function readDemoJourneyMode(): DemoJourneyMode {
  if (!canUseStorage()) return "preliminary";
  const stored = localStorage.getItem(DEMO_JOURNEY_STORAGE_KEY);
  return stored === "canada_locked" ? "canada_locked" : "preliminary";
}

export function writeDemoJourneyMode(mode: DemoJourneyMode) {
  if (!canUseStorage()) return mode;
  localStorage.setItem(DEMO_JOURNEY_STORAGE_KEY, mode);
  emitDemoJourneyChange();
  return mode;
}

export function isCanadaLockedDemo() {
  return readDemoJourneyMode() === "canada_locked";
}

export function getDemoCountryLock(): DemoCountryLock | null {
  return isCanadaLockedDemo() ? CANADA_COUNTRY_LOCK : null;
}

export function getScopedDemoUniversities(universities: University[] = DEMO_UNIVERSITIES) {
  const lock = getDemoCountryLock();
  if (!lock) return universities;
  const selectedIds = new Set(lock.universityIds);
  return universities.filter((university) => university.country === lock.countryName || selectedIds.has(university.id));
}

export function getScopedDemoCities() {
  const lock = getDemoCountryLock();
  if (!lock) return null;
  return lock.cities;
}

export function getDemoModeLabel() {
  return isCanadaLockedDemo() ? "Canada locked demo" : "Preliminary demo";
}

export function readDemoLedgerEvents(): DemoLedgerEvent[] {
  if (!canUseStorage()) return DEFAULT_DEMO_LEDGER_EVENTS;
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_LEDGER_STORAGE_KEY) ?? "null") as DemoLedgerEvent[] | null;
    if (Array.isArray(stored) && stored.length > 0) return stored;
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

export function getCanadaCountry() {
  return DEMO_COUNTRIES.find((country) => country.code === CANADA_COUNTRY_LOCK.countryCode);
}
