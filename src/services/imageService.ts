import { GeneratedImage, Generation, GenerationSettings, PromptSettings } from "../types";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ImageGenerator } from "../utils/imageGenerator";

// Create an instance of our ImageGenerator
const imageGenerator = new ImageGenerator();

// Parse image size string into width and height
const parseImageSize = (size: string): { width: number, height: number } => {
  const [width, height] = size.split("x").map(Number);
  return { width, height };
};

// Generate images using our API
export const generateImages = async (
  settings: GenerationSettings,
  prompts: PromptSettings,
  count = 4
): Promise<GeneratedImage[]> => {
  console.log("Generating images with settings:", settings, "and prompts:", prompts);
  
  try {
    // Map our application settings to the API options
    const { width, height } = parseImageSize(settings.size);
    
    // Map promptSettings to character options
    const characterOptions = {
      organization: settings.style, // Style maps to organization
      character_name: prompts.characterName,
      character_base: prompts.characterBase,
      character_scene_details: prompts.clothingDetails, // Clothing Details maps to character_scene_details
      background: prompts.background,
      final_details_quality_tags: prompts.finalDetailQualityTags,
      prompt_scenes: prompts.promptScenes
    };
    
    // Map generationSettings to API options
    const apiOptions = {
      width,
      height,
      seed: settings.seed,
      image_format: "webp", // Default to webp for better quality/size ratio
      optimize_size: true,
      image_quality: 85,
      negative_prompt: prompts.negativePrompt,
      ...(prompts.civitaiLora ? { lora_air: prompts.civitaiLora } : {})
    };
    
    // Call the API through our generator
    const result = await imageGenerator.generateImages(characterOptions, apiOptions);
    
    // If request was canceled or failed, just return an empty array instead of throwing
    if (!result.success) {
      if (result.error && result.error.includes("canceled")) {
        console.log("Request was canceled by user");
        return [];
      }
      throw new Error(result.error || "Failed to generate images");
    }
    
    if (!result.images || result.images.length === 0) {
      throw new Error("No images were generated");
    }
    
    // Map the API response to our application's image format
    const generatedImages: GeneratedImage[] = result.images.map(img => ({
      id: crypto.randomUUID(),
      url: img.viewUrl, // Use the data URL directly
      seed: settings.seed, // Use the same seed for all images in one generation
      timestamp: new Date(),
      settings: { ...settings },
      prompts: { ...prompts }
    }));
    
    return generatedImages;
  } catch (error) {
    console.error("Error generating images:", error);
    throw error;
  }
};

export const saveToHistory = (generation: Generation): void => {
  try {
    // Get existing history from localStorage
    const historyJson = localStorage.getItem("imageGenerationHistory");
    const history: Generation[] = historyJson ? JSON.parse(historyJson) : [];
    
    // Add new generation to history (at the beginning)
    history.unshift(generation);
    
    // Limit history to last 20 generations to prevent localStorage from getting too large
    const limitedHistory = history.slice(0, 20);
    
    // Save updated history back to localStorage
    localStorage.setItem("imageGenerationHistory", JSON.stringify(limitedHistory));
  } catch (error) {
    console.error("Error saving to history:", error);
  }
};

export const getHistory = (): Generation[] => {
  try {
    const historyJson = localStorage.getItem("imageGenerationHistory");
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error("Error getting history:", error);
    return [];
  }
};

export const saveToTrash = (images: GeneratedImage[]): void => {
  try {
    // Get existing trash from localStorage
    const trashJson = localStorage.getItem("imageTrash");
    const trash: GeneratedImage[] = trashJson ? JSON.parse(trashJson) : [];
    
    // Add images to trash
    trash.unshift(...images);
    
    // Limit trash to last 100 images
    const limitedTrash = trash.slice(0, 100);
    
    // Save updated trash back to localStorage
    localStorage.setItem("imageTrash", JSON.stringify(limitedTrash));
  } catch (error) {
    console.error("Error saving to trash:", error);
  }
};

export const getTrash = (): GeneratedImage[] => {
  try {
    const trashJson = localStorage.getItem("imageTrash");
    return trashJson ? JSON.parse(trashJson) : [];
  } catch (error) {
    console.error("Error getting trash:", error);
    return [];
  }
};

export const clearTrash = (): void => {
  localStorage.removeItem("imageTrash");
};

export const restoreFromTrash = (imageIds: string[]): GeneratedImage[] => {
  try {
    // Get existing trash
    const trashJson = localStorage.getItem("imageTrash");
    const trash: GeneratedImage[] = trashJson ? JSON.parse(trashJson) : [];
    
    // Find images to restore
    const imagesToRestore = trash.filter(img => imageIds.includes(img.id));
    
    // Remove restored images from trash
    const updatedTrash = trash.filter(img => !imageIds.includes(img.id));
    
    // Save updated trash
    localStorage.setItem("imageTrash", JSON.stringify(updatedTrash));
    
    return imagesToRestore;
  } catch (error) {
    console.error("Error restoring from trash:", error);
    return [];
  }
};

export const downloadImage = async (imageUrl: string, filename: string): Promise<void> => {
  try {
    // For data URLs, we can directly convert to blob
    if (imageUrl.startsWith('data:')) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Use FileSaver for better cross-browser compatibility
      saveAs(blob, filename);
    } else {
      // For regular URLs, fetch first
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      saveAs(blob, filename);
    }
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
};

export const downloadAllImages = async (images: GeneratedImage[]): Promise<void> => {
  try {
    if (images.length === 0) {
      throw new Error("No images to download");
    }
    
    // Create a new JSZip instance
    const zip = new JSZip();
    
    // Create a folder for the images
    const imgFolder = zip.folder("generated-images");
    
    if (!imgFolder) {
      throw new Error("Failed to create zip folder");
    }
    
    // Add each image to the zip
    const fetchPromises = images.map(async (image, index) => {
      try {
        // For data URLs, we need to convert to blob
        if (image.url.startsWith('data:')) {
          const response = await fetch(image.url);
          const blob = await response.blob();
          
          // Add the image to the zip with a filename that includes the seed
          imgFolder.file(`image-${index+1}-seed-${image.seed}.jpg`, blob);
        } else {
          // For regular URLs, fetch first
          const response = await fetch(image.url);
          const blob = await response.blob();
          
          imgFolder.file(`image-${index+1}-seed-${image.seed}.jpg`, blob);
        }
        
        // Return the index for progress tracking
        return index;
      } catch (error) {
        console.error(`Error fetching image ${index}:`, error);
        throw error;
      }
    });
    
    // Wait for all fetches to complete
    await Promise.all(fetchPromises);
    
    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    
    // Create a timestamp for the filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    
    // Download the zip file
    saveAs(zipBlob, `generated-images-${timestamp}.zip`);
  } catch (error) {
    console.error("Error downloading all images:", error);
    throw error;
  }
};

export const deleteFromTrash = (imageIds: string[]): void => {
  try {
    // Get existing trash
    const trashJson = localStorage.getItem("imageTrash");
    const trash: GeneratedImage[] = trashJson ? JSON.parse(trashJson) : [];
    
    // Remove selected images from trash
    const updatedTrash = trash.filter(img => !imageIds.includes(img.id));
    
    // Save updated trash
    localStorage.setItem("imageTrash", JSON.stringify(updatedTrash));
  } catch (error) {
    console.error("Error deleting from trash:", error);
  }
};
