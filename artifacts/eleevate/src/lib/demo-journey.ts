import { useEffect, useState } from "react";
import type { University } from "@workspace/api-client-react";
import { DEMO_COUNTRIES, DEMO_UNIVERSITIES } from "@/lib/demo-catalog";

export type DemoJourneyMode = "preliminary";

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

export const DEMO_AGENT_PROMPTS: DemoAgentPrompt[] = [
  { id: "country", label: "Find my country", prompt: "Compare countries by profile, budget, visa risk, and future career route.", href: "/countries" },
  { id: "report", label: "Generate ELEE report", prompt: "Turn my profile, family readiness, and finance details into a readable action report.", href: "/elee-report" },
  { id: "finance", label: "Check finance gap", prompt: "Show my funding gap, matching lenders, remittance, forex card, and insurance steps.", href: "/financial-hub" },
  { id: "applications", label: "Start applications", prompt: "Move my saved universities into a tracked application workflow.", href: "/universities" },
];

export const DEFAULT_DEMO_LEDGER_EVENTS: DemoLedgerEvent[] = [];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitDemoJourneyChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(DEMO_JOURNEY_EVENT));
}

export function readDemoJourneyMode(): DemoJourneyMode {
  return "preliminary";
}

export function writeDemoJourneyMode(mode: DemoJourneyMode) {
  if (!canUseStorage()) return mode;
  localStorage.setItem(DEMO_JOURNEY_STORAGE_KEY, "preliminary");
  emitDemoJourneyChange();
  return "preliminary";
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
  const lock = getDemoCountryLock();
  if (!lock) return null;
  return lock.cities;
}

export function getDemoModeLabel() {
  return "Global journey";
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
  return DEMO_COUNTRIES.find((country) => country.code === "CA");
}
