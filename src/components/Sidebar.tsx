
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GenerationSettings, ImageSize, PromptSettings } from "@/types";
import { Separator } from "@/components/ui/separator";
import { ArrowRightCircle, Loader2, Sparkles, Plus, Minus } from "lucide-react";

interface SidebarProps {
  generationSettings: GenerationSettings;
  promptSettings: PromptSettings;
  onGenerationSettingsChange: (settings: Partial<GenerationSettings>) => void;
  onPromptSettingsChange: (settings: Partial<PromptSettings>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const TEMPLATES = ["Portrait", "Full Body", "Group", "Landscape", "Abstract"];
const STYLES = ["Realistic", "Anime", "Cartoon", "Fantasy", "SciFi", "Noir", "Watercolor", "Oil Painting"];
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
        {/* Generation Settings Section */}
        <div className="glassmorphism rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-medium">Generation Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select 
                value={generationSettings.template} 
                onValueChange={(value) => onGenerationSettingsChange({ template: value })}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((template) => (
                    <SelectItem key={template} value={template}>
                      {template}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Style</Label>
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

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="aiEnhancer" 
                checked={generationSettings.aiEnhancer} 
                onCheckedChange={(checked) => 
                  onGenerationSettingsChange({ aiEnhancer: checked === true })
                }
              />
              <Label htmlFor="aiEnhancer">AI Enhancer</Label>
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
                <span className="text-xs text-gray-500">(0-100)</span>
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
                <span className="text-xs text-gray-500">(0-100)</span>
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
                <span className="text-xs text-gray-500">(0-100)</span>
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
          </div>
        </div>

        {/* Prompt Settings Section */}
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
              <Label htmlFor="clothingDetails">Clothing Details</Label>
              <Input
                id="clothingDetails"
                value={promptSettings.clothingDetails}
                onChange={(e) => onPromptSettingsChange({ clothingDetails: e.target.value })}
                placeholder="e.g. black suit, red tie"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="characterSceneDetails">Character Scene</Label>
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
              <Label htmlFor="promptScenes">Prompt Scenes</Label>
              <Input
                id="promptScenes"
                value={promptSettings.promptScenes}
                onChange={(e) => onPromptSettingsChange({ promptScenes: e.target.value })}
                placeholder="e.g. scene 1, scene 2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPrompts">Max Prompts</Label>
              <div className="flex">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => {
                    const currentVal = parseInt(promptSettings.maxPrompts) || 4;
                    onPromptSettingsChange({ maxPrompts: Math.max(1, currentVal - 1).toString() });
                  }}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="maxPrompts"
                  value={promptSettings.maxPrompts}
                  onChange={(e) => onPromptSettingsChange({ maxPrompts: e.target.value })}
                  className="rounded-none text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => {
                    const currentVal = parseInt(promptSettings.maxPrompts) || 4;
                    onPromptSettingsChange({ maxPrompts: Math.min(12, currentVal + 1).toString() });
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="arguments">Arguments</Label>
              <Input
                id="arguments"
                value={promptSettings.arguments}
                onChange={(e) => onPromptSettingsChange({ arguments: e.target.value })}
                placeholder="e.g. additional arguments"
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
                placeholder="Enter Lora ID or URL"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
