
/**
 * Scene Prompt Generator
 * Enhanced version ready for React implementation with improved parsing
 */

// Core generator functionality
class SceneGenerator {
  private fileData: {
    solo: string | null;
    couple: string | null;
    afetex: string | null;
  };
  private fileUrls: {
    solo: string;
    couple: string;
    afetex: string;
  };
  private initialized: boolean;
  private model: string;
  private fileDataExpiry: number | null;

  constructor() {
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
    this.model = 'aion-labs/aion-1.0-mini';
    this.fileDataExpiry = null;
    
    // Try to load cached data from localStorage
    this.loadFromCache();
  }

  /**
   * Set the OpenRouter model to use
   */
  setModel(model: string) {
    this.model = model;
    console.log(`Scene generator model set to: ${model}`);
  }

  /**
   * Load cached data from localStorage if available
   */
  private loadFromCache() {
    try {
      const cachedData = localStorage.getItem('sceneGeneratorCache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        
        // Check if data is still valid (24 hours)
        if (parsed.expiry && parsed.expiry > Date.now()) {
          console.log('Loading scene generator data from cache');
          this.fileData = parsed.fileData;
          this.fileDataExpiry = parsed.expiry;
          
          // Verify all data is present
          if (this.fileData.solo && this.fileData.couple && this.fileData.afetex) {
            this.initialized = true;
          }
        } else {
          console.log('Cache expired, will fetch fresh data');
          localStorage.removeItem('sceneGeneratorCache');
        }
      }
    } catch (error) {
      console.error('Error loading scene generator cache:', error);
      localStorage.removeItem('sceneGeneratorCache');
    }
  }

  /**
   * Save data to localStorage cache
   */
  private saveToCache() {
    try {
      const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      const cacheData = {
        fileData: this.fileData,
        expiry
      };
      
      localStorage.setItem('sceneGeneratorCache', JSON.stringify(cacheData));
      this.fileDataExpiry = expiry;
      console.log('Scene generator data cached until', new Date(expiry).toLocaleString());
    } catch (error) {
      console.error('Error caching scene generator data:', error);
    }
  }

  /**
   * Download a text file from a URL
   * @param {string} url - URL to download from
   * @returns {Promise<string>} - Text content of the file
   */
  async fetchTextFile(url: string): Promise<string> {
    console.log(`Fetching text file: ${url}`);
    const response = await fetch(url, {
      cache: 'no-store', // Skip the browser cache for fresh data
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  }

  /**
   * Initialize the generator by loading all required text files
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      console.log('Scene generator already initialized');
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
      
      // Save to cache
      this.saveToCache();
      
      this.initialized = true;
      console.log('Scene generator initialization complete');
      return true;
    } catch (error) {
      console.error('Failed to initialize scene generator:', error);
      return false;
    }
  }

  /**
   * Select random lines from text content
   * @param {string} text - Text content to select from
   * @param {number} count - Number of lines to select
   * @returns {string[]} - Selected lines
   */
  selectLines(text: string, count: number): string[] {
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
   * @param {string} prompt - Raw prompt to send to API
   * @param {string} extraInstructions - Additional instructions for the API
   * @returns {Promise<string>} - Processed prompt from API
   */
  async callApi(prompt: string, extraInstructions: string): Promise<string> {
    try {
      console.log(`Calling OpenRouter API with model: ${this.model}`);
      console.log(`Prompt: ${prompt}`);
      console.log(`Extra instructions: ${extraInstructions || '(none)'}`);

      const apiKey = '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';
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: "Generate scene prompts based on the input. Your output should be a series of scene descriptions separated by slashes (/)."
            },
            {
              role: 'user',
              content: `Base prompts: "${prompt}" 
              Please improve these prompts and create a series of scenes based on them.
              Extra instructions: ${extraInstructions || 'Make them vivid and detailed.'}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('API response:', result);
      
      // Extract the content from the response
      const content = result.choices?.[0]?.message?.content || '';
      const extractedPrompt = this.extractScenePrompts(content);
      
      console.log('Extracted prompt scenes:', extractedPrompt);
      return extractedPrompt;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  /**
   * Extract scene prompts from API response with improved handling of JSON-like content
   * @param {string} content - API response content
   * @returns {string} - Cleaned scene prompts
   */
  extractScenePrompts(content: string): string {
    console.log('Extracting prompt scenes from:', content);
    
    // First, remove all think tags and their content (handles multiple variants)
    let cleaned = content.replace(/<\/?(?:think|uncensored_think)>[\s\S]*?<\/(?:think|uncensored_think)>/g, '');
    
    // Improved extraction strategy - look for series of scenes separated by slashes
    const scenes: string[] = [];
    
    // Method 1: Look for blocks of text with slashes
    const slashSeparatedBlocks = cleaned.split(/\n+/).filter(block => block.includes('/'));
    
    for (const block of slashSeparatedBlocks) {
      const parts = block.split('/').map(p => p.trim()).filter(p => p);
      scenes.push(...parts);
    }
    
    // Method 2: If no slash-separated blocks found, look for numbered or bulleted lists
    if (scenes.length === 0) {
      const listItems = cleaned.match(/(?:^|\n)(?:[•\-*]|\d+[\.\)])\s*(.+?)(?=(?:\n[•\-*]|\n\d+[\.\)]|\n\n|$))/g);
      
      if (listItems && listItems.length > 0) {
        for (const item of listItems) {
          // Extract just the content after the bullet or number
          const content = item.replace(/(?:^|\n)(?:[•\-*]|\d+[\.\)])\s*/, '').trim();
          if (content) scenes.push(content);
        }
      }
    }
    
    // If we still don't have scenes, try to extract from any quotes
    if (scenes.length === 0) {
      const quotes = cleaned.match(/["'](.+?)["']/g);
      if (quotes && quotes.length > 0) {
        for (const quote of quotes) {
          const content = quote.replace(/^["']|["']$/g, '').trim();
          if (content) scenes.push(content);
        }
      }
    }
    
    // Last resort: split by newlines and take non-empty lines that look like scenes
    if (scenes.length === 0) {
      const lines = cleaned.split('\n')
        .map(line => line.trim())
        .filter(line => 
          line && 
          line.length > 15 && // Reasonable length for a scene
          !line.includes(':') && // Not a label
          !line.startsWith('Scene') // Not a header
        );
      
      scenes.push(...lines);
    }
    
    // If we still have nothing, just return the original content
    if (scenes.length === 0) {
      return cleaned
        .replace(/\/+/g, '/') // Remove duplicate slashes
        .replace(/,+/g, ',')  // Remove duplicate commas
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
    }
    
    // Join scenes with slashes
    return scenes.join(' / ')
      .replace(/\/+/g, '/') // Remove duplicate slashes
      .replace(/,+/g, ',')  // Remove duplicate commas
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
  }

  /**
   * Generate a scene prompt
   * @param {Object} options - Configuration options
   * @param {boolean} options.useApi - Whether to use the API for processing
   * @param {number} options.start - Number of lines from solo text
   * @param {number} options.mid - Number of lines from couple text
   * @param {number} options.end - Number of lines from afetex text
   * @param {string} options.extraInstructions - Additional instructions for API
   * @returns {Promise<string>} - Generated scene prompt
   */
  async generate({ 
    useApi = false, 
    start = 1, 
    mid = 1, 
    end = 1, 
    extraInstructions = '' 
  }: {
    useApi?: boolean;
    start?: number;
    mid?: number;
    end?: number;
    extraInstructions?: string;
  }): Promise<string> {
    console.log(`Generating scene prompt with: useApi=${useApi}, start=${start}, mid=${mid}, end=${end}`);
    
    if (!this.initialized) {
      console.log('Scene generator not initialized, initializing now...');
      const success = await this.initialize();
      if (!success) {
        throw new Error('Failed to initialize scene generator');
      }
    }

    // Select lines from each text source
    const startLines = this.selectLines(this.fileData.solo!, start);
    const midLines = this.selectLines(this.fileData.couple!, mid);
    const endLines = this.selectLines(this.fileData.afetex!, end);
    
    console.log(`Selected ${startLines.length} start lines, ${midLines.length} mid lines, ${endLines.length} end lines`);
    
    // Combine all lines
    const allLines = [...startLines, ...midLines, ...endLines];
    let rawPrompt = allLines.join('/').replace(/\/+/g, '/').trim();
    
    console.log('Raw prompt:', rawPrompt);
    
    // Return raw prompt if not using API
    if (!useApi) {
      return rawPrompt;
    }
    
    // Process with API
    try {
      console.log('Using API to enhance prompt');
      return await this.callApi(rawPrompt, extraInstructions);
    } catch (error) {
      console.error('Error using API, returning raw prompt instead:', error);
      return rawPrompt;
    }
  }
}

// Create a singleton instance
const sceneGenerator = new SceneGenerator();

export { SceneGenerator, sceneGenerator };
