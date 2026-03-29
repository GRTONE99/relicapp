import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { CollectionItem } from "@/context/CollectionContext";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

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
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    }),
  },
}));

// Mock html-to-image toPng
const mockToPng = vi.fn().mockResolvedValue("data:image/png;base64,fakeimage");
vi.mock("html-to-image", () => ({
  toPng: (...args: unknown[]) => mockToPng(...args),
}));

// Mock exportCSV, exportPDF, exportInsurance
const mockExportCSV = vi.fn();
const mockExportPDF = vi.fn();
const mockExportInsurance = vi.fn();
vi.mock("@/lib/exportUtils", () => ({
  exportCSV: (...args: unknown[]) => mockExportCSV(...args),
  exportPDF: (...args: unknown[]) => mockExportPDF(...args),
  exportInsurance: (...args: unknown[]) => mockExportInsurance(...args),
}));

// ─── Mock items ───────────────────────────────────────────────────────────────

const mockItem: CollectionItem = {
  id: "item-1",
  collectionId: "1",
  name: "Test Card",
  player: "Test Player",
  team: "Test Team",
  sport: "baseball",
  year: "2020",
  category: "cards",
  subCategory: "",
  condition: "Mint",
  grade: "9",
  gradingCompany: "PSA",
  certificationNumber: "",
  authenticationCompany: "",
  purchasePrice: 100,
  estimatedValue: 500,
  recentSalePrice: 0,
  storageLocation: "",
  notes: "",
  dateAcquired: "",
  images: ["https://example.com/img.jpg"],
  createdDate: "2024-01-01",
  purchasedFrom: "",
  origin: "",
  previousOwners: "",
  eventDetails: "",
  supportingEvidence: "",
};

let mockItems: CollectionItem[] = [mockItem];

vi.mock("@/context/CollectionContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/context/CollectionContext")>();
  return {
    ...actual,
    useCollection: () => ({
      items: mockItems,
      addItem: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
      getTotalValue: () => mockItems.reduce((s, i) => s + i.estimatedValue, 0),
      getTotalCost: () => 100,
      getTotalGain: () => 400,
      getTopAsset: () => mockItem,
      user: { id: "user-123", email: "test@example.com" },
      loading: false,
      itemsLoading: false,
      signOut: vi.fn(),
      isAtFreeLimit: () => false,
    }),
  };
});

// Mock global fetch for toPng's image capture
global.fetch = vi.fn().mockResolvedValue({
  blob: () => Promise.resolve(new Blob(["png-data"], { type: "image/png" })),
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:fake-url");
global.URL.revokeObjectURL = vi.fn();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function renderSharePage() {
  const { default: SharePage } = await import("@/pages/SharePage");
  return render(<SharePage />);
}

async function renderExportPage() {
  const { default: ExportPage } = await import("@/pages/ExportPage");
  return render(<ExportPage />);
}

// ─── SharePage Tests ──────────────────────────────────────────────────────────

describe("SharePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockItems = [mockItem];
    mockToPng.mockResolvedValue("data:image/png;base64,fakeimage");
  });

  // 1. Renders tab list with Item/Roster/Profile/Recent tabs
  it("renders tabs: Item, Roster, Profile, Recent", async () => {
    await renderSharePage();
    expect(screen.getByRole("tab", { name: /item/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /roster/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /recent/i })).toBeInTheDocument();
  });

  // 2. Shows "Add items" message when items is empty on Item tab
  it("shows 'Add items to your roster to share them.' when items is empty", async () => {
    mockItems = [];
    await renderSharePage();
    expect(
      screen.getByText(/add items to your roster to share them/i)
    ).toBeInTheDocument();
  });

  // 3. Renders Facebook, X, Instagram, Save buttons
  it("renders Facebook, X, Instagram, Save share buttons", async () => {
    await renderSharePage();
    expect(screen.getByRole("button", { name: /facebook/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^x$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /instagram/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  // 4. X button on desktop calls window.open with twitter.com URL
  it("X button calls window.open with twitter.com/intent/tweet URL", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    await renderSharePage();
    const xBtn = screen.getByRole("button", { name: /^x$/i });
    fireEvent.click(xBtn);
    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining("twitter.com/intent/tweet"),
        "_blank",
        expect.any(String)
      );
    });
    openSpy.mockRestore();
  });

  // 5. Facebook button calls window.open with facebook.com/sharer URL
  it("Facebook button calls window.open with facebook.com/sharer URL", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    await renderSharePage();
    const fbBtn = screen.getByRole("button", { name: /facebook/i });
    fireEvent.click(fbBtn);
    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining("facebook.com/sharer"),
        "_blank",
        expect.any(String)
      );
    });
    openSpy.mockRestore();
  });

  // 6. Instagram button on desktop downloads image
  it("Instagram button triggers download — toPng is called", async () => {
    await renderSharePage();
    fireEvent.click(screen.getByRole("button", { name: /instagram/i }));
    // toPng is called as part of the capture pipeline
    await waitFor(() => {
      expect(mockToPng).toHaveBeenCalled();
    });
  });

  // 7. Save button triggers download
  it("Save button triggers download — toPng is called", async () => {
    await renderSharePage();
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(mockToPng).toHaveBeenCalled();
    });
  });
});

// ─── ExportPage Tests ─────────────────────────────────────────────────────────

describe("ExportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockItems = [mockItem];
  });

  // 8. ExportPage renders Export CSV and Export PDF buttons
  it("renders Export buttons for CSV and PDF", async () => {
    await renderExportPage();
    // "Export" buttons are present — there are 3 (CSV, PDF, Insurance)
    const exportBtns = screen.getAllByRole("button", { name: /export/i });
    expect(exportBtns.length).toBeGreaterThanOrEqual(2);
  });

  // 9. ExportPage CSV button calls exportCSV
  it("CSV Export button calls exportCSV", async () => {
    await renderExportPage();
    // CSV Export card has title "CSV Export"
    expect(screen.getByText("CSV Export")).toBeInTheDocument();
    // The Export button within the CSV card
    const csvCard = screen.getByText("CSV Export").closest("div")!;
    // The Export button inside that section
    const exportBtn = csvCard
      .closest('[class*="CardContent"]')
      ?.querySelector("button") as HTMLButtonElement | null;
    if (exportBtn) {
      fireEvent.click(exportBtn);
      await waitFor(() => {
        expect(mockExportCSV).toHaveBeenCalled();
      });
    } else {
      // Fallback: click first Export button
      const buttons = screen.getAllByRole("button", { name: /export/i });
      fireEvent.click(buttons[0]);
      await waitFor(() => {
        expect(mockExportCSV).toHaveBeenCalled();
      });
    }
  });

  // 10. ExportPage renders insurance report option
  it("renders Insurance Report option", async () => {
    await renderExportPage();
    expect(screen.getByText(/insurance report/i)).toBeInTheDocument();
  });
});
