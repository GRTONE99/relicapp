import { useState, useRef, useCallback, useEffect } from "react";
import { useCollection, CollectionItem } from "@/context/CollectionContext";
import { supabase } from "@/integrations/supabase/client";
import { toPng } from "html-to-image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import {
  Package,
  User,
  Clock,
  Share2,
  Download,
} from "lucide-react";

// Social icons
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

interface ShareCardPreviewProps {
  type: "item" | "collection" | "profile" | "recent";
  item?: CollectionItem;
  items?: CollectionItem[];
  totalValue?: number;
  itemCount?: number;
  displayName?: string;
  collectionName?: string;
}

function ShareCardPreview({ type, item, items, totalValue, itemCount, displayName = "Collector", collectionName = "My Roster" }: ShareCardPreviewProps) {
  if (type === "item" && item) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden max-w-sm mx-auto">
        {item.images[0] && (
          <div className="aspect-[4/3] overflow-hidden bg-secondary">
            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
          </div>
        )}
        <div className="p-5 space-y-3">
          <div>
            <h3 className="font-bold text-lg">{item.player || item.name}</h3>
            <p className="text-sm text-muted-foreground">{item.name}</p>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Estimated Value</p>
            <p className="text-2xl font-bold mono text-primary">${item.estimatedValue.toLocaleString()}</p>
          </div>
          <div className="border-t pt-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">From <span className="font-medium text-foreground">{collectionName}</span></p>
            <p className="text-xs text-muted-foreground">Tracked on <a href="https://relicroster.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Relic Roster</a></p>
          </div>
        </div>
      </div>
    );
  }

  if (type === "collection") {
    const displayItems = (items || []).slice(0, 4);
    return (
      <div className="rounded-xl border bg-card overflow-hidden max-w-sm mx-auto">
        <div className="grid grid-cols-2 gap-0.5 bg-secondary">
          {displayItems.map((it) => (
            <div key={it.id} className="aspect-square overflow-hidden">
              <img src={it.images[0]} alt={it.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
            </div>
          ))}
        </div>
        <div className="p-5 space-y-3">
          <h3 className="font-bold text-lg">{collectionName}</h3>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Items</p>
              <p className="text-xl font-bold mono">{itemCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Value</p>
              <p className="text-xl font-bold mono text-primary">${totalValue?.toLocaleString()}</p>
            </div>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground">Tracked on <a href="https://relicroster.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Relic Roster</a></p>
          </div>
        </div>
      </div>
    );
  }

  if (type === "profile") {
    return (
      <div className="rounded-xl border bg-card overflow-hidden max-w-sm mx-auto">
        <div className="p-6 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <span className="text-3xl font-bold text-primary">{displayName?.[0]?.toUpperCase() || "?"}</span>
          </div>
          <div>
            <h3 className="font-bold text-xl">{displayName}</h3>
            <p className="text-sm text-muted-foreground">Sports memorabilia collector</p>
          </div>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-xl font-bold mono">{itemCount}</p>
              <p className="text-xs text-muted-foreground">Items</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold mono text-primary">${totalValue?.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Value</p>
            </div>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground">Tracked on <a href="https://relicroster.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Relic Roster</a></p>
          </div>
        </div>
      </div>
    );
  }

  // Recent additions
  const recentItems = (items || []).slice(0, 3);
  return (
    <div className="rounded-xl border bg-card overflow-hidden max-w-sm mx-auto">
      <div className="p-5 pb-3">
        <h3 className="font-bold text-lg">Recent Additions</h3>
        <p className="text-xs text-muted-foreground">{collectionName}</p>
      </div>
      <div className="space-y-0">
        {recentItems.map((it) => (
          <div key={it.id} className="flex items-center gap-3 px-5 py-3 border-t">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
              <img src={it.images[0]} alt={it.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{it.name}</p>
              <p className="text-xs text-muted-foreground">{it.player}</p>
            </div>
            <p className="text-sm font-bold mono text-primary">${it.estimatedValue.toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground">Tracked on <a href="https://relicroster.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Relic Roster</a></p>
      </div>
    </div>
  );
}

interface ShareButtonsProps {
  cardRef: React.RefObject<HTMLDivElement>;
}

async function copyImageToClipboardFromBlob(blob: Blob): Promise<boolean> {
  try {
    // Some browsers require the blob to be passed as a Promise
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
    return true;
  } catch {
    // Fallback: try converting to a new blob to ensure correct type
    try {
      const pngBlob = new Blob([await blob.arrayBuffer()], { type: "image/png" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": pngBlob,
        }),
      ]);
      return true;
    } catch (e) {
      console.error("Clipboard write failed:", e);
      return false;
    }
  }
}

// Convert a remote image URL to a base64 data URL.
// Cache-bust the URL so the browser doesn't serve a previously-cached response
// that was stored without CORS headers (img tags loaded without crossOrigin="anonymous"
// poison the browser cache — a CORS fetch against that cache entry fails).
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
    // Pre-inline all <img> srcs as data URLs so toPng sees same-origin images.
    // html-to-image silently replaces failed image fetches with an empty string;
    // pre-fetching ourselves (with cache-busting) avoids that silent failure.
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
          // Wait for the browser to paint the new src before capture
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
      // Fallback: if any img still has a remote src (pre-fetch failed),
      // tell html-to-image to fetch it with CORS mode.
      fetchRequestInit: { mode: "cors", credentials: "omit" },
    });

    // Restore original srcs so the page UI is unchanged after capture
    originals.forEach((src, img) => { img.src = src; });

    const res = await fetch(dataUrl);
    return await res.blob();
  } catch (err) {
    console.error("Failed to capture share card:", err);
    return null;
  }
}

function ShareButtons({ cardRef }: ShareButtonsProps) {
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
export default function SharePage() {
  const { items, getTotalValue, user } = useCollection();
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || "");
  const selectedItem = items.find((i) => i.id === selectedItemId);
  const totalValue = getTotalValue();
  const [displayName, setDisplayName] = useState("Collector");
  const collectionName = `${displayName}'s Roster`;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
  }, [user]);

  const itemCardRef = useRef<HTMLDivElement>(null);
  const collectionCardRef = useRef<HTMLDivElement>(null);
  const profileCardRef = useRef<HTMLDivElement>(null);
  const recentCardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="container max-w-3xl py-6 pb-24 md:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Share</h1>
        <p className="text-sm text-muted-foreground mt-1">Show off your roster across social media</p>
      </div>

      <Tabs defaultValue="item" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="item" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Package className="w-4 h-4 hidden sm:block" />
            Item
          </TabsTrigger>
          <TabsTrigger value="collection" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Share2 className="w-4 h-4 hidden sm:block" />
            Roster
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <User className="w-4 h-4 hidden sm:block" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Clock className="w-4 h-4 hidden sm:block" />
            Recent
          </TabsTrigger>
        </TabsList>

        {/* Share Item */}
        <TabsContent value="item" className="space-y-6">
          {items.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Select an item to share</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedItemId === item.id ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedItem && (
            <>
              <div ref={itemCardRef}>
                <ShareCardPreview type="item" item={selectedItem} collectionName={collectionName} displayName={displayName} />
              </div>
              <ShareButtons cardRef={itemCardRef} />
            </>
          )}
          {items.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Add items to your roster to share them.</p>
          )}
        </TabsContent>

        {/* Share Roster */}
        <TabsContent value="collection" className="space-y-6">
          <div ref={collectionCardRef}>
            <ShareCardPreview type="collection" items={items} totalValue={totalValue} itemCount={items.length} collectionName={collectionName} displayName={displayName} />
          </div>
          <ShareButtons cardRef={collectionCardRef} />
        </TabsContent>

        {/* Share Profile */}
        <TabsContent value="profile" className="space-y-6">
          <div ref={profileCardRef}>
            <ShareCardPreview type="profile" totalValue={totalValue} itemCount={items.length} displayName={displayName} collectionName={collectionName} />
          </div>
          <ShareButtons cardRef={profileCardRef} />
        </TabsContent>

        {/* Recent Additions */}
        <TabsContent value="recent" className="space-y-6">
          <div ref={recentCardRef}>
            <ShareCardPreview type="recent" items={items} collectionName={collectionName} displayName={displayName} />
          </div>
          <ShareButtons cardRef={recentCardRef} />
        </TabsContent>
      </Tabs>
    </div>
  );
}