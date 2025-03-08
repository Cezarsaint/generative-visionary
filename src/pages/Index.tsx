
import { useState } from "react";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import ImageCanvas from "@/components/ImageCanvas";
import HistoryTab from "@/components/HistoryTab";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePlus, History } from "lucide-react";

const Index = () => {
  const { 
    isGenerating,
    currentImages,
    generationSettings,
    promptSettings,
    updateGenerationSettings,
    updatePromptSettings,
    generateNewImages,
    deleteImage,
    deleteAllImages,
    downloadSingleImage,
    downloadAll,
    restoreImages
  } = useImageGeneration();

  const [activeTab, setActiveTab] = useState<string>("canvas");

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50">
      <Header 
        settings={generationSettings}
        onSettingsChange={updateGenerationSettings}
        onGenerate={generateNewImages}
        isGenerating={isGenerating}
      />
      
      <Navbar 
        prompts={promptSettings}
        onPromptsChange={updatePromptSettings}
      />
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="mt-6"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="canvas" className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4" />
            Current Generation
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History & Trash
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="canvas" className="animate-fade-in">
          <div className="glassmorphism rounded-xl p-6">
            <ImageCanvas 
              images={currentImages}
              onDelete={deleteImage}
              onDownload={downloadSingleImage}
              onDownloadAll={downloadAll}
              isGenerating={isGenerating}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="animate-fade-in">
          <HistoryTab 
            onRestore={restoreImages}
            onDownload={downloadSingleImage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
