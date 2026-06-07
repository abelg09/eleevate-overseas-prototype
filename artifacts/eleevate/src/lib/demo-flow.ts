import type { Application } from "@workspace/api-client-react";
import {
  DEMO_APPLICATION_STORAGE_KEY,
  DEMO_UNIVERSITIES,
  getDemoProgramsForUniversity,
  getDemoUniversity,
} from "@/lib/demo-catalog";

export const DEMO_SHORTLIST_STORAGE_KEY = "eleevate.ai.shortlist.v2";

export const DEFAULT_DEMO_SHORTLIST_IDS: string[] = [];

export function readDemoShortlistIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_SHORTLIST_STORAGE_KEY) ?? "null") as string[] | null;
    if (Array.isArray(stored)) return stored;
  } catch {
    return DEFAULT_DEMO_SHORTLIST_IDS;
  }

  return DEFAULT_DEMO_SHORTLIST_IDS;
}

export function writeDemoShortlistIds(ids: Iterable<string>) {
  const uniqueIds = Array.from(new Set(ids));
  localStorage.setItem(DEMO_SHORTLIST_STORAGE_KEY, JSON.stringify(uniqueIds));
  return uniqueIds;
}

export function getDemoShortlistUniversities() {
  const ids = new Set(readDemoShortlistIds());
  return DEMO_UNIVERSITIES.filter((university) => ids.has(university.id));
}

function readStoredApplications() {
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_APPLICATION_STORAGE_KEY) ?? "[]") as Application[];
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function buildDemoApplicationFromUniversity(universityId: string, source = "shortlist"): Application | null {
  const university = getDemoUniversity(universityId);
  const program = getDemoProgramsForUniversity(universityId)[0];
  if (!university || !program) return null;

  return {
    id: `demo-app-${source}-${program.id}`,
    studentId: "demo-student",
    programId: program.id,
    status: "researching",
    notes: `Started from ${source === "shortlist" ? "shortlist" : "university discovery"} for ${university.name}. Review fit, documents, and deadline with a counsellor.`,
    deadline: program.applicationDeadline,
    updatedAt: new Date().toISOString(),
    program: {
      ...program,
      university,
    },
  };
}

export function getDemoApplicationsFromShortlist() {
  return readDemoShortlistIds()
    .map((id) => buildDemoApplicationFromUniversity(id))
    .filter((application): application is Application => Boolean(application));
}

export function ensureDemoApplicationForUniversity(universityId: string, source = "shortlist") {
  const nextApplication = buildDemoApplicationFromUniversity(universityId, source);
  if (!nextApplication) return null;

  const existing = readStoredApplications();
  if (existing.some((application) => application.programId === nextApplication.programId)) {
    return existing.find((application) => application.programId === nextApplication.programId) ?? nextApplication;
  }

  localStorage.setItem(DEMO_APPLICATION_STORAGE_KEY, JSON.stringify([nextApplication, ...existing]));
  return nextApplication;
}
