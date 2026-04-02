import { useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Download, Loader2 } from "lucide-react";

async function captureCardAsBlob(cardRef: React.RefObject<HTMLDivElement>): Promise<Blob | null> {
  if (!cardRef.current) return null;
  const card = cardRef.current;
  const { width, height } = card.getBoundingClientRect();

  // Step 1: Prefetch every external image as a data URL via the proxy.
  // Doing this BEFORE cloning means we never touch the browser's image cache
  // (which may have non-CORS entries from initial page render), so canvas
  // taint is impossible. Data URLs are always CORS-clean for toPng/canvas.
  const imgs = Array.from(card.querySelectorAll<HTMLImageElement>("img"));
  const dataUrls = await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src") || "";
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return src || null;
      try {
        const res = await fetch(src, { mode: "cors", credentials: "omit", cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn("[share] prefetch failed:", src.substring(0, 80), e);
        return null;
      }
    })
  );

  // Step 2: Clone into a fixed-position invisible overlay so CSS layout
  // computes correctly on mobile Safari (aspect-ratio, flex, etc.).
  const wrapper = document.createElement("div");
  wrapper.style.cssText = [
    "position:fixed", "top:0", "left:0",
    `width:${Math.round(width)}px`,
    "opacity:0", "z-index:-9999", "pointer-events:none", "overflow:hidden",
  ].join(";");
  const clone = card.cloneNode(true) as HTMLDivElement;
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  // Step 3: Swap in data URLs. Remove crossorigin — data URLs don't need it.
  const cloneImgs = Array.from(clone.querySelectorAll<HTMLImageElement>("img"));
  cloneImgs.forEach((img, i) => {
    img.removeAttribute("crossorigin");
    if (dataUrls[i]) {
      img.src = dataUrls[i]!;
    } else {
      img.style.visibility = "hidden";
    }
  });
  void wrapper.offsetHeight; // reflow

  // Step 4: Bake aspect-ratio → explicit px height so html-to-image's SVG
  // foreignObject renderer can measure containers (SVG ignores aspect-ratio CSS).
  clone.querySelectorAll<HTMLElement>("*").forEach(el => {
    const ar = window.getComputedStyle(el).getPropertyValue("aspect-ratio");
    if (ar && ar !== "auto" && ar !== "none" && ar !== "") {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h > 0) {
        el.style.setProperty("aspect-ratio", "auto", "important");
        el.style.setProperty("height", `${h}px`, "important");
      }
    }
  });
  void wrapper.offsetHeight; // reflow after height baking

  try {
    const r = clone.getBoundingClientRect();
    const dataUrl = await toPng(clone, {
      pixelRatio: 2,
      width:  Math.round(r.width  || width),
      height: Math.round(r.height || height),
      skipFonts: true,
    });
    document.body.removeChild(wrapper);
    return await (await fetch(dataUrl)).blob();
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
