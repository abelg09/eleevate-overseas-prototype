import type { Country, Program } from "@workspace/api-client-react";
import { DEMO_COUNTRIES, DEMO_PROGRAMS } from "@/lib/demo-catalog";

export interface CourseInsight {
  programId: string;
  fitScore: number;
  careerSignal: string;
  visaSignal: string;
  scholarshipSignal: string;
  eleeReason: string;
}

export interface DemoScholarship {
  id: string;
  name: string;
  country: string;
  provider: string;
  amountUsd: number;
  deadline: string;
  fitScore: number;
  type: "Merit" | "Need" | "Country" | "University";
  eligibility: string[];
  requiredDocs: string[];
}

export interface CountryCompareInsight {
  code: string;
  fitScore: number;
  tuitionRange: string;
  livingCost: string;
  visaRisk: "Low" | "Medium" | "Review";
  postStudyWork: string;
  pathway: string;
  familyReadiness: string;
}

export const COURSE_INSIGHTS: CourseInsight[] = [
  {
    programId: "demo-uoft-mscs",
    fitScore: 92,
    careerSignal: "AI, software, and research roles in Toronto",
    visaSignal: "Strong if GIC and sponsor proof are cleaned",
    scholarshipSignal: "Merit shortlist possible",
    eleeReason: "Highest Canada fit for CS profile, PGWP pathway, and family sponsor readiness.",
  },
  {
    programId: "demo-ubc-data",
    fitScore: 89,
    careerSignal: "Data science and analytics roles in Vancouver",
    visaSignal: "Strong route with clear one-year program finance proof",
    scholarshipSignal: "Department award review",
    eleeReason: "Fast applied program with strong employability and lower timeline risk.",
  },
  {
    programId: "demo-manchester-ai",
    fitScore: 86,
    careerSignal: "AI and analytics roles across UK tech hubs",
    visaSignal: "CAS route is straightforward after deposit",
    scholarshipSignal: "India excellence awards",
    eleeReason: "Good backup to Canada with faster completion and strong brand.",
  },
  {
    programId: "demo-leeds-business",
    fitScore: 78,
    careerSignal: "Business analyst and international operations roles",
    visaSignal: "Low visa complexity if funds are parked early",
    scholarshipSignal: "Business school awards",
    eleeReason: "Value-focused UK option with a practical cost profile.",
  },
  {
    programId: "demo-asu-software",
    fitScore: 81,
    careerSignal: "US software engineering and product roles",
    visaSignal: "Interview preparation required",
    scholarshipSignal: "Innovation scholarships",
    eleeReason: "Flexible US route, but visa interview and higher proof of funds need attention.",
  },
  {
    programId: "demo-tum-ai",
    fitScore: 83,
    careerSignal: "European AI, data, and engineering roles",
    visaSignal: "Blocked account and APS checklist required",
    scholarshipSignal: "DAAD-style funding review",
    eleeReason: "Low-tuition route with strong technical brand, but documentation must be precise.",
  },
];

export const DEFAULT_COURSE_INSIGHT: Omit<CourseInsight, "programId"> = {
  fitScore: 74,
  careerSignal: "Career outcome needs counsellor review",
  visaSignal: "Document and funding proof review required",
  scholarshipSignal: "Scholarship eligibility unknown",
  eleeReason: "Promising option, but ELEE needs more profile evidence before ranking it higher.",
};

export const DEMO_SCHOLARSHIPS: DemoScholarship[] = [
  {
    id: "sch-canada-merit",
    name: "Canada Graduate Excellence Award",
    country: "Canada",
    provider: "University / faculty award",
    amountUsd: 8000,
    deadline: "2026-06-15",
    fitScore: 86,
    type: "Merit",
    eligibility: ["GPA above 3.3", "Strong SOP", "STEM or research-led program"],
    requiredDocs: ["Transcript", "SOP", "Resume", "Faculty fit note"],
  },
  {
    id: "sch-uoft-international",
    name: "International Student Grant",
    country: "Canada",
    provider: "University partner",
    amountUsd: 6000,
    deadline: "2026-06-03",
    fitScore: 82,
    type: "University",
    eligibility: ["Admit or active application", "Family funding evidence", "Academic merit"],
    requiredDocs: ["Application ID", "Bank proof", "Academic record"],
  },
  {
    id: "sch-uk-india",
    name: "UK India Future Leaders Scholarship",
    country: "United Kingdom",
    provider: "Partner universities",
    amountUsd: 5000,
    deadline: "2026-07-01",
    fitScore: 79,
    type: "Country",
    eligibility: ["Indian passport", "Leadership evidence", "UK master's application"],
    requiredDocs: ["Leadership essay", "Resume", "Offer letter"],
  },
  {
    id: "sch-germany-daad",
    name: "Germany Technical Excellence Funding",
    country: "Germany",
    provider: "Public funding pathway",
    amountUsd: 7000,
    deadline: "2026-05-31",
    fitScore: 75,
    type: "Country",
    eligibility: ["Engineering or data program", "German route readiness", "Strong academic record"],
    requiredDocs: ["APS status", "Transcript", "Motivation letter"],
  },
  {
    id: "sch-australia-access",
    name: "Australia Global Access Grant",
    country: "Australia",
    provider: "Institutional award",
    amountUsd: 4500,
    deadline: "2026-06-20",
    fitScore: 72,
    type: "Need",
    eligibility: ["Financial gap", "On-time deposit", "Program-aligned SOP"],
    requiredDocs: ["Family income proof", "Offer letter", "SOP"],
  },
];

export const COUNTRY_COMPARE_INSIGHTS: CountryCompareInsight[] = [
  {
    code: "CA",
    fitScore: 88,
    tuitionRange: "$38k-$46k",
    livingCost: "$1.4k/mo",
    visaRisk: "Medium",
    postStudyWork: "PGWP pathway",
    pathway: "Strong for CS, data, and PR-aware planning",
    familyReadiness: "Needs clean GIC + sponsor proof",
  },
  {
    code: "GB",
    fitScore: 84,
    tuitionRange: "$32k-$42k",
    livingCost: "$1.5k/mo",
    visaRisk: "Low",
    postStudyWork: "Graduate route",
    pathway: "Fast master's and strong brand options",
    familyReadiness: "Deposit and maintenance proof",
  },
  {
    code: "US",
    fitScore: 81,
    tuitionRange: "$45k-$62k",
    livingCost: "$1.9k/mo",
    visaRisk: "Review",
    postStudyWork: "OPT / STEM OPT",
    pathway: "Best for STEM scale and employer exposure",
    familyReadiness: "Interview and sponsor story required",
  },
  {
    code: "AU",
    fitScore: 79,
    tuitionRange: "$36k-$48k",
    livingCost: "$1.6k/mo",
    visaRisk: "Medium",
    postStudyWork: "Temporary graduate visa",
    pathway: "Work rights and strong city experience",
    familyReadiness: "Genuine student narrative required",
  },
  {
    code: "DE",
    fitScore: 76,
    tuitionRange: "$18k-$30k",
    livingCost: "$1.1k/mo",
    visaRisk: "Medium",
    postStudyWork: "18-month job seeker",
    pathway: "Low tuition and technical depth",
    familyReadiness: "Blocked account and APS tracking",
  },
  {
    code: "NL",
    fitScore: 73,
    tuitionRange: "$28k-$40k",
    livingCost: "$1.4k/mo",
    visaRisk: "Low",
    postStudyWork: "Orientation year",
    pathway: "Applied tech and design-friendly route",
    familyReadiness: "University-led permit process",
  },
];

export function getCourseInsight(program: Program) {
  const insight = COURSE_INSIGHTS.find((item) => item.programId === program.id);
  return insight ?? { ...DEFAULT_COURSE_INSIGHT, programId: program.id };
}

export function getCountryInsight(country: Country) {
  return COUNTRY_COMPARE_INSIGHTS.find((item) => item.code === country.code);
}

export function getFeaturedCoursePrograms() {
  const selectedIds = new Set(COURSE_INSIGHTS.map((item) => item.programId));
  return DEMO_PROGRAMS.filter((program) => selectedIds.has(program.id));
}

export function getScholarshipsForCountry(countryName: string | "All") {
  if (countryName === "All") return DEMO_SCHOLARSHIPS;
  return DEMO_SCHOLARSHIPS.filter((scholarship) => scholarship.country === countryName);
}

export function getComparableCountries() {
  const codes = new Set(COUNTRY_COMPARE_INSIGHTS.map((item) => item.code));
  return DEMO_COUNTRIES.filter((country) => codes.has(country.code));
}
