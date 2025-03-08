
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GeneratedImage } from "@/types";
import { Download, Trash2, Maximize, Loader2 } from "lucide-react";
import ImageViewer from "./ImageViewer";

interface ImageCanvasProps {
  images: GeneratedImage[];
  onDelete: (imageId: string) => void;
  onDownload: (imageId: string) => void;
  onDownloadAll: () => void;
  isGenerating: boolean;
}

const ImageCanvas = ({ 
  images, 
  onDelete, 
  onDownload, 
  onDownloadAll, 
  isGenerating 
}: ImageCanvasProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const handleImageLoad = (imageId: string) => {
    setLoadedImages(prev => ({ ...prev, [imageId]: true }));
  };

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImageViewer = () => {
    setSelectedImageIndex(null);
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
            Adjust your settings above and click Generate to create images
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
                className={`aspect-[4/3] bg-muted cursor-pointer relative ${isImageLoaded(image.id) ? '' : 'image-loading'}`}
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

      {selectedImageIndex !== null && images.length > 0 && (
        <ImageViewer
          images={images}
          currentIndex={selectedImageIndex}
          onClose={closeImageViewer}
          onNavigate={navigateImages}
          onDelete={(id) => {
            onDelete(id);
            closeImageViewer();
          }}
          onDownload={onDownload}
        />
      )}
    </div>
  );
};

export default ImageCanvas;
