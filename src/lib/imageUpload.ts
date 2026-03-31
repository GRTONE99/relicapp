import { supabase } from "@/integrations/supabase/client";

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;

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
      resolve(blob);
    };

    img.src = objectUrl;
  });
}

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

  const formData = new FormData();
  formData.append("file", new File([compressed], "image.jpg", { type: "image/jpeg" }));
  formData.append("userId", userId);

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const response = await fetch(`${supabaseUrl}/functions/v1/upload-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const text = await response.text();
  console.log("upload-image response:", response.status, text);

  let data: { success: boolean; error?: string; url?: string };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Upload failed (${response.status}): ${text.slice(0, 200)}`);
  }

  if (!data.success) throw new Error(data.error ?? "Upload failed");
  return data.url!;
}

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
