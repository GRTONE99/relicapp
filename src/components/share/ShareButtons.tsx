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

  // Clone the card into an off-screen node that React does not own.
  // This means React can never re-render and reset img.src back to the
  // proxy URL while we are mid-capture.
  const clone = cardRef.current.cloneNode(true) as HTMLDivElement;
  Object.assign(clone.style, {
    position: "fixed",
    top: "-99999px",
    left: "-99999px",
    zIndex: "-1",
    pointerEvents: "none",
  });
  document.body.appendChild(clone);

  const imgs = Array.from(clone.querySelectorAll<HTMLImageElement>("img"));

  // Replace every image in the clone with a data URL fetched via the proxy.
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src") || "";
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
      try {
        const dataUrl = await fetchAsDataUrl(src);
        img.src = dataUrl;
        if (!img.complete || img.naturalWidth === 0) {
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 3000);
          });
        }
      } catch (e) {
        console.warn("Share: could not inline image", src, e);
        img.style.visibility = "hidden";
      }
    }),
  );

  try {
    const dataUrl = await toPng(clone, { pixelRatio: 2, skipAutoScale: true });
    document.body.removeChild(clone);
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch (err) {
    document.body.removeChild(clone);
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
