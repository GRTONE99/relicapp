import { supabase } from "@/integrations/supabase/client";

/**
 * Upload an image (base64 data URL or File) to the item-photos storage bucket.
 * Returns the public URL of the uploaded image.
 */
export async function uploadItemImage(
  userId: string,
  file: File | string, // File object or base64 data URL
  index: number
): Promise<string> {
  let blob: Blob;
  let ext = "png";

  if (typeof file === "string") {
    // base64 data URL
    const res = await fetch(file);
    blob = await res.blob();
    const mimeMatch = file.match(/^data:image\/(\w+)/);
    if (mimeMatch) ext = mimeMatch[1] === "jpeg" ? "jpg" : mimeMatch[1];
  } else {
    blob = file;
    const parts = file.name.split(".");
    ext = parts[parts.length - 1] || "png";
  }

  const fileName = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("item-photos")
    .upload(fileName, blob, { upsert: true, contentType: blob.type || "image/png" });

  if (error) throw error;

  const { data } = supabase.storage.from("item-photos").getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Upload multiple images, returning an array of public URLs.
 * Accepts a mix of existing URLs (passed through) and base64 data URLs (uploaded).
 */
export async function uploadItemImages(
  userId: string,
  images: string[]
): Promise<string[]> {
  const results: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    // If it's already a URL (not base64), keep it
    if (img.startsWith("http://") || img.startsWith("https://")) {
      results.push(img);
    } else {
      // It's a base64 data URL — upload it
      const url = await uploadItemImage(userId, img, i);
      results.push(url);
    }
  }
  return results;
}
