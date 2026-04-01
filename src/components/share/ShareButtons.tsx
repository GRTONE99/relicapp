import { useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Download, Loader2 } from "lucide-react";

async function captureCardAsBlob(cardRef: React.RefObject<HTMLDivElement>): Promise<Blob | null> {
  if (!cardRef.current) return null;

  // Snapshot the card's rendered width so the off-screen clone has
  // identical dimensions and the layout doesn't collapse.
  const { width } = cardRef.current.getBoundingClientRect();

  // Wrapper is absolutely positioned far off-screen with a fixed width.
  // React never touches this subtree so img.src can't be reset mid-capture.
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `position:absolute;top:-9999px;left:0;width:${width}px;`;
  const clone = cardRef.current.cloneNode(true) as HTMLDivElement;
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  const originalImgs = Array.from(cardRef.current.querySelectorAll<HTMLImageElement>("img"));
  const imgs = Array.from(clone.querySelectorAll<HTMLImageElement>("img"));

  // Fix image container heights in the clone. When the clone is positioned
  // off-screen, CSS aspect-ratio doesn't compute a height, so overflow:hidden
  // clips the image to zero. Copy the pixel height from the live card instead.
  originalImgs.forEach((origImg, i) => {
    const cloneImg = imgs[i];
    if (!cloneImg) return;
    const origContainer = origImg.parentElement as HTMLElement | null;
    const cloneContainer = cloneImg.parentElement as HTMLElement | null;
    if (origContainer && cloneContainer) {
      const { width, height } = origContainer.getBoundingClientRect();
      if (height > 0) cloneContainer.style.height = `${height}px`;
      if (width > 0) cloneContainer.style.width = `${width}px`;
    }
  });

  // Pre-fetch every image via the proxy and inline as a data URL so that
  // toPng makes zero external requests — no CORS issues possible.
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src") || "";
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
      try {
        const res = await fetch(src, { mode: "cors", credentials: "omit" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        img.src = dataUrl;
        await new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) { resolve(); return; }
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 3000);
        });
      } catch (e) {
        console.warn("[share] could not inline image:", src.substring(0, 100), e);
        img.style.visibility = "hidden";
      }
    }),
  );

  try {
    const { width, height } = cardRef.current.getBoundingClientRect();
    const dataUrl = await toPng(clone, {
      pixelRatio: 2,
      width: Math.round(width),
      height: Math.round(height),
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
