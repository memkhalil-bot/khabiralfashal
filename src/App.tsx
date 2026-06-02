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
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import { LanguageProvider } from "@/contexts/LanguageContext";

// ── Public pages ──────────────────────────────────────────────────────────────
const Home          = lazy(() => import("./pages/Home"));
const About         = lazy(() => import("./pages/About"));
const Contact       = lazy(() => import("./pages/Contact"));
const ValleyOfDeath = lazy(() => import("./pages/ValleyOfDeath"));
const Methodology   = lazy(() => import("./pages/Methodology"));
const NotFound      = lazy(() => import("./pages/NotFound"));

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

        {/* Arabic routes — same components, language derived from URL prefix */}
        <Route path="/ar"                 element={<PageTransition><Home /></PageTransition>} />
        <Route path="/ar/about"           element={<PageTransition><About /></PageTransition>} />
        <Route path="/ar/valley-of-death" element={<PageTransition><ValleyOfDeath /></PageTransition>} />
        <Route path="/ar/contact"         element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/ar/methodology"     element={<PageTransition><Methodology /></PageTransition>} />

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
        </Routes>
      </Suspense>
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
