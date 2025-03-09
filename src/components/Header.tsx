
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Copy, Trash2, Settings, Undo, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  GenerationSettings, 
  PromptSettings, 
  ImageSize 
} from "@/types";

// Updated STYLES to match organizations from the API
const STYLES = ["Realistic", "lovehent", "meitabu", "project3"];
const SIZES: { value: ImageSize; label: string }[] = [
  { value: "1344x768", label: "Landscape (1344×768)" },
  { value: "768x1344", label: "Portrait (768×1344)" },
  { value: "836x1216", label: "Square-ish (836×1216)" }
];

type HeaderProps = {
  onGenerate: () => void;
  onDownloadAll: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onDeleteAll: () => void;
  onRefresh: () => void;
  generationSettings: GenerationSettings;
  updateGenerationSettings: (settings: Partial<GenerationSettings>) => void;
  promptSettings: PromptSettings;
  updatePromptSettings: (settings: Partial<PromptSettings>) => void;
  isLoading: boolean;
};

const Header: React.FC<HeaderProps> = ({
  onGenerate,
  onDownloadAll,
  onCopy,
  onDelete,
  onDeleteAll,
  onRefresh,
  generationSettings,
  updateGenerationSettings,
  promptSettings,
  updatePromptSettings,
  isLoading
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const handleClipboardCopy = () => {
    // Create a formatted string with all the settings
    const settingsText = `
Style: ${generationSettings.style}
Size: ${generationSettings.size}
Seed: ${generationSettings.seed}
Character: ${promptSettings.characterName}
Character Base: ${promptSettings.characterBase}
Clothing Details: ${promptSettings.clothingDetails}
Scene Details: ${promptSettings.characterSceneDetails}
Background: ${promptSettings.background}
Detail Tags: ${promptSettings.finalDetailQualityTags}
Negative Prompt: ${promptSettings.negativePrompt}
Civitai Lora: ${promptSettings.civitaiLora}
    `.trim();

    // Copy to clipboard
    navigator.clipboard.writeText(settingsText).then(
      () => {
        toast.success("Settings copied to clipboard");
        onCopy();
      },
      () => {
        toast.error("Failed to copy settings");
      }
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="default"
            size="sm"
            onClick={onGenerate}
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Generate"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            title="Refresh settings"
          >
            <Undo className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {showSettings ? "Hide Settings" : "Show Settings"}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClipboardCopy}
            title="Copy settings"
          >
            <Copy className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadAll}
            title="Download all"
          >
            <Download className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" title="Delete options">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onDelete}>
                Delete Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDeleteAll}>
                Delete All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showSettings && (
        <div className="mt-4 space-y-4 border p-4 rounded-md bg-white/50 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="style">Style</Label>
              <Select
                value={generationSettings.style}
                onValueChange={(value) =>
                  updateGenerationSettings({ style: value })
                }
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

            <div>
              <Label htmlFor="seed">Seed</Label>
              <div className="flex space-x-2">
                <Input
                  id="seed"
                  type="number"
                  value={generationSettings.seed}
                  onChange={(e) =>
                    updateGenerationSettings({
                      seed: parseInt(e.target.value) || 0,
                    })
                  }
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    updateGenerationSettings({
                      seed: Math.floor(Math.random() * 1000000),
                    })
                  }
                  className="whitespace-nowrap"
                >
                  Random
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="size">Size</Label>
              <Select
                value={generationSettings.size}
                onValueChange={(value: ImageSize) =>
                  updateGenerationSettings({ size: value })
                }
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
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="negativePrompt">Negative Prompt</Label>
              <Input
                id="negativePrompt"
                value={promptSettings.negativePrompt}
                onChange={(e) =>
                  updatePromptSettings({ negativePrompt: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="civitaiLora">Civitai Lora</Label>
              <Input
                id="civitaiLora"
                value={promptSettings.civitaiLora}
                onChange={(e) =>
                  updatePromptSettings({ civitaiLora: e.target.value })
                }
                placeholder="e.g. 795522@1114681"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(false)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Close Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
