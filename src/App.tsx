import { lazy, Suspense, useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { createHolzenQueryClient } from "@/lib/query-client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { holzenLog } from "@/lib/holzen-console";
import { attachHolzenQueryLogging } from "@/lib/holzen-query-logging";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineBanner } from "./components/OfflineBanner";
import { CookieConsent } from "./components/CookieConsent";
import AuthLoading from "./components/AuthLoading";
import { AppLayout } from "./components/AppLayout";

const Home = lazy(() => import("./pages/Home"));
const Library = lazy(() => import("./pages/Library"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));
const Landing = lazy(() => import("./pages/Landing"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const Breathe = lazy(() => import("./pages/Breathe"));
const Ambient = lazy(() => import("./pages/Ambient"));
const Reserve = lazy(() => import("./pages/Reserve"));
const PracticeCheckIn = lazy(() => import("./pages/PracticeCheckIn"));
const PracticeJournal = lazy(() => import("./pages/PracticeJournal"));
const PracticeBodyScan = lazy(() => import("./pages/PracticeBodyScan"));
const PracticeReplay = lazy(() => import("./pages/PracticeReplay"));
const PauseSession = lazy(() => import("./pages/PauseSession"));
const Ground = lazy(() => import("./pages/Ground"));
const GroundHistory = lazy(() => import("./pages/GroundHistory"));
const Admin = lazy(() => import("./pages/Admin"));

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

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
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
        className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary/60 animate-spin"
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

/** Logs pathname + auth state when either changes (under `[holzen:router]`). */
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
      <HolzenQueryLogging />
      <TooltipProvider>
        <Sonner />
        <OfflineBanner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <ScrollToTop />
          <CookieConsent />
          <AuthProvider>
            <RouterLocationLog />
            <Suspense fallback={<RouteChunkFallback />}>
              <Routes>
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/" element={<Home />} />
                  <Route path="/index" element={<Navigate to="/" replace />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/history" element={<Navigate to="/library" replace />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
                {/* Immersive full-screen experiences — no nav bar */}
                <Route path="/pause" element={<ProtectedRoute><PauseSession /></ProtectedRoute>} />
                <Route path="/breathe" element={<ProtectedRoute><Breathe /></ProtectedRoute>} />
                <Route path="/ground" element={<ProtectedRoute><Ground /></ProtectedRoute>} />
                <Route path="/ground/history" element={<ProtectedRoute><GroundHistory /></ProtectedRoute>} />
                <Route path="/ambient" element={<ProtectedRoute><Ambient /></ProtectedRoute>} />
                <Route path="/practice/checkin" element={<ProtectedRoute><PracticeCheckIn /></ProtectedRoute>} />
                <Route path="/practice/journal" element={<ProtectedRoute><PracticeJournal /></ProtectedRoute>} />
                <Route path="/practice/bodyscan" element={<ProtectedRoute><PracticeBodyScan /></ProtectedRoute>} />
                <Route path="/practice/replay" element={<ProtectedRoute><PracticeReplay /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                <Route path="/welcome" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
                <Route path="/auth" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
                <Route path="/reset-password" element={<ResetPassword />} />
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
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
