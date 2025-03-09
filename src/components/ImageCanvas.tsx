
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GeneratedImage } from "@/types";
import { Download, Trash2, Maximize, Loader2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ImageCanvasProps {
  images: GeneratedImage[];
  onDelete: (imageId: string) => void;
  onDownload: (imageId: string) => void;
  onDownloadAll: () => void;
  isGenerating: boolean;
  promptPreview: string;
}

const ImageCanvas = ({ 
  images, 
  onDelete, 
  onDownload, 
  onDownloadAll, 
  isGenerating,
  promptPreview 
}: ImageCanvasProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const handleImageLoad = (imageId: string) => {
    setLoadedImages(prev => ({ ...prev, [imageId]: true }));
  };

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when viewer is open
  };

  const closeImageViewer = () => {
    setSelectedImageIndex(null);
    document.body.style.overflow = ''; // Restore scrolling
  };

  const navigateImages = (direction: 'next' | 'prev') => {
    if (selectedImageIndex === null || images.length === 0) return;

    if (direction === 'next') {
      setSelectedImageIndex((selectedImageIndex + 1) % images.length);
    } else {
      setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length);
    }
  };

  const isImageLoaded = (imageId: string) => !!loadedImages[imageId];

  // Function to determine image aspect ratio class
  const getAspectRatioClass = (imageSize: string) => {
    switch (imageSize) {
      case "768x1344":
        return "aspect-[9/16]"; // Portrait
      case "1344x768":
        return "aspect-[16/9]"; // Landscape
      case "836x1216":
        return "aspect-[3/4]"; // Square-ish
      default:
        return "aspect-[4/3]"; // Default
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Generated Images ({images.length})</h2>
        <Button
          onClick={onDownloadAll}
          disabled={images.length === 0 || isGenerating}
          variant="outline"
          className="flex gap-2 items-center"
        >
          <Download className="h-4 w-4" />
          Download All
        </Button>
      </div>

      {images.length === 0 && !isGenerating ? (
        <div className="glassmorphism rounded-xl p-12 text-center animate-fade-in">
          <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Maximize className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">No Images Generated</h3>
          <p className="text-muted-foreground mb-6">
            Adjust your settings in the sidebar and click Generate to create images
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isGenerating && (
            Array.from({ length: parseInt(images.length > 0 ? "4" : "4") }).map((_, i) => (
              <Card key={`skeleton-${i}`} className="overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/60" />
                </div>
              </Card>
            ))
          )}
          
          {images.map((image, index) => (
            <Card 
              key={image.id} 
              className="overflow-hidden group relative image-hover-effect animate-zoom-in transition-all duration-300"
            >
              <div 
                className={`${getAspectRatioClass(image.settings.size)} bg-muted cursor-pointer relative ${isImageLoaded(image.id) ? '' : 'image-loading'}`}
                onClick={() => openImageViewer(index)}
              >
                <img 
                  src={image.url} 
                  alt={`Generated image ${index + 1}`} 
                  className={`w-full h-full object-cover transition-opacity duration-300 ${isImageLoaded(image.id) ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => handleImageLoad(image.id)}
                />
                {!isImageLoaded(image.id) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/60" />
                  </div>
                )}
                {isImageLoaded(image.id) && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                )}
              </div>
              
              <div className="absolute top-2 right-2 hidden group-hover:flex gap-2 transition-all duration-300 animate-fade-in">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="bg-white/80 hover:bg-white/90 text-gray-700 shadow-sm h-8 w-8 rounded-full"
                  onClick={() => onDelete(image.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="bg-white/80 hover:bg-white/90 text-gray-700 shadow-sm h-8 w-8 rounded-full"
                  onClick={() => onDownload(image.id)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-3 hidden group-hover:block transition-all duration-300 animate-fade-in bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-white text-sm truncate">Seed: {image.seed}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Fullscreen image viewer */}
      {selectedImageIndex !== null && images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="relative w-full h-full max-w-screen-xl max-h-screen flex flex-col items-center justify-center p-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={closeImageViewer}
              className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 z-50"
            >
              <X className="h-6 w-6" />
            </Button>
            
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={images[selectedImageIndex].url} 
                alt={`Full size image ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
            
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateImages('prev')}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                Previous
              </Button>
              <Button 
                onClick={() => onDownload(images[selectedImageIndex].id)}
                className="bg-white/10 hover:bg-white/20 text-white flex gap-2 items-center"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateImages('next')}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full Prompt Preview */}
      <div className="mt-8 glassmorphism rounded-xl p-4">
        <Label htmlFor="fullPrompt" className="text-lg font-medium">Full Prompt Preview</Label>
        <Textarea
          id="fullPrompt"
          readOnly
          className="mt-2 font-mono text-xs bg-muted"
          value={promptPreview}
        />
      </div>
    </div>
  );
};

export default ImageCanvas;
