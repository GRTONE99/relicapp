import { useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Download } from "lucide-react";

// ─── Social icons ─────────────────────────────────────────────────────────────

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

// ─── Capture utilities ────────────────────────────────────────────────────────

async function copyImageToClipboardFromBlob(blob: Blob): Promise<boolean> {
  try {
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    return true;
  } catch {
    try {
      const pngBlob = new Blob([await blob.arrayBuffer()], { type: "image/png" });
      await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
      return true;
    } catch (e) {
      console.error("Clipboard write failed:", e);
      return false;
    }
  }
}

// Convert a remote image URL to a base64 data URL, cache-busting to avoid
// previously-cached responses that were stored without CORS headers.
async function toDataUrl(src: string): Promise<string> {
  const url = src + (src.includes("?") ? "&" : "?") + "_cb=" + Date.now();
  const res = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function captureCardAsBlob(cardRef: React.RefObject<HTMLDivElement>): Promise<Blob | null> {
  if (!cardRef.current) return null;
  try {
    const imgs = Array.from(cardRef.current.querySelectorAll<HTMLImageElement>("img"));
    const originals = new Map<HTMLImageElement, string>();
    await Promise.all(
      imgs.map(async (img) => {
        const src = img.getAttribute("src") || "";
        if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
        try {
          const dataUrl = await toDataUrl(src);
          originals.set(img, src);
          img.src = dataUrl;
          await new Promise<void>((resolve) => {
            if (img.complete) { resolve(); return; }
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        } catch (e) {
          console.warn("Share: could not inline image", src, e);
        }
      }),
    );

    const dataUrl = await toPng(cardRef.current, {
      pixelRatio: 2,
      cacheBust: true,
      skipAutoScale: true,
      fetchRequestInit: { mode: "cors", credentials: "omit" },
    });

    originals.forEach((src, img) => { img.src = src; });

    const res = await fetch(dataUrl);
    return await res.blob();
  } catch (err) {
    console.error("Failed to capture share card:", err);
    return null;
  }
}

// ─── ShareButtons component ───────────────────────────────────────────────────

interface ShareButtonsProps {
  cardRef: React.RefObject<HTMLDivElement>;
}

export function ShareButtons({ cardRef }: ShareButtonsProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const captureBlob = useCallback(async (): Promise<Blob | null> => {
    const blob = await captureCardAsBlob(cardRef);
    if (!blob) toast.error("Could not capture image.");
    return blob;
  }, [cardRef]);

  const downloadBlob = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relic-roster-share.png";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const withCapture = useCallback(
    (fn: (blob: Blob, file: File) => Promise<void>) =>
      async () => {
        setIsCapturing(true);
        try {
          const blob = await captureBlob();
          if (!blob) return;
          const file = new File([blob], "relic-roster-share.png", { type: "image/png" });
          await fn(blob, file);
        } finally {
          setIsCapturing(false);
        }
      },
    [captureBlob],
  );

  const shareToX = withCapture(async (blob, file) => {
    const text = "Check out my sports collectibles roster on Relic Roster! 🏆";
    const siteUrl = "https://relicroster.com";
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(siteUrl)}`;
    try {
      if (isMobile() && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "My Relic Roster", text, files: [file] });
      } else {
        downloadBlob(blob);
        window.open(twitterUrl, "_blank", "noopener,noreferrer,width=550,height=450");
        toast.success("Image saved — attach it to your post in X.");
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== "AbortError") {
        downloadBlob(blob);
        window.open(twitterUrl, "_blank", "noopener,noreferrer,width=550,height=450");
        toast.success("Image saved — attach it to your post in X.");
      }
    }
  });

  const shareToFacebook = withCapture(async (blob, file) => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://relicroster.com")}`;
    try {
      if (isMobile() && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "My Relic Roster", text: "Check out my sports collectibles!", files: [file] });
      } else {
        downloadBlob(blob);
        window.open(fbUrl, "_blank", "noopener,noreferrer,width=626,height=436");
        toast.success("Image saved — attach it to your Facebook post.");
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== "AbortError") {
        downloadBlob(blob);
        window.open(fbUrl, "_blank", "noopener,noreferrer,width=626,height=436");
        toast.success("Image saved — attach it to your Facebook post.");
      }
    }
  });

  const shareToInstagram = withCapture(async (blob, file) => {
    try {
      if (isMobile() && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "My Relic Roster", files: [file] });
      } else {
        downloadBlob(blob);
        toast.success("Image saved — open Instagram on your phone to share.");
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== "AbortError") {
        downloadBlob(blob);
        toast.success("Image saved — open Instagram on your phone to share.");
      }
    }
  });

  const handleDownload = withCapture(async (blob) => {
    downloadBlob(blob);
    toast.success("Image downloaded!");
  });

  const shareTargets = [
    { name: "Facebook",  icon: <FacebookIcon className="w-5 h-5" />,  action: shareToFacebook },
    { name: "X",         icon: <XIcon className="w-5 h-5" />,          action: shareToX },
    { name: "Instagram", icon: <InstagramIcon className="w-5 h-5" />, action: shareToInstagram },
    { name: "Save",      icon: <Download className="w-5 h-5" />,       action: handleDownload },
  ];

  return (
    <div className="flex justify-center gap-2 flex-wrap">
      {shareTargets.map((target) => (
        <Button
          key={target.name}
          variant="outline"
          className="h-auto py-3 px-4 flex flex-col items-center gap-2 min-w-[80px]"
          disabled={isCapturing}
          onClick={target.action}
        >
          {target.icon}
          <span className="text-xs font-medium">{target.name}</span>
        </Button>
      ))}
    </div>
  );
}
