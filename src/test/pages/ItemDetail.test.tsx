import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CollectionItem } from "@/context/CollectionContext";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "test-item-1" }),
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
      order: vi.fn().mockReturnThis(),
      then: vi.fn(),
    }),
  },
}));

// ─── Mock item fixture ────────────────────────────────────────────────────────

const mockItem: CollectionItem = {
  id: "test-item-1",
  collectionId: "1",
  name: "1986 Fleer Michael Jordan Rookie",
  player: "Michael Jordan",
  team: "Chicago Bulls",
  sport: "basketball",
  year: "1986",
  category: "cards",
  subCategory: "",
  condition: "Near Mint",
  grade: "9",
  gradingCompany: "PSA",
  certificationNumber: "12345678",
  authenticationCompany: "",
  purchasePrice: 500,
  estimatedValue: 5000,
  recentSalePrice: 4800,
  storageLocation: "Binder A",
  notes: "Graded card",
  dateAcquired: "2023-01-15",
  images: ["https://example.com/card.jpg"],
  createdDate: "2023-01-15",
  purchasedFrom: "eBay",
  origin: "",
  previousOwners: "",
  eventDetails: "",
  supportingEvidence: "",
};

let mockItems: CollectionItem[] = [mockItem];
let mockUpdateItem = vi.fn();
let mockDeleteItem = vi.fn();

vi.mock("@/context/CollectionContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/context/CollectionContext")>();
  return {
    ...actual,
    useCollection: () => ({
      items: mockItems,
      addItem: vi.fn(),
      updateItem: mockUpdateItem,
      deleteItem: mockDeleteItem,
      getTotalValue: () => 5000,
      getTotalCost: () => 500,
      getTotalGain: () => 4500,
      getTopAsset: () => mockItem,
      user: { id: "user-123", email: "test@example.com" },
      loading: false,
      itemsLoading: false,
      signOut: vi.fn(),
      isAtFreeLimit: () => false,
    }),
  };
});

// ─── Helper ───────────────────────────────────────────────────────────────────

async function renderItemDetail() {
  const { default: ItemDetail } = await import("@/pages/ItemDetail");
  return render(<ItemDetail />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ItemDetail page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockItems = [mockItem];
    mockUpdateItem = vi.fn().mockResolvedValue(undefined);
    mockDeleteItem = vi.fn().mockResolvedValue(undefined);
    mockNavigate.mockClear();
  });

  // 1. Renders item name in heading
  it("renders item name in heading", async () => {
    await renderItemDetail();
    expect(screen.getByText("1986 Fleer Michael Jordan Rookie")).toBeInTheDocument();
  });

  // 2. Renders estimated value
  it("renders estimated value", async () => {
    await renderItemDetail();
    expect(screen.getByText(/\$5,000/)).toBeInTheDocument();
  });

  // 3. Renders player and team fields
  it("renders player and team fields", async () => {
    await renderItemDetail();
    // Player and team appear in the subheader — use getAllByText since name also contains "Michael Jordan"
    const playerElements = screen.getAllByText(/Michael Jordan/);
    expect(playerElements.length).toBeGreaterThanOrEqual(1);
    // The team name appears in the subtitle paragraph
    expect(screen.getByText(/Chicago Bulls/)).toBeInTheDocument();
  });

  // 4. Edit button click enters edit mode
  it("clicking Edit button enters edit mode (shows Save button)", async () => {
    await renderItemDetail();
    const editBtn = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editBtn);
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  // 5. In edit mode, changing name updates the input value
  it("in edit mode, changing name input updates the value", async () => {
    await renderItemDetail();
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    // Find the Item Name input (label "Item Name" above the input)
    const nameInput = screen.getByDisplayValue("1986 Fleer Michael Jordan Rookie");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Updated Card Name");
    expect(nameInput).toHaveValue("Updated Card Name");
  });

  // 6. Save button calls updateItem with correct id and updated fields
  it("Save calls updateItem with the correct item id", async () => {
    await renderItemDetail();
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    const nameInput = screen.getByDisplayValue("1986 Fleer Michael Jordan Rookie");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Renamed Card");
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(mockUpdateItem).toHaveBeenCalledWith(
        "test-item-1",
        expect.objectContaining({ name: "Renamed Card" })
      );
    });
  });

  // 7. Save shows loading state during save (button disabled or shows Saving...)
  it("Save button is disabled or shows loading state while saving", async () => {
    // Make updateItem hang so we can check intermediate state
    mockUpdateItem = vi.fn(
      () => new Promise<void>((resolve) => setTimeout(resolve, 200))
    );
    await renderItemDetail();
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    // During the async save the button text changes to "Saving..."
    await waitFor(() => {
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });

  // 8. Cancel in edit mode reverts changes
  it("Cancel in edit mode exits edit mode and reverts name", async () => {
    await renderItemDetail();
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    const nameInput = screen.getByDisplayValue("1986 Fleer Michael Jordan Rookie");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Temporary Name");
    // Click Cancel
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    // Should go back to view mode and show the original name
    expect(screen.getByText("1986 Fleer Michael Jordan Rookie")).toBeInTheDocument();
    // Save button should be gone
    expect(screen.queryByRole("button", { name: /^save$/i })).not.toBeInTheDocument();
  });

  // 9. Delete button is present
  it("renders a Delete button", async () => {
    await renderItemDetail();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  // 10. Delete triggers confirmation dialog
  it("clicking Delete opens a confirmation dialog", async () => {
    await renderItemDetail();
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
  });

  // 11. Confirming delete calls deleteItem with correct id
  it("confirming delete calls deleteItem with the correct id", async () => {
    await renderItemDetail();
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
    // The dialog has a confirm Delete button
    const confirmButtons = screen.getAllByRole("button", { name: /delete/i });
    // Last button in the dialog is the destructive confirm
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);
    await waitFor(() => {
      expect(mockDeleteItem).toHaveBeenCalledWith("test-item-1");
    });
  });

  // 12. Item not found — shows not-found state
  it("shows 'Item not found' when item id does not match", async () => {
    mockItems = []; // no items — useParams still returns "test-item-1" but item won't be found
    await renderItemDetail();
    expect(screen.getByText(/item not found/i)).toBeInTheDocument();
  });
});
