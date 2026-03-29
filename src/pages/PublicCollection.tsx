import { useCollection } from "@/context/CollectionContext";
import { ItemCard } from "@/components/ItemCard";
import { Package, DollarSign } from "lucide-react";

export default function PublicCollection() {
  const { items, getTotalValue } = useCollection();
  return (
    <div className="container max-w-6xl py-6 pb-24 md:pb-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <span className="text-2xl font-bold text-primary">S</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scott's Roster</h1>
          <p className="text-muted-foreground text-sm mt-1">Sports memorabilia & cards</p>
        </div>
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="font-bold mono">${getTotalValue().toLocaleString()}</span>
            <span className="text-muted-foreground text-sm">value</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span className="font-bold">{items.length}</span>
            <span className="text-muted-foreground text-sm">items</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
