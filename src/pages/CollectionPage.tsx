import { useState, useMemo, useEffect } from "react";
import { ItemCard } from "@/components/ItemCard";
import { useCollection } from "@/context/CollectionContext";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const SPORT_LABELS: Record<string, string> = {
  baseball: "Baseball", basketball: "Basketball", boxing: "Boxing",
  football: "Football", golf: "Golf", hockey: "Hockey",
  mma: "MMA", motorsports: "Motorsports", soccer: "Soccer", tennis: "Tennis",
};

const CATEGORY_LABELS: Record<string, string> = {
  cards: "Cards", "jerseys-apparel": "Jerseys and Apparel",
  "balls-pucks": "Balls and Pucks", equipment: "Equipment", footwear: "Footwear",
  autographs: "Autographs", "photos-posters": "Photos and Posters",
  "tickets-programs": "Tickets and Programs", "championship-items": "Championship Items",
  "game-used": "Game-Used Artifacts", documents: "Documents", "promotional-items": "Promotional Items",
};

const ITEMS_PER_PAGE = 50;

export default function CollectionPage() {
  const { items, getTotalValue } = useCollection();
  const [search, setSearch] = useState("");
  const [rosterFilter, setRosterFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const sports = useMemo(
    () => [...new Set(items.map((i) => i.sport).filter(Boolean))],
    [items]
  );

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category).filter(Boolean))],
    [items]
  );

  const allTags = useMemo(
    () => [...new Set(items.flatMap((i) => i.tags))].sort(),
    [items]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(q) ||
        item.player.toLowerCase().includes(q);
      const matchSport = rosterFilter === "all" || item.sport === rosterFilter;
      const matchCat = categoryFilter === "all" || item.category === categoryFilter;
      const matchTag = tagFilter === "all" || item.tags.includes(tagFilter);
      return matchSearch && matchSport && matchCat && matchTag;
    });
  }, [items, search, rosterFilter, categoryFilter, tagFilter]);

  // Reset to first page whenever filters or search change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [search, rosterFilter, categoryFilter, tagFilter]);

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div className="container max-w-7xl py-6 pb-24 md:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Roster</h1>
        <p className="text-muted-foreground text-sm">
          {items.length} items · ${getTotalValue().toLocaleString()} total value
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={rosterFilter} onValueChange={setRosterFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Roster" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rosters</SelectItem>
            {sports.map((s) => <SelectItem key={s} value={s}>{SPORT_LABELS[s] || s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c] || c}</SelectItem>)}
          </SelectContent>
        </Select>
        {allTags.length > 0 && (
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Tag" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {visibleItems.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">No items match your filters.</div>
      )}
      {hasMore && (
        <div className="text-center pt-2">
          <button
            onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Show more ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
