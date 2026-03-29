import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

// Mock fetch used by uploadItemImage to convert a base64 data URL to a Blob
global.fetch = vi.fn().mockResolvedValue({
  blob: () => Promise.resolve(new Blob(["fake-image-data"], { type: "image/png" })),
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: (...args: unknown[]) => mockUpload(...args),
        getPublicUrl: (...args: unknown[]) => mockGetPublicUrl(...args),
      }),
    },
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUploadFunctions() {
  const { uploadItemImage, uploadItemImages } = await import("@/lib/imageUpload");
  return { uploadItemImage, uploadItemImages };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("imageUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default happy path: upload succeeds
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://cdn.example.com/item-photos/user-1/uuid.png" },
    });
  });

  // 1. uploadItemImages returns empty array for empty input
  it("returns empty array for empty images array", async () => {
    const { uploadItemImages } = await getUploadFunctions();
    const result = await uploadItemImages("user-1", []);
    expect(result).toEqual([]);
  });

  // 2. uploadItemImages passes through existing https:// URLs unchanged
  it("passes through https:// URLs without uploading", async () => {
    const { uploadItemImages } = await getUploadFunctions();
    const url = "https://existing-cdn.com/photo.jpg";
    const result = await uploadItemImages("user-1", [url]);
    expect(result).toEqual([url]);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  // 3. uploadItemImages uploads base64 data URLs and returns public URL
  it("uploads base64 data URL and returns the public URL", async () => {
    const { uploadItemImages } = await getUploadFunctions();
    const base64 = "data:image/png;base64,iVBORw0KGgo=";
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://cdn.example.com/item-photos/user-1/abc.png" },
    });
    const result = await uploadItemImages("user-1", [base64]);
    expect(mockUpload).toHaveBeenCalledOnce();
    expect(result[0]).toBe("https://cdn.example.com/item-photos/user-1/abc.png");
  });

  // 4. uploadItemImage throws when Supabase storage returns an error
  it("throws when Supabase upload returns an error", async () => {
    const { uploadItemImage } = await getUploadFunctions();
    mockUpload.mockResolvedValue({ error: { message: "bucket not found" } });
    await expect(
      uploadItemImage("user-1", "data:image/png;base64,abc", 0)
    ).rejects.toMatchObject({ message: "bucket not found" });
  });

  // 5. uploadItemImages handles mixed array (some URLs, some base64)
  it("handles mixed array of https URLs and base64 strings", async () => {
    const { uploadItemImages } = await getUploadFunctions();
    const existingUrl = "https://existing.com/photo.png";
    const base64 = "data:image/jpeg;base64,/9j/abc";
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://cdn.example.com/uploaded.jpg" },
    });
    const result = await uploadItemImages("user-1", [existingUrl, base64]);
    expect(result[0]).toBe(existingUrl);
    expect(result[1]).toBe("https://cdn.example.com/uploaded.jpg");
    expect(mockUpload).toHaveBeenCalledOnce();
  });

  // 6. File extension extracted correctly from data URL mime type
  it("uses jpg extension for image/jpeg mime type", async () => {
    const { uploadItemImage } = await getUploadFunctions();
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://cdn.example.com/item-photos/user-1/photo.jpg" },
    });
    await uploadItemImage("user-1", "data:image/jpeg;base64,/9j/", 0);
    // The upload path should end with .jpg
    const uploadPath: string = mockUpload.mock.calls[0][0];
    expect(uploadPath).toMatch(/\.jpg$/);
  });

  // 7. Upload path includes userId as folder prefix
  it("upload path is prefixed with userId", async () => {
    const { uploadItemImage } = await getUploadFunctions();
    const userId = "user-abc-123";
    await uploadItemImage(userId, "data:image/png;base64,abc", 0);
    const uploadPath: string = mockUpload.mock.calls[0][0];
    expect(uploadPath.startsWith(userId + "/")).toBe(true);
  });
});
