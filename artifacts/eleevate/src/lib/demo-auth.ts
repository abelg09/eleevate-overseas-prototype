import { useEffect, useState } from "react";

export type DemoRole = "student" | "consultant";

export interface DemoAuthSession {
  authenticated: true;
  role: DemoRole;
  email: string;
  signedInAt: string;
}

export const DEMO_AUTH_STORAGE_KEY = "eleevate.ai.auth.v1";
const DEMO_AUTH_EVENT = "eleevate-demo-auth";

function emitDemoAuthChange() {
  window.dispatchEvent(new Event(DEMO_AUTH_EVENT));
}

export function readDemoAuth(): DemoAuthSession | null {
  try {
    const value = localStorage.getItem(DEMO_AUTH_STORAGE_KEY);
    if (!value) return null;
    const session = JSON.parse(value) as Partial<DemoAuthSession>;
    if (session.authenticated && session.role && session.email) return session as DemoAuthSession;
  } catch {
    return null;
  }

  return null;
}

export function isDemoAuthenticated() {
  return readDemoAuth()?.authenticated === true;
}

export function writeDemoAuth(role: DemoRole, email: string) {
  const session: DemoAuthSession = {
    authenticated: true,
    role,
    email,
    signedInAt: new Date().toISOString(),
  };
  localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(session));
  emitDemoAuthChange();
  return session;
}

export function clearDemoAuth() {
  localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
  emitDemoAuthChange();
}

export function useDemoAuthState() {
  const [session, setSession] = useState<DemoAuthSession | null>(() => readDemoAuth());

  useEffect(() => {
    const sync = () => setSession(readDemoAuth());
    window.addEventListener(DEMO_AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DEMO_AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return session;
}
