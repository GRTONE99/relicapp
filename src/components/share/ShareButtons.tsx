import { useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Download, Loader2 } from "lucide-react";

async function captureCardAsBlob(cardRef: React.RefObject<HTMLDivElement>): Promise<Blob | null> {
  if (!cardRef.current) return null;

  const card = cardRef.current;
  const imgs = Array.from(card.querySelectorAll<HTMLImageElement>("img"));

  // Pre-fetch every image and convert to a data URL. This must happen before
  // we touch the live DOM so we have all data ready for a synchronous swap.
  const dataUrls = await Promise.all(
    imgs.map(async (img) => {
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
        console.warn("[share] image prefetch failed:", src.substring(0, 80), e);
        return null;
      }
    })
  );

  // Swap in data URLs synchronously — no await between here and toPng.
  // html-to-image clones the element at the very start of its serialization
  // step, so React cannot re-render and reset src values before the clone
  // is taken. Images that failed to prefetch keep their proxy src so
  // html-to-image can attempt its own fetch as a fallback.
  const originalSrcs = imgs.map((img) => img.getAttribute("src") || "");
  imgs.forEach((img, i) => { if (dataUrls[i]) img.src = dataUrls[i]!; });

  try {
    const dataUrl = await toPng(card, {
      pixelRatio: 2,
      width: card.offsetWidth,
      height: card.offsetHeight,
      skipFonts: true,
    });
    imgs.forEach((img, i) => { img.src = originalSrcs[i]; });
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch (err) {
    imgs.forEach((img, i) => { img.src = originalSrcs[i]; });
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

      // On mobile use the native share sheet (save to Photos, etc.).
      // Desktop macOS also supports navigator.share but we want a direct download there.
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
