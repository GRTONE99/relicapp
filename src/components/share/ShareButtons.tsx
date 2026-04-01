import { useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Download, Loader2 } from "lucide-react";

async function fetchAsDataUrl(src: string): Promise<string> {
  // img.src is already a proxy URL — fetch it directly. The proxy returns
  // Access-Control-Allow-Origin: * so the fetch succeeds on every device.
  const res = await fetch(src, { mode: "cors", credentials: "omit" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${src}`);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function captureCardAsBlob(cardRef: React.RefObject<HTMLDivElement>): Promise<Blob | null> {
  if (!cardRef.current) return null;

  const imgs = Array.from(cardRef.current.querySelectorAll<HTMLImageElement>("img"));
  const originals = new Map<HTMLImageElement, string>();

  // Convert every image to a data URL so html-to-image makes zero external
  // fetches during capture — no CORS taint possible on any browser/device.
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src") || "";
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
      try {
        const dataUrl = await fetchAsDataUrl(src);
        originals.set(img, src);
        img.src = dataUrl;
        // Wait for the element to render the new data URL.
        if (!img.complete || img.naturalWidth === 0) {
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 3000);
          });
        }
      } catch (e) {
        console.warn("Share: could not inline image", src, e);
      }
    }),
  );

  // Two frames so the browser paints before we capture.
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

  try {
    // No external fetches needed — all images are data URLs.
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, skipAutoScale: true });
    originals.forEach((src, img) => { img.src = src; });
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch (err) {
    originals.forEach((src, img) => { img.src = src; });
    console.error("Failed to capture share card:", err);
    throw err;
  }
}

// ─── ShareButtons component ───────────────────────────────────────────────────

interface ShareButtonsProps {
  cardRef: React.RefObject<HTMLDivElement>;
  filename?: string;
}

export function ShareButtons({ cardRef, filename = "relic-roster-share" }: ShareButtonsProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleSave = useCallback(async () => {
    setIsCapturing(true);
    try {
      const blob = await captureCardAsBlob(cardRef);
      if (!blob) { toast.error("Could not capture image."); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Image saved!");
    } catch {
      toast.error("Could not capture image. Check browser console for details.");
    } finally {
      setIsCapturing(false);
    }
  }, [cardRef]);

  return (
    <Button
      onClick={handleSave}
      disabled={isCapturing}
      className="w-full h-12 text-base font-semibold gap-2"
    >
      {isCapturing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
      {isCapturing ? "Saving..." : "Save Image"}
    </Button>
  );
}
