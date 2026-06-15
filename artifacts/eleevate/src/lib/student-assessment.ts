import { useEffect, useState } from "react";

export interface StudentFieldRecommendation {
  field: string;
  countries: string[];
  careers: string[];
  matchScore: number;
}

export interface StudentAssessmentResult {
  id: string;
  fieldRecommendations: StudentFieldRecommendation[];
  careerRecommendations?: { career: string; field: string }[];
  personalityInsights?: {
    workStyle?: string;
    socialStyle?: string;
    decisionStyle?: string;
    planningStyle?: string;
  };
  completedAt: string;
}

export const STUDENT_ASSESSMENT_STORAGE_KEY = "eleevate.student-first.assessment.result.v1";
export const STUDENT_ASSESSMENT_EVENT = "eleevate-student-assessment";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitAssessmentChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STUDENT_ASSESSMENT_EVENT));
}

export function readStudentAssessmentResult(): StudentAssessmentResult | null {
  if (!canUseStorage()) return null;
  try {
    const stored = JSON.parse(localStorage.getItem(STUDENT_ASSESSMENT_STORAGE_KEY) ?? "null") as StudentAssessmentResult | null;
    if (!stored || typeof stored !== "object") return null;
    return stored;
  } catch {
    return null;
  }
}

export function writeStudentAssessmentResult(result: StudentAssessmentResult) {
  if (!canUseStorage()) return result;
  localStorage.setItem(STUDENT_ASSESSMENT_STORAGE_KEY, JSON.stringify(result));
  emitAssessmentChange();
  return result;
}

export function useStudentAssessmentResult() {
  const [result, setResult] = useState<StudentAssessmentResult | null>(() => readStudentAssessmentResult());

  useEffect(() => {
    const sync = () => setResult(readStudentAssessmentResult());
    window.addEventListener(STUDENT_ASSESSMENT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STUDENT_ASSESSMENT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return result;
}
