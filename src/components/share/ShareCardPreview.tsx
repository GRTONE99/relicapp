import type { CollectionItem } from "@/context/CollectionContext";

export interface ShareCardPreviewProps {
  type: "item" | "collection" | "profile" | "recent";
  item?: CollectionItem;
  items?: CollectionItem[];
  totalValue?: number;
  itemCount?: number;
  displayName?: string;
  collectionName?: string;
}

export function ShareCardPreview({
  type,
  item,
  items,
  totalValue,
  itemCount,
  displayName = "Collector",
  collectionName = "My Roster",
}: ShareCardPreviewProps) {
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
