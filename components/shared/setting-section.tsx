"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { THEME_LIST } from "@/data/themes";
import { useSetting } from "@/context/setting-context";
import type { ProjectType } from "@/types";

type Props = {
  projectDetail: ProjectType;
  onNewScreen: (screen: import("@/types").ScreenConfig) => void;
  onScreenshot: (activeTheme: string) => void;
  screenshotLoading?: boolean;
};

export default function SettingSection({
  projectDetail,
  onNewScreen,
  onScreenshot,
  screenshotLoading,
}: Props) {
  const { settingDetail, setSettingDetail } = useSetting();
  const [projectName, setProjectName] = useState("");
  const [newScreenInput, setNewScreenInput] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("Polar Mint");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (projectDetail) {
      setProjectName(projectDetail.projectName ?? "");
      setSelectedTheme(projectDetail.theme ?? "Polar Mint");
      setSettingDetail({
        ...projectDetail,
        theme: projectDetail.theme ?? "Polar Mint",
      });
    }
  }, [projectDetail, setSettingDetail]);

  const onThemeSelect = (name: string) => {
    setSelectedTheme(name);
    setSettingDetail((prev) =>
      prev ? { ...prev, theme: name } : prev
    );
    toast.message("Theme applied to previews", {
      description: "Click Save (top right) to store it on the project.",
    });
  };

  const generateNewScreen = async () => {
    if (!newScreenInput.trim()) return;
    setGenerating(true);
    try {
      const { data } = await axios.post("/api/screen", {
        projectId: projectDetail.projectId,
        userInput: newScreenInput,
      });
      onNewScreen(data);
      setNewScreenInput("");
      toast.success("Screen added — generating UI...");
    } catch {
      toast.error("Failed to add screen");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-6 rounded-xl border bg-card p-5 h-fit">
      <div>
        <Label>Project name</Label>
        <Input
          className="mt-2"
          value={projectName}
          onChange={(e) => {
            setProjectName(e.target.value);
            setSettingDetail((prev) =>
              prev
                ? { ...prev, projectName: e.target.value }
                : prev
            );
          }}
        />
      </div>

      <div>
        <Label>New screen (AI)</Label>
        <Textarea
          className="mt-2 min-h-[72px] resize-none rounded-lg border-zinc-200 bg-zinc-50/80 text-sm leading-relaxed placeholder:text-zinc-400 focus:bg-white"
          placeholder="e.g. Profile settings with avatar and preferences"
          value={newScreenInput}
          onChange={(e) => setNewScreenInput(e.target.value)}
        />
        <Button
          className="mt-2 w-full gap-2"
          onClick={generateNewScreen}
          disabled={generating}
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate with AI
        </Button>
      </div>

      <div>
        <Label className="mb-3 block">Themes</Label>
        <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
          {THEME_LIST.map((theme) => (
            <button
              key={theme.name}
              type="button"
              onClick={() => onThemeSelect(theme.name)}
              className={`rounded-lg border p-2 text-left text-xs transition-colors ${
                selectedTheme === theme.name
                  ? "border-primary bg-primary/10"
                  : "hover:border-primary/50"
              }`}
            >
              <div
                className="h-8 rounded mb-1"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                }}
              />
              {theme.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() =>
            onScreenshot(
              settingDetail?.theme ?? selectedTheme ?? projectDetail.theme ?? "Polar Mint"
            )
          }
          disabled={screenshotLoading}
        >
          {screenshotLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          Screenshot canvas
        </Button>
      </div>
    </aside>
  );
}
