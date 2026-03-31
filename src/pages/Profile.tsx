import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCollection } from "@/context/CollectionContext";
import type { ProfileData } from "@/context/CollectionContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Save, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SPORTS = ["Baseball", "Basketball", "Football", "Hockey", "Soccer", "Golf", "Tennis", "Boxing/MMA", "Racing", "Other"];

const emptyProfile: ProfileData = {
  username: "",
  display_name: "",
  avatar_url: "",
  favorite_sport: "",
  favorite_team: "",
  personal_collection: "",
  bio: "",
};

export default function Profile() {
  const { user, profile: cachedProfile, profileLoading: contextProfileLoading, refreshProfile } = useCollection();
  const navigate = useNavigate();
  const [editProfile, setEditProfile] = useState<ProfileData>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initRef = useRef(false);

  // Initialise the edit form from the context profile once it finishes loading.
  // Using a ref prevents re-initialisation if the context value updates after a save.
  useEffect(() => {
    if (contextProfileLoading || initRef.current) return;
    initRef.current = true;
    if (cachedProfile) {
      setEditProfile(cachedProfile);
      setIsNew(false);
    } else {
      setIsNew(true);
    }
    setLoading(false);
  }, [contextProfileLoading, cachedProfile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Profile photo must be under 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("profile-photos").getPublicUrl(filePath);
    setEditProfile((prev) => ({ ...prev, avatar_url: urlData.publicUrl + "?t=" + Date.now() }));
    setUploading(false);
    toast({ title: "Photo uploaded!" });
  };

  const handleSave = async () => {
    if (!user) return;
    if (!editProfile.username.trim() || !editProfile.display_name.trim()) {
      toast({ title: "Required fields missing", description: "Username and Display Name are required.", variant: "destructive" });
      return;
    }

    setSaving(true);

    const { data: usernameAvailable, error: usernameErr } = await supabase
      .rpc("check_username_available", {
        check_username: editProfile.username.trim(),
        current_user_id: user.id,
      });

    if (usernameErr || !usernameAvailable) {
      toast({ title: "Username taken", description: "That username is already in use. Please choose another.", variant: "destructive" });
      setSaving(false);
      return;
    }

    const { data: displayNameAvailable, error: displayNameErr } = await supabase
      .rpc("check_display_name_available", {
        check_display_name: editProfile.display_name.trim(),
        current_user_id: user.id,
      });

    if (displayNameErr || !displayNameAvailable) {
      toast({ title: "Display name taken", description: "That display name is already in use. Please choose another.", variant: "destructive" });
      setSaving(false);
      return;
    }

    if (isNew) {
      const { error } = await supabase.from("profiles").insert({ user_id: user.id, ...editProfile });
      if (error) {
        toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
      } else {
        setIsNew(false);
        await refreshProfile();
        toast({ title: "Profile created!" });
      }
    } else {
      const { error } = await supabase.from("profiles").update(editProfile).eq("user_id", user.id);
      if (error) {
        toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
      } else {
        await refreshProfile();
        toast({ title: "Profile updated!" });
      }
    }
    setSaving(false);
  };

  if (loading || contextProfileLoading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            My Profile
          </CardTitle>
          <CardDescription>Manage your collector profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="w-24 h-24 border-2 border-primary/20">
              <AvatarImage src={editProfile.avatar_url} alt="Profile photo" />
              <AvatarFallback className="text-2xl">
                {editProfile.display_name?.[0]?.toUpperCase() || <User className="w-8 h-8" />}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handlePhotoUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="w-4 h-4 mr-1" />
              {uploading ? "Uploading..." : "Upload Photo"}
            </Button>
            <p className="text-xs text-muted-foreground">Required</p>
          </div>

          {/* Required Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">Required</h3>

            <div className="space-y-2">
              <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
              <Input
                id="username"
                placeholder="e.g. relic_king99"
                value={editProfile.username}
                onChange={(e) => setEditProfile((p) => ({ ...p, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") }))}
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">Letters, numbers, and underscores only</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name <span className="text-destructive">*</span></Label>
              <Input
                id="display_name"
                placeholder="e.g. Scott Hicks"
                value={editProfile.display_name}
                onChange={(e) => setEditProfile((p) => ({ ...p, display_name: e.target.value }))}
                maxLength={50}
              />
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">Optional</h3>

            <div className="space-y-2">
              <Label htmlFor="favorite_sport">Favorite Sport</Label>
              <Select
                value={editProfile.favorite_sport}
                onValueChange={(val) => setEditProfile((p) => ({ ...p, favorite_sport: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sport" />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="favorite_team">Favorite Team</Label>
              <Input
                id="favorite_team"
                placeholder="e.g. Edmonton Oilers"
                value={editProfile.favorite_team}
                onChange={(e) => setEditProfile((p) => ({ ...p, favorite_team: e.target.value }))}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personal_collection">Personal Collection (PC)</Label>
              <Input
                id="personal_collection"
                placeholder="e.g. Wayne Gretzky rookie cards"
                value={editProfile.personal_collection}
                onChange={(e) => setEditProfile((p) => ({ ...p, personal_collection: e.target.value }))}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">What do you collect most?</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Short Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell other collectors a bit about yourself..."
                value={editProfile.bio}
                onChange={(e) => setEditProfile((p) => ({ ...p, bio: e.target.value }))}
                maxLength={160}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">{editProfile.bio.length}/160 characters</p>
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : isNew ? "Create Profile" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
