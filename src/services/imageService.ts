
import { GeneratedImage, Generation, GenerationSettings, PromptSettings } from "../types";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ImageGenerator } from "../utils/imageGenerator";
import { toast } from "sonner";

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
    
    // If request was canceled or failed with known error, return empty array
    if (!result.success) {
      // Check specific cancellation or user-initiated errors
      if (result.error && (
        result.error.includes("canceled") || 
        result.error.includes("aborted") || 
        result.error.includes("user") ||
        result.error.includes("timeout")
      )) {
        console.log("Request was canceled by user or timeout");
        return [];
      }
      
      // For other errors, throw to be caught by the caller
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
    
    // Check if this is a user cancellation
    if (error instanceof Error && 
        (error.message.includes("canceled") || 
         error.message.includes("aborted") || 
         error.message.includes("user") ||
         error.message.includes("timeout"))) {
      console.log("Handling user cancellation as non-error");
      return [];
    }
    
    throw error;
  }
};

// Advanced quota-aware storage management
const MAX_HISTORY_ITEMS = 10; // Reduce from 20 to 10 for better quota management
const MAX_TRASH_ITEMS = 20; // Reduce from 100 to 20

// Advanced image compression for storage
const compressImageUrl = (url: string, level: number): string => {
  if (!url || !url.startsWith('data:')) return url;
  
  if (level >= 3) return null; // Most aggressive: don't store image data
  if (level >= 2) return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1px transparent GIF
  if (level >= 1) return url.substring(0, 1000) + '...'; // Truncate data URL
  
  return url; // No compression
};

// Helper function to reduce localStorage usage by compressing image data
const compressStorageData = (data: any, reductionLevel = 0): any => {
  if (!data) return data;
  
  // For arrays
  if (Array.isArray(data)) {
    return data.map(item => compressStorageData(item, reductionLevel));
  }
  
  // For objects
  if (typeof data === 'object') {
    const result: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Special handling for image URLs
      if (key === 'url' && typeof value === 'string') {
        result[key] = compressImageUrl(value, reductionLevel);
      } else {
        // Recursively process nested objects/arrays
        result[key] = compressStorageData(value, reductionLevel);
      }
    }
    
    return result;
  }
  
  // For primitive values
  return data;
};

// Get estimated size of an object in bytes
const getObjectSize = (obj: any): number => {
  const str = JSON.stringify(obj);
  // Estimate 2 bytes per character (UTF-16)
  return str.length * 2;
};

// Save generation to history with quota management
export const saveToHistory = (generation: Generation): void => {
  try {
    // Get existing history
    const history = getHistory();
    
    // Add the new generation at the beginning
    const updatedHistory = [generation, ...history];
    
    // Limit history size 
    const limitedHistory = updatedHistory.slice(0, MAX_HISTORY_ITEMS);
    
    // Try to save with progressive compression
    let saved = false;
    let compressionLevel = 0;
    
    while (!saved && compressionLevel <= 3) {
      try {
        const compressedData = compressStorageData(limitedHistory, compressionLevel);
        localStorage.setItem('imageGenerationHistory', JSON.stringify(compressedData));
        saved = true;
        
        if (compressionLevel > 0) {
          console.log(`Saved to history with compression level ${compressionLevel}`);
        }
      } catch (error) {
        compressionLevel++;
        
        if (compressionLevel > 3) {
          // Maximum compression failed, try with just the newest item
          try {
            const singleItem = compressStorageData([generation], 3);
            localStorage.setItem('imageGenerationHistory', JSON.stringify(singleItem));
            saved = true;
            toast.warning('History storage limit reached. Older items removed.');
          } catch (e) {
            console.error("Failed to save even with maximum compression:", e);
            toast.error('Failed to save to history due to storage limits');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in saveToHistory:', error);
    toast.error('Failed to save to history');
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
    // Get existing trash
    const trash: GeneratedImage[] = getTrash();
    
    // Add new images to the beginning
    const updatedTrash = [...images, ...trash];
    
    // Limit trash size
    const limitedTrash = updatedTrash.slice(0, MAX_TRASH_ITEMS);
    
    // Try to save with progressive compression
    let saved = false;
    let compressionLevel = 0;
    
    while (!saved && compressionLevel <= 3) {
      try {
        const compressedData = compressStorageData(limitedTrash, compressionLevel);
        localStorage.setItem("imageTrash", JSON.stringify(compressedData));
        saved = true;
        
        if (compressionLevel > 0) {
          console.log(`Saved to trash with compression level ${compressionLevel}`);
        }
      } catch (error) {
        compressionLevel++;
        
        if (compressionLevel > 3) {
          // Maximum compression failed, try with just the newest items
          try {
            const newItems = compressStorageData(images.slice(0, 2), 3);
            localStorage.setItem("imageTrash", JSON.stringify(newItems));
            saved = true;
            toast.warning('Trash storage limit reached. Older items removed.');
          } catch (e) {
            console.error("Failed to save trash even with maximum compression:", e);
            toast.error('Failed to save to trash due to storage limits');
          }
        }
      }
    }
  } catch (error) {
    console.error("Error saving to trash:", error);
    toast.error('Failed to save to trash');
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
    const trash: GeneratedImage[] = getTrash();
    
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

export const deleteFromHistory = (generationId: string): void => {
  try {
    // Get existing history
    const history: Generation[] = getHistory();
    
    // Find the generation to delete
    const generationToDelete = history.find(gen => gen.id === generationId);
    
    if (generationToDelete) {
      // Move images to trash
      saveToTrash(generationToDelete.images);
      
      // Remove from history
      const updatedHistory = history.filter(gen => gen.id !== generationId);
      
      // Save updated history with compression if needed
      try {
        localStorage.setItem("imageGenerationHistory", JSON.stringify(updatedHistory));
      } catch (error) {
        // If quota error, try with compression
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          const compressed = compressStorageData(updatedHistory, 1);
          localStorage.setItem("imageGenerationHistory", JSON.stringify(compressed));
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error("Error deleting from history:", error);
    toast.error("Failed to delete from history");
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
        if (image.url && image.url.startsWith('data:')) {
          const response = await fetch(image.url);
          const blob = await response.blob();
          
          // Add the image to the zip with a filename that includes the seed
          imgFolder.file(`image-${index+1}-seed-${image.seed}.jpg`, blob);
        } else if (image.url) {
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
    const trash: GeneratedImage[] = getTrash();
    
    // Remove selected images from trash
    const updatedTrash = trash.filter(img => !imageIds.includes(img.id));
    
    // Save updated trash
    localStorage.setItem("imageTrash", JSON.stringify(updatedTrash));
  } catch (error) {
    console.error("Error deleting from trash:", error);
    toast.error("Failed to delete from trash");
  }
};
