import { useEffect, useState } from "react";

export interface StudentWorkspaceProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: string;
  dob?: string;
  country?: string;
  city?: string;
  preferredCountry?: string;
  address?: string;
  passportNumber?: string;
  studyLevel?: string;
  targetCountries?: string[];
  courseGoal?: string;
  careerGoal?: string;
  gpa?: string;
  ieltsScore?: string;
  toeflScore?: string;
  greScore?: string;
  gmatScore?: string;
  nationality?: string;
  preferredIntake?: string;
  budget?: string;
  budgetMin?: string;
  budgetMax?: string;
  budgetCurrency?: "INR" | "USD";
  highestEducation?: string;
  stream?: string;
  passingYear?: string;
  boardOrUniversity?: string;
  languageTestName?: string;
  languageTestDate?: string;
  languageTestExpiry?: string;
  readingScore?: string;
  writingScore?: string;
  speakingScore?: string;
  listeningScore?: string;
  aptitudeTestName?: string;
  aptitudeTestDate?: string;
  verbalReasoningScore?: string;
  quantitativeReasoningScore?: string;
  analyticalWritingScore?: string;
  companyName?: string;
  companyAddress?: string;
  designation?: string;
  jobType?: string;
  profileRemarks?: string;
  emergencyName?: string;
  emergencyContact?: string;
  emergencyEmail?: string;
  emergencyRelationship?: string;
  lastSavedAt?: string;
}

export const STUDENT_PROFILE_STORAGE_KEY = "eleevate.student-first.profile.v2";
export const STUDENT_WORKSPACE_EVENT = "eleevate-student-workspace";

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
  const nextProfile = {
    ...profile,
    lastSavedAt: new Date().toISOString(),
  };
  localStorage.setItem(STUDENT_PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
  emitWorkspaceChange();
  return nextProfile;
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
    profile.courseGoal ||
    profile.gpa ||
    profile.ieltsScore ||
    profile.toeflScore ||
    profile.greScore ||
    profile.gmatScore ||
    profile.nationality ||
    profile.preferredIntake ||
    profile.budget ||
    profile.budgetMin ||
    profile.budgetMax ||
    profile.mobileNumber ||
    profile.dob ||
    profile.country ||
    profile.city ||
    profile.preferredCountry ||
    profile.address ||
    profile.passportNumber ||
    profile.highestEducation ||
    profile.stream ||
    profile.companyName ||
    profile.emergencyName,
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
