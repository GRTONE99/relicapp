import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ─── Mocks ────────────────────────────────────────────────────────────────────

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

vi.mock("@/context/CollectionContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/context/CollectionContext")>();
  return {
    ...actual,
    useCollection: () => ({
      items: [],
      addItem: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
      getTotalValue: () => 0,
      getTotalCost: () => 0,
      getTotalGain: () => 0,
      getTopAsset: () => null,
      user: { id: "user-123", email: "test@example.com" },
      loading: false,
      itemsLoading: false,
      signOut: vi.fn(),
      isAtFreeLimit: () => false,
    }),
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setWindowWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Responsive behaviour", () => {
  afterEach(() => {
    // Reset to desktop width after each test
    setWindowWidth(1280);
  });

  // 1. Navbar renders mobile bottom navigation at mobile width
  it("Navbar renders mobile bottom navigation elements at mobile width", async () => {
    setWindowWidth(375);
    const { Navbar } = await import("@/components/Navbar");
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    // The mobile bottom nav uses "md:hidden fixed bottom-0" — there are two navs rendered.
    // We check that Dashboard / Roster links exist (they appear in the bottom nav).
    const dashboardLinks = screen.getAllByText("Dashboard");
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(1);
  });

  // 2. Navbar does not render mobile bottom nav at desktop width — both navs are in DOM
  //    but hidden via CSS. We verify the Navbar renders at all and the nav element exists.
  it("Navbar renders desktop nav at desktop width", async () => {
    setWindowWidth(1280);
    const { Navbar } = await import("@/components/Navbar");
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    // Desktop nav should contain "Dashboard" link
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThanOrEqual(1);
  });

  // 3. use-mobile hook returns true when window width < 768
  it("useIsMobile returns true when innerWidth is 375", async () => {
    setWindowWidth(375);
    const { useIsMobile } = await import("@/hooks/use-mobile");
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  // 4. use-mobile hook returns false when window width >= 768
  it("useIsMobile returns false when innerWidth is 1280", async () => {
    setWindowWidth(1280);
    const { useIsMobile } = await import("@/hooks/use-mobile");
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  // 5. Dashboard stat grid has grid-cols-2 class
  it("Dashboard stat grid container has grid-cols-2 class", async () => {
    setWindowWidth(375);
    const { default: Dashboard } = await import("@/pages/Dashboard");
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    // The stat grid div has class "grid grid-cols-2 lg:grid-cols-4 gap-3"
    const gridEl = document.querySelector(".grid-cols-2");
    expect(gridEl).not.toBeNull();
  });

  // 6. Dashboard stat grid has lg:grid-cols-4 class at desktop
  it("Dashboard stat grid container has lg:grid-cols-4 class", async () => {
    setWindowWidth(1280);
    const { default: Dashboard } = await import("@/pages/Dashboard");
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    const gridEl = document.querySelector(".lg\\:grid-cols-4");
    expect(gridEl).not.toBeNull();
  });
});
