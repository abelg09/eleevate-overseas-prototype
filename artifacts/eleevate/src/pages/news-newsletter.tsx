import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { cn } from "@/lib/utils";

const feedItems = [
  {
    title: "Canada intake deadline watch",
    category: "Admissions",
    country: "Canada",
    impact: "High",
    summary: "Flag programs closing in the next 30 days and push affected students into application review.",
    tone: "border-l-red-400",
  },
  {
    title: "UK finance evidence reminder",
    category: "Visa",
    country: "United Kingdom",
    impact: "Medium",
    summary: "Prompt students to align sponsor statements, loan sanction letters, and tuition payment receipts.",
    tone: "border-l-[#F8B133]",
  },
  {
    title: "Germany language readiness brief",
    category: "Upskilling",
    country: "Germany",
    impact: "Medium",
    summary: "Route students with German preferences into language lab and blocked-account preparation.",
    tone: "border-l-primary",
  },
  {
    title: "Post-study work pathway roundup",
    category: "Career",
    country: "Multi-country",
    impact: "Watch",
    summary: "Create a family-friendly comparison for employability, duration, and filing milestones.",
    tone: "border-l-emerald-400",
  },
];

const newsletterSegments = [
  { segment: "Students", cadence: "Weekly", content: "Deadlines, scholarships, test prep, visa checklist, next action" },
  { segment: "Parents", cadence: "Fortnightly", content: "Cost, country comparison, safety, finance, accommodation" },
  { segment: "Consultants", cadence: "Daily", content: "Blocked workflows, rule changes, inbox priorities, lead nudges" },
  { segment: "Alumni", cadence: "Monthly", content: "Mentor requests, job referrals, events, wellness, community highlights" },
];

const automationRules = [
  "Tag each update by country, intake, module, risk level, and audience.",
  "Convert high-impact updates into tasks on the student dashboard.",
  "Send consultant brief before student-facing newsletter when action is required.",
  "Archive every sent issue against the student's ELEE timeline.",
];

export default function NewsNewsletterPage() {
  return (
    <div data-testid="news-newsletter-page">
      <PageHeader
        eyebrow="Live News & Newsletter"
        title="News command center"
        description="A curated update layer for visa changes, admission deadlines, scholarships, job market signals, and newsletter campaigns. Demo data is shown now; live feeds can be connected later."
        actions={
          <Link href="/elee-report">
            <Button className="rounded-full font-serif">Open ELEE context</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="app-card p-4">
          <SectionHeader title="Priority update feed" description="Operational updates that should become student, family, or consultant actions." />
          <div className="space-y-3">
            {feedItems.map((item) => (
              <div key={item.title} className={cn("rounded-lg border border-border border-l-4 bg-white p-4", item.tone)}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-serif text-base font-bold text-foreground">{item.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{item.country} - {item.category}</div>
                  </div>
                  <Badge variant="outline">{item.impact}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.summary}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="app-card p-4">
          <SectionHeader title="Newsletter segments" />
          <div className="space-y-3">
            {newsletterSegments.map((segment) => (
              <div key={segment.segment} className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-foreground">{segment.segment}</div>
                  <Badge variant="secondary">{segment.cadence}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{segment.content}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="app-card mt-4 p-4">
        <SectionHeader title="Automation rules" description="How this module should improve the product once connected to live sources." />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {automationRules.map((rule, index) => (
            <div key={rule} className="rounded-lg border border-border bg-white p-3">
              <div className="font-serif text-xs font-bold uppercase tracking-wide text-primary">Rule {String(index + 1).padStart(2, "0")}</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{rule}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
