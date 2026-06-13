import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { cn } from "@/lib/utils";

const alumniSignals = [
  { label: "Country chapters", value: "12", detail: "Global student groups", tone: "border-l-primary" },
  { label: "Mentors available", value: "86", detail: "42 verified this month", tone: "border-l-emerald-400" },
  { label: "Open referrals", value: "24", detail: "Part-time and graduate roles", tone: "border-l-[#F8B133]" },
  { label: "Wellness circles", value: "9", detail: "Local support groups", tone: "border-l-primary" },
];

const communities = [
  {
    title: "Canada student community",
    location: "Toronto, Waterloo, Vancouver",
    members: 118,
    focus: "Internships, housing, winter readiness, and post-study work permits.",
    progress: 82,
  },
  {
    title: "UK Business & Analytics",
    location: "London, Manchester, Birmingham",
    members: 74,
    focus: "Graduate route planning, CV reviews, part-time jobs, and local networking.",
    progress: 68,
  },
  {
    title: "Germany Engineering",
    location: "Berlin, Munich, Aachen",
    members: 51,
    focus: "Language readiness, blocked account setup, accommodation, and research roles.",
    progress: 54,
  },
];

const mentorQueue = [
  { name: "Rhea Nair", role: "Graduate mentor, Canada", status: "Available", fit: "SOP, co-op, housing" },
  { name: "Arjun Shah", role: "MBA, University of Leeds", status: "This week", fit: "Career switch, finance proof" },
  { name: "Meera Iyer", role: "MS Data Science, TU Munich", status: "Waitlist", fit: "German process, language plan" },
];

const postLandingServices = [
  "Airport pickup and local familiarization",
  "SIM, bank account, tax, and insurance setup",
  "Part-time employment readiness",
  "PSWV and work permit filing support",
  "Physical and mental wellness check-ins",
  "Business, startup, sports, and hobby groups",
];

export default function AlumniNetworkPage() {
  return (
    <div data-testid="alumni-network-page">
      <PageHeader
        eyebrow="Career & Community"
        title="Alumni Network"
        description="Connect with alumni, local student communities, career mentors, wellness support, and arrival services after admission."
        actions={
          <Link href="/careers">
            <Button className="rounded-full font-serif">Explore careers</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {alumniSignals.map((item) => (
          <Card key={item.label} className={cn("app-card border-l-4 p-4", item.tone)}>
            <div className="text-xs font-semibold text-muted-foreground">{item.label}</div>
            <div className="mt-2 font-serif text-2xl font-bold text-foreground">{item.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{item.detail}</div>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="app-card p-4">
          <SectionHeader title="Country and university communities" description="Structured around the exact post-landing needs from the flow chart." />
          <div className="space-y-3">
            {communities.map((community) => (
              <div key={community.title} className="rounded-lg border border-border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-serif text-base font-bold text-foreground">{community.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{community.location}</div>
                  </div>
                  <Badge variant="secondary">{community.members} members</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{community.focus}</p>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={community.progress} className="h-1.5 flex-1" />
                  <span className="text-xs font-semibold text-foreground">{community.progress}% active</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="app-card p-4">
          <SectionHeader title="Mentor matching queue" />
          <div className="space-y-3">
            {mentorQueue.map((mentor) => (
              <div key={mentor.name} className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{mentor.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{mentor.role}</div>
                  </div>
                  <Badge variant="outline">{mentor.status}</Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{mentor.fit}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="app-card mt-4 p-4">
        <SectionHeader title="Post-landing service map" description="What students need after the visa is approved and before they feel settled." />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {postLandingServices.map((service) => (
            <div key={service} className="rounded-lg border border-border bg-white p-3 text-sm font-medium text-foreground">
              {service}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
