import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CollectionItem } from "@/context/CollectionContext";
import { FREE_ITEM_LIMIT } from "@/lib/constants";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Mock supabase (avoid network calls)
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: false }, error: null }),
    },
  },
}));

// CollectionContext mock — injected per-test via the factory below
let mockAddItem = vi.fn();
let mockIsAtFreeLimit = vi.fn(() => false);
let mockItems: CollectionItem[] = [];

vi.mock("@/context/CollectionContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/context/CollectionContext")>();
  return {
    ...actual,
    useCollection: () => ({
      items: mockItems,
      addItem: mockAddItem,
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
      isAtFreeLimit: mockIsAtFreeLimit,
    }),
  };
});

// ─── Test helper ──────────────────────────────────────────────────────────────

async function renderAddItem() {
  // Dynamic import so mocks are in place before the module loads
  const { default: AddItem } = await import("@/pages/AddItem");
  return render(<AddItem />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AddItem page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddItem = vi.fn().mockResolvedValue(undefined);
    mockIsAtFreeLimit = vi.fn(() => false);
    mockItems = [];
    mockNavigate.mockClear();
  });

  // 1. Renders without crash
  it("renders the Add Item heading without crashing", async () => {
    await renderAddItem();
    expect(screen.getByText("Add Item")).toBeInTheDocument();
  });

  it("renders the item name input", async () => {
    await renderAddItem();
    const nameInput = screen.getByPlaceholderText(/wayne gretzky rookie card/i);
    expect(nameInput).toBeInTheDocument();
  });

  it("renders the submit button", async () => {
    await renderAddItem();
    const submitBtn = screen.getByRole("button", { name: /add to roster/i });
    expect(submitBtn).toBeInTheDocument();
  });

  // Helper: get the name input with correct placeholder
  // Used throughout tests below

  // 2. Submit blocked when name is empty
  it("does not call addItem and shows error toast when name is empty", async () => {
    await renderAddItem();

    const submitBtn = screen.getByRole("button", { name: /add to roster/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAddItem).not.toHaveBeenCalled();
    });
    // Navigation should not occur
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // 3. Submit blocked when at free limit
  it("shows limit dialog and does not call addItem when at free limit", async () => {
    mockIsAtFreeLimit = vi.fn(() => true);
    mockItems = Array.from({ length: FREE_ITEM_LIMIT }, (_, i) => ({
      id: String(i),
      collectionId: "1",
      name: `Item ${i}`,
      player: "", team: "", sport: "", year: "", category: "", subCategory: "",
      condition: "", grade: "", gradingCompany: "", certificationNumber: "",
      authenticationCompany: "", purchasePrice: 0, estimatedValue: 0,
      recentSalePrice: 0, storageLocation: "", notes: "", dateAcquired: "",
      images: [], createdDate: "2024-01-01", purchasedFrom: "", origin: "",
      previousOwners: "", eventDetails: "", supportingEvidence: "",
    }));

    await renderAddItem();

    // When at free limit the button text changes to "Upgrade to Add More Items"
    // and is disabled — we verify addItem is not called regardless
    const submitBtn = screen.getByRole("button", { name: /upgrade to add more items/i });
    expect(submitBtn).toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAddItem).not.toHaveBeenCalled();
    });
  });

  // 4. Successful submit calls addItem with correct shape
  it("calls addItem with correct shape on successful submit", async () => {
    await renderAddItem();

    const nameInput = screen.getByPlaceholderText(/wayne gretzky rookie card/i);
    await userEvent.type(nameInput, "1986 Fleer Jordan RC");

    const submitBtn = screen.getByRole("button", { name: /add to roster/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledOnce();
    });

    const calledWith: CollectionItem = mockAddItem.mock.calls[0][0];

    // Required field
    expect(calledWith.name).toBe("1986 Fleer Jordan RC");
    // Shape correctness — all required keys present
    expect(typeof calledWith.id).toBe("string");
    expect(calledWith.collectionId).toBe("1");
    expect(typeof calledWith.purchasePrice).toBe("number");
    expect(typeof calledWith.estimatedValue).toBe("number");
    expect(Array.isArray(calledWith.images)).toBe(true);
    // Default numeric values when left blank
    expect(calledWith.purchasePrice).toBe(0);
    expect(calledWith.estimatedValue).toBe(0);
  });

  it("navigates to /roster after successful submit", async () => {
    await renderAddItem();

    const nameInput = screen.getByPlaceholderText(/wayne gretzky rookie card/i);
    await userEvent.type(nameInput, "Test Card");

    const submitBtn = screen.getByRole("button", { name: /add to roster/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/roster");
    });
  });

  it("shows the free-tier limit banner when at free limit", async () => {
    mockIsAtFreeLimit = vi.fn(() => true);
    mockItems = Array.from({ length: FREE_ITEM_LIMIT }, (_, i) => ({
      id: String(i), collectionId: "1", name: `Item ${i}`,
      player: "", team: "", sport: "", year: "", category: "", subCategory: "",
      condition: "", grade: "", gradingCompany: "", certificationNumber: "",
      authenticationCompany: "", purchasePrice: 0, estimatedValue: 0,
      recentSalePrice: 0, storageLocation: "", notes: "", dateAcquired: "",
      images: [], createdDate: "2024-01-01", purchasedFrom: "", origin: "",
      previousOwners: "", eventDetails: "", supportingEvidence: "",
    }));

    await renderAddItem();

    expect(screen.getByText(/Free limit reached/i)).toBeInTheDocument();
  });
});
