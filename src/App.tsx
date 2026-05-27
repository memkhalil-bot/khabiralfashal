import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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

// ── Public pages ──────────────────────────────────────────────────────────────
const Index = lazy(() => import("./pages/Index"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const ValleyOfDeath = lazy(() => import("./pages/ValleyOfDeath"));
const NotFound = lazy(() => import("./pages/NotFound"));

// ── Admin pages (code-split, loaded only when visiting /admin/*) ──────────────
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminSubmissions = lazy(() => import("./pages/admin/AdminSubmissions"));
const AdminTestimonials = lazy(() => import("./pages/admin/AdminTestimonials"));

const queryClient = new QueryClient();

// ── Public animated routes (wrapped in the site Layout) ───────────────────────
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/portfolio" element={<PageTransition><Portfolio /></PageTransition>} />
        <Route path="/project/:slug" element={<PageTransition><ProjectDetail /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/valley-of-death" element={<PageTransition><ValleyOfDeath /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

// ── Root router — switches between public site and admin ──────────────────────
//
// The key trick: we use useLocation() to decide which "shell" to render
// (admin layout vs public Layout) WITHOUT creating a parent <Route> that
// would make inner routes relative.  Both AdminRoutes and AnimatedRoutes
// render their own top-level <Routes> so paths remain absolute.
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
    <>
      <SkipToContent />
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <AnimatedRoutes />
        </Suspense>
      </Layout>
    </>
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
