
import { GeneratedImage, Generation, GenerationSettings, PromptSettings } from "../types";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// In a real implementation, this would call your actual API
export const generateImages = async (
  settings: GenerationSettings,
  prompts: PromptSettings,
  count = 4
): Promise<GeneratedImage[]> => {
  // For now, we'll use the Lorem Picsum API as a placeholder
  console.log("Generating images with settings:", settings, "and prompts:", prompts);
  
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a batch of random images using Lorem Picsum
    const images: GeneratedImage[] = [];
    
    for (let i = 0; i < count; i++) {
      // Create a unique seed for each image
      const seed = Math.floor(Math.random() * 1000000);
      
      // Parse size dimensions
      const [width, height] = settings.size.split("x").map(Number);
      
      // Generate a unique ID for the image
      const id = crypto.randomUUID();
      
      // Use Lorem Picsum with the seed as a random identifier
      const url = `https://picsum.photos/seed/${seed}/${width}/${height}`;
      
      images.push({
        id,
        url,
        seed,
        timestamp: new Date(),
        settings: { ...settings },
        prompts: { ...prompts }
      });
    }
    
    return images;
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
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Use FileSaver for better cross-browser compatibility
    saveAs(blob, filename);
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
        const response = await fetch(image.url);
        const blob = await response.blob();
        
        // Add the image to the zip with a filename that includes the seed
        imgFolder.file(`image-${index+1}-seed-${image.seed}.jpg`, blob);
        
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
