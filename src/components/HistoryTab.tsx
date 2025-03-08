
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  Trash, 
  Download, 
  RefreshCw 
} from "lucide-react";
import { Generation, GeneratedImage } from "@/types";
import { getHistory, getTrash, clearTrash, restoreFromTrash } from "@/services/imageService";

interface HistoryTabProps {
  onRestore: (images: GeneratedImage[]) => void;
  onDownload: (imageId: string) => void;
}

const HistoryTab = ({ onRestore, onDownload }: HistoryTabProps) => {
  const [activeTab, setActiveTab] = useState<string>("history");
  const [history, setHistory] = useState<Generation[]>(getHistory());
  const [trash, setTrash] = useState<GeneratedImage[]>(getTrash());
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  const refreshHistory = () => {
    setHistory(getHistory());
  };

  const refreshTrash = () => {
    setTrash(getTrash());
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSelectedItems({});
    if (value === "history") {
      refreshHistory();
    } else {
      refreshTrash();
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const selectAll = () => {
    const newSelectedItems: Record<string, boolean> = {};
    
    if (activeTab === "history") {
      history.forEach(gen => {
        newSelectedItems[gen.id] = true;
      });
    } else {
      trash.forEach(img => {
        newSelectedItems[img.id] = true;
      });
    }
    
    setSelectedItems(newSelectedItems);
  };

  const deselectAll = () => {
    setSelectedItems({});
  };

  const handleClearTrash = () => {
    clearTrash();
    setTrash([]);
    setSelectedItems({});
  };

  const handleRestoreFromTrash = () => {
    const selectedIds = Object.entries(selectedItems)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);
    
    if (selectedIds.length === 0) return;
    
    const restoredImages = restoreFromTrash(selectedIds);
    onRestore(restoredImages);
    refreshTrash();
    setSelectedItems({});
  };

  const getSelectedCount = () => {
    return Object.values(selectedItems).filter(Boolean).length;
  };

  return (
    <div className="w-full glassmorphism rounded-xl p-4 transition-all duration-300 animate-slide-up">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="trash" className="flex items-center gap-2">
              <Trash className="h-4 w-4" />
              Trash
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            {getSelectedCount() > 0 && (
              <span className="text-sm text-muted-foreground self-center">
                {getSelectedCount()} selected
              </span>
            )}
            
            {getSelectedCount() > 0 ? (
              <Button variant="ghost" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Select All
              </Button>
            )}
            
            {activeTab === "history" ? (
              <Button variant="outline" size="sm" onClick={refreshHistory}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshTrash}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <TabsContent value="history" className="mt-2">
          {history.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-lg font-medium">No Generation History</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Generate some images to see your history
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((generation) => (
                <div key={generation.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`select-${generation.id}`}
                        checked={!!selectedItems[generation.id]}
                        onChange={() => toggleSelectItem(generation.id)}
                        className="rounded-sm"
                      />
                      <h3 className="text-sm font-medium">
                        {new Date(generation.timestamp).toLocaleString()} • {generation.images.length} images
                      </h3>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {generation.settings.template}, {generation.settings.style}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {generation.images.map((image) => (
                      <Card key={image.id} className="overflow-hidden relative group">
                        <div className="aspect-square">
                          <img
                            src={image.url}
                            alt={`Generated on ${new Date(image.timestamp).toLocaleString()}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onDownload(image.id)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="trash" className="mt-2">
          {trash.length === 0 ? (
            <div className="text-center py-8">
              <Trash className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-lg font-medium">Trash is Empty</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Deleted images will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearTrash}
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  Empty Trash
                </Button>
                
                {getSelectedCount() > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRestoreFromTrash}
                  >
                    Restore Selected
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {trash.map((image) => (
                  <Card 
                    key={image.id} 
                    className={`overflow-hidden relative group ${
                      selectedItems[image.id] ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => toggleSelectItem(image.id)}
                  >
                    <div className="aspect-square cursor-pointer">
                      <img
                        src={image.url}
                        alt={`Deleted image ${image.seed}`}
                        className="w-full h-full object-cover"
                      />
                      <div 
                        className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                          selectedItems[image.id] ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!selectedItems[image.id]}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelectItem(image.id);
                          }}
                          className="h-5 w-5"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoryTab;
