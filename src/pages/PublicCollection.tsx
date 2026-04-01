import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { CollectionItem } from "@/context/CollectionContext";
import { Package, DollarSign } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToItem(row: any): CollectionItem {
  return {
    id: row.id,
    collectionId: row.collection_id ?? "1",
    name: row.name,
    player: row.player ?? "",
    team: row.team ?? "",
    sport: row.sport ?? "",
    year: row.year ?? "",
    category: row.category ?? "",
    subCategory: row.sub_category ?? "",
    condition: row.condition ?? "",
    grade: row.grade ?? "",
    gradingCompany: row.grading_company ?? "",
    certificationNumber: row.certification_number ?? "",
    authenticationCompany: row.authentication_company ?? "",
    purchasePrice: Number(row.purchase_price) || 0,
    estimatedValue: Number(row.estimated_value) || 0,
    recentSalePrice: Number(row.recent_sale_price) || 0,
    storageLocation: row.storage_location ?? "",
    notes: row.notes ?? "",
    dateAcquired: row.date_acquired ?? "",
    images: row.images ?? [],
    createdDate: row.created_at?.split("T")[0] ?? "",
    purchasedFrom: row.purchased_from ?? "",
    origin: row.origin ?? "",
    previousOwners: row.previous_owners ?? "",
    eventDetails: row.event_details ?? "",
    supportingEvidence: row.supporting_evidence ?? "",
  };
}

export default function PublicCollection() {
  const { username } = useParams<{ username: string }>();
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;

    (async () => {
      setLoading(true);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .eq("username", username)
        .maybeSingle();

      if (!profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setDisplayName(profileData.display_name || username);

      const { data: rows } = await supabase
        .from("collection_items")
        .select("*")
        .eq("user_id", profileData.user_id)
        .order("created_at", { ascending: false });

      setItems((rows ?? []).map(rowToItem));
      setLoading(false);
    })();
  }, [username]);

  const totalValue = items.reduce((sum, item) => sum + (item.estimatedValue || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading collection...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
        <Package className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Collection not found</h1>
        <p className="text-muted-foreground">No collection exists for @{username}</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 pb-24 md:pb-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <span className="text-2xl font-bold text-primary">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{displayName}'s Roster</h1>
          <p className="text-muted-foreground text-sm mt-1">Sports memorabilia &amp; cards</p>
        </div>
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="font-bold font-mono">${totalValue.toLocaleString()}</span>
            <span className="text-muted-foreground text-sm">value</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span className="font-bold">{items.length}</span>
            <span className="text-muted-foreground text-sm">items</span>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No items in this collection yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border bg-card overflow-hidden">
              {item.images[0] && (
                <div className="aspect-square overflow-hidden bg-secondary">
                  <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-3 space-y-1">
                <p className="font-medium text-sm leading-tight line-clamp-2">{item.name}</p>
                {item.player && <p className="text-xs text-muted-foreground">{item.player}</p>}
                {item.estimatedValue > 0 && (
                  <p className="text-xs font-semibold text-primary">${item.estimatedValue.toLocaleString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
