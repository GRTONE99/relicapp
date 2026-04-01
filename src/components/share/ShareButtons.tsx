import { useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Download, Loader2 } from "lucide-react";

async function captureCardAsBlob(cardRef: React.RefObject<HTMLDivElement>): Promise<Blob | null> {
  if (!cardRef.current) return null;
  const card = cardRef.current;
  const { width, height } = card.getBoundingClientRect();

  // Extract data URLs from the live card's images. These are already loaded
  // in the browser with crossOrigin="anonymous" via the CORS proxy, so we
  // can draw them to a canvas without any network request.
  const liveImgs = Array.from(card.querySelectorAll<HTMLImageElement>("img"));
  const dataUrls = await Promise.all(
    liveImgs.map(async (img) => {
      // Primary: canvas draw — zero latency, no fetch, works offline
      if (img.complete && img.naturalWidth > 0) {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        if (ctx) {
          try {
            ctx.drawImage(img, 0, 0);
            return c.toDataURL("image/jpeg", 0.92);
          } catch { /* canvas tainted, fall through to fetch */ }
        }
      }
      // Fallback: fetch via proxy URL
      const src = img.getAttribute("src") || "";
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return null;
      try {
        const res = await fetch(src, { mode: "cors", credentials: "omit" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn("[share] image unavailable:", src.substring(0, 80), e);
        return null;
      }
    })
  );

  // Clone into a fixed-position invisible overlay. position:fixed ensures
  // that CSS layout (aspect-ratio, flex, etc.) computes correctly on mobile
  // Safari. position:absolute with a large negative offset causes Safari to
  // skip layout/paint for those elements.
  const wrapper = document.createElement("div");
  wrapper.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    `width:${Math.round(width)}px`,
    "opacity:0",
    "z-index:-9999",
    "pointer-events:none",
    "overflow:hidden",
  ].join(";");
  const clone = card.cloneNode(true) as HTMLDivElement;
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);
  void wrapper.offsetHeight; // force layout

  const cloneImgs = Array.from(clone.querySelectorAll<HTMLImageElement>("img"));
  cloneImgs.forEach((img, i) => {
    if (dataUrls[i]) img.src = dataUrls[i]!;
    else img.style.visibility = "hidden";
  });
  void wrapper.offsetHeight; // force layout after src swap

  try {
    const cloneRect = clone.getBoundingClientRect();
    const dataUrl = await toPng(clone, {
      pixelRatio: 2,
      width: Math.round(cloneRect.width || width),
      height: Math.round(cloneRect.height || height),
      skipFonts: true,
    });
    document.body.removeChild(wrapper);
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch (err) {
    document.body.removeChild(wrapper);
    console.error("[share] toPng failed:", err);
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

      const file = new File([blob], `${filename}.png`, { type: "image/png" });

      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMobile && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Relic Roster" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Image saved!");
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== "AbortError") {
        toast.error("Could not save image. Check browser console for details.");
      }
    } finally {
      setIsCapturing(false);
    }
  }, [cardRef, filename]);

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
