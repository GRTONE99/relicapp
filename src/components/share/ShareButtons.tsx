import { useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Download, MessageSquare, Loader2 } from "lucide-react";

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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
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
  caption?: string;
}

export function ShareButtons({ cardRef, caption }: ShareButtonsProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  const defaultCaption = caption || "Check out my sports collectibles roster on Relic Roster! 🏆";
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
    const siteUrl = "https://relicroster.com";
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(defaultCaption)}&url=${encodeURIComponent(siteUrl)}`;
    try {
      if (isMobile() && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "My Relic Roster", text: defaultCaption, files: [file] });
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
        await navigator.share({ title: "My Relic Roster", text: defaultCaption, files: [file] });
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

  const shareToWhatsApp = async () => {
    const text = `${defaultCaption} https://relicroster.com`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const shareViaSMS = async () => {
    const text = `${defaultCaption} https://relicroster.com`;
    window.location.href = `sms:?body=${encodeURIComponent(text)}`;
  };

  const shareTargets = [
    { name: "Facebook",  icon: <FacebookIcon className="w-5 h-5" />,  action: shareToFacebook, capture: true },
    { name: "X",         icon: <XIcon className="w-5 h-5" />,          action: shareToX,        capture: true },
    { name: "Instagram", icon: <InstagramIcon className="w-5 h-5" />, action: shareToInstagram, capture: true },
    { name: "WhatsApp",  icon: <WhatsAppIcon className="w-5 h-5" />,  action: shareToWhatsApp,  capture: false },
    { name: "SMS",       icon: <MessageSquare className="w-5 h-5" />, action: shareViaSMS,       capture: false },
    { name: "Save",      icon: <Download className="w-5 h-5" />,       action: handleDownload,   capture: true },
  ];

  return (
    <div className="flex justify-center gap-2 flex-wrap">
      {shareTargets.map((target) => (
        <Button
          key={target.name}
          variant="outline"
          className="h-auto py-3 px-4 flex flex-col items-center gap-2 min-w-[72px]"
          disabled={target.capture && isCapturing}
          onClick={target.action}
        >
          {target.capture && isCapturing
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : target.icon
          }
          <span className="text-xs font-medium">
            {target.capture && isCapturing ? "..." : target.name}
          </span>
        </Button>
      ))}
    </div>
  );
}
