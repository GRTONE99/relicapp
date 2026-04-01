import { useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Download, Loader2 } from "lucide-react";

async function captureCardAsBlob(cardRef: React.RefObject<HTMLDivElement>): Promise<Blob | null> {
  if (!cardRef.current) return null;

  // All images in the card use proxyUrl() which serves them from
  // the Supabase edge function with Access-Control-Allow-Origin: *.
  // Passing fetchRequestInit lets html-to-image fetch those URLs with
  // CORS so it can inline them into the canvas without taint errors.
  try {
    const dataUrl = await toPng(cardRef.current, {
      pixelRatio: 2,
      fetchRequestInit: { mode: "cors", credentials: "omit" },
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch (err) {
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Image saved!");
    } catch {
      toast.error("Could not save image. Check browser console for details.");
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
