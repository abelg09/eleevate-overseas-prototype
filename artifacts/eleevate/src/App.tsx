import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
import { queryClient } from "@/lib/queryClient";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { isDemoMode } from "@/lib/demo-mode";

import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import OnboardingPage from "@/pages/onboarding";
import StudentDashboardPage from "@/pages/student-dashboard";
import JourneyMapPage from "@/pages/journey-map";
import EdgeReportPage from "@/pages/edge-report";
import UniversitiesPage from "@/pages/universities";
import UniversityDetailPage from "@/pages/university-detail";
import CourseFinderPage from "@/pages/course-finder";
import ApplicationsPage from "@/pages/applications";
import CountriesPage from "@/pages/countries";
import StudentProfilePage from "@/pages/student-profile";
import ConsultantDashboardPage from "@/pages/consultant-dashboard";
import ConsultantProfilePage from "@/pages/consultant-profile";
import CrmPage from "@/pages/crm";
import CounsellingPage from "@/pages/counselling";
import AiChatbotPage from "@/pages/ai-chatbot";
import SopBuilderPage from "@/pages/sop-builder";
import DocumentReviewPage from "@/pages/document-review";
import TeamPage from "@/pages/team";
import PartnersPage from "@/pages/partners";
import BrandingPage from "@/pages/branding";
import ShortlistPage from "@/pages/shortlist";
import DocumentVaultPage from "@/pages/document-vault";
import VisaCenterPage from "@/pages/visa-center";
import LanguageHubPage from "@/pages/language-hub";
import RewardsPage from "@/pages/rewards";
import SupportPage from "@/pages/support";
import AssessmentPage from "@/pages/assessment";
import TestPrepPage from "@/pages/test-prep";
import MockTestPage from "@/pages/mock-test";
import ELearningPage from "@/pages/e-learning";
import JobBoardPage from "@/pages/job-board";
import CareersPage from "@/pages/careers";
import AlumniNetworkPage from "@/pages/alumni-network";
import NewsNewsletterPage from "@/pages/news-newsletter";
import LmsPage from "@/pages/lms";
import SubscriptionPage from "@/pages/subscription";
import ScholarshipsPage from "@/pages/scholarships";
import SopStudioPage from "@/pages/sop-studio";
import MarketplacePage from "@/pages/marketplace";
import TuitionPaymentPage from "@/pages/tuition-payment";
import FinancialHubPage from "@/pages/financial-hub";
import LoansPage from "@/pages/loans";
import RemittancePage from "@/pages/remittance";
import ForexCardPage from "@/pages/forex-card";
import ForexPage from "@/pages/forex";
import InsurancePage from "@/pages/insurance";
import InvoicingPage from "@/pages/invoicing";
import MorePage from "@/pages/more";
import NotFound from "@/pages/not-found";
import { useDemoAuthState } from "@/lib/demo-auth";
import { writeDemoJourneyMode } from "@/lib/demo-journey";
import { resetStudentOwnedSessionData } from "@/lib/student-session-reset";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const demoMode = isDemoMode();
const defaultDemoClerkKey = "pk_test_YWxsb3dlZC1ib2FyLTQwLmNsZXJrLmFjY291bnRzLmRldiQ";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? defaultDemoClerkKey,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function scrollToRouteTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.querySelector<HTMLElement>("[data-route-scroll-container]")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

if (!demoMode && !clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.webp`,
    socialButtonsPlacement: "bottom" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "hsl(221, 83%, 53%)",
    colorForeground: "hsl(222, 47%, 11%)",
    colorMutedForeground: "hsl(215, 16%, 47%)",
    colorDanger: "hsl(0, 84%, 60%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInput: "hsl(210, 40%, 96%)",
    colorInputForeground: "hsl(222, 47%, 11%)",
    colorNeutral: "hsl(214, 32%, 91%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-bold font-serif",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary hover:text-primary/80 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-green-600",
    alertText: "text-foreground",
    logoBox: "flex items-center justify-center",
    logoImage: "h-24 w-24 rounded-full object-cover",
    socialButtonsBlockButton: "border border-border bg-background hover:bg-muted",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold",
    formFieldInput: "bg-input border-border text-foreground",
    footerAction: "border-t border-border",
    dividerLine: "bg-border",
    alert: "border border-border",
    otpCodeFieldInput: "border-border bg-input",
    formFieldRow: "gap-3",
    main: "gap-5",
  },
};

function SignInPage() {
  if (demoMode) return <LoginPage />;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4" data-testid="sign-in-page">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  if (demoMode) return <LoginPage />;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4" data-testid="sign-up-page">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomeRedirect() {
  if (demoMode) return <LandingPage />;

  return (
    <>
      <Show when="signed-in">
        <SignedInHomeRedirect />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function StudentEntryRoute() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!demoMode) {
      setLocation("/sign-up");
      return;
    }

    writeDemoJourneyMode("preliminary");
    resetStudentOwnedSessionData();

    setLocation("/login?redirect=/dashboard");
  }, [setLocation]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 text-center">
      <div>
        <div className="font-serif text-xl font-bold text-foreground">Preparing your EleevateOverseas journey</div>
        <p className="mt-2 text-sm text-muted-foreground">Opening a fresh student workspace...</p>
      </div>
    </div>
  );
}

function SignedInHomeRedirect() {
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const user: User | undefined = me;

  if (!user) return null;
  if (!user.onboardingComplete) return <Redirect to="/onboarding" />;
  if (user.role === "consultant") return <Redirect to="/consultant/dashboard" />;
  return <Redirect to="/dashboard" />;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [location] = useLocation();
  const demoSession = useDemoAuthState();

  if (demoMode) {
    if (!demoSession) return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
    return <Component />;
  }

  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ConsultantRoute({ component: Component }: { component: React.ComponentType }) {
  const [location] = useLocation();
  const demoSession = useDemoAuthState();

  if (demoMode) {
    if (!demoSession) return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
    return <Component />;
  }

  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const user: User | undefined = me;
  return (
    <>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
      <Show when="signed-in">
        {user && user.role !== "consultant"
          ? <Redirect to="/dashboard" />
          : <Component />}
      </Show>
    </>
  );
}

function StudentRoute({ component: Component }: { component: React.ComponentType }) {
  const [location] = useLocation();
  const demoSession = useDemoAuthState();

  if (demoMode) {
    if (!demoSession) return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
    return <Component />;
  }

  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const user: User | undefined = me;
  return (
    <>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
      <Show when="signed-in">
        {user && user.role === "consultant"
          ? <Redirect to="/consultant/dashboard" />
          : <Component />}
      </Show>
    </>
  );
}

function WithAppLayout({ component: Component }: { component: React.ComponentType }) {
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function RouteScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    requestAnimationFrame(scrollToRouteTop);
  }, [location]);

  useEffect(() => {
    const handleInternalLinkClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const samePageHashLink =
        Boolean(url.hash) &&
        url.pathname === window.location.pathname &&
        url.search === window.location.search;
      if (samePageHashLink) return;

      window.setTimeout(scrollToRouteTop, 0);
    };

    document.addEventListener("click", handleInternalLinkClick);
    return () => document.removeEventListener("click", handleInternalLinkClick);
  }, []);

  return null;
}

function Router() {
  return (
    <>
      <RouteScrollToTop />
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/product" component={LandingPage} />
        <Route path="/demo/preliminary" component={StudentEntryRoute} />
        <Route path="/demo/canada" component={StudentEntryRoute} />
        <Route path="/login" component={() => demoMode ? <LoginPage /> : <Redirect to="/sign-in" />} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/onboarding" component={() => <ProtectedRoute component={OnboardingPage} />} />
        <Route path="/dashboard" component={() => <StudentRoute component={StudentDashboardPage} />} />
        <Route path="/more" component={() => <StudentRoute component={MorePage} />} />
        <Route path="/journey-map" component={() => <StudentRoute component={JourneyMapPage} />} />
        <Route path="/elee-report" component={() => <StudentRoute component={EdgeReportPage} />} />
        <Route path="/elle-report" component={() => <Redirect to="/elee-report" />} />
        <Route path="/edge-report" component={() => <Redirect to="/elee-report" />} />
        <Route path="/universities" component={() => <ProtectedRoute component={UniversitiesPage} />} />
        <Route path="/universities/:id" component={() => <ProtectedRoute component={UniversityDetailPage} />} />
        <Route path="/course-finder" component={() => <StudentRoute component={() => <WithAppLayout component={CourseFinderPage} />} />} />
        <Route path="/applications" component={() => <StudentRoute component={ApplicationsPage} />} />
        <Route path="/countries" component={() => <ProtectedRoute component={CountriesPage} />} />
        <Route path="/profile" component={() => <StudentRoute component={StudentProfilePage} />} />
        <Route path="/shortlist" component={() => <StudentRoute component={ShortlistPage} />} />
        <Route path="/documents" component={() => <StudentRoute component={DocumentVaultPage} />} />
        <Route path="/sop-studio" component={() => <StudentRoute component={() => <WithAppLayout component={SopStudioPage} />} />} />
        <Route path="/visa-center" component={() => <StudentRoute component={VisaCenterPage} />} />
        <Route path="/language-hub" component={() => <StudentRoute component={LanguageHubPage} />} />
        <Route path="/rewards" component={() => <StudentRoute component={RewardsPage} />} />
        <Route path="/support" component={() => <StudentRoute component={SupportPage} />} />
        <Route path="/assessment" component={() => <StudentRoute component={() => <WithAppLayout component={AssessmentPage} />} />} />
        <Route path="/test-prep" component={() => <StudentRoute component={() => <WithAppLayout component={TestPrepPage} />} />} />
        <Route path="/mock-test" component={() => <StudentRoute component={() => <WithAppLayout component={MockTestPage} />} />} />
        <Route path="/upskilling" component={() => <ProtectedRoute component={() => <WithAppLayout component={ELearningPage} />} />} />
        <Route path="/e-learning" component={() => <ProtectedRoute component={() => <WithAppLayout component={ELearningPage} />} />} />
        <Route path="/job-board" component={() => <ProtectedRoute component={() => <WithAppLayout component={JobBoardPage} />} />} />
        <Route path="/careers" component={() => <StudentRoute component={() => <WithAppLayout component={CareersPage} />} />} />
        <Route path="/alumni" component={() => <ProtectedRoute component={() => <WithAppLayout component={AlumniNetworkPage} />} />} />
        <Route path="/news" component={() => <ProtectedRoute component={() => <WithAppLayout component={NewsNewsletterPage} />} />} />
        <Route path="/consultant/lms" component={() => <ConsultantRoute component={() => <WithAppLayout component={LmsPage} />} />} />
        <Route path="/consultant/dashboard" component={() => <ConsultantRoute component={ConsultantDashboardPage} />} />
        <Route path="/consultant/profile" component={() => <ConsultantRoute component={ConsultantProfilePage} />} />
        <Route path="/consultant/crm" component={() => <ConsultantRoute component={CrmPage} />} />
        <Route path="/consultant/counselling" component={() => <ConsultantRoute component={CounsellingPage} />} />
        <Route path="/consultant/chatbot" component={() => <ConsultantRoute component={AiChatbotPage} />} />
        <Route path="/consultant/sop" component={() => <ConsultantRoute component={SopBuilderPage} />} />
        <Route path="/consultant/doc-review" component={() => <ConsultantRoute component={DocumentReviewPage} />} />
        <Route path="/consultant/team" component={() => <ConsultantRoute component={TeamPage} />} />
        <Route path="/consultant/partners" component={() => <ConsultantRoute component={PartnersPage} />} />
        <Route path="/consultant/branding" component={() => <ConsultantRoute component={BrandingPage} />} />
        <Route path="/packages" component={() => <StudentRoute component={() => <WithAppLayout component={SubscriptionPage} />} />} />
        <Route path="/subscription" component={() => <StudentRoute component={() => <WithAppLayout component={SubscriptionPage} />} />} />
        <Route path="/marketplace" component={() => <StudentRoute component={() => <WithAppLayout component={MarketplacePage} />} />} />
        <Route path="/services" component={() => <StudentRoute component={() => <WithAppLayout component={MarketplacePage} />} />} />
        <Route path="/tuition-payment" component={() => <StudentRoute component={() => <WithAppLayout component={TuitionPaymentPage} />} />} />
        <Route path="/financial-hub" component={() => <StudentRoute component={() => <WithAppLayout component={FinancialHubPage} />} />} />
        <Route path="/scholarships" component={() => <StudentRoute component={() => <WithAppLayout component={ScholarshipsPage} />} />} />
        <Route path="/loans" component={() => <StudentRoute component={() => <WithAppLayout component={LoansPage} />} />} />
        <Route path="/remittance" component={() => <StudentRoute component={() => <WithAppLayout component={RemittancePage} />} />} />
        <Route path="/forex-card" component={() => <StudentRoute component={() => <WithAppLayout component={ForexCardPage} />} />} />
        <Route path="/forex" component={() => <ProtectedRoute component={() => <WithAppLayout component={ForexPage} />} />} />
        <Route path="/insurance" component={() => <StudentRoute component={() => <WithAppLayout component={InsurancePage} />} />} />
        <Route path="/consultant/invoicing" component={() => <ConsultantRoute component={() => <WithAppLayout component={InvoicingPage} />} />} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey ?? defaultDemoClerkKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      afterSignOutUrl={`${basePath}/`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your EleevateOverseas account",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Start your overseas education journey",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
