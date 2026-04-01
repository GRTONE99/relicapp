import { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useCollection } from "@/context/CollectionContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShareCardPreview } from "@/components/share/ShareCardPreview";
import { ShareButtons } from "@/components/share/ShareButtons";
import { Package, User, Clock, Share2 } from "lucide-react";

function slug(...parts: (string | undefined | null)[]) {
  return parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "relic-roster";
}

export default function SharePage() {
  const { items, getTotalValue, profile } = useCollection();
  const location = useLocation();
  const preselectedId = (location.state as { itemId?: string } | null)?.itemId;

  const [selectedItemId, setSelectedItemId] = useState<string>(preselectedId || items[0]?.id || "");
  const selectedItem = items.find((i) => i.id === selectedItemId);
  const totalValue = getTotalValue();
  const displayName = profile?.display_name || "Collector";
  const collectionName = `${displayName}'s Roster`;

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
            <Package className="w-4 h-4 hidden sm:block" />Item
          </TabsTrigger>
          <TabsTrigger value="collection" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Share2 className="w-4 h-4 hidden sm:block" />Roster
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <User className="w-4 h-4 hidden sm:block" />Profile
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Clock className="w-4 h-4 hidden sm:block" />Recent
          </TabsTrigger>
        </TabsList>

        {/* Share Item */}
        <TabsContent value="item" className="space-y-4">
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
                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedItem && (
            <>
              <div ref={itemCardRef}>
                <ShareCardPreview type="item" item={selectedItem} collectionName={collectionName} displayName={displayName} username={profile?.username} />
              </div>
              <ShareButtons cardRef={itemCardRef} filename={slug(selectedItem?.player || selectedItem?.name, selectedItem?.year, selectedItem?.gradingCompany, selectedItem?.grade)} />
            </>
          )}
          {items.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Add items to your roster to share them.</p>
          )}
        </TabsContent>

        {/* Share Roster */}
        <TabsContent value="collection" className="space-y-4">
          <div ref={collectionCardRef}>
            <ShareCardPreview type="collection" items={items} totalValue={totalValue} itemCount={items.length} collectionName={collectionName} displayName={displayName} username={profile?.username} />
          </div>
          <ShareButtons cardRef={collectionCardRef} filename={slug(displayName, "roster")} />
        </TabsContent>

        {/* Share Profile */}
        <TabsContent value="profile" className="space-y-4">
          <div ref={profileCardRef}>
            <ShareCardPreview type="profile" totalValue={totalValue} itemCount={items.length} displayName={displayName} collectionName={collectionName} username={profile?.username} avatarUrl={profile?.avatar_url} />
          </div>
          <ShareButtons cardRef={profileCardRef} filename={slug(displayName, "profile")} />
        </TabsContent>

        {/* Recent Additions */}
        <TabsContent value="recent" className="space-y-4">
          <div ref={recentCardRef}>
            <ShareCardPreview type="recent" items={items} collectionName={collectionName} displayName={displayName} username={profile?.username} />
          </div>
          <ShareButtons cardRef={recentCardRef} filename={slug(displayName, "recent-additions")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
