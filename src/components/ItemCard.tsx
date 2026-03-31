import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { CollectionItem } from "@/context/CollectionContext";

interface ItemCardProps {
  item: CollectionItem;
}

export function ItemCard({ item }: ItemCardProps) {
  const gain = item.estimatedValue - item.purchasePrice;
  const gainPercent = item.purchasePrice > 0 ? ((gain / item.purchasePrice) * 100).toFixed(1) : "0.0";

  return (
    <Link to={`/item/${item.id}`}>
      <Card className="overflow-hidden card-hover group cursor-pointer">
        <div className="aspect-[3/4] overflow-hidden bg-secondary">
          <img
            src={item.images[0]}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-4 space-y-1.5">
          <p className="font-semibold text-sm truncate">{item.name}</p>
          {item.player && <p className="text-xs text-muted-foreground">{item.player} · {item.year}</p>}
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-bold mono text-lg">${item.estimatedValue.toLocaleString()}</span>
            <span className={`text-xs font-medium mono ${gain >= 0 ? "text-gain" : "text-loss"}`}>
              {gain >= 0 ? "+" : ""}{gainPercent}%
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
