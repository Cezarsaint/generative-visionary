
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FullScreenImageViewerProps {
  images: Array<{ id: string; url: string }>;
  currentIndex: number;
  onClose: () => void;
  onDownload: (imageId: string) => void;
}

const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({
  images,
  currentIndex,
  onClose,
  onDownload
}) => {
  const [index, setIndex] = useState(currentIndex);
  
  useEffect(() => {
    // Add keyboard event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        navigatePrevious();
      } else if (e.key === 'ArrowRight') {
        navigateNext();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Prevent scrolling when fullscreen is active
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  
  const navigatePrevious = () => {
    if (images.length <= 1) return;
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const navigateNext = () => {
    if (images.length <= 1) return;
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  const currentImage = images[index];
  
  if (!currentImage) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-black/90">
        <div className="text-white">
          {index + 1} / {images.length}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDownload(currentImage.id)}
            className="text-white hover:bg-gray-800"
          >
            <Download className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <img
          src={currentImage.url}
          alt="Fullscreen preview"
          className="max-h-full max-w-full object-contain"
        />
        
        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={navigatePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full h-10 w-10"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={navigateNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full h-10 w-10"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default FullScreenImageViewer;
