
import React, { useState, useEffect } from "react";
import { 
  getHistory, 
  getTrash, 
  restoreFromTrash, 
  clearTrash, 
  deleteFromTrash,
  deleteFromHistory
} from "@/services/imageService";
import { GeneratedImage, Generation } from "@/types";
import ImageViewer from "./ImageViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Trash2, RefreshCw, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HistoryTabProps {
  onRestore: (images: GeneratedImage[]) => void;
  onDownload: (imageId: string) => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ onRestore, onDownload }) => {
  const [history, setHistory] = useState<Generation[]>([]);
  const [trash, setTrash] = useState<GeneratedImage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("history");
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<"selected" | "all" | "generation">("selected");
  const [generationToDelete, setGenerationToDelete] = useState<string | null>(null);

  // Load history and trash data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const historyData = getHistory();
      const trashData = getTrash();
      setHistory(historyData);
      setTrash(trashData);
    } catch (error) {
      console.error("Error loading history/trash data:", error);
      toast.error("Failed to load history data");
    }
  };

  // Filter history generations based on search term
  const filteredHistory = history.filter((generation) => {
    const searchString = searchTerm.toLowerCase();
    return (
      generation.prompts.characterName.toLowerCase().includes(searchString) ||
      generation.settings.style.toLowerCase().includes(searchString) ||
      generation.prompts.characterBase.toLowerCase().includes(searchString) ||
      generation.prompts.background.toLowerCase().includes(searchString)
    );
  });

  // Filter trash images based on search term
  const filteredTrash = trash.filter((image) => {
    const searchString = searchTerm.toLowerCase();
    return (
      image.prompts.characterName.toLowerCase().includes(searchString) ||
      image.settings.style.toLowerCase().includes(searchString) ||
      image.prompts.characterBase.toLowerCase().includes(searchString) ||
      image.prompts.background.toLowerCase().includes(searchString)
    );
  });

  // Toggle image selection in trash
  const toggleImageSelection = (imageId: string) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(imageId)) {
      newSelection.delete(imageId);
    } else {
      newSelection.add(imageId);
    }
    setSelectedImages(newSelection);
  };

  // Handle restoring selected images from trash
  const handleRestore = () => {
    if (selectedImages.size === 0) {
      toast.error("No images selected");
      return;
    }

    try {
      const imageIds = Array.from(selectedImages);
      const restoredImages = restoreFromTrash(imageIds);
      
      // Clear selection
      setSelectedImages(new Set());
      
      // Refresh trash data
      loadData();
      
      // Notify parent component about restored images
      onRestore(restoredImages);
      
      toast.success(`Restored ${restoredImages.length} images`);
    } catch (error) {
      console.error("Error restoring images:", error);
      toast.error("Failed to restore images");
    }
  };

  // Handle deleting selected images from trash
  const handleDeleteFromTrash = () => {
    if (selectedImages.size === 0) {
      toast.error("No images selected");
      return;
    }

    try {
      const imageIds = Array.from(selectedImages);
      deleteFromTrash(imageIds);
      
      // Clear selection
      setSelectedImages(new Set());
      
      // Refresh trash data
      loadData();
      
      toast.success(`Deleted ${imageIds.length} images`);
    } catch (error) {
      console.error("Error deleting images:", error);
      toast.error("Failed to delete images");
    }
  };

  // Handle clearing all trash
  const handleClearTrash = () => {
    try {
      clearTrash();
      setTrash([]);
      setSelectedImages(new Set());
      toast.success("Trash cleared");
    } catch (error) {
      console.error("Error clearing trash:", error);
      toast.error("Failed to clear trash");
    }
  };

  // Handle deleting a generation from history
  const handleDeleteGeneration = (generationId: string) => {
    try {
      deleteFromHistory(generationId);
      loadData();
      toast.success("Generation moved to trash");
    } catch (error) {
      console.error("Error deleting generation:", error);
      toast.error("Failed to delete generation");
    }
  };

  // Show the delete confirmation dialog
  const confirmDelete = (target: "selected" | "all" | "generation", generationId?: string) => {
    setDeleteTarget(target);
    setGenerationToDelete(generationId || null);
    setShowDeleteDialog(true);
  };

  // Execute the appropriate delete action based on target
  const executeDelete = () => {
    switch (deleteTarget) {
      case "selected":
        handleDeleteFromTrash();
        break;
      case "all":
        handleClearTrash();
        break;
      case "generation":
        if (generationToDelete) {
          handleDeleteGeneration(generationToDelete);
        }
        break;
    }
    setShowDeleteDialog(false);
  };

  return (
    <div className="glassmorphism rounded-xl p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by character, style, or background..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="w-full">
            <TabsTrigger value="history" className="flex-1">
              History ({history.length})
            </TabsTrigger>
            <TabsTrigger value="trash" className="flex-1">
              Trash ({trash.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                {searchTerm ? "No matching generations found" : "No generation history yet"}
              </div>
            ) : (
              <div className="space-y-8">
                {filteredHistory.map((generation) => (
                  <div key={generation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-wrap justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg font-medium mb-1">
                          {generation.prompts.characterName || "Unnamed Character"}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            {new Date(generation.timestamp).toLocaleString()}
                          </Badge>
                          <Badge variant="outline">{generation.settings.style}</Badge>
                          <Badge variant="outline">{generation.settings.size}</Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => confirmDelete("generation", generation.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {generation.images.map((image) => (
                        <div key={image.id} className="relative group">
                          <ImageViewer
                            image={image}
                            onDownload={onDownload}
                          />
                          <div className="absolute top-2 right-2 hidden group-hover:block">
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => confirmDelete("generation", generation.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trash" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <Badge variant="outline" className="mr-2">
                  {selectedImages.size} selected
                </Badge>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestore}
                  disabled={selectedImages.size === 0}
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Restore Selected
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => confirmDelete("selected")}
                  disabled={selectedImages.size === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Selected
                </Button>
              </div>
            </div>

            {filteredTrash.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                {searchTerm ? "No matching images found" : "Trash is empty"}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredTrash.map((image) => (
                  <ImageViewer
                    key={image.id}
                    image={image}
                    onDownload={onDownload}
                    onRestore={(id) => {
                      const restored = restoreFromTrash([id]);
                      onRestore(restored);
                      loadData();
                    }}
                    onDelete={(id) => {
                      deleteFromTrash([id]);
                      loadData();
                    }}
                    isTrash={true}
                    isSelected={selectedImages.has(image.id)}
                    onSelect={toggleImageSelection}
                  />
                ))}
              </div>
            )}

            {trash.length > 0 && (
              <div className="mt-6 flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => confirmDelete("all")}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Clear Trash
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation dialog for deletions */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {deleteTarget === "selected" && selectedImages.size > 0
                ? `Are you sure you want to permanently delete ${selectedImages.size} selected images?`
                : deleteTarget === "all"
                ? "Are you sure you want to permanently clear all items in the trash?"
                : "Are you sure you want to delete this generation and move its images to trash?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={executeDelete}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryTab;
