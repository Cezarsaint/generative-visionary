
/**
 * Utility for generating scene prompts
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
  
  // No cached prompts - force fresh generation each time
  private txtData: {
    solo?: string[];
    couple?: string[];
    afetex?: string[];
    fetchTime?: number;
  } = {};

  constructor() {
    // Load text files on initialization
    this.loadTextFiles();
  }
  
  public setModel(model: string): void {
    this.model = model;
    console.log(`Scene generator model set to: ${model}`);
  }
  
  // Clear any cached data
  public clearCache(): void {
    this.txtData = {};
    console.log("Scene generator cache cleared");
    this.loadTextFiles();
  }
  
  private async loadTextFiles(): Promise<void> {
    try {
      // Calculate the full URLs for Hugging Face hosted files
      const soloUrl = "https://huggingface.co/datasets/Aionnau/lovescenedata/resolve/main/solo.txt";
      const coupleUrl = "https://huggingface.co/datasets/Aionnau/lovescenedata/resolve/main/couple.txt";
      const afetexUrl = "https://huggingface.co/datasets/Aionnau/lovescenedata/resolve/main/afetex.txt";
      
      console.log("Loading scene text files from Hugging Face...");
      
      // Fetch all three files in parallel
      const [soloResponse, coupleResponse, afetexResponse] = await Promise.all([
        fetch(soloUrl, { cache: 'no-store' }), // Force no caching
        fetch(coupleUrl, { cache: 'no-store' }),
        fetch(afetexUrl, { cache: 'no-store' })
      ]);
      
      // Parse the text files
      const soloText = await soloResponse.text();
      const coupleText = await coupleResponse.text();
      const afetexText = await afetexResponse.text();
      
      // Split by newlines and filter empty lines
      this.txtData.solo = soloText.split('\n').filter(line => line.trim());
      this.txtData.couple = coupleText.split('\n').filter(line => line.trim());
      this.txtData.afetex = afetexText.split('\n').filter(line => line.trim());
      this.txtData.fetchTime = Date.now();
      
      console.log(`Loaded text files: ${this.txtData.solo.length} solo lines, ${this.txtData.couple.length} couple lines, ${this.txtData.afetex.length} afetex lines`);
    } catch (error) {
      console.error("Error loading text files:", error);
      throw new Error("Failed to load prompt text files");
    }
  }
  
  // Select random lines from a text file
  private selectRandomLines(textArray: string[], count: number): string[] {
    if (!textArray || textArray.length === 0) {
      throw new Error("Text array is empty");
    }
    
    const shuffled = [...textArray].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, textArray.length));
  }
  
  // Generate prompts based on the provided options
  public async generate(options: SceneGenerationOptions): Promise<string> {
    console.log("Starting scene generation with options:", options);
    
    // Reload text files if they're older than 1 hour or don't exist
    const oneHourMs = 60 * 60 * 1000;
    if (!this.txtData.fetchTime || Date.now() - this.txtData.fetchTime > oneHourMs || 
        !this.txtData.solo || !this.txtData.couple || !this.txtData.afetex) {
      console.log("Text files are stale or missing, reloading...");
      await this.loadTextFiles();
    }
    
    try {
      // Select random lines from each file based on the parameters
      const soloLines = this.selectRandomLines(this.txtData.solo || [], Math.max(1, Math.floor(options.start / 10)));
      const coupleLines = this.selectRandomLines(this.txtData.couple || [], Math.max(1, Math.floor(options.mid / 10)));
      const afetexLines = this.selectRandomLines(this.txtData.afetex || [], Math.max(1, Math.floor(options.end / 10)));
      
      // Combine lines from different files
      const combinedPrompts = [...soloLines, ...coupleLines, ...afetexLines];
      const shuffled = combinedPrompts.sort(() => 0.5 - Math.random());
      
      // Select 4 prompts for images
      const selectedPrompts = shuffled.slice(0, 4);
      
      // If AI enhancement is requested, use the OpenRouter API
      if (options.useApi) {
        console.log("Using AI Enhancer with model:", this.model);
        return await this.enhanceWithAI(selectedPrompts, options.extraInstructions || "");
      } else {
        console.log("AI Enhancer is disabled, using raw prompts");
        // Return the raw prompts separated by /
        return selectedPrompts.join(" / ");
      }
    } catch (error) {
      console.error("Error in scene generation:", error);
      throw new Error("Failed to generate scenes");
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
        })
      });
      
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
      console.error("Error enhancing prompts:", error);
      // Fall back to the original prompts if enhancement fails
      toast.error("AI enhancement failed, using original prompts");
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
