
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Trash, 
  Loader2, 
  Copy, 
  Maximize, 
  Info
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { GeneratedImage } from "@/types";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import FullScreenImageViewer from './FullScreenImageViewer';

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
  const [fullScreenImage, setFullScreenImage] = useState<{
    index: number;
    visible: boolean;
  }>({ index: 0, visible: false });

  const openFullScreen = (index: number) => {
    setFullScreenImage({ index, visible: true });
  };

  const closeFullScreen = () => {
    setFullScreenImage({ ...fullScreenImage, visible: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Current Generation</h2>
        
        <div className="flex gap-2">
          {images.length > 0 && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onDownloadAll}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download All</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete all images?")) {
                    onDelete(images[0].id);
                  }
                }}
                className="flex items-center gap-1 text-red-500 hover:text-red-700"
              >
                <Trash className="h-4 w-4" />
                <span className="hidden sm:inline">Delete All</span>
              </Button>
            </>
          )}
        </div>
      </div>
      
      <Separator />
      
      {isGenerating ? (
        <div className="mt-20 flex flex-col items-center justify-center text-center p-8">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
          <h3 className="text-xl font-medium mb-2">Generating Images</h3>
          <p className="text-muted-foreground max-w-md">
            This might take a minute or two. The AI is crafting unique images based on your prompts.
          </p>
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {images.map((image, index) => (
            <Card key={image.id} className="overflow-hidden group relative">
              <div className="relative aspect-[4/3] bg-gray-100">
                <img 
                  src={image.url} 
                  alt={`Generated image ${index + 1}`}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={() => openFullScreen(index)}
                />
                
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="h-8 w-8 rounded-full bg-black/50 text-white backdrop-blur-sm"
                          onClick={() => openFullScreen(index)}
                        >
                          <Maximize className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View fullscreen</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="h-8 w-8 rounded-full bg-black/50 text-white backdrop-blur-sm"
                          onClick={() => onDownload(image.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="h-8 w-8 rounded-full bg-black/50 text-white backdrop-blur-sm"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this image?")) {
                              onDelete(image.id);
                            }
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="h-7 text-xs rounded-full bg-black/50 text-white backdrop-blur-sm"
                        >
                          <Info className="h-3 w-3 mr-1" />
                          Seed: {image.seed}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-xs">
                          <p className="font-semibold">Image Seed</p>
                          <p className="text-sm">{image.seed}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-xl">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Copy className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">No Images Generated Yet</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Fill in the prompt settings on the left and click "Generate" to create images.
          </p>
          <div className="bg-muted p-4 rounded-md max-w-md mx-auto text-left text-sm">
            <p className="font-medium mb-2">Current Prompt Preview:</p>
            <pre className="whitespace-pre-wrap text-xs">{promptPreview}</pre>
          </div>
        </div>
      )}
      
      {/* Fullscreen image viewer */}
      {fullScreenImage.visible && (
        <FullScreenImageViewer
          images={images}
          currentIndex={fullScreenImage.index}
          onClose={closeFullScreen}
          onDownload={onDownload}
        />
      )}
    </div>
  );
};

export default ImageCanvas;
