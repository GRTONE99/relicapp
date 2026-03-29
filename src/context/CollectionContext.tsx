import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadItemImages } from "@/lib/imageUpload";
import { FREE_ITEM_LIMIT } from "@/lib/constants";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

// ─── Domain model ─────────────────────────────────────────────────────────────
// Camel-case representation used throughout the UI. The rowToItem function
// is the only place that translates snake_case DB rows into this shape.

export interface CollectionItem {
  id: string;
  collectionId: string;
  name: string;
  player: string;
  team: string;
  sport: string;
  year: string;
  category: string;
  subCategory: string;
  condition: string;
  grade: string;
  gradingCompany: string;
  certificationNumber: string;
  authenticationCompany: string;
  purchasePrice: number;
  estimatedValue: number;
  recentSalePrice: number;
  storageLocation: string;
  notes: string;
  dateAcquired: string;
  images: string[];
  createdDate: string;
  // Provenance fields
  purchasedFrom: string;
  origin: string;
  previousOwners: string;
  eventDetails: string;
  supportingEvidence: string;
}

// ─── Context type ─────────────────────────────────────────────────────────────

interface CollectionContextType {
  items: CollectionItem[];
  addItem: (item: CollectionItem) => Promise<void>;
  updateItem: (id: string, updates: Partial<CollectionItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getTotalValue: () => number;
  getTotalCost: () => number;
  getTotalGain: () => number;
  getTopAsset: () => CollectionItem | null;
  user: User | null;
  loading: boolean;
  itemsLoading: boolean;
  signOut: () => Promise<void>;
  isAtFreeLimit: () => boolean;
}

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

// ─── DB → app model mapper ────────────────────────────────────────────────────

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
    // Provenance
    purchasedFrom: row.purchased_from ?? "",
    origin: row.origin ?? "",
    previousOwners: row.previous_owners ?? "",
    eventDetails: row.event_details ?? "",
    supportingEvidence: row.supporting_evidence ?? "",
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);

  // Auth — both getSession() and onAuthStateChange run. getSession() is the
  // guaranteed resolver; onAuthStateChange handles post-mount events.
  // We store only the user ID in a separate piece of state so the items
  // useEffect depends on a stable string rather than the user object reference
  // (which changes on every getSession/onAuthStateChange call even for the
  // same user, causing duplicate fetches that race each other).
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setUserId(session?.user?.id ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setUserId(session?.user?.id ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch items when the user ID changes (stable string — won't double-fire
  // when getSession and onAuthStateChange both resolve for the same user).
  useEffect(() => {
    if (!userId) {
      setItems([]);
      setItemsLoading(false);
      return;
    }

    let cancelled = false;
    setItemsLoading(true);

    supabase
      .from("collection_items")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          toast.error("Failed to load your collection.");
          console.error("items fetch error", error);
        } else if (data) {
          setItems(data.map(rowToItem));
        }
        setItemsLoading(false);
      });

    return () => { cancelled = true; };
  }, [userId]);

  // ── Free-tier limit ─────────────────────────────────────────────────────────

  const isAtFreeLimit = () => items.length >= FREE_ITEM_LIMIT;

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const addItem = async (item: CollectionItem) => {
    if (!user) return;
    if (isAtFreeLimit()) {
      throw new Error("FREE_LIMIT_REACHED");
    }

    const imageUrls = await uploadItemImages(user.id, item.images);

    const { data, error } = await supabase
      .from("collection_items")
      .insert({
        user_id: user.id,
        name: item.name,
        player: item.player,
        team: item.team,
        sport: item.sport,
        year: item.year,
        category: item.category,
        sub_category: item.subCategory,
        condition: item.condition,
        grade: item.grade,
        grading_company: item.gradingCompany,
        certification_number: item.certificationNumber,
        authentication_company: item.authenticationCompany,
        purchase_price: item.purchasePrice,
        estimated_value: item.estimatedValue,
        recent_sale_price: item.recentSalePrice,
        storage_location: item.storageLocation,
        notes: item.notes,
        date_acquired: item.dateAcquired || null,
        images: imageUrls,
        collection_id: item.collectionId,
      })
      .select()
      .single();

    if (error) throw error;

    // Provenance fields are patched in a separate UPDATE so that a stale
    // PostgREST schema cache on the INSERT path doesn't block item creation.
    const hasProvenance =
      item.purchasedFrom || item.origin || item.previousOwners ||
      item.eventDetails || item.supportingEvidence;

    if (data && hasProvenance) {
      await supabase
        .from("collection_items")
        .update({
          purchased_from: item.purchasedFrom,
          origin: item.origin,
          previous_owners: item.previousOwners,
          event_details: item.eventDetails,
          supporting_evidence: item.supportingEvidence,
        })
        .eq("id", data.id);
      // Merge provenance into the returned row for local state
      data.purchased_from = item.purchasedFrom;
      data.origin = item.origin;
      data.previous_owners = item.previousOwners;
      data.event_details = item.eventDetails;
      data.supporting_evidence = item.supportingEvidence;
    }

    if (data) {
      setItems((prev) => [rowToItem(data), ...prev]);
    }
  };

  const updateItem = async (id: string, updates: Partial<CollectionItem>) => {
    if (!user) return;

    // Build the partial DB update object — only include keys that are present
    // in the updates argument so we never overwrite untouched fields with undefined.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbUpdates: Record<string, any> = {};
    if (updates.name              !== undefined) dbUpdates.name                  = updates.name;
    if (updates.player            !== undefined) dbUpdates.player                = updates.player;
    if (updates.team              !== undefined) dbUpdates.team                  = updates.team;
    if (updates.sport             !== undefined) dbUpdates.sport                 = updates.sport;
    if (updates.year              !== undefined) dbUpdates.year                  = updates.year;
    if (updates.category          !== undefined) dbUpdates.category              = updates.category;
    if (updates.subCategory       !== undefined) dbUpdates.sub_category          = updates.subCategory;
    if (updates.condition         !== undefined) dbUpdates.condition             = updates.condition;
    if (updates.grade             !== undefined) dbUpdates.grade                 = updates.grade;
    if (updates.gradingCompany    !== undefined) dbUpdates.grading_company       = updates.gradingCompany;
    if (updates.certificationNumber !== undefined) dbUpdates.certification_number = updates.certificationNumber;
    if (updates.authenticationCompany !== undefined) dbUpdates.authentication_company = updates.authenticationCompany;
    if (updates.purchasePrice     !== undefined) dbUpdates.purchase_price        = updates.purchasePrice;
    if (updates.estimatedValue    !== undefined) dbUpdates.estimated_value       = updates.estimatedValue;
    if (updates.recentSalePrice   !== undefined) dbUpdates.recent_sale_price     = updates.recentSalePrice;
    if (updates.storageLocation   !== undefined) dbUpdates.storage_location      = updates.storageLocation;
    if (updates.notes             !== undefined) dbUpdates.notes                 = updates.notes;
    if (updates.dateAcquired      !== undefined) dbUpdates.date_acquired         = updates.dateAcquired || null;
    if (updates.purchasedFrom     !== undefined) dbUpdates.purchased_from        = updates.purchasedFrom;
    if (updates.origin            !== undefined) dbUpdates.origin                = updates.origin;
    if (updates.previousOwners    !== undefined) dbUpdates.previous_owners       = updates.previousOwners;
    if (updates.eventDetails      !== undefined) dbUpdates.event_details         = updates.eventDetails;
    if (updates.supportingEvidence !== undefined) dbUpdates.supporting_evidence  = updates.supportingEvidence;
    if (updates.images !== undefined) {
      dbUpdates.images = await uploadItemImages(user.id, updates.images);
    }

    const { error } = await supabase
      .from("collection_items")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      toast.error("Failed to save changes. Please try again.");
      throw error;
    }

    const finalUpdates = updates.images !== undefined
      ? { ...updates, images: dbUpdates.images as string[] }
      : updates;

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...finalUpdates } : item)),
    );
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from("collection_items")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete item. Please try again.");
      throw error;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // ── Computed metrics ────────────────────────────────────────────────────────
  // Single pass over items for all aggregate values; result is stable across
  // renders until items changes.

  const { _totalValue, _totalCost, _topAsset } = useMemo(() => {
    let _totalValue = 0;
    let _totalCost  = 0;
    let _topAsset: CollectionItem | null = null;
    for (const item of items) {
      _totalValue += item.estimatedValue;
      _totalCost  += item.purchasePrice;
      if (!_topAsset || item.estimatedValue > _topAsset.estimatedValue) _topAsset = item;
    }
    return { _totalValue, _totalCost, _topAsset };
  }, [items]);

  const getTotalValue = () => _totalValue;
  const getTotalCost  = () => _totalCost;
  const getTotalGain  = () => _totalValue - _totalCost;
  const getTopAsset   = () => _topAsset;

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setItems([]);
  };

  return (
    <CollectionContext.Provider
      value={{
        items,
        addItem,
        updateItem,
        deleteItem,
        getTotalValue,
        getTotalCost,
        getTotalGain,
        getTopAsset,
        user,
        loading,
        itemsLoading,
        signOut,
        isAtFreeLimit,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
}

// ─── Consumer hook ────────────────────────────────────────────────────────────

export function useCollection() {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error("useCollection must be used within CollectionProvider");
  return ctx;
}
