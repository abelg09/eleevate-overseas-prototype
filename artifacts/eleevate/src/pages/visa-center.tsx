import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Circle, Globe2, Clock, FileText, DollarSign, AlertCircle, ExternalLink, Building2, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

interface EmbassyInfo {
  country: string;
  visaPortal: string;
  visaPortalLabel: string;
  phone?: string;
  email?: string;
  appointmentUrl?: string;
  appointmentLabel?: string;
}

interface VisaGuide {
  country: string;
  flag: string;
  visaType: string;
  processingTime: string;
  fee: string;
  validity: string;
  color: string;
  requirements: string[];
  tips: string[];
  timeline: Array<{ step: string; duration: string; description: string }>;
  embassy: EmbassyInfo;
}

const VISA_GUIDES: VisaGuide[] = [
  {
    country: "United Kingdom",
    flag: "🇬🇧",
    visaType: "Student Visa (Tier 4)",
    processingTime: "3–8 weeks",
    fee: "£490 + IHS",
    validity: "Duration of course + 4 months",
    color: "blue",
    requirements: [
      "CAS (Confirmation of Acceptance for Studies) from university",
      "Valid passport (6+ months validity)",
      "English language test results (IELTS 5.5+)",
      "Financial evidence (£1,334/month for London, £1,023 elsewhere)",
      "ATAS certificate (if applicable)",
      "Tuberculosis test results (for some countries)",
    ],
    tips: [
      "Apply no earlier than 3 months before your course starts",
      "Maintain your bank balance for 28+ consecutive days before applying",
      "Keep scanned copies of all documents",
    ],
    timeline: [
      { step: "Receive CAS", duration: "Week 1–2", description: "University issues your CAS number after conditional offer is accepted." },
      { step: "Gather documents", duration: "Week 2–4", description: "Collect financial evidence, language scores, and other documents." },
      { step: "Submit application", duration: "Week 4–5", description: "Apply online and pay the visa fee + IHS surcharge." },
      { step: "Biometrics appointment", duration: "Week 5–6", description: "Attend a UK Visa Application Centre for biometrics." },
      { step: "Decision", duration: "Week 6–12", description: "Standard processing 3 weeks; priority available for faster decision." },
    ],
    embassy: {
      country: "United Kingdom",
      visaPortal: "https://www.gov.uk/student-visa",
      visaPortalLabel: "UKVI Student Visa Portal",
      appointmentUrl: "https://www.gov.uk/find-a-visa-application-centre",
      appointmentLabel: "Find Visa Application Centre",
      email: "ukvisas@fco.gov.uk",
    },
  },
  {
    country: "Canada",
    flag: "🇨🇦",
    visaType: "Study Permit",
    processingTime: "4–16 weeks",
    fee: "CAD $150",
    validity: "Duration of study + 90 days",
    color: "red",
    requirements: [
      "Acceptance letter from a Designated Learning Institution (DLI)",
      "Proof of financial support (CAD $10,000/year + tuition)",
      "Valid passport",
      "Statement of Purpose explaining study plans",
      "Medical exam (if required)",
      "Police clearance certificate",
    ],
    tips: [
      "Apply through the Student Direct Stream if eligible for faster processing (8 weeks)",
      "Ensure your institution is a DLI",
      "Get a biometrics appointment early — waits can be long",
    ],
    timeline: [
      { step: "Receive acceptance letter", duration: "Week 1", description: "Formal acceptance from your Canadian DLI." },
      { step: "Gather financial proof", duration: "Week 1–3", description: "Bank statements, scholarship letters, GIC." },
      { step: "Submit application", duration: "Week 3–4", description: "Apply online via IRCC portal." },
      { step: "Biometrics", duration: "Week 4–6", description: "Biometrics at a VAC or Application Support Centre." },
      { step: "Decision", duration: "Week 8–20", description: "Varies by country and stream; SDS is faster." },
    ],
    embassy: {
      country: "Canada",
      visaPortal: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html",
      visaPortalLabel: "IRCC Study Permit Portal",
      appointmentUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/biometric.html",
      appointmentLabel: "Book Biometrics Appointment",
      email: "IRCC.InfoStudents-InfoEtudiants.IRCC@cic.gc.ca",
    },
  },
  {
    country: "Australia",
    flag: "🇦🇺",
    visaType: "Student Visa (Subclass 500)",
    processingTime: "3–6 weeks",
    fee: "AUD $710",
    validity: "Duration of course + 2 months",
    color: "green",
    requirements: [
      "Confirmation of Enrolment (CoE) from a CRICOS provider",
      "Genuine Temporary Entrant (GTE) statement",
      "English language proficiency (IELTS 5.5+)",
      "Financial capacity evidence",
      "Overseas Student Health Cover (OSHC)",
      "Health and character requirements",
    ],
    tips: [
      "Write a compelling GTE statement explaining why you'll return after studies",
      "Arrange OSHC before submitting your application",
      "Australian student visa processing is often faster than expected",
    ],
    timeline: [
      { step: "Receive CoE", duration: "Week 1", description: "Your Australian university issues your CoE after paying tuition deposit." },
      { step: "Arrange OSHC", duration: "Week 1–2", description: "Purchase Overseas Student Health Cover." },
      { step: "Submit online", duration: "Week 2–3", description: "Apply through ImmiAccount portal." },
      { step: "Health checks", duration: "Week 3–4", description: "Undergo health examination if requested." },
      { step: "Decision", duration: "Week 4–8", description: "Most decisions within 3–6 weeks." },
    ],
    embassy: {
      country: "Australia",
      visaPortal: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500",
      visaPortalLabel: "ImmiAccount Student Visa",
      appointmentUrl: "https://online.vfsglobal.com/Austn-Appl/",
      appointmentLabel: "Book at VFS Global",
      phone: "+61 2 6196 0196",
    },
  },
  {
    country: "Germany",
    flag: "🇩🇪",
    visaType: "Student Visa (National Visa D)",
    processingTime: "6–12 weeks",
    fee: "€75",
    validity: "Up to 3 months (extended to residence permit on arrival)",
    color: "yellow",
    requirements: [
      "University admission letter",
      "Proof of financial resources (€934/month blocked account or scholarship)",
      "Blocked account (Sperrkonto) from Deutsche Bank or Fintiba",
      "German language proficiency (B2+) or English-taught program proof",
      "Health insurance coverage",
      "Accommodation proof or statement",
    ],
    tips: [
      "Open a blocked account (Sperrkonto) early — it can take 2–4 weeks",
      "Apply at the German embassy in your home country well in advance",
      "Germany has no IELTS requirement for English-taught programs",
    ],
    timeline: [
      { step: "Open blocked account", duration: "Week 1–3", description: "Set up Sperrkonto with Deutsche Bank or Fintiba." },
      { step: "Gather documents", duration: "Week 2–4", description: "Collect admission letter, transcripts, and language certificates." },
      { step: "Embassy appointment", duration: "Week 4–6", description: "Book and attend visa appointment at German embassy." },
      { step: "Processing", duration: "Week 6–12", description: "Wait for embassy decision." },
      { step: "Convert to residence permit", duration: "Arrival +30 days", description: "Register and apply for residence permit at local Ausländerbehörde." },
    ],
    embassy: {
      country: "Germany",
      visaPortal: "https://www.auswaertiges-amt.de/en/visa-service",
      visaPortalLabel: "German Federal Foreign Office",
      appointmentUrl: "https://service2.diplo.de/rktermin/extern/choose_realmList.do",
      appointmentLabel: "Book Embassy Appointment",
      email: "visa@auswaertiges-amt.de",
    },
  },
];

export default function VisaCenterPage() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [checklists, setChecklists] = useState<Record<string, boolean[]>>({});
  const [visaFile, setVisaFile] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("eleevate.student-first.visa-file.v1") ?? "{}") as Record<string, string>;
    } catch {
      return {};
    }
  });

  const selected = VISA_GUIDES.find(g => g.country === selectedCountry);

  const updateVisaFile = (key: string, value: string) => {
    setVisaFile((current) => ({ ...current, [key]: value }));
  };

  const saveVisaFile = () => {
    localStorage.setItem("eleevate.student-first.visa-file.v1", JSON.stringify(visaFile));
    toast.success("Visa application file saved in this browser.");
  };

  const toggleCheck = (country: string, index: number) => {
    setChecklists(prev => {
      const current = prev[country] ?? [];
      const updated = [...current];
      updated[index] = !updated[index];
      return { ...prev, [country]: updated };
    });
  };

  const getProgress = (country: string, requirements: string[]) => {
    const checks = checklists[country] ?? [];
    const done = checks.filter(Boolean).length;
    return { done, total: requirements.length, pct: Math.round((done / requirements.length) * 100) };
  };

  return (
    <AppLayout>
      <div data-testid="visa-center-page">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-serif text-foreground">Visa & Immigration Center</h1>
          <p className="text-muted-foreground mt-1">Country-specific visa guides, checklists, embassy contacts, and appointment links.</p>
        </div>

        <section className="mb-8 space-y-5" data-testid="visa-application-file">
          <Card className="overflow-hidden border border-border bg-white p-0 shadow-sm">
            <div className="brand-gradient-bg h-1" />
            <div className="p-5">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="eyebrow mb-1">Visa application file</div>
                  <h2 className="font-serif text-2xl font-bold text-foreground">Prepare every visa field in one place</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Add offer/CAS details, fee evidence, IHS and VFS payments, biometrics, and final decision status.
                  </p>
                </div>
                <Button className="rounded-full font-serif" onClick={saveVisaFile}>Save visa file</Button>
              </div>

              <div className="mb-5 rounded-lg border border-border bg-muted/25 p-4">
                <div className="mb-3 font-serif text-base font-bold text-foreground">Visa allocation</div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div><Label className="mb-1.5">Assigned consultant</Label><Input value={visaFile.assignedConsultant ?? ""} onChange={(event) => updateVisaFile("assignedConsultant", event.target.value)} placeholder="Consultant name" /></div>
                  <div><Label className="mb-1.5">Visa country</Label><Input value={visaFile.visaCountry ?? ""} onChange={(event) => updateVisaFile("visaCountry", event.target.value)} placeholder="e.g. United Kingdom" /></div>
                  <div><Label className="mb-1.5">Created by</Label><Input value={visaFile.createdBy ?? ""} onChange={(event) => updateVisaFile("createdBy", event.target.value)} placeholder="Student / Consultant" /></div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                <VisaYesNo label="CAS / acceptance received?" value={visaFile.casReceived} onChange={(value) => updateVisaFile("casReceived", value)} />
                <VisaYesNo label="Tuition fee deposit paid?" value={visaFile.tuitionDepositPaid} onChange={(value) => updateVisaFile("tuitionDepositPaid", value)} />
                <VisaYesNo label="TB test required?" value={visaFile.tbTestRequired} onChange={(value) => updateVisaFile("tbTestRequired", value)} />
                <VisaYesNo label="Visa application started?" value={visaFile.visaApplicationStarted} onChange={(value) => updateVisaFile("visaApplicationStarted", value)} />
              </div>
            </div>
          </Card>

          <Card className="border border-border bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-serif text-lg font-bold text-foreground">IHS, Embassy and VFS visa fee payment</h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <Label className="mb-1.5">Appointment type</Label>
                <Select value={visaFile.appointmentType ?? ""} onValueChange={(value) => updateVisaFile("appointmentType", value)}>
                  <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="super-priority">Super priority</SelectItem>
                    <SelectItem value="biometric-only">Biometric only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="mb-1.5">IHS reference number</Label><Input value={visaFile.ihsReference ?? ""} onChange={(event) => updateVisaFile("ihsReference", event.target.value)} /></div>
              <div><Label className="mb-1.5">IHS currency</Label><Input value={visaFile.ihsCurrency ?? ""} onChange={(event) => updateVisaFile("ihsCurrency", event.target.value)} placeholder="GBP, USD, INR" /></div>
              <div><Label className="mb-1.5">IHS amount paid</Label><Input value={visaFile.ihsAmount ?? ""} onChange={(event) => updateVisaFile("ihsAmount", event.target.value)} /></div>
              <div><Label className="mb-1.5">IHS payment date</Label><Input type="date" value={visaFile.ihsPaymentDate ?? ""} onChange={(event) => updateVisaFile("ihsPaymentDate", event.target.value)} /></div>
              <div><Label className="mb-1.5">Upload IHS receipt</Label><Input type="file" /></div>

              <div><Label className="mb-1.5">Embassy currency</Label><Input value={visaFile.embassyCurrency ?? ""} onChange={(event) => updateVisaFile("embassyCurrency", event.target.value)} /></div>
              <div><Label className="mb-1.5">Embassy visa fee amount paid</Label><Input value={visaFile.embassyAmount ?? ""} onChange={(event) => updateVisaFile("embassyAmount", event.target.value)} /></div>
              <div><Label className="mb-1.5">Embassy visa fee payment date</Label><Input type="date" value={visaFile.embassyPaymentDate ?? ""} onChange={(event) => updateVisaFile("embassyPaymentDate", event.target.value)} /></div>
              <div><Label className="mb-1.5">Upload embassy visa fee receipt</Label><Input type="file" /></div>

              <div><Label className="mb-1.5">VFS currency</Label><Input value={visaFile.vfsCurrency ?? ""} onChange={(event) => updateVisaFile("vfsCurrency", event.target.value)} /></div>
              <div><Label className="mb-1.5">VFS visa fee amount paid</Label><Input value={visaFile.vfsAmount ?? ""} onChange={(event) => updateVisaFile("vfsAmount", event.target.value)} /></div>
              <div><Label className="mb-1.5">VFS visa fee payment date</Label><Input type="date" value={visaFile.vfsPaymentDate ?? ""} onChange={(event) => updateVisaFile("vfsPaymentDate", event.target.value)} /></div>
              <div><Label className="mb-1.5">Upload VFS visa fee receipt</Label><Input type="file" /></div>
              <div className="md:col-span-2">
                <Label className="mb-1.5">Remark</Label>
                <Textarea value={visaFile.remark ?? ""} onChange={(event) => updateVisaFile("remark", event.target.value)} placeholder="Add consultant/student notes" />
              </div>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border border-border bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-serif text-lg font-bold text-foreground">Biometric appointment</h3>
              <VisaYesNo label="Appointment booked?" value={visaFile.biometricBooked} onChange={(value) => updateVisaFile("biometricBooked", value)} />
              <div className="mt-4"><Label className="mb-1.5">Appointment date</Label><Input type="date" value={visaFile.biometricDate ?? ""} onChange={(event) => updateVisaFile("biometricDate", event.target.value)} /></div>
            </Card>
            <Card className="border border-border bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-serif text-lg font-bold text-foreground">Biometric completed</h3>
              <VisaYesNo label="Biometric completed?" value={visaFile.biometricCompleted} onChange={(value) => updateVisaFile("biometricCompleted", value)} />
              <div className="mt-4"><Label className="mb-1.5">Completion date</Label><Input type="date" value={visaFile.biometricCompletedDate ?? ""} onChange={(event) => updateVisaFile("biometricCompletedDate", event.target.value)} /></div>
            </Card>
            <Card className="border border-border bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-serif text-lg font-bold text-foreground">Visa decision & passport collection</h3>
              <Label className="mb-1.5">Visa decision</Label>
              <Select value={visaFile.visaDecision ?? ""} onValueChange={(value) => updateVisaFile("visaDecision", value)}>
                <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="refused">Refused</SelectItem>
                  <SelectItem value="additional-docs">Additional documents requested</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-4"><Label className="mb-1.5">Decision date</Label><Input type="date" value={visaFile.decisionDate ?? ""} onChange={(event) => updateVisaFile("decisionDate", event.target.value)} /></div>
            </Card>
          </div>
        </section>

        <div className="flex flex-wrap gap-3 mb-8">
          {VISA_GUIDES.map(guide => {
            const prog = getProgress(guide.country, guide.requirements);
            return (
              <Button
                key={guide.country}
                variant={selectedCountry === guide.country ? "default" : "outline"}
                onClick={() => setSelectedCountry(selectedCountry === guide.country ? null : guide.country)}
                className="flex items-center gap-2"
                data-testid={`btn-country-${guide.country.replace(/ /g, "-").toLowerCase()}`}
              >
                <span className="text-lg">{guide.flag}</span>
                {guide.country}
                {prog.done > 0 && (
                  <Badge variant="secondary" className="text-xs ml-1">{prog.done}/{prog.total}</Badge>
                )}
              </Button>
            );
          })}
        </div>

        {selected && (
          <div className="mb-8 space-y-6" data-testid={`visa-detail-${selected.country}`}>
            {/* Overview */}
            <Card className="p-6 border border-border">
              <div className="flex items-start gap-4">
                <span className="text-5xl">{selected.flag}</span>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground">{selected.country}</h2>
                  <p className="text-muted-foreground text-sm">{selected.visaType}</p>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">Processing</div>
                        <div className="font-medium text-foreground">{selected.processingTime}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">Visa Fee</div>
                        <div className="font-medium text-foreground">{selected.fee}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Globe2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">Validity</div>
                        <div className="font-medium text-foreground">{selected.validity}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Requirements Checklist */}
              <Card className="p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Requirements Checklist
                  </h3>
                  {(() => {
                    const prog = getProgress(selected.country, selected.requirements);
                    return <span className="text-xs text-muted-foreground">{prog.done}/{prog.total} done</span>;
                  })()}
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-4">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${getProgress(selected.country, selected.requirements).pct}%` }}
                  />
                </div>
                <div className="space-y-3">
                  {selected.requirements.map((req, i) => {
                    const done = checklists[selected.country]?.[i] ?? false;
                    return (
                      <button
                        key={i}
                        onClick={() => toggleCheck(selected.country, i)}
                        className="flex items-start gap-3 w-full text-left hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                        data-testid={`req-check-${i}`}
                      >
                        {done
                          ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          : <Circle className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                        }
                        <span className={`text-sm ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>{req}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <div className="space-y-4">
                {/* Pro Tips */}
                <Card className="p-6 border border-border">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" /> Pro Tips
                  </h3>
                  <div className="space-y-3">
                    {selected.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center flex-shrink-0 font-medium mt-0.5">{i + 1}</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Embassy & Official Links */}
                <Card className="p-6 border border-border" data-testid="embassy-info">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" /> Official Links & Embassy
                  </h3>
                  <div className="space-y-3">
                    <a
                      href={selected.embassy.visaPortal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                      data-testid="link-visa-portal"
                    >
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                      {selected.embassy.visaPortalLabel}
                    </a>
                    {selected.embassy.appointmentUrl && (
                      <a
                        href={selected.embassy.appointmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                        data-testid="link-appointment"
                      >
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                        {selected.embassy.appointmentLabel}
                      </a>
                    )}
                    {selected.embassy.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        {selected.embassy.phone}
                      </div>
                    )}
                    {selected.embassy.email && (
                      <a
                        href={`mailto:${selected.embassy.email}`}
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                        data-testid="link-embassy-email"
                      >
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        {selected.embassy.email}
                      </a>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* Timeline */}
            <Card className="p-6 border border-border">
              <h3 className="font-semibold text-foreground mb-5 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Application Timeline
              </h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-6">
                  {selected.timeline.map((step, i) => (
                    <div key={i} className="flex gap-4 relative pl-10">
                      <div className="absolute left-0 w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-foreground">{step.step}</span>
                          <Badge variant="secondary" className="text-xs">{step.duration}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {!selected && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {VISA_GUIDES.map(guide => (
              <Card
                key={guide.country}
                className="p-5 border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => setSelectedCountry(guide.country)}
                data-testid={`visa-card-${guide.country.replace(/ /g, "-").toLowerCase()}`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{guide.flag}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{guide.country}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{guide.visaType}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{guide.processingTime}</span>
                      <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />{guide.fee}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-muted-foreground">{guide.requirements.length} requirements</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-xs text-primary flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />Official portal
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function VisaYesNo({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="text-sm font-semibold text-foreground">{label}</div>
      <div className="mt-3 flex gap-2">
        {["Yes", "No"].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
              value === option
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-white text-foreground hover:border-primary/40"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
