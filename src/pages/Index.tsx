
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
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

  // Generate full prompt preview
  const fullPromptPreview = `Character: ${promptSettings.characterName || "[Character Name]"}, ${promptSettings.characterBase || "[Base]"}
Wearing: ${promptSettings.clothingDetails || "[Clothing]"}
Scene: ${promptSettings.characterSceneDetails || "[Scene Details]"}
Background: ${promptSettings.background || "[Background]"}
Details: ${promptSettings.finalDetailQualityTags}
Negative: ${promptSettings.negativePrompt}
Civitai Lora: ${promptSettings.civitaiLora || "[None]"}`;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        generationSettings={generationSettings}
        promptSettings={promptSettings}
        onGenerationSettingsChange={updateGenerationSettings}
        onPromptSettingsChange={updatePromptSettings}
        onGenerate={generateNewImages}
        isGenerating={isGenerating}
      />
      
      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="mt-2"
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
                promptPreview={fullPromptPreview}
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
    </div>
  );
};

export default Index;
