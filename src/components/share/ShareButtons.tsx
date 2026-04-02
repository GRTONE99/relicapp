import { useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Download, Loader2 } from "lucide-react";

// Extract the original image URL from a proxy URL, or return src unchanged.
function originalSrc(src: string): string {
  try {
    const encoded = new URL(src).searchParams.get("url");
    if (encoded) return decodeURIComponent(encoded);
  } catch { /* not a proxy URL */ }
  return src;
}

async function fetchAsDataUrl(url: string): Promise<string> {
  const sep = url.includes("?") ? "&" : "?";
  const res = await fetch(url + sep + "_cb=" + Date.now(), {
    mode: "cors",
    credentials: "omit",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function imgToDataUrl(img: HTMLImageElement): Promise<string | null> {
  const proxied = img.getAttribute("src") || "";
  if (!proxied || proxied.startsWith("data:") || proxied.startsWith("blob:")) return null;

  const direct = originalSrc(proxied);

  // 1. Canvas draw from the already-loaded DOM image (zero network).
  if (img.complete && img.naturalWidth > 0) {
    try {
      const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const dataUrl = c.toDataURL("image/jpeg", 0.92);
      if (dataUrl && dataUrl.length > 100) return dataUrl;
    } catch { /* canvas tainted — fall through */ }
  }

  // 2. Fetch the original URL directly (R2 / Supabase Storage have CORS for
  //    this domain). Bypasses the proxy for one less network hop.
  if (direct !== proxied) {
    try { return await fetchAsDataUrl(direct); } catch { /* fall through */ }
  }

  // 3. Fetch via the proxy as a final fallback.
  try { return await fetchAsDataUrl(proxied); } catch { /* fall through */ }

  console.warn("[share] all methods failed for:", proxied.substring(0, 80));
  return null;
}

async function captureCardAsBlob(cardRef: React.RefObject<HTMLDivElement>): Promise<Blob | null> {
  if (!cardRef.current) return null;
  const card = cardRef.current;
  const { width, height } = card.getBoundingClientRect();

  const liveImgs = Array.from(card.querySelectorAll<HTMLImageElement>("img"));

  // Wait for any images that are still fetching from the proxy.
  await Promise.all(
    liveImgs.map(img =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>(resolve => {
            img.addEventListener("load",  () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
            setTimeout(resolve, 10_000);
          })
    )
  );

  // Build data URLs for every image.
  const dataUrls = await Promise.all(liveImgs.map(imgToDataUrl));

  // Clone into a fixed-position invisible overlay so that CSS layout
  // (aspect-ratio, flex, etc.) computes correctly on mobile Safari.
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
  void wrapper.offsetHeight;

  const cloneImgs = Array.from(clone.querySelectorAll<HTMLImageElement>("img"));
  cloneImgs.forEach((img, i) => {
    if (dataUrls[i]) {
      img.removeAttribute("crossorigin");
      img.src = dataUrls[i]!;
    } else {
      img.style.visibility = "hidden";
    }
  });
  void wrapper.offsetHeight;

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
