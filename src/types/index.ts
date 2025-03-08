
export type ImageSize = "1344x768" | "768x1344" | "836x1216";

export interface GenerationSettings {
  template: string;
  style: string;
  aiEnhancer: boolean;
  seed: number;
  size: ImageSize;
  start: number;
  mid: number;
  end: number;
  llmModel: string; // New field for the LLM model
}

export interface PromptSettings {
  characterName: string;
  characterBase: string;
  clothingDetails: string;
  characterSceneDetails: string;
  background: string;
  finalDetailQualityTags: string;
  promptScenes: string;
  arguments: string;
  negativePrompt: string;
  civitaiLora: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  seed: number;
  timestamp: Date;
  settings: GenerationSettings;
  prompts: PromptSettings;
}

export interface Generation {
  id: string;
  images: GeneratedImage[];
  timestamp: Date;
  settings: GenerationSettings;
  prompts: PromptSettings;
}
