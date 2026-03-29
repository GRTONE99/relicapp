import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { CollectionProvider, useCollection } from "@/context/CollectionContext";
import { AppLoadingScreen } from "@/components/AppLoadingScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// All page chunks are deferred — only the chunk for the active route is fetched.
const Dashboard        = lazy(() => import("@/pages/Dashboard"));
const CollectionPage   = lazy(() => import("@/pages/CollectionPage"));
const AddItem          = lazy(() => import("@/pages/AddItem"));
const ItemDetail       = lazy(() => import("@/pages/ItemDetail"));
const PublicCollection = lazy(() => import("@/pages/PublicCollection"));
const SharePage        = lazy(() => import("@/pages/SharePage"));
const ExportPage       = lazy(() => import("@/pages/ExportPage"));
const Auth             = lazy(() => import("@/pages/Auth"));
const ResetPassword    = lazy(() => import("@/pages/ResetPassword"));
const NotFound         = lazy(() => import("@/pages/NotFound"));
const Profile          = lazy(() => import("@/pages/Profile"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCollection();
  if (loading) return <AppLoadingScreen message="Restoring your account..." />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AuthRoute() {
  const { user, loading } = useCollection();
  if (loading) return <AppLoadingScreen message="Checking your sign-in status..." />;
  if (user) return <Navigate to="/" replace />;
  return (
    <Suspense fallback={<AppLoadingScreen message="Loading..." />}>
      <Auth />
    </Suspense>
  );
}

const App = () => (
  <ErrorBoundary>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CollectionProvider>
        <BrowserRouter>
          <Navbar />
          <Suspense fallback={<AppLoadingScreen message="Loading..." />}>
            <Routes>
              <Route path="/auth" element={<AuthRoute />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/roster" element={<ProtectedRoute><CollectionPage /></ProtectedRoute>} />
              <Route path="/add-item" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
              <Route path="/item/:id" element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
              <Route path="/share" element={<ProtectedRoute><SharePage /></ProtectedRoute>} />
              <Route path="/public" element={<PublicCollection />} />
              <Route path="/export" element={<ProtectedRoute><ExportPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CollectionProvider>
    </TooltipProvider>
  </ErrorBoundary>
);

export default App;
