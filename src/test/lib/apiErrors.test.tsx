import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import React from "react";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// We control these per-test
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "user-123", email: "test@example.com" } } },
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: (...args: unknown[]) => { mockSelect(...args); return { order: mockOrder }; },
      insert: (...args: unknown[]) => { mockInsert(...args); return { select: () => ({ single: mockSingle }) }; },
      update: (...args: unknown[]) => { mockUpdate(...args); return { eq: mockEq }; },
      delete: () => ({ eq: mockDelete }),
    }),
  },
}));

// Mock imageUpload so we don't need real storage
vi.mock("@/lib/imageUpload", () => ({
  uploadItemImages: vi.fn().mockResolvedValue([]),
}));

// Capture toast calls
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

// ─── Consumer component ───────────────────────────────────────────────────────
// Renders nothing visible — just exposes context actions to the test via ref

import type { CollectionItem } from "@/context/CollectionContext";

function makeItem(overrides?: Partial<CollectionItem>): CollectionItem {
  return {
    id: "item-1",
    collectionId: "1",
    name: "Test Item",
    player: "",
    team: "",
    sport: "baseball",
    year: "2020",
    category: "cards",
    subCategory: "",
    condition: "Mint",
    grade: "",
    gradingCompany: "",
    certificationNumber: "",
    authenticationCompany: "",
    purchasePrice: 100,
    estimatedValue: 200,
    recentSalePrice: 0,
    storageLocation: "",
    notes: "",
    dateAcquired: "",
    images: [],
    createdDate: "2024-01-01",
    purchasedFrom: "",
    origin: "",
    previousOwners: "",
    eventDetails: "",
    supportingEvidence: "",
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CollectionContext — API error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: select/order returns an empty items list
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockEq.mockResolvedValue({ error: null });
    mockDelete.mockResolvedValue({ error: null });
    mockSingle.mockResolvedValue({ data: makeItem(), error: null });
  });

  // 1. addItem propagates Supabase insert error
  it("addItem throws when Supabase insert returns an error", async () => {
    const insertError = { message: "duplicate key", code: "23505" };
    mockSingle.mockResolvedValue({ data: null, error: insertError });

    const { CollectionProvider, useCollection } = await import("@/context/CollectionContext");

    let thrownError: unknown = null;
    function TestConsumer() {
      const { addItem } = useCollection();
      return (
        <button
          onClick={async () => {
            try {
              await addItem(makeItem());
            } catch (e) {
              thrownError = e;
            }
          }}
        >
          Add
        </button>
      );
    }

    render(
      <CollectionProvider>
        <TestConsumer />
      </CollectionProvider>
    );

    await waitFor(() => screen.getByRole("button", { name: "Add" }));
    await act(async () => {
      screen.getByRole("button", { name: "Add" }).click();
    });
    await waitFor(() => {
      expect(thrownError).toBeTruthy();
    });
  });

  // 2. updateItem calls toast.error and throws when Supabase update fails
  it("updateItem calls toast.error and throws when update fails", async () => {
    const updateError = { message: "update failed" };
    mockEq.mockResolvedValue({ error: updateError });
    // Pre-populate items so updateItem is callable
    mockOrder.mockResolvedValue({ data: [
      { id: "item-1", name: "Test", player: "", team: "", sport: "", year: "",
        category: "", sub_category: "", condition: "", grade: "", grading_company: "",
        certification_number: "", authentication_company: "", purchase_price: 0,
        estimated_value: 0, recent_sale_price: 0, storage_location: "", notes: "",
        date_acquired: null, images: [], created_at: "2024-01-01T00:00:00Z",
        purchased_from: "", origin: "", previous_owners: "", event_details: "", supporting_evidence: "" }
    ], error: null });

    const { CollectionProvider, useCollection } = await import("@/context/CollectionContext");

    let threw = false;
    function TestConsumer() {
      const { updateItem } = useCollection();
      return (
        <button
          onClick={async () => {
            try {
              await updateItem("item-1", { name: "New Name" });
            } catch {
              threw = true;
            }
          }}
        >
          Update
        </button>
      );
    }

    render(
      <CollectionProvider>
        <TestConsumer />
      </CollectionProvider>
    );

    await waitFor(() => screen.getByRole("button", { name: "Update" }));
    await act(async () => {
      screen.getByRole("button", { name: "Update" }).click();
    });
    await waitFor(() => {
      expect(threw).toBe(true);
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringContaining("Failed to save changes")
      );
    });
  });

  // 3. deleteItem calls toast.error and throws when Supabase delete fails
  it("deleteItem calls toast.error and throws when delete fails", async () => {
    const deleteError = { message: "delete failed" };
    mockDelete.mockResolvedValue({ error: deleteError });

    const { CollectionProvider, useCollection } = await import("@/context/CollectionContext");

    let threw = false;
    function TestConsumer() {
      const { deleteItem } = useCollection();
      return (
        <button
          onClick={async () => {
            try {
              await deleteItem("item-1");
            } catch {
              threw = true;
            }
          }}
        >
          Delete
        </button>
      );
    }

    render(
      <CollectionProvider>
        <TestConsumer />
      </CollectionProvider>
    );

    await waitFor(() => screen.getByRole("button", { name: "Delete" }));
    await act(async () => {
      screen.getByRole("button", { name: "Delete" }).click();
    });
    await waitFor(() => {
      expect(threw).toBe(true);
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete")
      );
    });
  });

  // 4. Items fetch failure calls toast.error
  it("failed items fetch calls toast.error", async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: "fetch failed" } });

    const { CollectionProvider } = await import("@/context/CollectionContext");

    render(
      <CollectionProvider>
        <div>loaded</div>
      </CollectionProvider>
    );

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringContaining("Failed to load")
      );
    });
  });

  // 5. Image upload failure in addItem propagates the error
  it("addItem propagates image upload failure", async () => {
    const { uploadItemImages } = await import("@/lib/imageUpload");
    vi.mocked(uploadItemImages).mockRejectedValueOnce(new Error("upload failed"));

    const { CollectionProvider, useCollection } = await import("@/context/CollectionContext");

    let thrownMessage = "";
    function TestConsumer() {
      const { addItem } = useCollection();
      return (
        <button
          onClick={async () => {
            try {
              await addItem(makeItem({ images: ["data:image/png;base64,abc"] }));
            } catch (e: unknown) {
              if (e instanceof Error) thrownMessage = e.message;
            }
          }}
        >
          AddWithImage
        </button>
      );
    }

    render(
      <CollectionProvider>
        <TestConsumer />
      </CollectionProvider>
    );

    await waitFor(() => screen.getByRole("button", { name: "AddWithImage" }));
    await act(async () => {
      screen.getByRole("button", { name: "AddWithImage" }).click();
    });
    await waitFor(() => {
      expect(thrownMessage).toBe("upload failed");
    });
  });
});
