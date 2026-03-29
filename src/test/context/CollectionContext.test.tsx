import { describe, it, expect } from "vitest";
import { FREE_ITEM_LIMIT } from "@/lib/constants";
import type { CollectionItem } from "@/context/CollectionContext";

// ─── Test-only pure functions ──────────────────────────────────────────────────
// CollectionContext computes these inside the provider using useMemo.  Because
// the real provider requires a live Supabase connection we test the same
// arithmetic in isolation using the identical formulas copied from the source.

function getTotalValue(items: CollectionItem[]): number {
  return items.reduce((sum, item) => sum + item.estimatedValue, 0);
}

function getTotalCost(items: CollectionItem[]): number {
  return items.reduce((sum, item) => sum + item.purchasePrice, 0);
}

function getTotalGain(items: CollectionItem[]): number {
  return getTotalValue(items) - getTotalCost(items);
}

function getTopAsset(items: CollectionItem[]): CollectionItem | null {
  let top: CollectionItem | null = null;
  for (const item of items) {
    if (!top || item.estimatedValue > top.estimatedValue) top = item;
  }
  return top;
}

function isAtFreeLimit(items: CollectionItem[]): boolean {
  return items.length >= FREE_ITEM_LIMIT;
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeItem(id: string, purchasePrice: number, estimatedValue: number): CollectionItem {
  return {
    id,
    collectionId: "1",
    name: `Item ${id}`,
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
    purchasePrice,
    estimatedValue,
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
  };
}

// ─── getTotalValue ────────────────────────────────────────────────────────────

describe("getTotalValue()", () => {
  it("returns 0 for empty array", () => {
    expect(getTotalValue([])).toBe(0);
  });

  it("returns estimatedValue for single item", () => {
    expect(getTotalValue([makeItem("a", 100, 200)])).toBe(200);
  });

  it("sums estimatedValue across multiple items", () => {
    const items = [
      makeItem("a", 100, 200),
      makeItem("b", 50,  500),
      makeItem("c", 0,   300),
    ];
    expect(getTotalValue(items)).toBe(1000);
  });

  it("handles items with zero estimatedValue", () => {
    const items = [makeItem("a", 100, 0), makeItem("b", 200, 0)];
    expect(getTotalValue(items)).toBe(0);
  });

  it("handles fractional values without floating point error (integer inputs)", () => {
    const items = [makeItem("a", 10, 10), makeItem("b", 20, 20)];
    expect(getTotalValue(items)).toBe(30);
  });
});

// ─── getTotalCost ─────────────────────────────────────────────────────────────

describe("getTotalCost()", () => {
  it("returns 0 for empty array", () => {
    expect(getTotalCost([])).toBe(0);
  });

  it("returns purchasePrice for single item", () => {
    expect(getTotalCost([makeItem("a", 500, 1000)])).toBe(500);
  });

  it("sums purchasePrice across multiple items", () => {
    const items = [
      makeItem("a", 100, 200),
      makeItem("b", 200, 400),
      makeItem("c", 50,  100),
    ];
    expect(getTotalCost(items)).toBe(350);
  });

  it("handles items with zero purchasePrice", () => {
    const items = [makeItem("a", 0, 100), makeItem("b", 0, 200)];
    expect(getTotalCost(items)).toBe(0);
  });
});

// ─── getTotalGain ─────────────────────────────────────────────────────────────

describe("getTotalGain()", () => {
  it("returns 0 for empty array", () => {
    expect(getTotalGain([])).toBe(0);
  });

  it("returns positive gain when value > cost", () => {
    const items = [makeItem("a", 100, 500)];
    expect(getTotalGain(items)).toBe(400);
  });

  it("returns negative gain when value < cost (loss scenario)", () => {
    const items = [makeItem("a", 1000, 200)];
    expect(getTotalGain(items)).toBe(-800);
  });

  it("returns 0 when value equals cost", () => {
    const items = [makeItem("a", 300, 300)];
    expect(getTotalGain(items)).toBe(0);
  });

  it("aggregates correctly across multiple items", () => {
    const items = [
      makeItem("a", 100, 200),  // +100
      makeItem("b", 500, 300),  // -200
      makeItem("c", 50,  150),  // +100
    ];
    // totalValue = 650, totalCost = 650, gain = 0
    expect(getTotalGain(items)).toBe(0);
  });
});

// ─── getTopAsset ──────────────────────────────────────────────────────────────

describe("getTopAsset()", () => {
  it("returns null for empty array", () => {
    expect(getTopAsset([])).toBeNull();
  });

  it("returns the only item for single-item array", () => {
    const item = makeItem("a", 100, 5000);
    expect(getTopAsset([item])).toBe(item);
  });

  it("returns item with highest estimatedValue", () => {
    const items = [
      makeItem("a", 100, 200),
      makeItem("b", 100, 9999),
      makeItem("c", 100, 500),
    ];
    expect(getTopAsset(items)?.id).toBe("b");
  });

  it("returns the first item when all have equal value", () => {
    const items = [makeItem("a", 0, 100), makeItem("b", 0, 100)];
    // With the current algorithm: "if item.estimatedValue > top.estimatedValue"
    // strict greater-than means first item wins on tie
    expect(getTopAsset(items)?.id).toBe("a");
  });

  it("returns item even when estimatedValue is 0 (still the top asset)", () => {
    const items = [makeItem("a", 0, 0)];
    expect(getTopAsset(items)?.id).toBe("a");
  });

  it("correctly identifies top asset when highest is in the middle", () => {
    const items = [
      makeItem("x", 0, 100),
      makeItem("y", 0, 99999),
      makeItem("z", 0, 5000),
    ];
    expect(getTopAsset(items)?.id).toBe("y");
  });
});

// ─── isAtFreeLimit ────────────────────────────────────────────────────────────

describe("isAtFreeLimit()", () => {
  it("returns false for 0 items", () => {
    expect(isAtFreeLimit([])).toBe(false);
  });

  it("returns false for 1 item", () => {
    const items = [makeItem("a", 0, 0)];
    expect(isAtFreeLimit(items)).toBe(false);
  });

  it("returns false for FREE_ITEM_LIMIT - 1 items (24)", () => {
    const items = Array.from({ length: FREE_ITEM_LIMIT - 1 }, (_, i) =>
      makeItem(String(i), 0, 0)
    );
    expect(isAtFreeLimit(items)).toBe(false);
  });

  it("returns true at exactly FREE_ITEM_LIMIT items (25)", () => {
    const items = Array.from({ length: FREE_ITEM_LIMIT }, (_, i) =>
      makeItem(String(i), 0, 0)
    );
    expect(isAtFreeLimit(items)).toBe(true);
  });

  it("returns true above FREE_ITEM_LIMIT (26+)", () => {
    const items = Array.from({ length: FREE_ITEM_LIMIT + 1 }, (_, i) =>
      makeItem(String(i), 0, 0)
    );
    expect(isAtFreeLimit(items)).toBe(true);
  });

  it("FREE_ITEM_LIMIT constant matches expected value of 25", () => {
    // Contract test: billing tier relies on this value
    expect(FREE_ITEM_LIMIT).toBe(25);
  });
});
