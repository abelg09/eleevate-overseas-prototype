import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function getDomain(website?: string | null) {
  if (!website) return null;

  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || null;
  }
}

function getInitials(name: string) {
  const words = name
    .replace(/\b(university|college|technical|of|the|and)\b/gi, " ")
    .split(/\s+/)
    .filter(Boolean);

  return (words[0]?.[0] ?? "U") + (words[1]?.[0] ?? "");
}

export function UniversityLogo({
  name,
  website,
  className,
  imageClassName,
}: {
  name: string;
  website?: string | null;
  className?: string;
  imageClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const domain = useMemo(() => getDomain(website), [website]);
  const logoUrl = domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : null;
  const initials = useMemo(() => getInitials(name).toUpperCase(), [name]);

  return (
    <div
      className={cn(
        "flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white shadow-sm",
        className,
      )}
      aria-hidden="true"
    >
      {logoUrl && !failed ? (
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={cn("h-9 w-9 object-contain", imageClassName)}
        />
      ) : (
        <span className="brand-gradient-bg flex h-full w-full items-center justify-center font-serif text-sm font-bold text-white">
          {initials}
        </span>
      )}
    </div>
  );
}
