// src/components/ItemDetail/EbayComps.tsx
//
// Renders eBay sold comps for an item. The user triggers a fetch manually
// (not on mount) to avoid Apify charges on every page view.

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, TrendingUp, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { CollectionItem } from "@/context/CollectionContext";
import type { CompsResponse } from "@/lib/comps/apify-ebay";

interface EbayCompsProps {
  item: CollectionItem;
}

export function EbayComps({ item }: EbayCompsProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchComps = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("ebay-comps", {
        body: {
          title: item.name,
          player: item.player || undefined,
          team: item.team || undefined,
          year: item.year || undefined,
          category: item.category || undefined,
          authentication_company: item.authenticationCompany || undefined,
          grade: item.grade || undefined,
        },
      });

      if (fnError) throw fnError;
      if (!result?.success) throw new Error(result?.error ?? "Failed to fetch comps");

      setData(result as CompsResponse);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch comps";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const confidenceBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 60) return "default";
    if (score >= 30) return "secondary";
    return "destructive";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> eBay Market Comps
          </CardTitle>
          <Button
            size="sm"
            variant={data ? "outline" : "default"}
            onClick={fetchComps}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Fetching…</>
            ) : data ? (
              <><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh</>
            ) : (
              "Get Comps"
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Idle state */}
        {!loading && !data && !error && (
          <p className="text-sm text-muted-foreground">
            Fetch recent eBay sold listings to estimate current market value.
          </p>
        )}

        {/* Error state */}
        {error && !loading && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-40 rounded-lg" />
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div className="space-y-4">
            {/* Summary metric tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-muted/40 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Avg Sale</p>
                <p className="text-base font-bold mono">${data.summary.average.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Median</p>
                <p className="text-base font-bold mono">${data.summary.median.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Est. Value</p>
                <p className="text-base font-bold mono text-primary">
                  ${data.summary.weightedEstimate.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                <Badge variant={confidenceBadgeVariant(data.summary.confidence)} className="mono tabular-nums">
                  {data.summary.confidence}/100
                </Badge>
              </div>
            </div>

            {/* Range + comp count + query used */}
            <p className="text-xs text-muted-foreground">
              {data.summary.count} comps · range ${data.summary.min.toLocaleString()}–${data.summary.max.toLocaleString()} · query: &ldquo;{data.query}&rdquo;
            </p>

            {/* Individual comps table */}
            {data.comps.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-24">Date</TableHead>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs text-right w-24">Price</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.comps.slice(0, 10).map((comp) => (
                      <TableRow key={comp.externalId}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {comp.soldDate || "—"}
                        </TableCell>
                        <TableCell className="text-xs max-w-[260px] truncate">
                          {comp.title}
                        </TableCell>
                        <TableCell className="text-xs font-semibold mono text-right whitespace-nowrap">
                          ${comp.soldPrice.toLocaleString()}
                        </TableCell>
                        <TableCell className="pl-0">
                          {comp.listingUrl && (
                            <a
                              href={comp.listingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No matching comps found. Try updating the item's player, year, or category.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
