import { useMemo } from "react";
import { DollarSign, Package, TrendingUp, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { ItemCard } from "@/components/ItemCard";
import { useCollection } from "@/context/CollectionContext";
import { CATEGORY_LABELS } from "@/lib/constants";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CATEGORY_COLORS = [
  "hsl(43 96% 56%)", "hsl(200 80% 55%)", "hsl(150 60% 45%)",
  "hsl(280 60% 55%)", "hsl(10 80% 55%)", "hsl(180 50% 50%)",
];

export default function Dashboard() {
  const { items, itemsLoading, getTotalValue, getTotalCost, getTotalGain, getTopAsset } = useCollection();

  const portfolioHistory = useMemo(() => {
    if (items.length === 0) return [];
    const sorted = [...items].sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());
    let cumulative = 0;
    return sorted.map((item) => {
      cumulative += item.estimatedValue;
      const d = new Date(item.createdDate);
      const label = `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      return { date: label, value: cumulative, itemName: item.name, itemValue: item.estimatedValue };
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

  if (itemsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-24 h-1 rounded-full bg-muted overflow-hidden">
            <div className="absolute h-full w-10 rounded-full bg-primary animate-[shimmer_1.2s_ease-in-out_infinite]" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading up your roster</p>
        </div>
      </div>
    );
  }

  const totalValue = getTotalValue();
  const totalGain = getTotalGain();
  const totalCost = getTotalCost();
  const gainPercent = totalCost > 0 ? ((totalGain / totalCost) * 100).toFixed(1) : "0.0";
  const topAsset = getTopAsset();
  const recentItems = [...items].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()).slice(0, 4);

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

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Roster Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioHistory}>
                  <defs>
                    <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(43 96% 56%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(43 96% 56%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 18%)" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(215 15% 50%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215 15% 50%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(220 18% 10%)", border: "1px solid hsl(220 13% 18%)", borderRadius: "8px", color: "hsl(210 20% 95%)" }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Total Value"]}
                    labelFormatter={(_label, payload) => {
                      if (payload?.[0]?.payload) {
                        const p = payload[0].payload;
                        return `${p.date} — Added: ${p.itemName} ($${p.itemValue.toLocaleString()})`;
                      }
                      return _label;
                    }}
                  />
                  <Area type="monotone" dataKey="value" stroke="hsl(43 96% 56%)" strokeWidth={2} fill="url(#valueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} strokeWidth={0}>
                    {categoryBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(220 18% 10%)", border: "1px solid hsl(220 13% 18%)", borderRadius: "8px", color: "hsl(210 20% 95%)" }} formatter={(value: number) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {categoryBreakdown.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.fill }} />
                    <span className="text-muted-foreground">{cat.name}</span>
                  </div>
                  <span className="mono font-medium">${cat.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
