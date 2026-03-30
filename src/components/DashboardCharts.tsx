// Isolated recharts import — this file is lazy-loaded by Dashboard so the
// vendor-charts chunk (411 KB) is only fetched when the dashboard route renders.
import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PortfolioPoint {
  date: string;
  value: number;
  itemName: string;
  itemValue: number;
}

interface CategorySlice {
  name: string;
  value: number;
  fill: string;
}

interface DashboardChartsProps {
  portfolioHistory: PortfolioPoint[];
  categoryBreakdown: CategorySlice[];
}

export default function DashboardCharts({ portfolioHistory, categoryBreakdown }: DashboardChartsProps) {
  const [hovered, setHovered] = useState<PortfolioPoint | null>(null);

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Roster Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={portfolioHistory}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onMouseMove={(state: any) => {
                  if (state?.activePayload?.length) {
                    setHovered(state.activePayload[0].payload as PortfolioPoint);
                  }
                }}
                onMouseLeave={() => setHovered(null)}
              >
                <defs>
                  <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(43 96% 56%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(43 96% 56%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 18%)" />
                <XAxis dataKey="date" tick={{ fill: "hsl(215 15% 50%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(215 15% 50%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                {/* Tooltip is kept only for the cursor line — content renders nothing */}
                <Tooltip
                  content={() => null}
                  cursor={{ stroke: "hsl(215 15% 50%)", strokeWidth: 1, strokeDasharray: "3 3" }}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(43 96% 56%)" strokeWidth={2} fill="url(#valueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Hover info panel — normal document flow, can never overflow the card */}
          <div className="mt-3 min-h-[36px] px-1">
            {hovered ? (
              <div className="flex flex-col gap-0.5 text-sm">
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className="font-semibold text-foreground">{hovered.date}</span>
                  <span style={{ color: "hsl(43 96% 56%)" }} className="font-medium">
                    ${hovered.value.toLocaleString()}
                  </span>
                </div>
                {hovered.itemName && (
                  <span className="text-muted-foreground text-xs leading-snug">
                    + {hovered.itemName}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/40">Hover a point to see details</p>
            )}
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
  );
}
