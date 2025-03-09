/**
 * Utility for generating scene prompts with local fallbacks
 */
import { toast } from "sonner";

type SceneGenerationOptions = {
  useApi: boolean;
  start: number;
  mid: number;
  end: number;
  extraInstructions?: string;
};

class SceneGenerator {
  private model: string = "aion-labs/aion-1.0-mini";
  private apiUrl: string = "https://api.openrouter.ai/api/v1/chat/completions";
  private apiKey: string = "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";
  
  // Local fallback data
  private localFallbackData = {
    solo: [
      "wearing a bikini at the beach",
      "in a luxurious bedroom",
      "posing in front of a mirror",
      "sitting on a chair",
      "standing in a garden",
      "leaning against a wall",
      "looking out a window",
      "relaxing in a hot tub",
      "sitting on a couch",
      "walking down a street",
    ],
    couple: [
      "romantic dinner scene",
      "walking on the beach",
      "dancing together",
      "sitting on a bench",
      "embracing each other",
      "holding hands",
      "in a hot spring",
      "watching a sunset",
      "on a date",
      "under the stars",
    ],
    afetex: [
      "detailed clothing texture",
      "high quality lighting effects",
      "intricate hair details",
      "perfect skin rendering",
      "dramatic shadows",
      "cinematic composition",
      "hyper-realistic details",
      "professional photography style",
      "elegant pose",
      "expressive facial details",
    ]
  };
  
  // No cached prompts - force fresh generation each time
  private txtData: {
    solo?: string[];
    couple?: string[];
    afetex?: string[];
    fetchTime?: number;
  } = {};

  constructor() {
    // Initialize with local data
    this.txtData = {
      solo: [...this.localFallbackData.solo],
      couple: [...this.localFallbackData.couple],
      afetex: [...this.localFallbackData.afetex],
      fetchTime: Date.now()
    };
    
    // Try to load remote data but use local fallback if it fails
    this.loadTextFiles().catch(err => {
      console.warn("Using local fallback data due to error:", err);
    });
  }
  
  public setModel(model: string): void {
    this.model = model;
    console.log(`Scene generator model set to: ${model}`);
  }
  
  // Clear any cached data
  public clearCache(): void {
    // Reset to fallback data first
    this.txtData = {
      solo: [...this.localFallbackData.solo],
      couple: [...this.localFallbackData.couple],
      afetex: [...this.localFallbackData.afetex],
      fetchTime: Date.now()
    };
    
    console.log("Scene generator cache cleared");
    
    // Try to load remote data
    this.loadTextFiles().catch(err => {
      console.warn("Using local fallback data after cache clear due to error:", err);
    });
  }
  
  private async loadTextFiles(): Promise<void> {
    try {
      // Calculate the full URLs for public sample files instead of private repo
      const soloUrl = "https://raw.githubusercontent.com/lovable-sample-data/scene-prompts/main/solo.txt";
      const coupleUrl = "https://raw.githubusercontent.com/lovable-sample-data/scene-prompts/main/couple.txt";
      const afetexUrl = "https://raw.githubusercontent.com/lovable-sample-data/scene-prompts/main/afetex.txt";
      
      console.log("Loading scene text files from GitHub...");
      
      // Fetch all three files in parallel with timeouts
      const fetchWithTimeout = (url: string, timeout = 5000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        return fetch(url, { 
          cache: 'no-store',
          signal: controller.signal 
        }).finally(() => clearTimeout(timeoutId));
      };
      
      const [soloResponse, coupleResponse, afetexResponse] = await Promise.all([
        fetchWithTimeout(soloUrl),
        fetchWithTimeout(coupleUrl),
        fetchWithTimeout(afetexUrl)
      ]);
      
      if (!soloResponse.ok || !coupleResponse.ok || !afetexResponse.ok) {
        throw new Error("One or more text files failed to load");
      }
      
      // Parse the text files
      const soloText = await soloResponse.text();
      const coupleText = await coupleResponse.text();
      const afetexText = await afetexResponse.text();
      
      // Split by newlines and filter empty lines
      const soloLines = soloText.split('\n').filter(line => line.trim());
      const coupleLines = coupleText.split('\n').filter(line => line.trim());
      const afetexLines = afetexText.split('\n').filter(line => line.trim());
      
      // Only update if we got actual data
      if (soloLines.length > 0) this.txtData.solo = soloLines;
      if (coupleLines.length > 0) this.txtData.couple = coupleLines;
      if (afetexLines.length > 0) this.txtData.afetex = afetexLines;
      
      this.txtData.fetchTime = Date.now();
      
      console.log(`Loaded text files: ${this.txtData.solo.length} solo lines, ${this.txtData.couple.length} couple lines, ${this.txtData.afetex.length} afetex lines`);
    } catch (error) {
      console.error("Error loading text files:", error);
      // Keep using the local fallback data that's already set
      console.log("Using fallback data instead");
    }
  }
  
  // Select random lines from a text file
  private selectRandomLines(textArray: string[], count: number): string[] {
    if (!textArray || textArray.length === 0) {
      console.warn("Text array is empty, using fallback");
      return ["generic scene"];
    }
    
    // Ensure we're using a copy to avoid modifying the original
    const shuffled = [...textArray].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, textArray.length));
  }
  
  // Generate prompts based on the provided options
  public async generate(options: SceneGenerationOptions): Promise<string> {
    console.log("Starting scene generation with options:", options);
    
    try {
      // Always force a fresh selection for each generation
      // Select random lines from each file based on the parameters
      const soloLines = this.selectRandomLines(
        this.txtData.solo || this.localFallbackData.solo, 
        Math.max(1, Math.floor(options.start / 10))
      );
      
      const coupleLines = this.selectRandomLines(
        this.txtData.couple || this.localFallbackData.couple, 
        Math.max(1, Math.floor(options.mid / 10))
      );
      
      const afetexLines = this.selectRandomLines(
        this.txtData.afetex || this.localFallbackData.afetex, 
        Math.max(1, Math.floor(options.end / 10))
      );
      
      // Combine lines from different files
      const combinedPrompts = [...soloLines, ...coupleLines, ...afetexLines];
      const shuffled = combinedPrompts.sort(() => 0.5 - Math.random());
      
      // Select 4 prompts for images
      const selectedPrompts = shuffled.slice(0, 4);
      
      // If AI enhancement is requested, use the OpenRouter API
      if (options.useApi) {
        console.log("Using AI Enhancer with model:", this.model);
        try {
          return await this.enhanceWithAI(selectedPrompts, options.extraInstructions || "");
        } catch (error) {
          console.error("AI enhancement failed, falling back to raw prompts:", error);
          toast.error("AI enhancement failed, using original prompts");
          return selectedPrompts.join(" / ");
        }
      } else {
        console.log("AI Enhancer is disabled, using raw prompts");
        // Return the raw prompts separated by /
        return selectedPrompts.join(" / ");
      }
    } catch (error) {
      console.error("Error in scene generation:", error);
      toast.error("Failed to generate scenes. Using fallbacks.");
      // Return fallback prompts if all else fails
      return this.localFallbackData.solo.slice(0, 4).join(" / ");
    }
  }
  
  // Enhance prompts using the OpenRouter API
  private async enhanceWithAI(prompts: string[], extraInstructions: string): Promise<string> {
    try {
      console.log("Enhancing prompts with OpenRouter API");
      
      // Create a context with the prompts
      const promptText = prompts.join("\n");
      
      // Build the system prompt
      const systemPrompt = `As an AI assistant, enhance the following text prompts for image generation. 
Make them more descriptive and vivid, while maintaining their original theme. 
Format your response as a list of prompts separated by forward slashes (/), with NO JSON formatting.
Each enhanced prompt should be 1-3 sentences maximum. 
Use a suitable writing style for the content. 
Do not add any explanations, headers or extra text.
${extraInstructions ? `Additional instructions: ${extraInstructions}` : ''}`;
      
      console.log("Sending request to OpenRouter with model:", this.model);
      
      // Use a timeout for the fetch request
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(this.apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "Image Generator"
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: promptText }
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("OpenRouter API error:", errorText);
          throw new Error(`OpenRouter API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("OpenRouter API response:", data);
        
        if (!data.choices || data.choices.length === 0) {
          throw new Error("No response from OpenRouter API");
        }
        
        const enhancedText = data.choices[0].message.content.trim();
        console.log("Enhanced prompts:", enhancedText);
        
        // Clean up the response to make sure it's properly formatted
        return this.cleanEnhancedResponse(enhancedText);
      } catch (error) {
        clearTimeout(timeout);
        if (error.name === "AbortError") {
          throw new Error("OpenRouter API request timed out");
        }
        throw error;
      }
    } catch (error) {
      console.error("Error enhancing prompts:", error);
      // Fall back to the original prompts if enhancement fails
      return prompts.join(" / ");
    }
  }
  
  // Clean up the AI response to ensure it's properly formatted
  private cleanEnhancedResponse(text: string): string {
    // Remove any JSON formatting, markdown code blocks, etc.
    let cleaned = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/\[|\]|\{|\}/g, '')
      .replace(/"prompts":/g, '')
      .replace(/":/g, '')
      .replace(/"/g, '')
      .trim();
    
    // If the response doesn't include slashes, add them
    if (!cleaned.includes('/')) {
      // Split by newlines and join with slashes
      cleaned = cleaned.split('\n')
        .filter(line => line.trim())
        .map(line => line.trim())
        .join(' / ');
    }
    
    // Normalize slashes with spaces
    cleaned = cleaned.replace(/\s*\/\s*/g, ' / ');
    
    // Remove any leading/trailing slashes
    cleaned = cleaned.replace(/^\/\s*|\s*\/$/g, '');
    
    return cleaned;
  }
}

// Export a singleton instance
export const sceneGenerator = new SceneGenerator();
