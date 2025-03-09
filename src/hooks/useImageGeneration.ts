
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
  const [hasError, setHasError] = useState(false);
  
  const updateGenerationSettings = useCallback((settings: Partial<GenerationSettings>) => {
    setGenerationSettings(prev => {
      const updated = { ...prev, ...settings };
      console.log("Generation settings updated:", updated);
      return updated;
    });
  }, []);
  
  const updatePromptSettings = useCallback((settings: Partial<PromptSettings>) => {
    setPromptSettings(prev => ({ ...prev, ...settings }));
  }, []);
  
  const generateNewImages = useCallback(async () => {
    try {
      // Clear any previous errors
      setHasError(false);
      setIsGenerating(true);
      
      // Make a copy of the current settings to avoid race conditions
      const currentGenerationSettings = { ...generationSettings };
      const currentPromptSettings = { ...promptSettings };
      
      console.log("Generating with settings:", currentGenerationSettings);
      console.log("Using prompt settings:", currentPromptSettings);
      console.log("AI Enhancer is:", currentGenerationSettings.aiEnhancer ? "ENABLED" : "DISABLED");
      
      // Validate settings
      if (!currentPromptSettings.characterName) {
        toast.error("Please enter a character name");
        setIsGenerating(false);
        return;
      }
      
      // Force fresh scene generation for each request
      let finalPromptScenes = "";
      
      try {
        toast.info("Generating prompt scenes...");
        console.log("Starting scene generation process");
        
        // Set the model from the current settings
        console.log(`Setting scene generator model to: ${currentGenerationSettings.llmModel}`);
        sceneGenerator.setModel(currentGenerationSettings.llmModel);
        
        // Force clear cache to ensure we get fresh prompts each time
        sceneGenerator.clearCache();
        
        // Generate new prompt scenes using current settings
        console.log(`Generating scenes with aiEnhancer=${currentGenerationSettings.aiEnhancer}`);
        
        // Force generation to use the parameter values at the time of clicking
        finalPromptScenes = await sceneGenerator.generate({
          useApi: currentGenerationSettings.aiEnhancer,
          start: currentGenerationSettings.start,
          mid: currentGenerationSettings.mid,
          end: currentGenerationSettings.end,
          extraInstructions: currentPromptSettings.arguments
        });
        
        console.log("Generated prompt scenes:", finalPromptScenes);
        
        toast.success("Prompt scenes generated successfully");
      } catch (error) {
        console.error("Error generating prompt scenes:", error);
        toast.error("Failed to generate prompt scenes, using fallbacks");
        // Use fallback prompts in case of failure
        finalPromptScenes = "casual pose / elegant pose / dramatic pose / action pose";
      }
      
      // Count the number of prompts in promptScenes (separated by /)
      const promptCount = finalPromptScenes.split('/').filter(p => p.trim()).length;
      
      if (promptCount === 0) {
        toast.error("Failed to generate valid prompt scenes");
        setIsGenerating(false);
        return;
      }
      
      toast.info(`Generating ${promptCount} images...`);
      
      // Generate images using the current settings and newly generated prompt scenes
      const newImages = await generateImages(
        currentGenerationSettings, 
        { ...currentPromptSettings, promptScenes: finalPromptScenes }, 
        promptCount
      );
      
      // If no images were returned (possible due to cancellation), just return
      if (newImages.length === 0) {
        setIsGenerating(false);
        return;
      }
      
      // Save as a new generation - use try/catch to handle quota errors
      try {
        const generation: Generation = {
          id: crypto.randomUUID(),
          images: newImages,
          timestamp: new Date(),
          settings: { ...currentGenerationSettings },
          prompts: { ...currentPromptSettings, promptScenes: finalPromptScenes }
        };
        
        // Save to history with compression to avoid quota issues
        saveToHistory(generation);
      } catch (error) {
        console.error("Error saving to history:", error);
        toast.error("Failed to save to history - storage quota exceeded");
      }
      
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
      setHasError(true);
    } finally {
      setIsGenerating(false);
    }
  }, [generationSettings, promptSettings, updateGenerationSettings]);
  
  const deleteImage = useCallback((imageId: string) => {
    // Find the image to delete
    const imageToDelete = currentImages.find(img => img.id === imageId);
    
    if (imageToDelete) {
      try {
        // Save to trash
        saveToTrash([imageToDelete]);
        
        // Remove from current images
        setCurrentImages(prev => prev.filter(img => img.id !== imageId));
        
        toast.success("Image moved to trash");
      } catch (error) {
        console.error("Error saving to trash:", error);
        // Just delete it from current images anyway
        setCurrentImages(prev => prev.filter(img => img.id !== imageId));
        toast.error("Failed to save to trash - storage quota exceeded");
      }
    }
  }, [currentImages]);
  
  const deleteAllImages = useCallback(() => {
    if (currentImages.length === 0) return;
    
    try {
      // Save all current images to trash
      saveToTrash([...currentImages]);
      
      // Clear current images
      setCurrentImages([]);
      
      toast.success(`${currentImages.length} images moved to trash`);
    } catch (error) {
      console.error("Error saving to trash:", error);
      // Just delete them from current images anyway
      setCurrentImages([]);
      toast.error("Failed to save to trash - storage quota exceeded");
    }
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
    restoreImages,
    hasError
  };
};
