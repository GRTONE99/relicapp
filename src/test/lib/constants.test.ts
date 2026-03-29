import { describe, it, expect } from "vitest";
import {
  SPORT_OPTIONS,
  CATEGORY_OPTIONS,
  CONDITION_OPTIONS,
  GRADING_COMPANY_OPTIONS,
  FREE_ITEM_LIMIT,
  CATEGORY_LABELS,
  SPORT_LABELS,
  type Option,
} from "@/lib/constants";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function assertOptionShape(opts: Option[], listName: string) {
  opts.forEach((opt, i) => {
    expect(opt, `${listName}[${i}] should be an object`).toBeDefined();
    expect(typeof opt.value, `${listName}[${i}].value`).toBe("string");
    expect(typeof opt.label, `${listName}[${i}].label`).toBe("string");
    expect(opt.value.trim(), `${listName}[${i}].value must not be blank`).not.toBe("");
    expect(opt.label.trim(), `${listName}[${i}].label must not be blank`).not.toBe("");
  });
}

function assertUniqueValues(opts: Option[], listName: string) {
  const values = opts.map((o) => o.value);
  const unique = new Set(values);
  expect(unique.size, `${listName} values must be unique`).toBe(values.length);
}

function assertUniqueLabels(opts: Option[], listName: string) {
  const labels = opts.map((o) => o.label);
  const unique = new Set(labels);
  expect(unique.size, `${listName} labels must be unique`).toBe(labels.length);
}

// ─── SPORT_OPTIONS ─────────────────────────────────────────────────────────────

describe("SPORT_OPTIONS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(SPORT_OPTIONS)).toBe(true);
    expect(SPORT_OPTIONS.length).toBeGreaterThan(0);
  });

  it("every entry has a non-empty string value and label", () => {
    assertOptionShape(SPORT_OPTIONS, "SPORT_OPTIONS");
  });

  it("values are unique", () => {
    assertUniqueValues(SPORT_OPTIONS, "SPORT_OPTIONS");
  });

  it("labels are unique", () => {
    assertUniqueLabels(SPORT_OPTIONS, "SPORT_OPTIONS");
  });

  it("contains expected sports", () => {
    const values = SPORT_OPTIONS.map((o) => o.value);
    expect(values).toContain("baseball");
    expect(values).toContain("basketball");
    expect(values).toContain("football");
    expect(values).toContain("hockey");
    expect(values).toContain("soccer");
  });
});

// ─── CATEGORY_OPTIONS ──────────────────────────────────────────────────────────

describe("CATEGORY_OPTIONS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(CATEGORY_OPTIONS)).toBe(true);
    expect(CATEGORY_OPTIONS.length).toBeGreaterThan(0);
  });

  it("every entry has a non-empty string value and label", () => {
    assertOptionShape(CATEGORY_OPTIONS, "CATEGORY_OPTIONS");
  });

  it("values are unique", () => {
    assertUniqueValues(CATEGORY_OPTIONS, "CATEGORY_OPTIONS");
  });

  it("labels are unique", () => {
    assertUniqueLabels(CATEGORY_OPTIONS, "CATEGORY_OPTIONS");
  });

  it("contains expected categories", () => {
    const values = CATEGORY_OPTIONS.map((o) => o.value);
    expect(values).toContain("cards");
    expect(values).toContain("autographs");
    expect(values).toContain("game-used");
  });
});

// ─── CONDITION_OPTIONS ─────────────────────────────────────────────────────────

describe("CONDITION_OPTIONS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(CONDITION_OPTIONS)).toBe(true);
    expect(CONDITION_OPTIONS.length).toBeGreaterThan(0);
  });

  it("every entry has a non-empty string value and label", () => {
    assertOptionShape(CONDITION_OPTIONS, "CONDITION_OPTIONS");
  });

  it("values are unique", () => {
    assertUniqueValues(CONDITION_OPTIONS, "CONDITION_OPTIONS");
  });

  it("labels are unique", () => {
    assertUniqueLabels(CONDITION_OPTIONS, "CONDITION_OPTIONS");
  });

  it("contains Gem Mint and Poor as boundary conditions", () => {
    const values = CONDITION_OPTIONS.map((o) => o.value);
    expect(values).toContain("Gem Mint");
    expect(values).toContain("Poor");
  });

  it("ordered from best to worst (Gem Mint first)", () => {
    expect(CONDITION_OPTIONS[0].value).toBe("Gem Mint");
    expect(CONDITION_OPTIONS[CONDITION_OPTIONS.length - 1].value).toBe("Poor");
  });
});

// ─── GRADING_COMPANY_OPTIONS ───────────────────────────────────────────────────

describe("GRADING_COMPANY_OPTIONS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(GRADING_COMPANY_OPTIONS)).toBe(true);
    expect(GRADING_COMPANY_OPTIONS.length).toBeGreaterThan(0);
  });

  it("every entry has a non-empty string value and label", () => {
    assertOptionShape(GRADING_COMPANY_OPTIONS, "GRADING_COMPANY_OPTIONS");
  });

  it("values are unique", () => {
    assertUniqueValues(GRADING_COMPANY_OPTIONS, "GRADING_COMPANY_OPTIONS");
  });

  it("contains PSA, BGS, SGC", () => {
    const values = GRADING_COMPANY_OPTIONS.map((o) => o.value);
    expect(values).toContain("psa");
    expect(values).toContain("bgs");
    expect(values).toContain("sgc");
  });
});

// ─── FREE_ITEM_LIMIT ───────────────────────────────────────────────────────────

describe("FREE_ITEM_LIMIT", () => {
  it("is a positive integer", () => {
    expect(typeof FREE_ITEM_LIMIT).toBe("number");
    expect(Number.isInteger(FREE_ITEM_LIMIT)).toBe(true);
    expect(FREE_ITEM_LIMIT).toBeGreaterThan(0);
  });

  it("is exactly 25", () => {
    // This is a contract test: changing FREE_ITEM_LIMIT has billing implications
    expect(FREE_ITEM_LIMIT).toBe(25);
  });
});

// ─── CATEGORY_LABELS ──────────────────────────────────────────────────────────

describe("CATEGORY_LABELS", () => {
  it("is an object (Record)", () => {
    expect(typeof CATEGORY_LABELS).toBe("object");
    expect(CATEGORY_LABELS).not.toBeNull();
  });

  it("has the same number of keys as CATEGORY_OPTIONS", () => {
    expect(Object.keys(CATEGORY_LABELS).length).toBe(CATEGORY_OPTIONS.length);
  });

  it("every CATEGORY_OPTIONS value maps to its label", () => {
    for (const opt of CATEGORY_OPTIONS) {
      expect(CATEGORY_LABELS[opt.value]).toBe(opt.label);
    }
  });

  it("no values are empty strings", () => {
    for (const [key, value] of Object.entries(CATEGORY_LABELS)) {
      expect(value.trim(), `CATEGORY_LABELS["${key}"] must not be blank`).not.toBe("");
    }
  });
});

// ─── SPORT_LABELS ─────────────────────────────────────────────────────────────

describe("SPORT_LABELS", () => {
  it("is an object (Record)", () => {
    expect(typeof SPORT_LABELS).toBe("object");
    expect(SPORT_LABELS).not.toBeNull();
  });

  it("has the same number of keys as SPORT_OPTIONS", () => {
    expect(Object.keys(SPORT_LABELS).length).toBe(SPORT_OPTIONS.length);
  });

  it("every SPORT_OPTIONS value maps to its label", () => {
    for (const opt of SPORT_OPTIONS) {
      expect(SPORT_LABELS[opt.value]).toBe(opt.label);
    }
  });

  it("no values are empty strings", () => {
    for (const [key, value] of Object.entries(SPORT_LABELS)) {
      expect(value.trim(), `SPORT_LABELS["${key}"] must not be blank`).not.toBe("");
    }
  });
});
