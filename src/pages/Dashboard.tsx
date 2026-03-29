import { lazy, Suspense, useMemo } from "react";
import { InitialLoadingScreen } from "@/components/InitialLoadingScreen";
import { DollarSign, Package, TrendingUp, Trophy } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { ItemCard } from "@/components/ItemCard";
import { useCollection } from "@/context/CollectionContext";
import { CATEGORY_LABELS } from "@/lib/constants";

// Deferred: the vendor-charts chunk (411 KB) only loads once this component renders.
const DashboardCharts = lazy(() => import("@/components/DashboardCharts"));

const CATEGORY_COLORS = [
  "hsl(43 96% 56%)", "hsl(200 80% 55%)", "hsl(150 60% 45%)",
  "hsl(280 60% 55%)", "hsl(10 80% 55%)", "hsl(180 50% 50%)",
];

// Skeleton shown while the charts chunk is downloading.
function ChartsSkeleton() {
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 h-64 rounded-xl bg-muted animate-pulse" />
      <div className="h-64 rounded-xl bg-muted animate-pulse" />
    </div>
  );
}

export default function Dashboard() {
  const { items, itemsLoading, getTotalValue, getTotalCost, getTotalGain, getTopAsset } = useCollection();

  const portfolioHistory = useMemo(() => {
    if (items.length === 0) return [];
    const sorted = [...items].sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());
    let cumulative = 0;
    return sorted.map((item) => {
      cumulative += item.estimatedValue;
      const d = new Date(item.createdDate);
      return {
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: cumulative,
        itemName: item.name,
        itemValue: item.estimatedValue,
      };
    });
  }, [items]);

  const categoryBreakdown = useMemo(() => {
    const catMap = new Map<string, number>();
    for (const item of items) {
      const cat = item.category || "Uncategorized";
      const label = CATEGORY_LABELS[cat] || cat;
      catMap.set(label, (catMap.get(label) || 0) + item.estimatedValue);
    }
    return Array.from(catMap.entries()).map(([name, value], i) => ({
      name, value, fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));
  }, [items]);

  const recentItems = useMemo(
    () => [...items]
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
      .slice(0, 4),
    [items],
  );

  if (itemsLoading) {
    return <InitialLoadingScreen />;
  }

  const totalValue = getTotalValue();
  const totalGain = getTotalGain();
  const totalCost = getTotalCost();
  const gainPercent = totalCost > 0 ? ((totalGain / totalCost) * 100).toFixed(1) : "0.0";
  const topAsset = getTopAsset();

  return (
    <div className="container max-w-7xl py-6 pb-24 md:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground text-sm">Your roster at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Value" value={`$${totalValue.toLocaleString()}`} icon={DollarSign} trend="up" trendValue={`${gainPercent}%`} subtitle="all time" />
        <StatCard title="Items" value={items.length.toString()} icon={Package} />
        <StatCard title="Total Gain" value={`$${totalGain.toLocaleString()}`} icon={TrendingUp} trend={totalGain >= 0 ? "up" : "down"} trendValue={`$${Math.abs(totalGain).toLocaleString()}`} />
        <StatCard title="Top Asset" value={topAsset ? `$${topAsset.estimatedValue.toLocaleString()}` : "—"} icon={Trophy} subtitle={topAsset?.name} />
      </div>

      <Suspense fallback={<ChartsSkeleton />}>
        <DashboardCharts portfolioHistory={portfolioHistory} categoryBreakdown={categoryBreakdown} />
      </Suspense>

      <div>
        <h2 className="text-lg font-semibold mb-4">Recently Added</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {recentItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
