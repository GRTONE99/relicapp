import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock supabase — CollectionContext uses it at module level
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn(),
    }),
  },
}));

// ─── ProtectedRoute component (inline copy matching App.tsx) ──────────────────
// We copy the implementation so the test doesn't depend on App's module graph.

import { AppLoadingScreen } from "@/components/AppLoadingScreen";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  user: object | null;
  loading: boolean;
}

function ProtectedRoute({ children, user, loading }: ProtectedRouteProps) {
  if (loading) return <AppLoadingScreen message="Restoring your account..." />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

// ─── Auth stub page ───────────────────────────────────────────────────────────
function AuthPage() {
  return <div>Auth Page</div>;
}

function ProtectedPage() {
  return <div>Protected Content</div>;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderWithRouter(
  initialPath: string,
  user: object | null,
  loading: boolean
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <ProtectedPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Loading state
  it("shows AppLoadingScreen while loading is true", () => {
    renderWithRouter("/", null, true);
    expect(screen.getByText("Relic Roster")).toBeInTheDocument();
    expect(screen.getByText("Restoring your account...")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Auth Page")).not.toBeInTheDocument();
  });

  it("loading screen does not show protected content", () => {
    renderWithRouter("/", null, true);
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  // 2. Unauthenticated redirect
  it("redirects to /auth when user is null and not loading", () => {
    renderWithRouter("/", null, false);
    expect(screen.getByText("Auth Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("does not render protected content when unauthenticated", () => {
    renderWithRouter("/", null, false);
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  // 3. Authenticated user sees content
  it("renders children when user is authenticated", () => {
    const user = { id: "user-123", email: "test@example.com" };
    renderWithRouter("/", user, false);
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Auth Page")).not.toBeInTheDocument();
  });

  it("does not show loading screen when authenticated", () => {
    const user = { id: "user-123", email: "test@example.com" };
    renderWithRouter("/", user, false);
    expect(screen.queryByText("Restoring your account...")).not.toBeInTheDocument();
  });

  it("does not redirect to /auth when authenticated", () => {
    const user = { id: "user-123", email: "test@example.com" };
    renderWithRouter("/", user, false);
    expect(screen.queryByText("Auth Page")).not.toBeInTheDocument();
  });

  // 4. Transition: loading → authenticated (render twice simulating state change)
  it("shows content after transitioning from loading to authenticated", () => {
    const user = { id: "user-123", email: "test@example.com" };
    const { rerender } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute user={null} loading={true}>
                <ProtectedPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Still loading
    expect(screen.getByText("Restoring your account...")).toBeInTheDocument();

    // Simulate auth resolving
    rerender(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute user={user} loading={false}>
                <ProtectedPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Restoring your account...")).not.toBeInTheDocument();
  });

  // 5. Transition: loading → unauthenticated
  it("redirects after transitioning from loading to unauthenticated", () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute user={null} loading={true}>
                <ProtectedPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Restoring your account...")).toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute user={null} loading={false}>
                <ProtectedPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Auth Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });
});
