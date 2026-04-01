import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Camera, X, Sparkles, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface PhotoUploadCardProps {
  photos: string[];
  detecting: boolean;
  onAddPhoto: (dataUrl: string) => void;
  onRemovePhoto: (index: number) => void;
  onAiDetect: (files: FileList) => void;
}

export function PhotoUploadCard({
  photos,
  detecting,
  onAddPhoto,
  onRemovePhoto,
  onAiDetect,
}: PhotoUploadCardProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  const readFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} exceeds 10MB limit.`); return; }
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} is not an image.`); return; }
      onAddPhoto(URL.createObjectURL(file));
    });
  };

  const handleAiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) onAiDetect(e.target.files);
    e.target.value = ""; // allow same file to be re-selected
  };

  return (
    <>
      {/* AI Auto-Detect */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <input
            ref={aiInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleAiFileChange}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full h-14 text-base border-primary/30 hover:bg-primary/10"
            onClick={() => aiInputRef.current?.click()}
            disabled={detecting}
          >
            {detecting ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing item...</>
            ) : (
              <><Sparkles className="w-5 h-5 mr-2" />Snap &amp; Auto-Fill with AI</>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Take a photo or upload an image and AI will detect the item details
          </p>
        </CardContent>
      </Card>

      {/* Photo Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />Photos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); readFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => readFiles(e.target.files)}
            />
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-xl bg-secondary">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Drop photos here or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
              </div>
            </div>
          </div>

          <div className="md:hidden">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => readFiles(e.target.files)}
            />
            <Button type="button" variant="outline" className="w-full" onClick={() => cameraInputRef.current?.click()}>
              <Camera className="w-4 h-4 mr-2" /> Take Photo
            </Button>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {photos.map((photo, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-secondary group">
                  <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemovePhoto(i)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
