import { useState, useCallback } from "react";
import { 
  GeneratedImage, 
  Generation, 
  GenerationSettings, 
  PromptSettings
} from "../types";
import { 
  generateImages, 
  saveToHistory, 
  saveToTrash,
  downloadImage,
  downloadAllImages
} from "../services/imageService";
import { toast } from "sonner";
import { sceneGenerator } from "../utils/sceneGenerator";

const defaultGenerationSettings: GenerationSettings = {
  template: "Portrait",
  style: "Realistic", // This maps to "organization" in the API
  aiEnhancer: true,
  seed: Math.floor(Math.random() * 1000000),
  size: "1344x768",
  start: 30,
  mid: 60,
  end: 90,
  llmModel: "aion-labs/aion-1.0-mini"
};

const defaultPromptSettings: PromptSettings = {
  characterName: "",
  characterBase: "",
  clothingDetails: "", // This maps to "character_scene_details" in the API
  characterSceneDetails: "",
  background: "",
  finalDetailQualityTags: "high detail, 8k, ultra realistic",
  promptScenes: "",
  arguments: "",
  negativePrompt: "deformed, distorted, disfigured, low quality",
  civitaiLora: ""
};

export const useImageGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImages, setCurrentImages] = useState<GeneratedImage[]>([]);
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>(defaultGenerationSettings);
  const [promptSettings, setPromptSettings] = useState<PromptSettings>(defaultPromptSettings);
  
  const updateGenerationSettings = useCallback((settings: Partial<GenerationSettings>) => {
    setGenerationSettings(prev => ({ ...prev, ...settings }));
  }, []);
  
  const updatePromptSettings = useCallback((settings: Partial<PromptSettings>) => {
    setPromptSettings(prev => ({ ...prev, ...settings }));
  }, []);
  
  const generateNewImages = useCallback(async () => {
    try {
      setIsGenerating(true);
      
      // Validate settings
      if (!promptSettings.characterName) {
        toast.error("Please enter a character name");
        setIsGenerating(false);
        return;
      }
      
      // If promptScenes is empty and aiEnhancer is true, generate prompt scenes
      let finalPromptScenes = promptSettings.promptScenes;
      if (!finalPromptScenes.trim()) {
        try {
          toast.info("Generating prompt scenes...");
          
          // Set the model first
          sceneGenerator.setModel(generationSettings.llmModel);
          
          // Generate the prompt scenes
          finalPromptScenes = await sceneGenerator.generate({
            useApi: generationSettings.aiEnhancer,
            start: generationSettings.start,
            mid: generationSettings.mid,
            end: generationSettings.end,
            extraInstructions: promptSettings.arguments
          });
          
          // Update the promptSettings with the generated scenes
          updatePromptSettings({
            promptScenes: finalPromptScenes
          });
          
          toast.success("Prompt scenes generated successfully");
        } catch (error) {
          console.error("Error generating prompt scenes:", error);
          toast.error("Failed to generate prompt scenes");
          setIsGenerating(false);
          return;
        }
      }
      
      // Count the number of prompts in promptScenes (separated by /)
      const promptCount = finalPromptScenes.split('/').filter(p => p.trim()).length;
      
      if (promptCount === 0) {
        toast.error("Please enter at least one valid prompt scene");
        setIsGenerating(false);
        return;
      }
      
      toast.info(`Generating ${promptCount} images...`);
      
      // Generate images
      const newImages = await generateImages(
        generationSettings, 
        { ...promptSettings, promptScenes: finalPromptScenes }, 
        promptCount
      );
      
      // Save as a new generation
      const generation: Generation = {
        id: crypto.randomUUID(),
        images: newImages,
        timestamp: new Date(),
        settings: { ...generationSettings },
        prompts: { ...promptSettings, promptScenes: finalPromptScenes }
      };
      
      // Save to history
      saveToHistory(generation);
      
      // Update current images
      setCurrentImages(newImages);
      
      // Generate a new random seed for next generation
      updateGenerationSettings({
        seed: Math.floor(Math.random() * 1000000)
      });
      
      toast.success(`Generated ${newImages.length} images`);
    } catch (error) {
      console.error("Error generating images:", error);
      toast.error("Failed to generate images");
    } finally {
      setIsGenerating(false);
    }
  }, [generationSettings, promptSettings, updateGenerationSettings, updatePromptSettings]);
  
  const deleteImage = useCallback((imageId: string) => {
    // Find the image to delete
    const imageToDelete = currentImages.find(img => img.id === imageId);
    
    if (imageToDelete) {
      // Save to trash
      saveToTrash([imageToDelete]);
      
      // Remove from current images
      setCurrentImages(prev => prev.filter(img => img.id !== imageId));
      
      toast.success("Image moved to trash");
    }
  }, [currentImages]);
  
  const deleteAllImages = useCallback(() => {
    if (currentImages.length === 0) return;
    
    // Save all current images to trash
    saveToTrash([...currentImages]);
    
    // Clear current images
    setCurrentImages([]);
    
    toast.success(`${currentImages.length} images moved to trash`);
  }, [currentImages]);
  
  const downloadSingleImage = useCallback(async (imageId: string) => {
    const image = currentImages.find(img => img.id === imageId);
    
    if (image) {
      try {
        const filename = `generated-image-${image.seed}.jpg`;
        await downloadImage(image.url, filename);
        toast.success("Image downloaded");
      } catch (error) {
        console.error("Error downloading image:", error);
        toast.error("Failed to download image");
      }
    }
  }, [currentImages]);
  
  const downloadAll = useCallback(async () => {
    if (currentImages.length === 0) {
      toast.error("No images to download");
      return;
    }
    
    try {
      toast.info(`Downloading ${currentImages.length} images...`);
      await downloadAllImages(currentImages);
      toast.success("All images downloaded");
    } catch (error) {
      console.error("Error downloading all images:", error);
      toast.error("Failed to download all images");
    }
  }, [currentImages]);
  
  const restoreImages = useCallback((restoredImages: GeneratedImage[]) => {
    setCurrentImages(prev => [...restoredImages, ...prev]);
    toast.success(`${restoredImages.length} images restored`);
  }, []);
  
  return {
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
  };
};
