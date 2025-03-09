
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Copy, Trash2, RefreshCw, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GeneratedImage } from "@/types";

interface ImageViewerProps {
  image: GeneratedImage;
  onDownload: (imageId: string) => void;
  onDelete?: (imageId: string) => void;
  onRestore?: (imageId: string) => void;
  showControls?: boolean;
  isTrash?: boolean;
  isSelected?: boolean;
  onSelect?: (imageId: string) => void;
  onClose?: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  image,
  onDownload,
  onDelete,
  onRestore,
  showControls = true,
  isTrash = false,
  isSelected = false,
  onSelect,
  onClose,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCopyPrompt = () => {
    const prompt = `${image.prompts.characterName}, ${image.prompts.characterBase}, ${image.prompts.clothingDetails}, ${image.prompts.background}, ${image.prompts.finalDetailQualityTags}`;
    
    navigator.clipboard.writeText(prompt).then(
      () => {
        toast.success("Prompt copied to clipboard");
      },
      () => {
        toast.error("Failed to copy prompt");
      }
    );
  };

  const handleCopySettings = () => {
    const settings = `
Style: ${image.settings.style}
Size: ${image.settings.size}
Seed: ${image.seed}
    `.trim();
    
    navigator.clipboard.writeText(settings).then(
      () => {
        toast.success("Settings copied to clipboard");
      },
      () => {
        toast.error("Failed to copy settings");
      }
    );
  };

  const formatDate = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleImageClick = () => {
    if (onSelect) {
      onSelect(image.id);
    } else {
      setIsDialogOpen(true);
    }
  };

  return (
    <>
      <div 
        className={`relative group rounded-lg overflow-hidden border ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={onSelect ? handleImageClick : undefined}
      >
        <img
          src={image.url}
          alt={`Generated image ${image.id}`}
          className="w-full h-48 md:h-64 object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Info overlay */}
        <div className="absolute inset-0 bg-black/60 flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="bg-black/50 text-white">
              Seed: {image.seed}
            </Badge>
            <Badge variant="outline" className="bg-black/50 text-white">
              {formatDate(image.timestamp)}
            </Badge>
          </div>
          
          {/* Bottom controls */}
          {showControls && (
            <div className="flex justify-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDialogOpen(true);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(image.id);
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyPrompt();
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
              
              {isTrash && onRestore ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(image.id);
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              ) : onDelete ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(image.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Image Details</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img
                src={image.url}
                alt={`Generated image ${image.id}`}
                className="w-full rounded-md shadow-md"
              />
              
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => onDownload(image.id)}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopyPrompt}>
                  <Copy className="h-4 w-4 mr-2" /> Copy Prompt
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopySettings}>
                  <Copy className="h-4 w-4 mr-2" /> Copy Settings
                </Button>
                {onDelete && (
                  <Button size="sm" variant="destructive" onClick={() => {
                    onDelete(image.id);
                    setIsDialogOpen(false);
                  }}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                )}
              </div>
            </div>
            
            <div>
              <Tabs defaultValue="prompt">
                <TabsList className="w-full">
                  <TabsTrigger value="prompt" className="flex-1">Prompt</TabsTrigger>
                  <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="prompt" className="space-y-4 mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-sm font-medium">Character</h4>
                          <p className="text-sm text-gray-700">{image.prompts.characterName}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium">Character Base</h4>
                          <p className="text-sm text-gray-700">{image.prompts.characterBase}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium">Clothing Details</h4>
                          <p className="text-sm text-gray-700">{image.prompts.clothingDetails}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium">Scene Details</h4>
                          <p className="text-sm text-gray-700">{image.prompts.characterSceneDetails}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium">Background</h4>
                          <p className="text-sm text-gray-700">{image.prompts.background}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium">Detail Tags</h4>
                          <p className="text-sm text-gray-700">{image.prompts.finalDetailQualityTags}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium">Negative Prompt</h4>
                          <p className="text-sm text-gray-700">{image.prompts.negativePrompt}</p>
                        </div>
                        
                        {image.prompts.civitaiLora && (
                          <div>
                            <h4 className="text-sm font-medium">Civitai Lora</h4>
                            <p className="text-sm text-gray-700">{image.prompts.civitaiLora}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="settings" className="space-y-4 mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-sm font-medium">Style</h4>
                          <p className="text-sm text-gray-700">{image.settings.style}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium">Size</h4>
                          <p className="text-sm text-gray-700">{image.settings.size}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium">Seed</h4>
                          <p className="text-sm text-gray-700">{image.seed}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium">AI Enhancer</h4>
                          <p className="text-sm text-gray-700">{image.settings.aiEnhancer ? "Enabled" : "Disabled"}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium">LLM Model</h4>
                          <p className="text-sm text-gray-700">{image.settings.llmModel}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageViewer;
