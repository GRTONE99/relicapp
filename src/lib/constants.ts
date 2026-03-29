// ─── Shared catalog constants ────────────────────────────────────────────────
// Single source of truth for category slugs, sport slugs, conditions, and
// grading companies. All components and export utilities derive their display
// labels and <Select> options from here.

export interface Option {
  value: string;
  label: string;
}

// ── Sports ────────────────────────────────────────────────────────────────────
export const SPORT_OPTIONS: Option[] = [
  { value: "baseball",    label: "Baseball"    },
  { value: "basketball",  label: "Basketball"  },
  { value: "boxing",      label: "Boxing"      },
  { value: "football",    label: "Football"    },
  { value: "golf",        label: "Golf"        },
  { value: "hockey",      label: "Hockey"      },
  { value: "mma",         label: "MMA"         },
  { value: "motorsports", label: "Motorsports" },
  { value: "soccer",      label: "Soccer"      },
  { value: "tennis",      label: "Tennis"      },
];

export const SPORT_LABELS: Record<string, string> = Object.fromEntries(
  SPORT_OPTIONS.map((o) => [o.value, o.label]),
);

// ── Categories ────────────────────────────────────────────────────────────────
export const CATEGORY_OPTIONS: Option[] = [
  { value: "cards",              label: "Cards"                },
  { value: "jerseys-apparel",    label: "Jerseys and Apparel"  },
  { value: "balls-pucks",        label: "Balls and Pucks"      },
  { value: "equipment",          label: "Equipment"            },
  { value: "footwear",           label: "Footwear"             },
  { value: "autographs",         label: "Autographs"           },
  { value: "photos-posters",     label: "Photos and Posters"   },
  { value: "tickets-programs",   label: "Tickets and Programs" },
  { value: "championship-items", label: "Championship Items"   },
  { value: "game-used",          label: "Game-Used Artifacts"  },
  { value: "documents",          label: "Documents"            },
  { value: "promotional",        label: "Promotional Items"    },
];

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
);

// ── Conditions ────────────────────────────────────────────────────────────────
export const CONDITION_OPTIONS: Option[] = [
  { value: "Gem Mint",  label: "Gem Mint"  },
  { value: "Mint",      label: "Mint"      },
  { value: "Near Mint", label: "Near Mint" },
  { value: "Excellent", label: "Excellent" },
  { value: "Very Good", label: "Very Good" },
  { value: "Good",      label: "Good"      },
  { value: "Fair",      label: "Fair"      },
  { value: "Poor",      label: "Poor"      },
];

// ── Grading companies ─────────────────────────────────────────────────────────
export const GRADING_COMPANY_OPTIONS: Option[] = [
  { value: "psa", label: "PSA"     },
  { value: "bgs", label: "BGS"     },
  { value: "sgc", label: "SGC"     },
];

export const FREE_ITEM_LIMIT = 25;
