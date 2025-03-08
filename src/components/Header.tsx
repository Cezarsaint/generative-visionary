
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GenerationSettings, ImageSize, PromptSettings } from "@/types";
import { Separator } from "@/components/ui/separator";
import { ArrowRightCircle, Loader2 } from "lucide-react";

interface HeaderProps {
  settings: GenerationSettings;
  promptSettings: PromptSettings;
  onSettingsChange: (settings: Partial<GenerationSettings>) => void;
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

const Header = ({ settings, promptSettings, onSettingsChange, onPromptSettingsChange, onGenerate, isGenerating }: HeaderProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full glassmorphism rounded-xl p-4 mb-6 transition-all duration-300 animate-slide-down">
      <div className="flex flex-col lg:flex-row items-center justify-between">
        <div className="flex gap-2 items-center mb-4 lg:mb-0">
          <div className="p-1 rounded-full bg-white/80 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500"></div>
          </div>
          <h1 className="text-xl font-semibold">Image Generator</h1>
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
          <Button 
            variant="outline" 
            className="lg:w-auto w-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Hide Settings" : "Show Settings"}
          </Button>
          <Button 
            onClick={onGenerate} 
            disabled={isGenerating}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white lg:w-auto w-full transition-all duration-300"
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
        </div>
      </div>

      {isExpanded && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select 
                value={settings.template} 
                onValueChange={(value) => onSettingsChange({ template: value })}
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
                value={settings.style} 
                onValueChange={(value) => onSettingsChange({ style: value })}
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
                checked={settings.aiEnhancer} 
                onCheckedChange={(checked) => 
                  onSettingsChange({ aiEnhancer: checked === true })
                }
              />
              <Label htmlFor="aiEnhancer">AI Enhancer</Label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seed">Seed</Label>
              <Input 
                id="seed" 
                type="number" 
                value={settings.seed} 
                onChange={(e) => onSettingsChange({ seed: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Select 
                value={settings.size} 
                onValueChange={(value: ImageSize) => onSettingsChange({ size: value })}
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

          <div className="space-y-4 col-span-1 md:col-span-2 lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="start">Start: {settings.start}</Label>
                  <span className="text-xs text-gray-500">(0-100)</span>
                </div>
                <Slider 
                  id="start"
                  value={[settings.start]} 
                  min={0} 
                  max={100} 
                  step={1}
                  onValueChange={(value) => onSettingsChange({ start: value[0] })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="mid">Mid: {settings.mid}</Label>
                  <span className="text-xs text-gray-500">(0-100)</span>
                </div>
                <Slider 
                  id="mid"
                  value={[settings.mid]} 
                  min={0} 
                  max={100} 
                  step={1}
                  onValueChange={(value) => onSettingsChange({ mid: value[0] })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="end">End: {settings.end}</Label>
                  <span className="text-xs text-gray-500">(0-100)</span>
                </div>
                <Slider 
                  id="end"
                  value={[settings.end]} 
                  min={0} 
                  max={100} 
                  step={1}
                  onValueChange={(value) => onSettingsChange({ end: value[0] })}
                />
              </div>
            </div>

            <Separator className="my-2" />
            
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="text-sm text-muted-foreground">
                <span className="block mb-1">Current Configuration:</span>
                <span className="font-semibold">{settings.template} • {settings.style} • {settings.size}</span>
              </div>
              
              <Button
                variant="secondary"
                onClick={() => onSettingsChange({
                  seed: Math.floor(Math.random() * 1000000)
                })}
                className="text-sm"
              >
                Randomize Seed
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
