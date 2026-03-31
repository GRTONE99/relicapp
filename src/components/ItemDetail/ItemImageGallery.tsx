import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface ItemImageGalleryProps {
  images: string[];
  itemName: string;
  editing: boolean;
  onAddImage: (dataUrl: string) => void;
  onRemoveImage: (index: number) => void;
}

export function ItemImageGallery({
  images,
  itemName,
  editing,
  onAddImage,
  onRemoveImage,
}: ItemImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Clamp index when images array shrinks
  const safeIndex = Math.min(selectedIndex, Math.max(0, images.length - 1));

  const goToPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const readFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} exceeds 10MB limit.`); return; }
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} is not an image.`); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) onAddImage(e.target.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = (index: number) => {
    onRemoveImage(index);
    if (safeIndex >= index && safeIndex > 0) setSelectedIndex(safeIndex - 1);
  };

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative rounded-xl overflow-hidden bg-secondary aspect-[3/4] group">
        <img
          src={images[safeIndex] ?? "/placeholder.svg"}
          alt={itemName}
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === safeIndex ? "bg-primary" : "bg-background/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`relative aspect-square rounded-lg overflow-hidden bg-secondary group ring-2 transition-all ${
                i === safeIndex ? "ring-primary" : "ring-transparent"
              }`}
            >
              <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              {editing && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                  className="absolute top-1 right-1 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Edit mode upload buttons */}
      {editing && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => readFiles(e.target.files)}
          />
          <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> Upload Photos
          </Button>
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
        </div>
      )}
    </div>
  );
}
