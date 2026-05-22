import { lazy, Suspense, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { createHolzenQueryClient } from "@/lib/query-client";
import { setHolzenQueryClient } from "@/lib/holzen-query-client-ref";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { reactRouterFutureFlags } from "@/lib/router-future";
import { AuthProvider, useAuth } from "@/features/auth/public";
import { HolzenProvider } from "@/app/components/HolzenProvider";
import { isAppShellPath } from "@/lib/app-routes";
import { holzenLog } from "@/lib/holzen-console";
import { attachHolzenQueryLogging } from "@/lib/holzen-query-logging";
import { scheduleCheckoutGuardCleanup } from "@/features/subscription/public";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { OfflineBanner } from "@/app/components/OfflineBanner";
import { CookieConsent } from "@/app/components/CookieConsent";
import AuthLoading from "@/app/components/AuthLoading";
import { AppLayout } from "@/app/components/AppLayout";
import { RobotsNoIndex } from "@/app/components/PageMeta";
import { FeedbackWidget } from "@/app/components/FeedbackWidget";

const Home = lazy(() => import("./screens/home/HomeScreen"));
const Archive = lazy(() => import("./screens/archive/ArchiveScreen"));
const JourneyOverview = lazy(() => import("./screens/journey/JourneyOverviewScreen"));
const SettingsRoot = lazy(() => import("./screens/settings/SettingsRoot"));
const SettingsStateLayout = lazy(() => import("./screens/settings/SettingsStateLayout"));
const SettingsHub = lazy(() => import("./screens/settings/SettingsHubScreen"));
const SettingsSectionPage = lazy(() => import("./screens/settings/SettingsSectionScreen"));
const Auth = lazy(() => import("./screens/marketing/AuthScreen"));
const Landing = lazy(() => import("./screens/marketing/LandingScreen"));
const Terms = lazy(() => import("./screens/marketing/TermsScreen"));
const Privacy = lazy(() => import("./screens/marketing/PrivacyScreen"));
const ResetPassword = lazy(() => import("./screens/marketing/ResetPasswordScreen"));
const NotFound = lazy(() => import("./screens/marketing/NotFoundScreen"));
const About = lazy(() => import("./screens/marketing/AboutScreen"));
const Blog = lazy(() => import("./screens/marketing/BlogScreen"));
const BlogPost = lazy(() => import("./screens/marketing/BlogPostScreen"));
const Reserve = lazy(() => import("./screens/marketing/ReserveScreen"));
const PauseSession = lazy(() => import("./screens/pause/PauseSessionScreen"));
const CompanionZoomOutPage = lazy(() => import("./screens/pause/CompanionZoomOutPage"));
const CompanionHistoryPage = lazy(() => import("./screens/pause/CompanionHistoryPage"));
const CompanionSignalPage = lazy(() => import("./screens/pause/CompanionSignalPage"));
const CompanionGroundingPage = lazy(() => import("./screens/pause/CompanionGroundingPage"));
const Admin = lazy(() => import("./screens/admin/AdminScreen"));
const SmokeTest = lazy(() => import("./screens/ops/SmokeTestScreen"));
const SentryAlerts = lazy(() => import("./screens/ops/SentryAlertsScreen"));
const EdgeCoverage = lazy(() => import("./screens/ops/EdgeCoverageScreen"));
const Unsubscribe = lazy(() => import("./screens/marketing/UnsubscribeScreen"));
const BillingHistory = lazy(() => import("./screens/settings/BillingHistoryScreen"));
const SettingsAbout = lazy(() => import("./screens/settings/SettingsAboutScreen"));
const Roadmap = lazy(() => import("./screens/marketing/RoadmapScreen"));

const queryClient = createHolzenQueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (!user) return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * Primary-tab switches keep each tab's scroll position; other navigations scroll to top.
 * Avoids the "full refresh" feel when hopping Home ↔ Archive ↔ Journey ↔ Settings.
 */
function ShellScrollRestoration() {
  const { pathname } = useLocation();
  const scrollByPath = useRef<Map<string, number>>(new Map());
  const prevPath = useRef(pathname);

  useEffect(() => {
    const from = prevPath.current;
    scrollByPath.current.set(from, window.scrollY);
    prevPath.current = pathname;

    const scrollToY = (y: number) => {
      if (typeof window.scrollTo === "function") {
        window.scrollTo(0, y);
      }
    };

    if (isAppShellPath(from) && isAppShellPath(pathname)) {
      const y = scrollByPath.current.get(pathname) ?? 0;
      requestAnimationFrame(() => scrollToY(y));
      return;
    }
    scrollToY(0);
  }, [pathname]);

  return null;
}

/** Mount shared pause/profile state only when signed in (see `useHolzen`). */
function HolzenBridge({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <>{children}</>;
  return <HolzenProvider>{children}</HolzenProvider>;
}

/** Shown while a lazy route chunk downloads — neutral copy (not session restore). */
function RouteChunkFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-background"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-border/50 border-t-nox-text-link/70"
        aria-hidden
      />
    </div>
  );
}

/** TanStack Query cache observer — same gate as all `holzenLog` output (see `isHolzenDebugEnabled`). */
function HolzenQueryLogging() {
  useEffect(() => attachHolzenQueryLogging(queryClient), []);
  return null;
}

/** Exposes the same QueryClient instance to `pause-api` (invalidate after pause completes). */
function HolzenQueryClientRegister() {
  const qc = useQueryClient();
  useEffect(() => {
    setHolzenQueryClient(qc);
    return () => {
      setHolzenQueryClient(null);
    };
  }, [qc]);
  return null;
}

/**
 * Periodically evict expired checkout-guard entries from local/session
 * storage so they never grow unbounded across long-lived tabs.
 */
function CheckoutGuardCleanup() {
  useEffect(() => scheduleCheckoutGuardCleanup(), []);
  return null;
}

/**
 * Mounts the error-report feedback sheet listener for signed-in users only (`send-feedback` needs a session).
 * Voluntary contact is Settings → About (`FeedbackForm`). `ErrorBoundary` opens the sheet via `holzen:open-feedback`.
 */
function FeedbackWidgetGate() {
  const { user } = useAuth();
  if (!user) return null;
  return <FeedbackWidget />;
}

/** Logs pathname + auth state when either changes (under `[holzen:router]`). */
/** Full-screen authenticated routes — keep out of search indexes. */
function PrivateExperienceLayout() {
  return (
    <>
      <RobotsNoIndex />
      <Outlet />
    </>
  );
}

function UtilityNoIndexLayout() {
  return (
    <>
      <RobotsNoIndex />
      <Outlet />
    </>
  );
}

function RouterLocationLog() {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  useEffect(() => {
    holzenLog.router("location", {
      pathname,
      authLoading: loading,
      signedIn: !!user,
      userIdPrefix: user?.id?.slice(0, 8) ?? null,
    });
  }, [pathname, loading, user?.id]);
  return null;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HolzenQueryClientRegister />
      <HolzenQueryLogging />
      <CheckoutGuardCleanup />
      <TooltipProvider>
        <Sonner />
        <OfflineBanner />
        <BrowserRouter future={reactRouterFutureFlags}>
          <ShellScrollRestoration />
          <CookieConsent />
          <AuthProvider>
            <HolzenBridge>
            <RouterLocationLog />
            <FeedbackWidgetGate />
            <Suspense fallback={<RouteChunkFallback />}>
              <Routes>
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/" element={<Home />} />
                  <Route path="/index" element={<Navigate to="/" replace />} />
                  <Route path="/archive" element={<Archive />} />
                  <Route path="/journey" element={<JourneyOverview />} />
                  <Route path="/settings" element={<SettingsRoot />}>
                    <Route path="about" element={<SettingsAbout />} />
                    <Route path="billing-history" element={<BillingHistory />} />
                    <Route element={<SettingsStateLayout />}>
                      <Route index element={<SettingsHub />} />
                      <Route path=":section" element={<SettingsSectionPage />} />
                    </Route>
                  </Route>
                </Route>
                <Route element={<ProtectedRoute><PrivateExperienceLayout /></ProtectedRoute>}>
                  <Route path="/pause" element={<PauseSession />} />
                  <Route path="/companion/zoom-out/:pauseInstanceId" element={<CompanionZoomOutPage />} />
                  <Route path="/companion/history/:pauseInstanceId" element={<CompanionHistoryPage />} />
                  <Route path="/companion/signal/:pauseInstanceId" element={<CompanionSignalPage />} />
                  <Route path="/companion/grounding/:pauseInstanceId" element={<CompanionGroundingPage />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/smoke-test" element={<SmokeTest />} />
                  <Route path="/admin/sentry-alerts" element={<SentryAlerts />} />
                  <Route path="/admin/edge-coverage" element={<EdgeCoverage />} />
                </Route>
                <Route path="/welcome" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
                <Route element={<UtilityNoIndexLayout />}>
                  <Route path="/auth" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                </Route>
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/roadmap" element={<Roadmap />} />
                <Route path="/reserve" element={<Reserve />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </HolzenBridge>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
