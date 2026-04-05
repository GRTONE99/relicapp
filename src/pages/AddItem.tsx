import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package, Shield, Calendar, ScrollText, TrendingUp, FileText, Lock, Tag } from "lucide-react";
import { toast } from "sonner";
import { useCollection } from "@/context/CollectionContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PhotoUploadCard } from "@/components/AddItem/PhotoUploadCard";
import { TagInput } from "@/components/TagInput";
import { DatePicker } from "@/components/ui/date-picker";
import {
  SPORT_OPTIONS,
  CATEGORY_OPTIONS,
  CONDITION_OPTIONS,
  GRADING_COMPANY_OPTIONS,
  FREE_ITEM_LIMIT,
} from "@/lib/constants";

export default function AddItem() {
  const navigate = useNavigate();
  const { addItem, isAtFreeLimit, items } = useCollection();
  const [photos, setPhotos] = useState<string[]>([]);

  // Revoke blob: URLs when component unmounts to free memory
  useEffect(() => {
    return () => { photos.forEach((p) => { if (p.startsWith("blob:")) URL.revokeObjectURL(p); }); };
  }, [photos]);
  const [detecting, setDetecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  // ── Form state ───────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [player, setPlayer] = useState("");
  const [team, setTeam] = useState("");
  const [year, setYear] = useState("");
  const [sport, setSport] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [gradingCompany, setGradingCompany] = useState("");
  const [grade, setGrade] = useState("");
  const [certificationNumber, setCertificationNumber] = useState("");
  const [authenticationCompany, setAuthenticationCompany] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [dateAcquired, setDateAcquired] = useState("");
  const [purchasedFrom, setPurchasedFrom] = useState("");
  const [origin, setOrigin] = useState("");
  const [previousOwners, setPreviousOwners] = useState("");
  const [eventDetails, setEventDetails] = useState("");
  const [supportingEvidence, setSupportingEvidence] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // ── AI detection ─────────────────────────────────────────────────────────────

  const handleAiDetect = async (files: FileList) => {
    const file = files[0];
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image exceeds 10MB limit."); return; }

    setDetecting(true);

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target!.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setPhotos((prev) => [...prev, base64]);

    try {
      const { data, error } = await supabase.functions.invoke("detect-item", {
        body: { imageBase64: base64 },
      });

      if (error) throw error;
      if (!data?.success || !data?.item) throw new Error(data?.error ?? "Detection failed");

      const item = data.item;
      if (item.name)                  setName(item.name);
      if (item.player)                setPlayer(item.player);
      if (item.team)                  setTeam(item.team);
      if (item.year)                  setYear(item.year);
      if (item.sport)                 setSport(item.sport);
      if (item.category)              setCategory(item.category);
      if (item.condition)             setCondition(item.condition);
      if (item.gradingCompany)        setGradingCompany(item.gradingCompany);
      if (item.grade)                 setGrade(item.grade);
      if (item.certificationNumber)   setCertificationNumber(item.certificationNumber);
      if (item.authenticationCompany) setAuthenticationCompany(item.authenticationCompany);
      if (item.estimatedValue)        setEstimatedValue(String(item.estimatedValue));
      if (item.notes)                 setNotes(item.notes);

      toast.success("AI detected item details — review and adjust as needed.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to detect item.";
      toast.error(message || "Failed to detect item. Please fill in manually.");
    } finally {
      setDetecting(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Item name is required."); return; }
    if (isAtFreeLimit()) { setShowLimitDialog(true); return; }
    if (submitting) return;
    setSubmitting(true);
    try {
      await addItem({
        id: crypto.randomUUID(),
        collectionId: "1",
        name, player, team, sport, year, category,
        subCategory: "",
        condition, grade, gradingCompany, certificationNumber, authenticationCompany,
        purchasePrice: parseFloat(purchasePrice) || 0,
        estimatedValue: parseFloat(estimatedValue) || 0,
        recentSalePrice: 0,
        storageLocation, notes, dateAcquired,
        images: photos,
        createdDate: new Date().toISOString().split("T")[0],
        tags,
        purchasedFrom, origin, previousOwners, eventDetails, supportingEvidence,
      });
      toast.success("Item added to your roster!");
      navigate("/roster");
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "FREE_LIMIT_REACHED") {
        setShowLimitDialog(true);
      } else {
        toast.error("Failed to add item. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl py-6 pb-24 md:pb-6 space-y-6">
      {isAtFreeLimit() && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <Lock className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="font-semibold text-sm text-destructive">
              Free limit reached ({items.length}/{FREE_ITEM_LIMIT} items)
            </p>
            <p className="text-xs text-muted-foreground">
              Upgrade to Pro ($7/mo) for unlimited items, analytics, exports, and more.
            </p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Item</h1>
        <p className="text-muted-foreground text-sm">Add a new collectible to your roster</p>
      </div>

      <PhotoUploadCard
        photos={photos}
        detecting={detecting}
        onAddPhoto={(url) => setPhotos((prev) => [...prev, url])}
        onRemovePhoto={(i) => setPhotos((prev) => {
          if (prev[i]?.startsWith("blob:")) URL.revokeObjectURL(prev[i]);
          return prev.filter((_, idx) => idx !== i);
        })}
        onAiDetect={handleAiDetect}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Item Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />Item Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input placeholder="e.g. Wayne Gretzky Rookie Card" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Player</Label>
                <Input placeholder="Player name" value={player} onChange={(e) => setPlayer(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Team</Label>
                <Input placeholder="Team name" value={team} onChange={(e) => setTeam(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Year</Label>
                <Input placeholder="1979" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sport</Label>
                <Select value={sport} onValueChange={setSport}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {SPORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Storage Location</Label>
                <Input placeholder="Safe, Binder, etc." value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grading Company</Label>
                <Select value={gradingCompany} onValueChange={setGradingCompany}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {GRADING_COMPANY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grade</Label>
                <Input placeholder="7" value={grade} onChange={(e) => setGrade(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Certification #</Label>
                <Input placeholder="45829231" className="mono" value={certificationNumber} onChange={(e) => setCertificationNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Auth Company</Label>
                <Input placeholder="PSA, JSA, Beckett" value={authenticationCompany} onChange={(e) => setAuthenticationCompany(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />Purchase Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Purchase Price</Label>
                <Input type="text" inputMode="decimal" placeholder="0.00" className="mono" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Date Acquired</Label>
                <DatePicker value={dateAcquired} onChange={setDateAcquired} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Purchased From</Label>
              <Input placeholder="Store, auction house, private seller, etc." value={purchasedFrom} onChange={(e) => setPurchasedFrom(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Provenance & History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-primary" />Provenance &amp; History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Origin</Label>
              <Input placeholder="Country, region, or source of origin" value={origin} onChange={(e) => setOrigin(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Previous Owners</Label>
              <Textarea placeholder="List known previous owners and dates of ownership" rows={2} value={previousOwners} onChange={(e) => setPreviousOwners(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Event Details</Label>
              <Input placeholder="Game, event, or occasion associated with this item" value={eventDetails} onChange={(e) => setEventDetails(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Supporting Evidence</Label>
              <Textarea placeholder="Letters of authenticity, photos, receipts, documentation details" rows={2} value={supportingEvidence} onChange={(e) => setSupportingEvidence(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput tags={tags} onChange={setTags} />
          </CardContent>
        </Card>

        {/* Value */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Estimated Value</Label>
              <Input type="text" inputMode="decimal" placeholder="0.00" className="mono" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea placeholder="Any additional notes about this item..." rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={isAtFreeLimit() || submitting}>
          {submitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</>
          ) : isAtFreeLimit() ? (
            "Upgrade to Add More Items"
          ) : (
            "Add to Roster"
          )}
        </Button>
      </form>

      {/* Free limit dialog */}
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />Free Limit Reached
            </DialogTitle>
            <DialogDescription>
              You've reached the maximum of {FREE_ITEM_LIMIT} items on the Free plan. Upgrade to
              Relic Roster Pro for just $7/month to unlock unlimited items, portfolio analytics,
              roster exports, and public sharing.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowLimitDialog(false)}>Maybe Later</Button>
            <Button className="flex-1" onClick={() => setShowLimitDialog(false)}>Upgrade to Pro</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

