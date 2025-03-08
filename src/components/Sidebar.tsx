
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GenerationSettings, ImageSize, PromptSettings } from "@/types";
import { Separator } from "@/components/ui/separator";
import { ArrowRightCircle, Loader2, Sparkles, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  generationSettings: GenerationSettings;
  promptSettings: PromptSettings;
  onGenerationSettingsChange: (settings: Partial<GenerationSettings>) => void;
  onPromptSettingsChange: (settings: Partial<PromptSettings>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

// Updated STYLES to match organizations from the API
const STYLES = ["Realistic", "lovehent", "meitabu", "project3"];
const SIZES: { value: ImageSize; label: string }[] = [
  { value: "1344x768", label: "Landscape (1344×768)" },
  { value: "768x1344", label: "Portrait (768×1344)" },
  { value: "836x1216", label: "Square-ish (836×1216)" }
];

const Sidebar = ({ 
  generationSettings, 
  promptSettings, 
  onGenerationSettingsChange, 
  onPromptSettingsChange, 
  onGenerate, 
  isGenerating 
}: SidebarProps) => {
  // Count number of prompts in promptScenes
  const promptCount = promptSettings.promptScenes ? 
    promptSettings.promptScenes.split('/').filter(p => p.trim()).length : 0;

  return (
    <div className="w-full md:w-80 lg:w-96 h-screen overflow-y-auto p-4 glassmorphism border-r border-white/10 shadow-lg flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1 rounded-full bg-white/80 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500"></div>
        </div>
        <h1 className="text-xl font-semibold">Image Generator</h1>
      </div>

      <Button 
        onClick={onGenerate} 
        disabled={isGenerating}
        className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white transition-all duration-300"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
          </>
        ) : (
          <>
            Generate <ArrowRightCircle className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      <div className="space-y-6 overflow-y-auto flex-1">
        {/* Prompt Settings Section - Moved up */}
        <div className="glassmorphism rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-medium">Prompt Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="characterName">Character Name</Label>
              <Input
                id="characterName"
                value={promptSettings.characterName}
                onChange={(e) => onPromptSettingsChange({ characterName: e.target.value })}
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="characterBase">Character Base</Label>
              <Input
                id="characterBase"
                value={promptSettings.characterBase}
                onChange={(e) => onPromptSettingsChange({ characterBase: e.target.value })}
                placeholder="e.g. tall male, brown hair"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="clothingDetails">Character Scene Details</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 ml-1 text-muted-foreground"
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This maps to 'character_scene_details' in the API</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="clothingDetails"
                value={promptSettings.clothingDetails}
                onChange={(e) => onPromptSettingsChange({ clothingDetails: e.target.value })}
                placeholder="e.g. black suit, red tie"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="characterSceneDetails">Additional Scene Details</Label>
              <Input
                id="characterSceneDetails"
                value={promptSettings.characterSceneDetails}
                onChange={(e) => onPromptSettingsChange({ characterSceneDetails: e.target.value })}
                placeholder="e.g. sitting at desk, working"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="background">Background</Label>
              <Input
                id="background"
                value={promptSettings.background}
                onChange={(e) => onPromptSettingsChange({ background: e.target.value })}
                placeholder="e.g. modern office, window view"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalDetailQualityTags">Detail Quality Tags</Label>
              <Input
                id="finalDetailQualityTags"
                value={promptSettings.finalDetailQualityTags}
                onChange={(e) => onPromptSettingsChange({ finalDetailQualityTags: e.target.value })}
                placeholder="e.g. high detail, 8k, ultra realistic"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="promptScenes">Prompt Scenes</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground">
                        {promptCount} {promptCount === 1 ? 'prompt' : 'prompts'}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Separate multiple scenes with /</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="promptScenes"
                value={promptSettings.promptScenes}
                onChange={(e) => onPromptSettingsChange({ promptScenes: e.target.value })}
                placeholder="e.g. sitting on throne / walking in snow"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Each scene separated by "/" will generate one image. Leave empty to auto-generate.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="arguments">Arguments</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 ml-1 text-muted-foreground"
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Extra instructions for the AI Enhancer</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="arguments"
                value={promptSettings.arguments}
                onChange={(e) => onPromptSettingsChange({ arguments: e.target.value })}
                placeholder="e.g. Make it more dramatic"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="negativePrompt">Negative Prompt</Label>
              <Input
                id="negativePrompt"
                value={promptSettings.negativePrompt}
                onChange={(e) => onPromptSettingsChange({ negativePrompt: e.target.value })}
                placeholder="e.g. blurry, bad quality"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="civitaiLora">Civitai Lora</Label>
              <Input 
                id="civitaiLora" 
                value={promptSettings.civitaiLora} 
                onChange={(e) => onPromptSettingsChange({ civitaiLora: e.target.value })}
                placeholder="e.g. 795522@1114681"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter Lora ID format: modelId@versionId
              </p>
            </div>
          </div>
        </div>

        {/* Generation Settings Section - Moved down */}
        <div className="glassmorphism rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-medium">Generation Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="style">Style (Organization)</Label>
                <div className="text-xs text-muted-foreground">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 ml-1 text-muted-foreground"
                        >
                          <Info className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Style maps to the organization in the API</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <Select 
                value={generationSettings.style} 
                onValueChange={(value) => onGenerationSettingsChange({ style: value })}
              >
                <SelectTrigger id="style">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map((style) => (
                    <SelectItem key={style} value={style}>
                      {style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seed">Seed</Label>
              <Input 
                id="seed" 
                type="number" 
                value={generationSettings.seed} 
                onChange={(e) => onGenerationSettingsChange({ seed: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Select 
                value={generationSettings.size} 
                onValueChange={(value: ImageSize) => onGenerationSettingsChange({ size: value })}
              >
                <SelectTrigger id="size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="start">Start: {generationSettings.start}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-xs text-gray-500 cursor-help">(0-100)</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of lines to select from the solo text file</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Slider 
                id="start"
                value={[generationSettings.start]} 
                min={0} 
                max={100} 
                step={1}
                onValueChange={(value) => onGenerationSettingsChange({ start: value[0] })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="mid">Mid: {generationSettings.mid}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-xs text-gray-500 cursor-help">(0-100)</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of lines to select from the couple text file</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Slider 
                id="mid"
                value={[generationSettings.mid]} 
                min={0} 
                max={100} 
                step={1}
                onValueChange={(value) => onGenerationSettingsChange({ mid: value[0] })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="end">End: {generationSettings.end}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-xs text-gray-500 cursor-help">(0-100)</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of lines to select from the afetex text file</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Slider 
                id="end"
                value={[generationSettings.end]} 
                min={0} 
                max={100} 
                step={1}
                onValueChange={(value) => onGenerationSettingsChange({ end: value[0] })}
              />
            </div>

            <Button
              variant="secondary"
              onClick={() => onGenerationSettingsChange({
                seed: Math.floor(Math.random() * 1000000)
              })}
              className="text-sm w-full"
            >
              Randomize Seed
            </Button>

            {/* AI Enhancer and LLM Model - Moved to the end */}
            <div className="flex items-center space-x-2 mt-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="aiEnhancer" 
                        checked={generationSettings.aiEnhancer} 
                        onCheckedChange={(checked) => 
                          onGenerationSettingsChange({ aiEnhancer: checked === true })
                        }
                      />
                      <Label htmlFor="aiEnhancer" className="cursor-pointer">AI Enhancer</Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>When enabled, uses an LLM to enhance auto-generated prompts</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="space-y-2">
              <Label htmlFor="llmModel">LLM Model</Label>
              <Input
                id="llmModel"
                value={generationSettings.llmModel}
                onChange={(e) => onGenerationSettingsChange({ llmModel: e.target.value })}
                placeholder="e.g. aion-labs/aion-1.0-mini"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used with AI Enhancer for prompt generation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
