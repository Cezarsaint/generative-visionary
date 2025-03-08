
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GeneratedImage } from "@/types";
import { X, ChevronLeft, ChevronRight, Download, Trash2, Info } from "lucide-react";

interface ImageViewerProps {
  images: GeneratedImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: 'next' | 'prev') => void;
  onDelete: (imageId: string) => void;
  onDownload: (imageId: string) => void;
}

const ImageViewer = ({
  images,
  currentIndex,
  onClose,
  onNavigate,
  onDelete,
  onDownload
}: ImageViewerProps) => {
  const [showInfo, setShowInfo] = useState(false);
  const currentImage = images[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          onNavigate('prev');
          break;
        case 'ArrowRight':
          onNavigate('next');
          break;
        case 'Escape':
          onClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate, onClose]);

  // Prevent scroll when viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!currentImage) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center transition-all duration-300 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full h-full max-w-6xl max-h-screen flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70 rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-10 bg-black/50 text-white hover:bg-black/70 rounded-full"
          onClick={() => setShowInfo(!showInfo)}
        >
          <Info className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 rounded-full h-10 w-10"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('prev');
          }}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 rounded-full h-10 w-10"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('next');
          }}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          <Button
            variant="outline"
            size="sm"
            className="bg-black/50 text-white border-white/20 hover:bg-black/70 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(currentImage.id);
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-black/50 text-white border-white/20 hover:bg-black/70 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(currentImage.id);
            }}
          >
            <Download className="h-4 w-4" /> Download
          </Button>
        </div>

        <div className="h-full max-h-screen w-full flex items-center justify-center transition-all duration-300 animate-zoom-in">
          <img
            src={currentImage.url}
            alt={`Full size image ${currentIndex + 1}`}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {showInfo && (
          <div className="absolute top-16 left-4 w-80 bg-black/80 text-white p-4 rounded-lg animate-slide-down">
            <h3 className="text-lg font-semibold mb-2">Image Details</h3>
            <div className="space-y-2 text-sm">
              <p>Seed: {currentImage.seed}</p>
              <p>Size: {currentImage.settings.size}</p>
              <p>Template: {currentImage.settings.template}</p>
              <p>Style: {currentImage.settings.style}</p>
              {currentImage.prompts.civitaiLora && (
                <p>Lora: {currentImage.prompts.civitaiLora}</p>
              )}
              <p>AI Enhancer: {currentImage.settings.aiEnhancer ? 'Enabled' : 'Disabled'}</p>
              <p>Date: {new Date(currentImage.timestamp).toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
