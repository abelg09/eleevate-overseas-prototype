import { useEffect, useState } from "react";

export interface StudentWorkspaceProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  studyLevel?: string;
  targetCountries?: string[];
  gpa?: string;
  ieltsScore?: string;
  toeflScore?: string;
  greScore?: string;
  gmatScore?: string;
  nationality?: string;
  preferredIntake?: string;
  budget?: string;
  careerGoal?: string;
  updatedAt?: string;
}

export const STUDENT_PROFILE_STORAGE_KEY = "eleevate.ai.student.profile.v2";
const STUDENT_WORKSPACE_EVENT = "eleevate-ai-student-workspace";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitWorkspaceChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STUDENT_WORKSPACE_EVENT));
}

export function readStudentWorkspaceProfile(): StudentWorkspaceProfile | null {
  if (!canUseStorage()) return null;
  try {
    const stored = JSON.parse(localStorage.getItem(STUDENT_PROFILE_STORAGE_KEY) ?? "null") as StudentWorkspaceProfile | null;
    if (!stored || typeof stored !== "object") return null;
    return stored;
  } catch {
    return null;
  }
}

export function writeStudentWorkspaceProfile(profile: StudentWorkspaceProfile) {
  if (!canUseStorage()) return profile;
  localStorage.setItem(STUDENT_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  emitWorkspaceChange();
  return profile;
}

export function clearStudentWorkspaceProfile() {
  if (!canUseStorage()) return;
  localStorage.removeItem(STUDENT_PROFILE_STORAGE_KEY);
  emitWorkspaceChange();
}

export function hasStudentWorkspaceProfile(profile: StudentWorkspaceProfile | null | undefined) {
  if (!profile) return false;
  return Boolean(
    profile.studyLevel ||
    profile.targetCountries?.length ||
    profile.gpa ||
    profile.ieltsScore ||
    profile.toeflScore ||
    profile.greScore ||
    profile.gmatScore ||
    profile.nationality ||
    profile.preferredIntake ||
    profile.budget ||
    profile.careerGoal,
  );
}

export function useStudentWorkspaceProfile() {
  const [profile, setProfile] = useState<StudentWorkspaceProfile | null>(() => readStudentWorkspaceProfile());

  useEffect(() => {
    const sync = () => setProfile(readStudentWorkspaceProfile());
    window.addEventListener(STUDENT_WORKSPACE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STUDENT_WORKSPACE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return profile;
}
