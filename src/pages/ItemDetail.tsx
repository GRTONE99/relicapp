import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCollection } from "@/context/CollectionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { ArrowLeft, Shield, TrendingUp, Calendar, Pencil, Trash2, Save, X, Trophy, Package, ScrollText, FileText, Loader2, Share2, Tag } from "lucide-react";
import { toast } from "sonner";
import { ItemImageGallery } from "@/components/ItemDetail/ItemImageGallery";
import { TagInput } from "@/components/TagInput";
import { EbayComps } from "@/components/ItemDetail/EbayComps";
import {
  SPORT_OPTIONS,
  CATEGORY_OPTIONS,
  CATEGORY_LABELS,
  GRADING_COMPANY_OPTIONS,
  CONDITION_OPTIONS,
} from "@/lib/constants";
import type { CollectionItem } from "@/context/CollectionContext";

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, updateItem, deleteItem } = useCollection();
  const item = items.find((i) => i.id === id);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<CollectionItem | null>(() => item ? { ...item } : null);

  if (!item || !form) {
    return (
      <div className="container max-w-4xl py-16 text-center">
        <p className="text-muted-foreground">Item not found.</p>
        <Link to="/roster">
          <Button variant="outline" className="mt-4">Back to Collection</Button>
        </Link>
      </div>
    );
  }

  const gain = item.estimatedValue - item.purchasePrice;
  const gainPercent = item.purchasePrice > 0 ? ((gain / item.purchasePrice) * 100).toFixed(1) : "0.0";

  const hasProvenance =
    item.purchasedFrom || item.origin || item.previousOwners ||
    item.eventDetails || item.supportingEvidence;

  const updateField = (field: keyof CollectionItem, value: string | number | string[]) => {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await updateItem(item.id, form);
      setEditing(false);
      toast.success("Item updated successfully.");
    } catch {
      // updateItem already shows a toast
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteItem(item.id);
      toast.success(`"${item.name}" removed from your roster.`);
      navigate("/roster");
    } catch {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleCancel = () => {
    setForm({ ...item });
    setEditing(false);
  };

  const currentImages = editing ? (form?.images ?? []) : (item?.images ?? []);

  return (
    <div className="container max-w-4xl py-6 pb-24 md:pb-6 space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <Link
          to="/roster"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Collection
        </Link>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Saving...</>
                  : <><Save className="w-4 h-4 mr-1" />Save</>
                }
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => navigate("/share", { state: { itemId: item.id } })}>
                <Share2 className="w-4 h-4 mr-1" /> Share
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setForm({ ...item }); setEditing(true); }}>
                <Pencil className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Item</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete &quot;{item.name}&quot;? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                      {deleting ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Deleting...</> : "Delete"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Left column: image gallery ──────────────────────────────────────── */}
        <ItemImageGallery
          images={currentImages}
          itemName={item.name}
          editing={editing}
          onAddImage={(url) =>
            setForm((prev) => prev ? { ...prev, images: [...prev.images, url] } : prev)
          }
          onRemoveImage={(i) =>
            setForm((prev) => prev ? { ...prev, images: prev.images.filter((_, idx) => idx !== i) } : prev)
          }
        />

        {/* ── Right column: detail cards ──────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Title + tags (view mode only) */}
          {!editing && (
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{item.name}</h1>
              {item.player && (
                <p className="text-muted-foreground">
                  {item.player}{item.team ? ` · ${item.team}` : ""}{item.year ? ` · ${item.year}` : ""}
                </p>
              )}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Item Details (edit mode) */}
          {editing && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" /> Item Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Item Name</Label>
                  <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Player</Label>
                    <Input value={form.player} onChange={(e) => updateField("player", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Team</Label>
                    <Input value={form.team} onChange={(e) => updateField("team", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Year</Label>
                    <Input value={form.year} onChange={(e) => updateField("year", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sport</Label>
                    <Select value={form.sport || undefined} onValueChange={(v) => updateField("sport", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {SPORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Category</Label>
                    <Select value={form.category || undefined} onValueChange={(v) => updateField("category", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Condition</Label>
                    <Select value={form.condition || undefined} onValueChange={(v) => updateField("condition", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Storage Location</Label>
                    <Input value={form.storageLocation} onChange={(e) => updateField("storageLocation", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Tag className="w-3 h-3" /> Tags
                  </Label>
                  <TagInput
                    tags={form.tags}
                    onChange={(tags) => updateField("tags", tags)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Authentication */}
          {(editing || item.gradingCompany || item.certificationNumber) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {editing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Grading Company</Label>
                        <Select value={form.gradingCompany || undefined} onValueChange={(v) => updateField("gradingCompany", v)}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {GRADING_COMPANY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Grade</Label>
                        <Input value={form.grade} onChange={(e) => updateField("grade", e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Certification #</Label>
                        <Input value={form.certificationNumber} onChange={(e) => updateField("certificationNumber", e.target.value)} className="mono" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Auth Company</Label>
                        <Input value={form.authenticationCompany} onChange={(e) => updateField("authenticationCompany", e.target.value)} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {item.gradingCompany && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Grading Company</span><span className="font-medium uppercase">{item.gradingCompany}</span></div>}
                    {item.grade && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Grade</span><span className="font-bold text-primary mono">{item.grade}</span></div>}
                    {item.certificationNumber && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cert #</span><span className="mono text-xs">{item.certificationNumber}</span></div>}
                    {item.authenticationCompany && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Authentication</span><span className="font-medium">{item.authenticationCompany}</span></div>}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Purchase Information */}
          {editing ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Purchase Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Purchase Price</Label>
                    <Input type="text" inputMode="decimal" value={form.purchasePrice} onChange={(e) => updateField("purchasePrice", Number(e.target.value))} className="mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Date Acquired</Label>
                    <DatePicker value={form.dateAcquired} onChange={(val) => updateField("dateAcquired", val)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Purchased From</Label>
                  <Input value={form.purchasedFrom} onChange={(e) => updateField("purchasedFrom", e.target.value)} placeholder="Store, auction house, private seller, etc." />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="gradient-gain">
              <CardContent className="p-5">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Purchase Price</p>
                    <p className="text-lg font-bold mono">${item.purchasePrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Est. Value</p>
                    <p className="text-lg font-bold mono">${item.estimatedValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Gain/Loss</p>
                    <p className={`text-lg font-bold mono ${gain >= 0 ? "text-gain" : "text-loss"}`}>
                      {gain >= 0 ? "+" : ""}${gain.toLocaleString()}
                    </p>
                    <p className={`text-xs mono ${gain >= 0 ? "text-gain" : "text-loss"}`}>
                      {gain >= 0 ? "+" : ""}{gainPercent}%
                    </p>
                  </div>
                </div>
                {item.purchasedFrom && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Acquired from {item.purchasedFrom}{item.dateAcquired ? ` · ${item.dateAcquired}` : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Category / Sport (view only) */}
          {!editing && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Category</span>
                  <span className="ml-auto font-medium">
                    {CATEGORY_LABELS[item.category] ?? item.category}
                    {item.subCategory ? ` · ${item.subCategory}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Sport</span>
                  <span className="ml-auto font-medium capitalize">{item.sport}</span>
                </div>
                {item.storageLocation && (
                  <div className="flex items-center gap-3 text-sm">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Storage</span>
                    <span className="ml-auto font-medium">{item.storageLocation}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Provenance & History */}
          {editing ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ScrollText className="w-4 h-4 text-primary" /> Provenance &amp; History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Origin</Label>
                  <Input value={form.origin} onChange={(e) => updateField("origin", e.target.value)} placeholder="Country, region, or source of origin" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Previous Owners</Label>
                  <Textarea value={form.previousOwners} onChange={(e) => updateField("previousOwners", e.target.value)} placeholder="List known previous owners and dates of ownership" rows={2} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Event Details</Label>
                  <Input value={form.eventDetails} onChange={(e) => updateField("eventDetails", e.target.value)} placeholder="Game, event, or occasion associated with this item" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Supporting Evidence</Label>
                  <Textarea value={form.supportingEvidence} onChange={(e) => updateField("supportingEvidence", e.target.value)} placeholder="COAs, photos, letters, documentation details" rows={2} />
                </div>
              </CardContent>
            </Card>
          ) : hasProvenance ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ScrollText className="w-4 h-4 text-primary" /> Provenance &amp; History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {item.origin && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Origin</span><span className="font-medium text-right max-w-[60%]">{item.origin}</span></div>}
                {item.eventDetails && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Event</span><span className="font-medium text-right max-w-[60%]">{item.eventDetails}</span></div>}
                {item.previousOwners && <div className="text-sm space-y-1"><p className="text-muted-foreground">Previous Owners</p><p className="text-foreground whitespace-pre-wrap">{item.previousOwners}</p></div>}
                {item.supportingEvidence && <div className="text-sm space-y-1"><p className="text-muted-foreground">Supporting Evidence</p><p className="text-foreground whitespace-pre-wrap">{item.supportingEvidence}</p></div>}
              </CardContent>
            </Card>
          ) : null}

          {/* Value (edit mode) */}
          {editing && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <Label className="text-xs">Estimated Value</Label>
                  <Input type="text" inputMode="decimal" value={form.estimatedValue} onChange={(e) => updateField("estimatedValue", Number(e.target.value))} className="mono" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {(item.notes || editing) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <Textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} rows={3} />
                ) : (
                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <EbayComps item={editing ? form : item} />
    </div>
  );
}

