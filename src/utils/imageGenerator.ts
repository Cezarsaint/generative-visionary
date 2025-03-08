
/**
 * Efficient image generation API client that returns data URLs
 */
export class ImageGenerator {
  private apiUrl: string;

  constructor(apiUrl = "https://argusparagonstudios--storydiffusion-hires-api-comfyuimod-3da204.modal.run") {
    this.apiUrl = apiUrl;
  }

  /**
   * Clean text for prompt formatting
   */
  private cleanText(text: string): string {
    return text.replace(/_/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/ ,/g, ',')
      .replace(/,{2,}/g, ',')
      .replace(/\|{2,}/g, '|')
      .trim();
  }

  /**
   * Generate prompts from character and scene details
   */
  private generatePrompts(options: {
    organization: string;
    character_name: string;
    character_base: string;
    character_scene_details: string;
    background: string;
    final_details_quality_tags: string;
    prompt_scenes: string;
  }) {
    const {
      organization,
      character_name,
      character_base,
      character_scene_details,
      background,
      final_details_quality_tags,
      prompt_scenes
    } = options;

    // Organization-specific artist mappings
    const orgMappings: Record<string, { base: string, hiresfix: string }> = {
      "lovehent": { base: "mdf_an,ratatatat74", hiresfix: "mdf_an,artist:quasarcake" },
      "meitabu": { base: "(suyasuyabi,ratatatat74)", hiresfix: "(suyasuyabi,dross,(ratatatat74:0.5))" },
      "project3": { base: "proj3 patreon", hiresfix: "" }
    };

    const orgMapping = orgMappings[organization] || { base: "", hiresfix: "" };

    // Generate character prompt
    const characterPrompt = this.cleanText(`[${character_name}], ${orgMapping.base}, ${character_base}, ${background}`);

    // Process scene prompts
    const promptSegments = prompt_scenes.split("/");

    const scenePromptsList: string[] = [];
    const hiresfixPromptsList: string[] = [];

    for (const segment of promptSegments) {
      if (!segment.trim()) continue;

      scenePromptsList.push(
        this.cleanText(`[${character_name}], ${segment.trim()}, ${character_scene_details}, ${final_details_quality_tags}`)
      );

      const hiresfixBase = orgMapping.hiresfix ? `${orgMapping.hiresfix}, ` : "";
      hiresfixPromptsList.push(
        this.cleanText(`${hiresfixBase}${character_base}, ${segment.trim()}, ${character_scene_details}, ${background}, ${final_details_quality_tags}`)
      );
    }

    return {
      character_prompt: characterPrompt,
      scene_prompts: scenePromptsList.join(";\n"),
      hiresfixprompt: hiresfixPromptsList.join(" / ")
    };
  }

  /**
   * Generate images and return data URLs
   */
  async generateImages(
    options: {
      organization: string;
      character_name: string;
      character_base: string;
      character_scene_details: string;
      background: string;
      final_details_quality_tags: string;
      prompt_scenes: string;
    },
    apiOptions: {
      width?: number;
      height?: number;
      seed?: number;
      image_format?: string;
      optimize_size?: boolean;
      image_quality?: string | number;
      negative_prompt?: string;
      lora_air?: string;
    } = {}
  ): Promise<{
    success: boolean;
    imageCount?: number;
    images?: Array<{ index: number; viewUrl: string }>;
    requestId?: string;
    error?: string;
  }> {
    try {
      // Generate prompts
      const prompts = this.generatePrompts(options);

      // Build API payload
      const payload: Record<string, any> = {
        character_prompt: prompts.character_prompt,
        scene_prompts: prompts.scene_prompts,
        hiresfixprompt: prompts.hiresfixprompt,
        negative_prompt: apiOptions.negative_prompt || '',
        width: apiOptions.width || 768,
        height: apiOptions.height || 768,
        seed: apiOptions.seed || Math.floor(Math.random() * 2147483647),
        image_format: apiOptions.image_format || "webp",
        optimize_size: apiOptions.optimize_size || true,
        image_quality: apiOptions.image_quality || "85"
      };

      // Add optional lora_air if present
      if (apiOptions.lora_air) {
        payload.lora_air = apiOptions.lora_air;
      }

      console.log("Sending API request with payload:", payload);

      // Call API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} - ${await response.text()}`);
      }

      const result = await response.json();
      console.log("API response received:", result);

      // Process images into data URLs
      const imageFormat = payload.image_format as string;
      const mimeType = `image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat}`;

      const images = (result.images || []).map((base64Image: string, index: number) => ({
        index,
        viewUrl: `data:${mimeType};base64,${base64Image}`
      }));

      return {
        success: true,
        imageCount: images.length,
        images,
        requestId: result.request_id || 'unknown'
      };
    } catch (error: any) {
      console.error("API error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
