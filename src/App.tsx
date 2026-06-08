import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Layout } from "@/components/layout/Layout";
import { SkipToContent } from "@/components/ui/SkipToContent";
import { LoadingFallback } from "@/components/ui/LoadingFallback";
import { PageTransition } from "@/components/ui/PageTransition";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { AdminThemeProvider } from "@/hooks/useAdminTheme";
import { AdminLanguageProvider } from "@/hooks/useAdminLanguage";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import { LanguageProvider } from "@/contexts/LanguageContext";

// ── Public pages ──────────────────────────────────────────────────────────────
const Home             = lazy(() => import("./pages/Home"));
const About            = lazy(() => import("./pages/About"));
const Contact          = lazy(() => import("./pages/Contact"));
const ValleyOfDeath    = lazy(() => import("./pages/ValleyOfDeath"));
const Methodology      = lazy(() => import("./pages/Methodology"));
const CaseFiles        = lazy(() => import("./pages/CaseFiles"));
const ThankYou         = lazy(() => import("./pages/ThankYou"));
const NotFound         = lazy(() => import("./pages/NotFound"));
const RunwaySimulator  = lazy(() => import("./pages/tools/RunwaySimulator"));

// ── Preview (temporary — remove after visual approval) ────────────────────────
const ResultPreview = lazy(() =>
  import("./components/valley/CinematicAssessmentResult").then((m) => ({
    default: m.CinematicAssessmentResultPreview,
  }))
);

// ── Admin pages (code-split, loaded only when visiting /admin/*) ──────────────
const AdminLogin        = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard    = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminSubmissions  = lazy(() => import("./pages/admin/AdminSubmissions"));
const AdminTestimonials = lazy(() => import("./pages/admin/AdminTestimonials"));
const AdminFounders     = lazy(() => import("./pages/admin/AdminFounders"));
const AdminSessions     = lazy(() => import("./pages/admin/AdminSessions"));
const AdminReports      = lazy(() => import("./pages/admin/AdminReports"));
const AdminFollowUps    = lazy(() => import("./pages/admin/AdminFollowUps"));
const AdminApprovals    = lazy(() => import("./pages/admin/AdminApprovals"));
const AdminBookings     = lazy(() => import("./pages/admin/AdminBookings"));
const AdminValleyLeads  = lazy(() => import("./pages/admin/AdminValleyLeads"));
const AdminReportQueue  = lazy(() => import("./pages/admin/AdminReportQueue"));
const AdminPromoCodes   = lazy(() => import("./pages/admin/AdminPromoCodes"));
const AdminTeam          = lazy(() => import("./pages/admin/AdminTeam"));
const AdminRevenue       = lazy(() => import("./pages/admin/AdminRevenue"));
const AdminDebug         = lazy(() => import("./pages/admin/AdminDebug"));
const AdminEmailTemplates = lazy(() => import("./pages/admin/AdminEmailTemplates"));
const AdminActionCenter     = lazy(() => import("./pages/admin/AdminActionCenter"));
const AdminServices         = lazy(() => import("./pages/admin/AdminServices"));
const AdminReportTemplates  = lazy(() => import("./pages/admin/AdminReportTemplates"));
const AdminRetargeting      = lazy(() => import("./pages/admin/AdminRetargeting"));
const AdminActivityLog      = lazy(() => import("./pages/admin/AdminActivityLog"));
const AdminFailKit          = lazy(() => import("./pages/admin/AdminFailKit"));
const BookSession           = lazy(() => import("./pages/BookSession"));
const FailKitRequest        = lazy(() => import("./pages/FailKitRequest"));

const queryClient = new QueryClient();

// ── Public bilingual routes ────────────────────────────────────────────────────
//
// /           → redirect to /en
// /en          → English home
// /en/about   → English about page
// /en/valley-of-death
// /en/contact
// /ar          → Arabic home
// /ar/about   → Arabic about page  (same component, language from URL)
// /ar/valley-of-death
// /ar/contact
// /*           → 404
//
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/en" replace />} />

        {/* English routes */}
        <Route path="/en"                 element={<PageTransition><Home /></PageTransition>} />
        <Route path="/en/about"           element={<PageTransition><About /></PageTransition>} />
        <Route path="/en/valley-of-death" element={<PageTransition><ValleyOfDeath /></PageTransition>} />
        <Route path="/en/contact"         element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/en/methodology"     element={<PageTransition><Methodology /></PageTransition>} />
        <Route path="/en/case-files"      element={<PageTransition><CaseFiles /></PageTransition>} />
        <Route path="/en/thank-you"       element={<PageTransition><ThankYou /></PageTransition>} />
        <Route path="/en/tools/runway-simulator" element={<PageTransition><RunwaySimulator /></PageTransition>} />
        <Route path="/en/book-session"          element={<PageTransition><BookSession /></PageTransition>} />
        <Route path="/en/fail-kit-request"      element={<PageTransition><FailKitRequest /></PageTransition>} />

        {/* Arabic routes — same components, language derived from URL prefix */}
        <Route path="/ar"                 element={<PageTransition><Home /></PageTransition>} />
        <Route path="/ar/about"           element={<PageTransition><About /></PageTransition>} />
        <Route path="/ar/valley-of-death" element={<PageTransition><ValleyOfDeath /></PageTransition>} />
        <Route path="/ar/contact"         element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/ar/methodology"     element={<PageTransition><Methodology /></PageTransition>} />
        <Route path="/ar/case-files"      element={<PageTransition><CaseFiles /></PageTransition>} />
        <Route path="/ar/thank-you"       element={<PageTransition><ThankYou /></PageTransition>} />
        <Route path="/ar/tools/runway-simulator" element={<PageTransition><RunwaySimulator /></PageTransition>} />
        <Route path="/ar/book-session"          element={<PageTransition><BookSession /></PageTransition>} />
        <Route path="/ar/fail-kit-request"      element={<PageTransition><FailKitRequest /></PageTransition>} />

        {/* Preview route — remove after visual approval */}
        <Route path="/result-preview" element={<Suspense fallback={<LoadingFallback />}><ResultPreview /></Suspense>} />

        {/* 404 */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

// ── Root router — switches between public site and admin ──────────────────────
//
// useLocation() decides which "shell" to render without creating a parent
// <Route> that would make inner routes relative.
//
function RootRouter() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <AdminThemeProvider>
        <AdminLanguageProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/submissions"
            element={
              <ProtectedAdminRoute>
                <AdminSubmissions />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/testimonials"
            element={
              <ProtectedAdminRoute>
                <AdminTestimonials />
              </ProtectedAdminRoute>
            }
          />
          <Route path="/admin/founders"   element={<ProtectedAdminRoute><AdminFounders /></ProtectedAdminRoute>} />
          <Route path="/admin/sessions"   element={<ProtectedAdminRoute><AdminSessions /></ProtectedAdminRoute>} />
          <Route path="/admin/reports"    element={<ProtectedAdminRoute><AdminReports /></ProtectedAdminRoute>} />
          <Route path="/admin/follow-ups" element={<ProtectedAdminRoute><AdminFollowUps /></ProtectedAdminRoute>} />
          <Route path="/admin/approvals"  element={<ProtectedAdminRoute><AdminApprovals /></ProtectedAdminRoute>} />
          <Route path="/admin/bookings"      element={<ProtectedAdminRoute><AdminBookings /></ProtectedAdminRoute>} />
          <Route path="/admin/valley-leads" element={<ProtectedAdminRoute><AdminValleyLeads /></ProtectedAdminRoute>} />
          <Route path="/admin/report-queue" element={<ProtectedAdminRoute><AdminReportQueue /></ProtectedAdminRoute>} />
          <Route path="/admin/promo-codes"  element={<ProtectedAdminRoute><AdminPromoCodes /></ProtectedAdminRoute>} />
          <Route path="/admin/team"         element={<ProtectedAdminRoute><AdminTeam /></ProtectedAdminRoute>} />
          <Route path="/admin/revenue"         element={<ProtectedAdminRoute><AdminRevenue /></ProtectedAdminRoute>} />
          <Route path="/admin/debug"           element={<ProtectedAdminRoute><AdminDebug /></ProtectedAdminRoute>} />
          <Route path="/admin/email-templates" element={<ProtectedAdminRoute><AdminEmailTemplates /></ProtectedAdminRoute>} />
          <Route path="/admin/action-center"     element={<ProtectedAdminRoute><AdminActionCenter /></ProtectedAdminRoute>} />
          <Route path="/admin/services"          element={<ProtectedAdminRoute><AdminServices /></ProtectedAdminRoute>} />
          <Route path="/admin/report-templates"  element={<ProtectedAdminRoute><AdminReportTemplates /></ProtectedAdminRoute>} />
          <Route path="/admin/retargeting"       element={<ProtectedAdminRoute><AdminRetargeting /></ProtectedAdminRoute>} />
          <Route path="/admin/activity-log"      element={<ProtectedAdminRoute><AdminActivityLog /></ProtectedAdminRoute>} />
          <Route path="/admin/fail-kit"          element={<ProtectedAdminRoute><AdminFailKit /></ProtectedAdminRoute>} />
        </Routes>
      </Suspense>
        </AdminLanguageProvider>
      </AdminThemeProvider>
    );
  }

  return (
    <LanguageProvider>
      <SkipToContent />
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <AnimatedRoutes />
        </Suspense>
      </Layout>
    </LanguageProvider>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AdminAuthProvider>
              <RootRouter />
            </AdminAuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
