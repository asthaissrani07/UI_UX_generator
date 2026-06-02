"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <aside className="workspace-panel h-fit w-full shrink-0 space-y-7 p-6 lg:w-[19rem] xl:w-80">
      <div>
        <p className="workspace-section-title">Project settings</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Name your mockup and customize the look.
        </p>
      </div>

      <div>
        <label className="workspace-label" htmlFor="project-name">
          Project name
        </label>
        <Input
          id="project-name"
          className="workspace-field"
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
        <label className="workspace-label" htmlFor="new-screen">
          New screen (AI)
        </label>
        <Textarea
          id="new-screen"
          className="workspace-field min-h-[80px] resize-none text-sm leading-relaxed placeholder:text-muted-foreground/70"
          placeholder="e.g. Profile settings with avatar and preferences"
          value={newScreenInput}
          onChange={(e) => setNewScreenInput(e.target.value)}
        />
        <Button
          className="workspace-btn-primary mt-3 w-full gap-2"
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
        <label className="workspace-label mb-3 block">Themes</label>
        <div className="grid max-h-[220px] grid-cols-2 gap-2 overflow-y-auto pr-1">
          {THEME_LIST.map((theme) => (
            <button
              key={theme.name}
              type="button"
              onClick={() => onThemeSelect(theme.name)}
              className={`workspace-theme-btn p-2.5 text-left ${
                selectedTheme === theme.name ? "is-active" : ""
              }`}
            >
              <div
                className="mb-2 h-8 rounded-md"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                }}
              />
              {theme.name}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border/80 pt-5">
        <Button
          variant="outline"
          className="workspace-btn-outline w-full gap-2"
          onClick={() =>
            onScreenshot(
              settingDetail?.theme ??
                selectedTheme ??
                projectDetail.theme ??
                "Polar Mint"
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
