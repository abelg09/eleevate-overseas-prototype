export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE !== "false";
}

export function listFromApi<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object") {
    const candidate = value as {
      data?: unknown;
      items?: unknown;
      results?: unknown;
      records?: unknown;
    };

    for (const key of ["data", "items", "results", "records"] as const) {
      if (Array.isArray(candidate[key])) return candidate[key] as T[];
    }
  }

  return [];
}

export const demoUser = {
  student: {
    firstName: "Aarav",
    lastName: "Mehta",
    email: "aarav.mehta@example.com",
  },
  consultant: {
    firstName: "Maya",
    lastName: "Rao",
    email: "maya.rao@eleevate.example",
  },
};
