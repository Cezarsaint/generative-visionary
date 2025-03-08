
/**
 * Scene Prompt Generator
 * Enhanced version for React implementation with improved parsing
 */

// Define the API key - In a production app, this should be in an environment variable
const API_KEY = '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';

export class SceneGenerator {
  private fileData: {
    solo: string | null;
    couple: string | null;
    afetex: string | null;
  };
  private fileUrls: Record<string, string>;
  private initialized: boolean;
  private model: string;

  constructor(model = 'aion-labs/aion-1.0-mini') {
    this.fileData = {
      solo: null,
      couple: null,
      afetex: null
    };
    this.fileUrls = {
      solo: 'https://huggingface.co/adbrasi/testedownload/resolve/main/solo.txt?download=true',
      couple: 'https://huggingface.co/adbrasi/testedownload/resolve/main/couple.txt?download=true',
      afetex: 'https://huggingface.co/adbrasi/testedownload/resolve/main/afetex.txt?download=true'
    };
    this.initialized = false;
    this.model = model;

    // Try to load cached data
    this.loadFromCache();
  }

  /**
   * Load data from localStorage cache if available
   */
  private loadFromCache(): void {
    try {
      const cachedData = localStorage.getItem('sceneGeneratorCache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.solo && parsed.couple && parsed.afetex) {
          this.fileData = parsed;
          this.initialized = true;
          console.log('Loaded scene generator data from cache');
        }
      }
    } catch (error) {
      console.warn('Failed to load from cache:', error);
    }
  }

  /**
   * Save data to localStorage cache
   */
  private saveToCache(): void {
    try {
      localStorage.setItem('sceneGeneratorCache', JSON.stringify(this.fileData));
      console.log('Saved scene generator data to cache');
    } catch (error) {
      console.warn('Failed to save to cache:', error);
    }
  }

  /**
   * Download a text file from a URL
   */
  private async fetchTextFile(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  }

  /**
   * Initialize the generator by loading all required text files
   */
  public async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      console.log('Initializing scene generator...');
      
      // Fetch all files in parallel
      const [soloText, coupleText, afetexText] = await Promise.all([
        this.fetchTextFile(this.fileUrls.solo),
        this.fetchTextFile(this.fileUrls.couple),
        this.fetchTextFile(this.fileUrls.afetex)
      ]);

      this.fileData.solo = soloText;
      this.fileData.couple = coupleText;
      this.fileData.afetex = afetexText;
      
      this.initialized = true;
      
      // Save to cache for future use
      this.saveToCache();
      
      console.log('Scene generator initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize generator:', error);
      return false;
    }
  }

  /**
   * Set the model to use for API calls
   */
  public setModel(model: string): void {
    this.model = model;
  }

  /**
   * Select random lines from text content
   */
  private selectLines(text: string, count: number): string[] {
    // Split text into trimmed, non-empty lines
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');
    
    const numLines = lines.length;
    const selected: number[] = [];
    const excluded = new Set<number>();

    // Select the required number of lines
    while (selected.length < count && excluded.size < numLines) {
      const candidates: number[] = [];
      for (let i = 0; i < numLines; i++) {
        if (!excluded.has(i)) {
          candidates.push(i);
        }
      }
      
      if (candidates.length === 0) {
        break; // No more valid lines available
      }

      // Randomly select a line
      const selectedIndex = candidates[Math.floor(Math.random() * candidates.length)];
      selected.push(selectedIndex);
      
      // Exclude the selected line, the line above, and the two below
      excluded.add(selectedIndex);
      if (selectedIndex > 0) excluded.add(selectedIndex - 1);
      if (selectedIndex + 1 < numLines) excluded.add(selectedIndex + 1);
      if (selectedIndex + 2 < numLines) excluded.add(selectedIndex + 2);
    }

    // Sort indices to maintain order from the original file
    selected.sort((a, b) => a - b);
    return selected.map(i => lines[i]);
  }

  /**
   * Call the OpenRouter API
   */
  private async callApi(prompt: string, extraInstructions: string): Promise<string> {
    try {
      console.log(`Calling API with model: ${this.model}`);
      console.log(`Raw prompt: ${prompt}`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: "Your output must be in JSON format. {scene_prompts:'prompt1/prompt2/prompt3...'}"
            },
            {
              role: 'user',
              content: `scene_prompts:"${prompt}" and here are the extra Instructions: ${extraInstructions || ''}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('API response:', result);
      
      const extractedPrompts = this.extractScenePrompts(result.choices[0].message.content);
      console.log('Extracted prompts:', extractedPrompts);
      
      return extractedPrompts;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  /**
   * Extract scene prompts from API response
   */
  private extractScenePrompts(content: string): string {
    console.log('Extracting scene prompts from:', content);
    
    // First, remove all think tags and their content (handles multiple variants)
    let cleaned = content.replace(/<\/?(?:think|uncensored_think)>[\s\S]*?<\/(?:think|uncensored_think)>/g, '');
    
    // Try to parse as JSON
    try {
      // Match JSON objects (handles both complete objects and partial matches)
      const jsonMatch = cleaned.match(/{[\s\S]*?}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        // Extract scene_prompts if available
        if (parsed.scene_prompts) {
          // Clean up the format
          return parsed.scene_prompts
            .replace(/\/+/g, '/') // Remove duplicate slashes
            .replace(/,+/g, ',')  // Remove duplicate commas
            .replace(/\s+/g, ' ') // Collapse multiple spaces
            .trim();
        }
      }
    } catch (e) {
      console.warn('Failed to parse JSON from API response, trying fallback method');
    }
    
    // Fallback: Look for scene_prompts key-value pattern
    const promptsMatch = cleaned.match(/scene_prompts['":\s]+([^}'"]+)/i);
    if (promptsMatch && promptsMatch[1]) {
      return promptsMatch[1]
        .replace(/\/+/g, '/') // Remove duplicate slashes
        .replace(/,+/g, ',')  // Remove duplicate commas
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
    }
    
    // Last resort: just return the cleaned string
    return cleaned
      .replace(/\/+/g, '/') // Remove duplicate slashes
      .replace(/,+/g, ',')  // Remove duplicate commas
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
  }

  /**
   * Generate a scene prompt
   */
  public async generate(options: {
    useApi?: boolean;
    start?: number;
    mid?: number;
    end?: number;
    extraInstructions?: string;
  }): Promise<string> {
    const { useApi = false, start = 1, mid = 1, end = 1, extraInstructions = '' } = options;
    
    console.log(`Generating scene prompt with options:`, options);
    
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) {
        throw new Error('Failed to initialize generator');
      }
    }

    // Select lines from each text source
    const startLines = this.selectLines(this.fileData.solo!, start);
    const midLines = this.selectLines(this.fileData.couple!, mid);
    const endLines = this.selectLines(this.fileData.afetex!, end);
    
    // Combine all lines
    const allLines = [...startLines, ...midLines, ...endLines];
    let rawPrompt = allLines.join('/').replace(/\/+/g, '/').trim();
    
    console.log('Generated raw prompt:', rawPrompt);
    
    // Return raw prompt if not using API
    if (!useApi) {
      return rawPrompt;
    }
    
    // Process with API
    try {
      return await this.callApi(rawPrompt, extraInstructions);
    } catch (error) {
      console.error('Error using API, returning raw prompt instead:', error);
      return rawPrompt;
    }
  }
}

// Create a singleton instance
export const sceneGenerator = new SceneGenerator();
