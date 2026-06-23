import { useEffect, useMemo, useState } from "react";
import type { Program, University } from "@workspace/api-client-react";
import { DEMO_COUNTRIES, DEMO_PROGRAMS, DEMO_UNIVERSITIES } from "@/lib/demo-catalog";
import type { StudentPackageTier } from "@/lib/student-packages";

export const STUDENT_V6_STORAGE_KEY = "eleevate.student-v6.state.v1";
export const STUDENT_V6_EVENT = "eleevate-student-v6";

export type StudentV6RouteChoice = "confused" | "known";
export type StudentV6PassportStatus = "yes" | "applied" | "no" | "";
export type StudentV6ApplicationStatus = "shortlisted" | "applying" | "submitted" | "offer" | "visa" | "done";

export interface StudentV6Profile {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  city?: string;
  parentName?: string;
  parentMobile?: string;
  passportStatus?: StudentV6PassportStatus;
  studyLevel?: string;
  courseInterest?: string;
  preferredIntake?: string;
  targetCountries?: string[];
  budgetMinInr?: number;
  budgetMaxInr?: number;
  degree?: string;
  stream?: string;
  marks?: string;
  backlogs?: string;
  educationGap?: string;
  testName?: string;
  testStatus?: string;
  testScore?: string;
}

export interface StudentV6Application {
  id: string;
  universityId: string;
  universityName: string;
  country: string;
  city: string;
  status: StudentV6ApplicationStatus;
  createdAt: string;
}

export interface StudentV6Document {
  id: string;
  label: string;
  group: "identity" | "academic" | "application" | "finance" | "visa";
  status: "missing" | "uploaded";
  updatedAt: string;
  hint?: string;
  countrySpecific?: boolean;
}

export type StudentV6VisaField = "offerReceived" | "casOrAcceptance" | "tuitionDeposit" | "visaFormStarted" | "biometricsBooked";

export interface StudentV6VisaChecklistItem {
  key: StudentV6VisaField;
  label: string;
  detail: string;
}

export interface StudentV6VisaState {
  country?: string;
  offerReceived?: boolean;
  casOrAcceptance?: boolean;
  tuitionDeposit?: boolean;
  visaFormStarted?: boolean;
  biometricsBooked?: boolean;
  decision?: "waiting" | "approved" | "refused" | "";
}

export interface StudentV6FinanceState {
  loanAmountInr?: number;
  tenureMonths?: number;
  interestRate?: number;
  selectedLoan?: boolean;
  remittance?: boolean;
  forexCard?: boolean;
  insurance?: boolean;
  accommodation?: boolean;
}

export interface StudentV6PackageSelection {
  packageId: StudentPackageTier;
  selectedAt: string;
}

export interface StudentV6State {
  profile: StudentV6Profile;
  routeChoice?: StudentV6RouteChoice;
  reportGenerated?: boolean;
  shortlistedUniversityIds: string[];
  applications: StudentV6Application[];
  documents: StudentV6Document[];
  visa: StudentV6VisaState;
  finance: StudentV6FinanceState;
  packageSelection?: StudentV6PackageSelection;
  rewardPoints: number;
  updatedAt?: string;
}

export interface StudentV6JourneyStep {
  id: string;
  label: string;
  href: string;
  complete: boolean;
  status: "done" | "current" | "locked";
  studentTask: string;
  required: string;
  cta: string;
}

export interface StudentV6Task {
  id: string;
  title: string;
  detail: string;
  href: string;
  priority: "high" | "medium" | "low";
}

export interface StudentV6Notification {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: "action" | "success" | "info";
}

export interface StudentV6Snapshot {
  state: StudentV6State;
  studentName: string;
  packageLabel: string;
  progress: number;
  currentStep: StudentV6JourneyStep;
  steps: StudentV6JourneyStep[];
  tasks: StudentV6Task[];
  notifications: StudentV6Notification[];
  missing: string[];
  completed: string[];
  documentReadiness: number;
  selectedCountry: string | null;
}

const EMPTY_STATE: StudentV6State = {
  profile: {
    budgetMinInr: 0,
    budgetMaxInr: 0,
    targetCountries: [],
  },
  shortlistedUniversityIds: [],
  applications: [],
  documents: [],
  visa: {},
  finance: {
    loanAmountInr: 0,
    tenureMonths: 60,
    interestRate: 9,
  },
  rewardPoints: 0,
};

type StudentV6DocumentTemplate = Omit<StudentV6Document, "id" | "status" | "updatedAt">;

const REQUIRED_DOCUMENTS: StudentV6DocumentTemplate[] = [
  { group: "identity", label: "Passport", hint: "Valid passport or travel document." },
  { group: "identity", label: "Passport-size photo", hint: "Recent photo as per visa/college format." },
  { group: "academic", label: "10th marksheet", hint: "For academic history and visa file." },
  { group: "academic", label: "12th marksheet", hint: "For undergraduate entry or academic background." },
  { group: "academic", label: "Degree marksheets / transcripts", hint: "Semester marksheets, transcript, provisional/degree certificate." },
  { group: "academic", label: "English test score", hint: "IELTS, PTE, TOEFL, Duolingo, or university-approved proof." },
  { group: "application", label: "SOP / personal statement", hint: "Course-specific statement of purpose." },
  { group: "application", label: "LOR", hint: "Academic or professional recommendation letters." },
  { group: "application", label: "Resume", hint: "Updated CV with study, work, projects, and gaps." },
  { group: "finance", label: "Bank statement / proof of funds", hint: "Funds evidence for tuition and living cost." },
  { group: "finance", label: "Sponsor income proof", hint: "Income tax return, salary slip, business proof, or sponsor documents." },
  { group: "finance", label: "Loan sanction letter", hint: "If education loan is part of the funding plan." },
];

const COUNTRY_REQUIRED_DOCUMENTS: Record<string, StudentV6DocumentTemplate[]> = {
  "United Kingdom": [
    { group: "visa", label: "CAS from university", hint: "Confirmation of Acceptance for Studies issued by the UK sponsor.", countrySpecific: true },
    { group: "finance", label: "UK maintenance funds evidence", hint: "Tuition balance plus living funds, if required for your case.", countrySpecific: true },
    { group: "visa", label: "TB test certificate", hint: "Needed for Indian applicants and other listed countries.", countrySpecific: true },
    { group: "visa", label: "ATAS certificate if course requires", hint: "For selected science, engineering, and research courses.", countrySpecific: true },
    { group: "visa", label: "IHS payment confirmation", hint: "Immigration Health Surcharge receipt before submission.", countrySpecific: true },
    { group: "visa", label: "UK visa application and biometrics receipt", hint: "Application confirmation plus VAC/UKVCAS appointment proof.", countrySpecific: true },
  ],
  "United States": [
    { group: "visa", label: "Form I-20 from SEVP school", hint: "Certificate of Eligibility signed by student and school.", countrySpecific: true },
    { group: "visa", label: "SEVIS I-901 fee receipt", hint: "Proof that SEVIS fee is paid before interview.", countrySpecific: true },
    { group: "visa", label: "DS-160 confirmation page", hint: "Printed confirmation page for the visa interview.", countrySpecific: true },
    { group: "visa", label: "MRV fee and interview appointment", hint: "Visa fee receipt and appointment confirmation.", countrySpecific: true },
    { group: "finance", label: "US tuition and living cost proof", hint: "Evidence that family/loan/sponsor can pay education and stay costs.", countrySpecific: true },
    { group: "academic", label: "US academic and test evidence", hint: "Transcripts, diplomas, standardized test scores if requested.", countrySpecific: true },
  ],
  Canada: [
    { group: "visa", label: "Letter of Acceptance (LOA)", hint: "Upload the official acceptance letter from the DLI.", countrySpecific: true },
    { group: "visa", label: "PAL / TAL or CAQ if required", hint: "Provincial/territorial attestation, or CAQ for Quebec.", countrySpecific: true },
    { group: "identity", label: "Canada identity documents", hint: "Passport information page and two recent passport-size photos.", countrySpecific: true },
    { group: "finance", label: "Canada proof of financial support", hint: "Tuition, living, return travel, GIC/loan/sponsor where relevant.", countrySpecific: true },
    { group: "application", label: "Letter of explanation", hint: "Study plan and responsibilities as an international student.", countrySpecific: true },
    { group: "visa", label: "Medical exam / police certificate if requested", hint: "Complete if your application or IRCC checklist asks for it.", countrySpecific: true },
  ],
  Australia: [
    { group: "visa", label: "Confirmation of Enrolment (CoE)", hint: "Current CoE uploaded to ImmiAccount.", countrySpecific: true },
    { group: "application", label: "Genuine Student answers and evidence", hint: "Evidence for course choice, circumstances, employment, and future value.", countrySpecific: true },
    { group: "finance", label: "Australia financial capacity evidence", hint: "Tuition, living cost, travel, loan/sponsor/scholarship evidence if required.", countrySpecific: true },
    { group: "academic", label: "Australia academic and English evidence", hint: "Academic records and English proof if the checklist asks for it.", countrySpecific: true },
    { group: "visa", label: "OSHC health cover", hint: "Overseas Student Health Cover for the visa period.", countrySpecific: true },
    { group: "visa", label: "Health exam / biometrics if requested", hint: "Complete medicals or biometrics after ImmiAccount request.", countrySpecific: true },
  ],
  Germany: [
    { group: "visa", label: "German university admission letter", hint: "Admission, Studienkolleg, or language course confirmation.", countrySpecific: true },
    { group: "finance", label: "Blocked account / proof of funds", hint: "Proof of secure livelihood, commonly a Sperrkonto or accepted sponsor/scholarship.", countrySpecific: true },
    { group: "academic", label: "APS certificate if applicable", hint: "Generally required for Indian academic credential verification.", countrySpecific: true },
    { group: "academic", label: "Previous academic qualifications", hint: "10th, 12th, degree, transcripts, certificates as applicable.", countrySpecific: true },
    { group: "application", label: "CV and motivation letter", hint: "Study purpose and academic/work timeline.", countrySpecific: true },
    { group: "visa", label: "German health insurance / travel insurance", hint: "Insurance proof requested for visa and enrolment.", countrySpecific: true },
  ],
  Netherlands: [
    { group: "visa", label: "Dutch university admission confirmation", hint: "Your recognised sponsor/university starts MVV/VVR with IND.", countrySpecific: true },
    { group: "finance", label: "Netherlands proof of financial means", hint: "Income/funds evidence requested by the educational institution.", countrySpecific: true },
    { group: "identity", label: "Legalised birth certificate if requested", hint: "Some municipalities ask for legalised/apostilled birth certificate after arrival.", countrySpecific: true },
    { group: "visa", label: "MVV / residence permit forms", hint: "Institution-led immigration forms and declarations.", countrySpecific: true },
    { group: "visa", label: "Health insurance plan", hint: "Insurance check for study and after arrival.", countrySpecific: true },
    { group: "visa", label: "TB test appointment if required", hint: "Some nationalities need TB screening after arrival.", countrySpecific: true },
  ],
  Ireland: [
    { group: "visa", label: "Ireland visa summary application form", hint: "Signed and dated online application summary.", countrySpecific: true },
    { group: "identity", label: "Ireland passport and photos", hint: "Current passport, prior passport copies if asked, and passport photos.", countrySpecific: true },
    { group: "visa", label: "College acceptance / enrolment letter", hint: "Full-time course acceptance and course details.", countrySpecific: true },
    { group: "finance", label: "Proof of fees paid", hint: "Receipt or college letter showing fees paid.", countrySpecific: true },
    { group: "finance", label: "Ireland finance evidence", hint: "Bank, sponsor, scholarship, or bond evidence if requested.", countrySpecific: true },
    { group: "visa", label: "Private medical insurance", hint: "Medical cover for Ireland before travel/registration.", countrySpecific: true },
  ],
  "New Zealand": [
    { group: "visa", label: "Offer of place", hint: "Offer from an approved New Zealand education provider.", countrySpecific: true },
    { group: "finance", label: "Tuition fee evidence or scholarship", hint: "Proof that tuition is paid or will be paid.", countrySpecific: true },
    { group: "finance", label: "New Zealand living funds evidence", hint: "Funds or acceptable sponsorship for living expenses.", countrySpecific: true },
    { group: "visa", label: "Medical and travel insurance", hint: "Insurance accepted by your education provider.", countrySpecific: true },
    { group: "visa", label: "Onward travel funds / ticket evidence", hint: "Evidence for return/onward travel if required.", countrySpecific: true },
    { group: "visa", label: "Medical / police certificate if requested", hint: "Health and character evidence based on application.", countrySpecific: true },
  ],
  Singapore: [
    { group: "visa", label: "Singapore school acceptance / SOLAR registration", hint: "Institute registers you for Student's Pass application.", countrySpecific: true },
    { group: "visa", label: "eForm 16", hint: "Student's Pass application form through ICA e-Service.", countrySpecific: true },
    { group: "identity", label: "Passport particulars page", hint: "Travel document information page.", countrySpecific: true },
    { group: "identity", label: "Digital passport photo", hint: "Recent photo as per ICA requirements.", countrySpecific: true },
    { group: "finance", label: "Parent/sponsor financial evidence if requested", hint: "Financial support evidence for school or ICA if asked.", countrySpecific: true },
    { group: "visa", label: "IPA / medical exam if required", hint: "In-principle approval and medical steps before Student's Pass issuance.", countrySpecific: true },
  ],
  "United Arab Emirates": [
    { group: "visa", label: "UAE university admission letter", hint: "University or sponsor confirms admission for student residence visa.", countrySpecific: true },
    { group: "identity", label: "Passport copy and photo", hint: "Passport plus recent photo as per UAE visa format.", countrySpecific: true },
    { group: "finance", label: "UAE sponsor / tuition proof", hint: "Proof of sponsor, tuition payment, or financial capacity if requested.", countrySpecific: true },
    { group: "academic", label: "Attested academic documents if requested", hint: "Attestation may be needed by university or authority.", countrySpecific: true },
    { group: "visa", label: "Medical fitness test", hint: "Medical fitness exam for residence visa.", countrySpecific: true },
    { group: "visa", label: "Emirates ID and health insurance", hint: "Post-arrival identity and insurance steps.", countrySpecific: true },
  ],
  France: [
    { group: "visa", label: "France-Visas long-stay application", hint: "Completed online application and appointment receipt.", countrySpecific: true },
    { group: "visa", label: "Certificate of enrolment / acceptance", hint: "Proof of admission at the French higher education institution.", countrySpecific: true },
    { group: "finance", label: "France proof of resources", hint: "Funds/sponsor proof shown through the France-Visas checklist.", countrySpecific: true },
    { group: "visa", label: "Accommodation proof", hint: "Residence booking, host letter, or rental evidence if requested.", countrySpecific: true },
    { group: "identity", label: "France passport and ICAO photos", hint: "Passport plus two recent photos.", countrySpecific: true },
    { group: "visa", label: "Etudes en France / Campus France file if applicable", hint: "Required for countries using the EEF procedure.", countrySpecific: true },
  ],
};

const VISA_CHECKLISTS: Record<string, StudentV6VisaChecklistItem[]> = {
  "United Kingdom": [
    { key: "offerReceived", label: "Unconditional offer received", detail: "University offer is accepted and any academic condition is cleared." },
    { key: "casOrAcceptance", label: "CAS issued", detail: "CAS from the university is ready before visa submission." },
    { key: "tuitionDeposit", label: "Deposit and maintenance funds ready", detail: "Tuition deposit, bank proof, sponsor/loan evidence are ready if required." },
    { key: "visaFormStarted", label: "UK visa form and IHS started", detail: "Online visa application and health surcharge are in progress." },
    { key: "biometricsBooked", label: "Biometrics / VAC appointment booked", detail: "Appointment confirmation and document upload are ready." },
  ],
  "United States": [
    { key: "offerReceived", label: "SEVP school offer accepted", detail: "University has issued or will issue the I-20." },
    { key: "casOrAcceptance", label: "I-20 and SEVIS ready", detail: "I-20 signed and SEVIS I-901 fee paid." },
    { key: "tuitionDeposit", label: "Finance proof ready", detail: "Funds evidence covers tuition, living, and travel costs." },
    { key: "visaFormStarted", label: "DS-160 submitted", detail: "DS-160 confirmation and MRV fee receipt are ready." },
    { key: "biometricsBooked", label: "Visa interview booked", detail: "Embassy/consulate appointment is scheduled." },
  ],
  Canada: [
    { key: "offerReceived", label: "LOA received", detail: "Letter of Acceptance from the DLI is ready." },
    { key: "casOrAcceptance", label: "PAL / TAL or CAQ ready", detail: "Attestation letter or CAQ is ready where required." },
    { key: "tuitionDeposit", label: "Proof of funds ready", detail: "Funds, GIC/loan/sponsor, and tuition receipts are organised." },
    { key: "visaFormStarted", label: "Study permit form started", detail: "Online study permit application is in progress." },
    { key: "biometricsBooked", label: "Biometrics / medical step booked", detail: "Biometrics appointment and medical/police requests are tracked." },
  ],
  Australia: [
    { key: "offerReceived", label: "Offer accepted", detail: "Education provider has confirmed admission." },
    { key: "casOrAcceptance", label: "CoE ready", detail: "Current Confirmation of Enrolment is uploaded to ImmiAccount." },
    { key: "tuitionDeposit", label: "OSHC and finance evidence ready", detail: "Health cover and financial capacity documents are ready if required." },
    { key: "visaFormStarted", label: "Subclass 500 application started", detail: "ImmiAccount application and GS answers are in progress." },
    { key: "biometricsBooked", label: "Health / biometrics request handled", detail: "Medical or biometrics requests are completed when asked." },
  ],
  Germany: [
    { key: "offerReceived", label: "Admission letter received", detail: "German university, Studienkolleg, or language course admission is ready." },
    { key: "casOrAcceptance", label: "APS and visa file ready", detail: "APS certificate and visa checklist documents are prepared where applicable." },
    { key: "tuitionDeposit", label: "Blocked account / sponsor proof ready", detail: "Financial means are ready through blocked account, sponsor, or scholarship." },
    { key: "visaFormStarted", label: "National visa appointment prepared", detail: "Visa form, photos, insurance, and copies are organised." },
    { key: "biometricsBooked", label: "VFS / consulate appointment booked", detail: "Biometric submission appointment is scheduled." },
  ],
  Netherlands: [
    { key: "offerReceived", label: "University admission accepted", detail: "Recognised sponsor/university can start MVV/VVR process." },
    { key: "casOrAcceptance", label: "MVV/VVR documents ready", detail: "Institution immigration forms and declarations are complete." },
    { key: "tuitionDeposit", label: "Financial means submitted", detail: "Proof of income/funds is submitted to the institution." },
    { key: "visaFormStarted", label: "IND application started by institution", detail: "University has started residence permit process." },
    { key: "biometricsBooked", label: "Biometrics / TB step tracked", detail: "Biometrics and TB test steps are tracked if needed." },
  ],
  Ireland: [
    { key: "offerReceived", label: "College acceptance received", detail: "Full-time course acceptance/enrolment letter is ready." },
    { key: "casOrAcceptance", label: "Visa summary form ready", detail: "Signed application summary and passport photos are ready." },
    { key: "tuitionDeposit", label: "Fees, finance, and insurance ready", detail: "Fee receipt, finance evidence, and medical insurance are ready." },
    { key: "visaFormStarted", label: "Long-stay study visa file started", detail: "Supporting documents are organised for submission." },
    { key: "biometricsBooked", label: "Appointment / registration step tracked", detail: "Submission, decision, and post-arrival registration are tracked." },
  ],
  "New Zealand": [
    { key: "offerReceived", label: "Offer of place received", detail: "Approved education provider offer is ready." },
    { key: "casOrAcceptance", label: "Visa application evidence ready", detail: "Offer, tuition, insurance, and identity evidence are ready." },
    { key: "tuitionDeposit", label: "Funds and tuition evidence ready", detail: "Living funds, tuition, scholarship, or sponsor proof is ready." },
    { key: "visaFormStarted", label: "Student visa application started", detail: "Online fee-paying student visa application is in progress." },
    { key: "biometricsBooked", label: "Medical / police requests tracked", detail: "Health and character documents are completed if requested." },
  ],
  Singapore: [
    { key: "offerReceived", label: "School acceptance received", detail: "Institute has accepted you and can support Student's Pass." },
    { key: "casOrAcceptance", label: "SOLAR / eForm 16 ready", detail: "eForm 16 and school registration details are ready." },
    { key: "tuitionDeposit", label: "Fee / sponsor proof ready", detail: "School fee and support documents are ready if requested." },
    { key: "visaFormStarted", label: "Student's Pass application started", detail: "ICA e-Service application is in progress." },
    { key: "biometricsBooked", label: "IPA / medical step tracked", detail: "In-principle approval and medical exam are tracked." },
  ],
  "United Arab Emirates": [
    { key: "offerReceived", label: "University admission confirmed", detail: "UAE institution can sponsor student residence visa." },
    { key: "casOrAcceptance", label: "Entry permit / sponsor file ready", detail: "Passport, photo, offer, and sponsor documents are ready." },
    { key: "tuitionDeposit", label: "Tuition / sponsor proof ready", detail: "Payment or sponsor evidence is organised." },
    { key: "visaFormStarted", label: "Residence visa process started", detail: "University or sponsor has started visa process." },
    { key: "biometricsBooked", label: "Medical fitness and Emirates ID step", detail: "Post-arrival medical and ID steps are tracked." },
  ],
  France: [
    { key: "offerReceived", label: "French acceptance received", detail: "Certificate of enrolment/admission is ready." },
    { key: "casOrAcceptance", label: "France-Visas / EEF file ready", detail: "France-Visas and Etudes en France/Campus France file are prepared if applicable." },
    { key: "tuitionDeposit", label: "Resources and accommodation ready", detail: "Funds, sponsor, housing, and insurance evidence are organised." },
    { key: "visaFormStarted", label: "Long-stay visa application started", detail: "Online application and appointment booking are in progress." },
    { key: "biometricsBooked", label: "Appointment and biometrics booked", detail: "Visa centre appointment and passport submission are scheduled." },
  ],
};

const COUNTRY_ALIASES: Record<string, string> = {
  uk: "United Kingdom",
  "u.k.": "United Kingdom",
  england: "United Kingdom",
  britain: "United Kingdom",
  "great britain": "United Kingdom",
  us: "United States",
  usa: "United States",
  "u.s.": "United States",
  "united states of america": "United States",
  uae: "United Arab Emirates",
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitV6Change() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STUDENT_V6_EVENT));
}

function withDefaults(state: Partial<StudentV6State> | null | undefined): StudentV6State {
  return {
    ...EMPTY_STATE,
    ...state,
    profile: {
      ...EMPTY_STATE.profile,
      ...(state?.profile ?? {}),
      targetCountries: state?.profile?.targetCountries ?? [],
    },
    shortlistedUniversityIds: state?.shortlistedUniversityIds ?? [],
    applications: state?.applications ?? [],
    documents: state?.documents ?? [],
    visa: state?.visa ?? {},
    finance: {
      ...EMPTY_STATE.finance,
      ...(state?.finance ?? {}),
    },
    rewardPoints: state?.rewardPoints ?? 0,
  };
}

export function readStudentV6State(): StudentV6State {
  if (!canUseStorage()) return withDefaults(null);
  try {
    return withDefaults(JSON.parse(localStorage.getItem(STUDENT_V6_STORAGE_KEY) ?? "null") as StudentV6State | null);
  } catch {
    return withDefaults(null);
  }
}

export function writeStudentV6State(state: StudentV6State) {
  const next = withDefaults({ ...state, updatedAt: new Date().toISOString() });
  if (canUseStorage()) {
    localStorage.setItem(STUDENT_V6_STORAGE_KEY, JSON.stringify(next));
    emitV6Change();
  }
  return next;
}

export function updateStudentV6State(updater: (state: StudentV6State) => StudentV6State) {
  return writeStudentV6State(updater(readStudentV6State()));
}

export function clearStudentV6State() {
  if (!canUseStorage()) return;
  localStorage.removeItem(STUDENT_V6_STORAGE_KEY);
  emitV6Change();
}

export function useStudentV6State() {
  const [state, setState] = useState<StudentV6State>(() => readStudentV6State());

  useEffect(() => {
    const sync = () => setState(readStudentV6State());
    window.addEventListener(STUDENT_V6_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STUDENT_V6_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return state;
}

function hasValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return value > 0;
  return Boolean(String(value ?? "").trim());
}

export function normalizeV6Country(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  const alias = COUNTRY_ALIASES[normalized];
  if (alias) return alias;
  const byName = DEMO_COUNTRIES.find((country) => country.name.toLowerCase() === normalized);
  if (byName) return byName.name;
  const byCode = DEMO_COUNTRIES.find((country) => country.code.toLowerCase() === normalized);
  return byCode?.name ?? null;
}

export function getStudentV6CountryOptions() {
  return DEMO_COUNTRIES.map((country) => country.name);
}

function getSelectedCountry(profile: StudentV6Profile) {
  return normalizeV6Country(profile.targetCountries?.[0]);
}

function documentId(label: string) {
  return `v6-doc-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function getCountryDocumentTemplates(country: string | null): StudentV6DocumentTemplate[] {
  if (!country) return REQUIRED_DOCUMENTS;
  return [...REQUIRED_DOCUMENTS, ...(COUNTRY_REQUIRED_DOCUMENTS[country] ?? [])];
}

export function getStudentV6VisaChecklist(countryOverride?: string | null): StudentV6VisaChecklistItem[] {
  const state = readStudentV6State();
  const country = normalizeV6Country(countryOverride) ?? getSelectedCountry(state.profile) ?? normalizeV6Country(state.visa.country);
  return country && VISA_CHECKLISTS[country]
    ? VISA_CHECKLISTS[country]
    : [
        { key: "offerReceived", label: "Offer received", detail: "Get the official university offer or admission letter." },
        { key: "casOrAcceptance", label: "Visa acceptance document ready", detail: "Prepare CAS, I-20, CoE, LOA, or country-specific acceptance proof." },
        { key: "tuitionDeposit", label: "Fees and funds proof ready", detail: "Organise tuition receipt, bank proof, sponsor, or loan evidence." },
        { key: "visaFormStarted", label: "Visa form started", detail: "Start the correct country visa application form after offer stage." },
        { key: "biometricsBooked", label: "Biometrics / appointment booked", detail: "Book biometrics, interview, medical, or visa centre appointment if required." },
      ];
}

function queryTokens(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !["and", "the", "for"].includes(token));
}

function matchesV6Query(haystack: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  const normalizedHaystack = haystack.toLowerCase();
  if (normalizedHaystack.includes(normalizedQuery)) return true;
  const tokens = queryTokens(normalizedQuery);
  return tokens.length === 0 || tokens.some((token) => normalizedHaystack.includes(token));
}

function getStepDefinitions(state: StudentV6State): StudentV6JourneyStep[] {
  const profile = state.profile;
  const requiredDocs = getRequiredV6Documents(getSelectedCountry(profile), state);
  const uploadedRequiredCount = requiredDocs.filter((doc) => doc.status === "uploaded").length;
  const detailsComplete = [
    profile.firstName,
    profile.mobile,
    profile.email,
    profile.city,
    profile.parentMobile,
    profile.passportStatus,
  ].every(hasValue);
  const goalComplete = [
    profile.studyLevel,
    profile.courseInterest,
    profile.preferredIntake,
    profile.targetCountries,
    profile.budgetMaxInr,
  ].every(hasValue);
  const academicComplete = [profile.degree, profile.stream, profile.marks, profile.testStatus].every(hasValue);
  const routeComplete = Boolean(state.routeChoice && state.reportGenerated);
  const exploreComplete = state.shortlistedUniversityIds.length > 0;
  const applicationComplete = state.applications.length > 0 && (uploadedRequiredCount >= 2 || Boolean(state.visa.visaFormStarted));
  const financeComplete = Boolean(
    (state.finance.loanAmountInr ?? 0) > 0 ||
    state.finance.remittance ||
    state.finance.forexCard ||
    state.finance.insurance ||
    state.packageSelection,
  );

  const definitions = [
    {
      id: "details",
      label: "Student details",
      href: "/student-v6/start",
      complete: detailsComplete,
      studentTask: "Add your basic details and parent/sponsor contact.",
      required: "Name, mobile, email, city, parent mobile, passport status.",
      cta: "Add student details",
    },
    {
      id: "study-goal",
      label: "Study goal",
      href: "/student-v6/start",
      complete: goalComplete,
      studentTask: "Tell us what you want to study and how much your family can plan.",
      required: "Study level, course interest, intake, country, INR budget.",
      cta: "Add study goal",
    },
    {
      id: "academics",
      label: "Academics and test",
      href: "/student-v6/start",
      complete: academicComplete,
      studentTask: "Add marks, stream, backlogs/gap, and test status.",
      required: "Degree, stream, score, IELTS/PTE/TOEFL/GRE/GMAT status.",
      cta: "Add academics",
    },
    {
      id: "route",
      label: "ELEE route",
      href: "/student-v6/start",
      complete: routeComplete,
      studentTask: "Choose psychometric help if confused, or generate ELEE report if you know your path.",
      required: "One route choice.",
      cta: "Choose route",
    },
    {
      id: "explore",
      label: "Find course and university",
      href: "/student-v6/explore",
      complete: exploreComplete,
      studentTask: "Compare only relevant countries, courses, and universities.",
      required: "Shortlist at least one university.",
      cta: "Find universities",
    },
    {
      id: "apply-docs",
      label: "Applications and documents",
      href: "/student-v6/applications",
      complete: applicationComplete,
      studentTask: "Move shortlist into applications and prepare documents.",
      required: "Application tracker and first documents.",
      cta: "Open applications",
    },
    {
      id: "finance-arrival",
      label: "Finance and arrival",
      href: "/student-v6/finance",
      complete: financeComplete,
      studentTask: "Plan loan, scholarship, remittance, forex card, insurance, stay, and arrival.",
      required: "One finance or package action.",
      cta: "Plan finance",
    },
  ];

  const firstIncomplete = definitions.findIndex((step) => !step.complete);
  return definitions.map((step, index) => ({
    ...step,
    status: step.complete ? "done" : index === firstIncomplete ? "current" : "locked",
  }));
}

export function getStudentV6Snapshot(state = readStudentV6State()): StudentV6Snapshot {
  const steps = getStepDefinitions(state);
  const currentStep = steps.find((step) => !step.complete) ?? steps[steps.length - 1];
  const completed = steps.filter((step) => step.complete).map((step) => step.label);
  const missing = steps.filter((step) => !step.complete).map((step) => step.required);
  const studentName = [state.profile.firstName, state.profile.lastName].filter(Boolean).join(" ") || "Student";
  const packageLabel = state.packageSelection?.packageId
    ? state.packageSelection.packageId[0].toUpperCase() + state.packageSelection.packageId.slice(1)
    : "No tier";
  const requiredLabels = new Set(getRequiredV6Documents(getSelectedCountry(state.profile), state).map((doc) => doc.label));
  const uploadedLabels = new Set(state.documents.filter((doc) => doc.status === "uploaded").map((doc) => doc.label));
  const documentReadiness = Math.round((Array.from(requiredLabels).filter((label) => uploadedLabels.has(label)).length / requiredLabels.size) * 100);
  const notifications: StudentV6Notification[] = [
    {
      id: `next-${currentStep.id}`,
      title: `Next: ${currentStep.label}`,
      detail: currentStep.studentTask,
      href: currentStep.href,
      tone: "action",
    },
  ];
  if (state.shortlistedUniversityIds.length > 0) {
    notifications.push({
      id: "shortlist",
      title: "Shortlist saved",
      detail: "Your application tracker is ready for the saved universities.",
      href: "/student-v6/applications",
      tone: "success",
    });
  }
  if (state.documents.length > 0 && documentReadiness < 100) {
    notifications.push({
      id: "documents",
      title: "Documents pending",
      detail: `${documentReadiness}% of required documents are marked uploaded.`,
      href: "/student-v6/documents",
      tone: "info",
    });
  }

  return {
    state,
    studentName,
    packageLabel,
    progress: Math.round((completed.length / steps.length) * 100),
    currentStep,
    steps,
    tasks: steps.filter((step) => !step.complete).slice(0, 3).map((step, index) => ({
      id: step.id,
      title: step.label,
      detail: step.studentTask,
      href: step.href,
      priority: index === 0 ? "high" : "medium",
    })),
    notifications,
    missing,
    completed,
    documentReadiness,
    selectedCountry: getSelectedCountry(state.profile),
  };
}

export function useStudentV6Snapshot() {
  const state = useStudentV6State();
  return useMemo(() => getStudentV6Snapshot(state), [state]);
}

export function getRequiredV6Documents(countryOverride?: string | null, stateOverride?: StudentV6State): StudentV6Document[] {
  const state = stateOverride ?? readStudentV6State();
  const country = normalizeV6Country(countryOverride) ?? getSelectedCountry(state.profile) ?? normalizeV6Country(state.visa.country);
  const savedByLabel = new Map(state.documents.map((doc) => [doc.label, doc]));
  return getCountryDocumentTemplates(country).map((template) => {
    const saved = savedByLabel.get(template.label);
    return {
      ...template,
      id: saved?.id ?? documentId(template.label),
      status: saved?.status ?? "missing",
      updatedAt: saved?.updatedAt ?? "",
    };
  });
}

export function filterV6Universities(state: StudentV6State, countryOverride?: string | null, query = ""): University[] {
  const selectedCountry = normalizeV6Country(countryOverride) ?? getSelectedCountry(state.profile);
  return DEMO_UNIVERSITIES.filter((university) => {
    const matchesCountry = selectedCountry ? university.country === selectedCountry : true;
    const haystack = [university.name, university.city, university.country, university.description ?? ""].join(" ").toLowerCase();
    return matchesCountry && matchesV6Query(haystack, query);
  });
}

export function filterV6Programs(state: StudentV6State, countryOverride?: string | null, query = ""): Program[] {
  const selectedCountry = normalizeV6Country(countryOverride) ?? getSelectedCountry(state.profile);
  const interest = query.trim() || state.profile.courseInterest || "";
  const normalizedInterest = interest.toLowerCase();
  return DEMO_PROGRAMS.filter((program) => {
    const university = program.university;
    const matchesCountry = selectedCountry ? university?.country === selectedCountry : true;
    const haystack = [program.name, program.field, university?.name ?? "", university?.city ?? ""].join(" ").toLowerCase();
    return matchesCountry && (
      matchesV6Query(haystack, normalizedInterest) ||
      matchesV6Query(normalizedInterest, program.field)
    );
  });
}

export function shortlistV6University(university: University) {
  return updateStudentV6State((state) => {
    const alreadyShortlisted = state.shortlistedUniversityIds.includes(university.id);
    const shortlistedUniversityIds = alreadyShortlisted
      ? state.shortlistedUniversityIds
      : [...state.shortlistedUniversityIds, university.id];
    const hasApplication = state.applications.some((application) => application.universityId === university.id);
    const applications: StudentV6Application[] = hasApplication
      ? state.applications
      : [
          ...state.applications,
          {
            id: `v6-app-${university.id}`,
            universityId: university.id,
            universityName: university.name,
            country: university.country,
            city: university.city,
            status: "shortlisted",
            createdAt: new Date().toISOString(),
          },
        ];
    return {
      ...state,
      shortlistedUniversityIds,
      applications,
      rewardPoints: state.rewardPoints + (alreadyShortlisted ? 0 : 25),
    };
  });
}

export function setV6ApplicationStatus(applicationId: string, status: StudentV6ApplicationStatus) {
  return updateStudentV6State((state) => ({
    ...state,
    applications: state.applications.map((application) => (
      application.id === applicationId ? { ...application, status } : application
    )),
    rewardPoints: state.rewardPoints + 20,
  }));
}

export function toggleV6Document(label: string, group: StudentV6Document["group"]) {
  return updateStudentV6State((state) => {
    const existing = state.documents.find((doc) => doc.label === label);
    const documents: StudentV6Document[] = existing
      ? state.documents.map((doc) => (
          doc.label === label
            ? { ...doc, status: doc.status === "uploaded" ? "missing" : "uploaded", updatedAt: new Date().toISOString() }
            : doc
        ))
      : [
          ...state.documents,
          {
            id: `v6-doc-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            label,
            group,
            status: "uploaded",
            updatedAt: new Date().toISOString(),
          },
        ];
    return {
      ...state,
      documents,
      rewardPoints: state.rewardPoints + (existing?.status === "uploaded" ? 0 : 10),
    };
  });
}

export function selectV6Package(packageId: StudentPackageTier) {
  return updateStudentV6State((state) => ({
    ...state,
    packageSelection: { packageId, selectedAt: new Date().toISOString() },
    rewardPoints: state.rewardPoints + 100,
  }));
}

export function formatV6Inr(value: number | undefined | null) {
  return `₹${Math.round(value ?? 0).toLocaleString("en-IN")}`;
}

export function calculateV6Emi(amount: number, annualRate: number, months: number) {
  if (!amount || !months) return 0;
  const monthlyRate = annualRate / 12 / 100;
  if (!monthlyRate) return amount / months;
  return amount * monthlyRate * ((1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months) - 1);
}
