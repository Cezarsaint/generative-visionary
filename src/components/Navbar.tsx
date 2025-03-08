
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PromptSettings } from "@/types";
import { ChevronDown, ChevronUp, Sparkles, Plus, Minus } from "lucide-react";

interface NavbarProps {
  prompts: PromptSettings;
  onPromptsChange: (prompts: Partial<PromptSettings>) => void;
}

const Navbar = ({ prompts, onPromptsChange }: NavbarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full glassmorphism rounded-xl mb-6 transition-all duration-300 animate-slide-down">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-medium">Prompt Settings</h2>
        </div>
        <Button variant="ghost" size="sm">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="characterName">Character Name</Label>
              <Input
                id="characterName"
                value={prompts.characterName}
                onChange={(e) => onPromptsChange({ characterName: e.target.value })}
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="characterBase">Character Base</Label>
              <Input
                id="characterBase"
                value={prompts.characterBase}
                onChange={(e) => onPromptsChange({ characterBase: e.target.value })}
                placeholder="e.g. tall male, brown hair"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clothingDetails">Clothing Details</Label>
              <Input
                id="clothingDetails"
                value={prompts.clothingDetails}
                onChange={(e) => onPromptsChange({ clothingDetails: e.target.value })}
                placeholder="e.g. black suit, red tie"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="characterSceneDetails">Character Scene</Label>
              <Input
                id="characterSceneDetails"
                value={prompts.characterSceneDetails}
                onChange={(e) => onPromptsChange({ characterSceneDetails: e.target.value })}
                placeholder="e.g. sitting at desk, working"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="background">Background</Label>
              <Input
                id="background"
                value={prompts.background}
                onChange={(e) => onPromptsChange({ background: e.target.value })}
                placeholder="e.g. modern office, window view"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="finalDetailQualityTags">Detail Quality Tags</Label>
              <Input
                id="finalDetailQualityTags"
                value={prompts.finalDetailQualityTags}
                onChange={(e) => onPromptsChange({ finalDetailQualityTags: e.target.value })}
                placeholder="e.g. high detail, 8k, ultra realistic"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="promptScenes">Prompt Scenes</Label>
              <Input
                id="promptScenes"
                value={prompts.promptScenes}
                onChange={(e) => onPromptsChange({ promptScenes: e.target.value })}
                placeholder="e.g. scene 1, scene 2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="maxPrompts">Max Prompts</Label>
              <div className="flex">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => {
                    const currentVal = parseInt(prompts.maxPrompts) || 4;
                    onPromptsChange({ maxPrompts: Math.max(1, currentVal - 1).toString() });
                  }}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="maxPrompts"
                  value={prompts.maxPrompts}
                  onChange={(e) => onPromptsChange({ maxPrompts: e.target.value })}
                  className="rounded-none text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => {
                    const currentVal = parseInt(prompts.maxPrompts) || 4;
                    onPromptsChange({ maxPrompts: Math.min(12, currentVal + 1).toString() });
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
                value={prompts.arguments}
                onChange={(e) => onPromptsChange({ arguments: e.target.value })}
                placeholder="e.g. additional arguments"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="negativePrompt">Negative Prompt</Label>
              <Input
                id="negativePrompt"
                value={prompts.negativePrompt}
                onChange={(e) => onPromptsChange({ negativePrompt: e.target.value })}
                placeholder="e.g. blurry, bad quality"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="fullPrompt">Full Prompt Preview</Label>
            <Textarea
              id="fullPrompt"
              readOnly
              className="mt-2 font-mono text-xs bg-muted"
              value={`Character: ${prompts.characterName || "[Character Name]"}, ${prompts.characterBase || "[Base]"}
Wearing: ${prompts.clothingDetails || "[Clothing]"}
Scene: ${prompts.characterSceneDetails || "[Scene Details]"}
Background: ${prompts.background || "[Background]"}
Details: ${prompts.finalDetailQualityTags}
Negative: ${prompts.negativePrompt}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
