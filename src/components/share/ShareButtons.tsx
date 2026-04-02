import { useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Download, Loader2 } from "lucide-react";

async function captureCardAsBlob(cardRef: React.RefObject<HTMLDivElement>): Promise<Blob | null> {
  if (!cardRef.current) return null;
  const card = cardRef.current;
  const { width, height } = card.getBoundingClientRect();

  // Clone into a fixed-position invisible overlay so CSS layout computes
  // correctly on mobile Safari (aspect-ratio, flex, etc.).
  const wrapper = document.createElement("div");
  wrapper.style.cssText = [
    "position:fixed", "top:0", "left:0",
    `width:${Math.round(width)}px`,
    "opacity:0", "z-index:-9999", "pointer-events:none", "overflow:hidden",
  ].join(";");
  const clone = card.cloneNode(true) as HTMLDivElement;
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  // Force every image in the clone to reload with crossOrigin set BEFORE src.
  // On mobile Safari, React sometimes sets the src attribute before crossorigin,
  // causing the browser to start a non-CORS load. That taints the canvas and
  // the image is unusable for capture. Reloading from the clone (in a
  // position:fixed element) with crossOrigin first guarantees a CORS-clean load.
  const cloneImgs = Array.from(clone.querySelectorAll<HTMLImageElement>("img"));
  await Promise.all(
    cloneImgs.map(img => {
      const src = img.getAttribute("src") || "";
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
      return new Promise<void>(resolve => {
        img.removeAttribute("crossorigin");
        img.crossOrigin = "anonymous"; // ← must be set BEFORE src
        img.onload  = () => resolve();
        img.onerror = () => resolve();
        img.src = ""; // reset so the browser treats next assignment as new load
        img.src = src;
        setTimeout(resolve, 10_000);
      });
    })
  );

  // Extract each loaded image as a data URL via canvas.
  const dataUrls = await Promise.all(
    cloneImgs.map(async img => {
      // Canvas draw — works because we just forced a CORS-safe load above.
      if (img.complete && img.naturalWidth > 0) {
        try {
          const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
          const c = document.createElement("canvas");
          c.width  = Math.round(img.naturalWidth  * scale);
          c.height = Math.round(img.naturalHeight * scale);
          c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
          const dataUrl = c.toDataURL("image/jpeg", 0.92);
          if (dataUrl.length > 100) return dataUrl;
        } catch { /* canvas still tainted — fall to fetch */ }
      }

      // Fetch fallback via proxy (catches images that failed to load above).
      const src = img.getAttribute("src") || "";
      if (!src) return null;
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

  // Swap in data URLs (remove crossorigin so html-to-image won't re-fetch).
  cloneImgs.forEach((img, i) => {
    if (dataUrls[i]) {
      img.removeAttribute("crossorigin");
      img.src = dataUrls[i]!;
    } else {
      img.style.visibility = "hidden";
    }
  });
  void wrapper.offsetHeight;

  // Bake aspect-ratio → explicit px height so html-to-image's SVG foreignObject
  // can render them (SVG does not evaluate CSS aspect-ratio, so containers get 0 height).
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
  void wrapper.offsetHeight; // reflow after baking heights

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
