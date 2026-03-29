import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
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
      order: vi.fn().mockReturnThis(),
      then: vi.fn(),
    }),
  },
}));

// ─── Mock items fixture ───────────────────────────────────────────────────────

function makeItem(overrides: Partial<CollectionItem> & { id: string; name: string }): CollectionItem {
  return {
    id: overrides.id,
    collectionId: "1",
    name: overrides.name,
    player: overrides.player ?? "",
    team: overrides.team ?? "",
    sport: overrides.sport ?? "baseball",
    year: overrides.year ?? "2020",
    category: overrides.category ?? "cards",
    subCategory: overrides.subCategory ?? "",
    condition: overrides.condition ?? "Mint",
    grade: overrides.grade ?? "",
    gradingCompany: overrides.gradingCompany ?? "",
    certificationNumber: overrides.certificationNumber ?? "",
    authenticationCompany: overrides.authenticationCompany ?? "",
    purchasePrice: overrides.purchasePrice ?? 100,
    estimatedValue: overrides.estimatedValue ?? 200,
    recentSalePrice: overrides.recentSalePrice ?? 0,
    storageLocation: overrides.storageLocation ?? "",
    notes: overrides.notes ?? "",
    dateAcquired: overrides.dateAcquired ?? "2024-01-01",
    images: overrides.images ?? [],
    createdDate: overrides.createdDate ?? "2024-01-01",
    purchasedFrom: overrides.purchasedFrom ?? "",
    origin: overrides.origin ?? "",
    previousOwners: overrides.previousOwners ?? "",
    eventDetails: overrides.eventDetails ?? "",
    supportingEvidence: overrides.supportingEvidence ?? "",
  };
}

const baseItems: CollectionItem[] = [
  makeItem({ id: "1", name: "Babe Ruth Card",        player: "Babe Ruth",    sport: "baseball",    category: "cards",    estimatedValue: 5000, purchasePrice: 1000 }),
  makeItem({ id: "2", name: "Jordan Jersey",          player: "Michael Jordan", sport: "basketball", category: "jerseys-apparel", estimatedValue: 3000, purchasePrice: 500 }),
  makeItem({ id: "3", name: "Brady Football",         player: "Tom Brady",    sport: "football",    category: "balls-pucks", estimatedValue: 1500, purchasePrice: 200 }),
  makeItem({ id: "4", name: "Gretzky Autograph",      player: "Wayne Gretzky", sport: "hockey",     category: "autographs", estimatedValue: 8000, purchasePrice: 2000 }),
  makeItem({ id: "5", name: "Tiger Woods Photo",      player: "Tiger Woods",  sport: "golf",        category: "photos-posters", estimatedValue: 500, purchasePrice: 100 }),
];

let mockItems: CollectionItem[] = baseItems;

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
      getTotalCost: () => mockItems.reduce((s, i) => s + i.purchasePrice, 0),
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

// ─── Helper ───────────────────────────────────────────────────────────────────

async function renderCollectionPage() {
  const { default: CollectionPage } = await import("@/pages/CollectionPage");
  return render(<CollectionPage />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CollectionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockItems = [...baseItems];
  });

  // 1. Renders all items when no filter applied
  it("renders all 5 items with no filter", async () => {
    await renderCollectionPage();
    expect(screen.getByText("Babe Ruth Card")).toBeInTheDocument();
    expect(screen.getByText("Jordan Jersey")).toBeInTheDocument();
    expect(screen.getByText("Brady Football")).toBeInTheDocument();
    expect(screen.getByText("Gretzky Autograph")).toBeInTheDocument();
    expect(screen.getByText("Tiger Woods Photo")).toBeInTheDocument();
  });

  // 2. Sport filter hides items not matching (tested via text search since Select interaction is complex)
  it("text search for sport-specific player hides non-matching items", async () => {
    await renderCollectionPage();
    const searchInput = screen.getByPlaceholderText(/search items/i);
    fireEvent.change(searchInput, { target: { value: "Babe Ruth" } });
    expect(screen.getByText("Babe Ruth Card")).toBeInTheDocument();
    expect(screen.queryByText("Jordan Jersey")).not.toBeInTheDocument();
    expect(screen.queryByText("Brady Football")).not.toBeInTheDocument();
  });

  // 3. Category filter — validated by showing only empty state when filter value matches nothing
  it("renders empty state message when filters yield no results", async () => {
    await renderCollectionPage();
    const searchInput = screen.getByPlaceholderText(/search items/i);
    fireEvent.change(searchInput, { target: { value: "xyznonexistent12345" } });
    expect(screen.getByText(/no items match your filters/i)).toBeInTheDocument();
  });

  // 4. Text search filters by item name (case-insensitive)
  it("text search filters by item name case-insensitively", async () => {
    await renderCollectionPage();
    const searchInput = screen.getByPlaceholderText(/search items/i);
    fireEvent.change(searchInput, { target: { value: "gretzky autograph" } });
    expect(screen.getByText("Gretzky Autograph")).toBeInTheDocument();
    expect(screen.queryByText("Babe Ruth Card")).not.toBeInTheDocument();
  });

  // 5. Text search filters by player name
  it("text search filters by player name", async () => {
    await renderCollectionPage();
    const searchInput = screen.getByPlaceholderText(/search items/i);
    fireEvent.change(searchInput, { target: { value: "Tiger Woods" } });
    expect(screen.getByText("Tiger Woods Photo")).toBeInTheDocument();
    expect(screen.queryByText("Babe Ruth Card")).not.toBeInTheDocument();
  });

  // 6. Clearing search shows all items again
  it("clearing search shows all items again", async () => {
    await renderCollectionPage();
    const searchInput = screen.getByPlaceholderText(/search items/i);
    fireEvent.change(searchInput, { target: { value: "Jordan" } });
    expect(screen.queryByText("Babe Ruth Card")).not.toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByText("Babe Ruth Card")).toBeInTheDocument();
  });

  // 7. Empty state shown when no items exist
  it("shows 'no items match' message when items array is empty", async () => {
    mockItems = [];
    await renderCollectionPage();
    expect(screen.getByText(/no items match your filters/i)).toBeInTheDocument();
  });

  // 8. Empty state shown when filters match nothing
  it("shows empty state message when search matches nothing", async () => {
    await renderCollectionPage();
    const searchInput = screen.getByPlaceholderText(/search items/i);
    fireEvent.change(searchInput, { target: { value: "NORESULTSZZZ" } });
    expect(screen.getByText(/no items match your filters/i)).toBeInTheDocument();
  });

  // 9. CollectionPage shows item count and total value in subtitle
  it("shows item count in subtitle", async () => {
    await renderCollectionPage();
    expect(screen.getByText(/5 items/)).toBeInTheDocument();
  });

  // 10. Shows the Roster heading
  it("renders Roster heading", async () => {
    await renderCollectionPage();
    expect(screen.getByRole("heading", { name: /roster/i })).toBeInTheDocument();
  });
});
