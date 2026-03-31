import { supabase } from "@/integrations/supabase/client";

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;

/**
 * Compress an image blob to at most MAX_DIMENSION on its longest side,
 * normalising output to JPEG. Images already within the limit are returned
 * unchanged (no re-encoding overhead).
 */
async function compressImage(blob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        resolve(blob);
        return;
      }

      if (width > height) {
        height = Math.round((height / width) * MAX_DIMENSION);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width / height) * MAX_DIMENSION);
        height = MAX_DIMENSION;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (compressed) => resolve(compressed ?? blob),
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(blob); // fall back to original on error
    };

    img.src = objectUrl;
  });
}

/**
 * Upload an image (base64 data URL or File) to the item-photos bucket.
 * Compresses before upload. Returns the public URL.
 */
export async function uploadItemImage(
  userId: string,
  file: File | string,
  _index: number
): Promise<string> {
  let blob: Blob;

  if (typeof file === "string") {
    const res = await fetch(file);
    blob = await res.blob();
  } else {
    blob = file;
  }

  const compressed = await compressImage(blob);
  const fileName = `${userId}/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage
    .from("item-photos")
    .upload(fileName, compressed, { upsert: true, contentType: "image/jpeg" });

  if (error) throw error;

  const { data } = supabase.storage.from("item-photos").getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Upload multiple images in parallel. Existing https:// URLs are passed through
 * unchanged; base64 data URLs are compressed and uploaded concurrently.
 */
export async function uploadItemImages(
  userId: string,
  images: string[]
): Promise<string[]> {
  return Promise.all(
    images.map((img, i) =>
      img.startsWith("http://") || img.startsWith("https://")
        ? Promise.resolve(img)
        : uploadItemImage(userId, img, i)
    )
  );
}
