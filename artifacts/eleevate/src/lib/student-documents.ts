import type { Document } from "@workspace/api-client-react";

export const STUDENT_DOCUMENTS_STORAGE_KEY = "eleevate.student-first.documents.v1";
export const STUDENT_DOCUMENTS_EVENT = "eleevate-student-documents";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitDocumentsChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STUDENT_DOCUMENTS_EVENT));
}

export function readStudentDocuments(): Document[] {
  if (!canUseStorage()) return [];
  try {
    const stored = JSON.parse(localStorage.getItem(STUDENT_DOCUMENTS_STORAGE_KEY) ?? "[]") as Document[];
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function writeStudentDocuments(documents: Document[]) {
  if (!canUseStorage()) return documents;
  localStorage.setItem(STUDENT_DOCUMENTS_STORAGE_KEY, JSON.stringify(documents));
  emitDocumentsChange();
  return documents;
}

export function clearStudentDocuments() {
  if (!canUseStorage()) return;
  localStorage.removeItem(STUDENT_DOCUMENTS_STORAGE_KEY);
  emitDocumentsChange();
}
