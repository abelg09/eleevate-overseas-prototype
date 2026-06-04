import { Link } from "wouter";
import { ArrowRight, BookOpenCheck, FileText, LifeBuoy, UsersRound, WalletCards } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-shell";

const moreGroups = [
  {
    title: "Documents & Visa",
    description: "Prepare the file that supports applications, offers, and visa confidence.",
    icon: FileText,
    links: [
      { href: "/documents", label: "Document Vault" },
      { href: "/visa-center", label: "Visa Center" },
      { href: "/sop-studio", label: "SOP Studio" },
      { href: "/support", label: "Support" },
    ],
  },
  {
    title: "Finance & Services",
    description: "Plan funds, loans, remittance, forex, insurance, subscriptions, and rewards.",
    icon: WalletCards,
    links: [
      { href: "/financial-hub", label: "Financial Hub" },
      { href: "/loans", label: "Edu Loans" },
      { href: "/remittance", label: "Remittance" },
      { href: "/forex-card", label: "Forex Card" },
      { href: "/forex", label: "Forex" },
      { href: "/insurance", label: "Insurance" },
      { href: "/subscription", label: "Subscription" },
      { href: "/rewards", label: "Rewards" },
    ],
  },
  {
    title: "Upskilling & Careers",
    description: "Improve test scores, language confidence, employability, and alumni access.",
    icon: BookOpenCheck,
    links: [
      { href: "/upskilling", label: "Upskilling" },
      { href: "/test-prep", label: "Test Prep" },
      { href: "/mock-test", label: "Mock Test" },
      { href: "/language-hub", label: "Language Lab" },
      { href: "/careers", label: "Careers" },
      { href: "/job-board", label: "Job Board" },
      { href: "/alumni", label: "Alumni Network" },
      { href: "/news", label: "News & Newsletter" },
    ],
  },
  {
    title: "Support & Team",
    description: "Ask for help or switch into the consultant workbench when reviewing operations.",
    icon: LifeBuoy,
    links: [
      { href: "/support", label: "Student Support" },
      { href: "/marketplace", label: "Services" },
      { href: "/consultant/dashboard", label: "Consultant Workbench" },
    ],
  },
];

export default function MorePage() {
  return (
    <AppLayout>
      <div data-testid="more-page">
        <PageHeader
          eyebrow="More"
          title="Everything else, grouped clearly"
          description="The main menu stays simple. These modules are still available when the student needs documents, finance, upskilling, news, alumni, rewards, or support."
          actions={
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-full font-serif">Back to dashboard</Button>
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {moreGroups.map((group) => {
            const GroupIcon = group.icon;

            return (
              <Card key={group.title} className="app-card overflow-hidden p-0">
                <div className="brand-gradient-bg h-1.5" />
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="brand-gradient-bg flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg text-white">
                      <GroupIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-serif text-xl font-bold text-foreground">{group.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{group.description}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {group.links.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <div className="group flex min-h-12 items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm font-semibold text-foreground transition-all hover:border-primary/35 hover:bg-primary/5">
                          <span>{item.label}</span>
                          <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="app-card mt-5 border-primary/20 bg-primary/5 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge className="rounded-full bg-white text-primary hover:bg-white">Student-first rule</Badge>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                Start with the seven-step journey. Open More only when the task needs a deeper service, learning, support, or finance tool.
              </p>
            </div>
            <Link href="/journey-map">
              <Button className="rounded-full font-serif">
                View journey checklist <UsersRound className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
