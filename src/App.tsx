import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { CollectionProvider, useCollection } from "@/context/CollectionContext";
import { AppLoadingScreen } from "@/components/AppLoadingScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Dashboard from "@/pages/Dashboard";
import CollectionPage from "@/pages/CollectionPage";
import AddItem from "@/pages/AddItem";
import ItemDetail from "@/pages/ItemDetail";
import PublicCollection from "@/pages/PublicCollection";
import SharePage from "@/pages/SharePage";
import ExportPage from "@/pages/ExportPage";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import Profile from "@/pages/Profile";

const queryClient = new QueryClient();

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
  return <Auth />;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CollectionProvider>
          <BrowserRouter>
          <Navbar />
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
          </BrowserRouter>
        </CollectionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
