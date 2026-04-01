import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useCollection } from "@/context/CollectionContext";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ShareCardPreview } from "@/components/share/ShareCardPreview";
import { ShareButtons } from "@/components/share/ShareButtons";
import { Package, User, Clock, Share2, Link } from "lucide-react";
import { toast } from "sonner";

export default function SharePage() {
  const { items, getTotalValue, profile } = useCollection();
  const location = useLocation();
  const preselectedId = (location.state as { itemId?: string } | null)?.itemId;

  const [selectedItemId, setSelectedItemId] = useState<string>(preselectedId || items[0]?.id || "");
  const selectedItem = items.find((i) => i.id === selectedItemId);
  const totalValue = getTotalValue();
  const displayName = profile?.display_name || "Collector";
  const collectionName = `${displayName}'s Roster`;

  // Computed captions
  const computedItemCaption = selectedItem
    ? [
        selectedItem.player || selectedItem.name,
        selectedItem.year,
        selectedItem.gradingCompany && selectedItem.grade
          ? `${selectedItem.gradingCompany.toUpperCase()} ${selectedItem.grade}`
          : selectedItem.condition,
        selectedItem.estimatedValue ? `Est. $${selectedItem.estimatedValue.toLocaleString()}` : "",
        `— ${collectionName} on Relic Roster https://relicroster.com`,
      ].filter(Boolean).join(" · ")
    : "";

  const computedRosterCaption = `${collectionName}: ${items.length} items worth $${totalValue.toLocaleString()} — tracked on Relic Roster https://relicroster.com`;
  const computedProfileCaption = profile?.username
    ? `Follow ${displayName}'s sports collectibles on Relic Roster: https://relicroster.com/u/${profile.username}`
    : `Check out ${displayName}'s sports collectibles on Relic Roster! 🏆 https://relicroster.com`;
  const computedRecentCaption = `Just added to ${collectionName} on Relic Roster! 🏆 https://relicroster.com`;

  const [itemCaption, setItemCaption] = useState(computedItemCaption);
  const [rosterCaption, setRosterCaption] = useState(computedRosterCaption);
  const [profileCaption, setProfileCaption] = useState(computedProfileCaption);
  const [recentCaption, setRecentCaption] = useState(computedRecentCaption);

  // Update item caption when selected item changes
  useEffect(() => {
    setItemCaption(computedItemCaption);
  }, [selectedItemId]); // eslint-disable-line react-hooks/exhaustive-deps

  const itemCardRef = useRef<HTMLDivElement>(null);
  const collectionCardRef = useRef<HTMLDivElement>(null);
  const profileCardRef = useRef<HTMLDivElement>(null);
  const recentCardRef = useRef<HTMLDivElement>(null);

  const copyProfileLink = () => {
    if (!profile?.username) return;
    navigator.clipboard.writeText(`https://relicroster.com/u/${profile.username}`);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="container max-w-3xl py-6 pb-24 md:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Share</h1>
        <p className="text-sm text-muted-foreground mt-1">Show off your roster across social media</p>
      </div>

      <Tabs defaultValue={preselectedId ? "item" : "item"} className="space-y-6">
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
              <div className="space-y-1">
                <label className="text-sm font-medium">Caption</label>
                <Textarea value={itemCaption} onChange={(e) => setItemCaption(e.target.value)} rows={3} className="text-sm resize-none" placeholder="Add a caption for your post..." />
              </div>
              <ShareButtons cardRef={itemCardRef} caption={itemCaption} />
            </>
          )}
          {items.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Add items to your roster to share them.</p>
          )}
        </TabsContent>

        {/* Share Roster */}
        <TabsContent value="collection" className="space-y-4">
          <div ref={collectionCardRef}>
            <ShareCardPreview type="collection" items={items} totalValue={totalValue} itemCount={items.length} collectionName={collectionName} displayName={displayName} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Caption</label>
            <Textarea value={rosterCaption} onChange={(e) => setRosterCaption(e.target.value)} rows={3} className="text-sm resize-none" placeholder="Add a caption for your post..." />
          </div>
          <ShareButtons cardRef={collectionCardRef} caption={rosterCaption} />
        </TabsContent>

        {/* Share Profile */}
        <TabsContent value="profile" className="space-y-4">
          {profile?.username && (
            <Button variant="outline" className="w-full" onClick={copyProfileLink}>
              <Link className="w-4 h-4 mr-2" />
              Copy shareable link — relicroster.com/u/{profile.username}
            </Button>
          )}
          <div ref={profileCardRef}>
            <ShareCardPreview type="profile" totalValue={totalValue} itemCount={items.length} displayName={displayName} collectionName={collectionName} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Caption</label>
            <Textarea value={profileCaption} onChange={(e) => setProfileCaption(e.target.value)} rows={3} className="text-sm resize-none" placeholder="Add a caption for your post..." />
          </div>
          <ShareButtons cardRef={profileCardRef} caption={profileCaption} />
        </TabsContent>

        {/* Recent Additions */}
        <TabsContent value="recent" className="space-y-4">
          <div ref={recentCardRef}>
            <ShareCardPreview type="recent" items={items} collectionName={collectionName} displayName={displayName} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Caption</label>
            <Textarea value={recentCaption} onChange={(e) => setRecentCaption(e.target.value)} rows={3} className="text-sm resize-none" placeholder="Add a caption for your post..." />
          </div>
          <ShareButtons cardRef={recentCardRef} caption={recentCaption} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
