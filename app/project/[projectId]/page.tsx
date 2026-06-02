"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SettingProvider } from "@/context/setting-context";
import ProjectHeader from "@/components/shared/project-header";
import SettingSection from "@/components/shared/setting-section";
import Canvas from "@/components/shared/canvas";
import {
  captureAllIframes,
  getScreenIframes,
} from "@/lib/capture-screenshot";
import type { ProjectType, ScreenConfig } from "@/types";

export default function ProjectCanvasPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [projectDetail, setProjectDetail] = useState<ProjectType | null>(null);
  const [screenConfig, setScreenConfig] = useState<ScreenConfig[]>([]);
  const [screenConfigOriginal, setScreenConfigOriginal] = useState<
    ScreenConfig[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);

  const fetchProject = useCallback(async () => {
    const { data } = await axios.get("/api/project", {
      params: { projectId },
    });
    setProjectDetail(data.projectDetail);
    setScreenConfig(data.screenConfig ?? []);
    setScreenConfigOriginal(data.screenConfig ?? []);
    return data;
  }, [projectId]);

  const generateScreenConfig = useCallback(
    async (detail: ProjectType) => {
      setLoading(true);
      setLoadingMessage("Generating screen configuration...");
      try {
        await axios.post("/api/generate-config", {
          projectId,
          userInput: detail.userInput,
          device: detail.device,
        });
        await fetchProject();
      } catch (err) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.message
            ? String(err.response.data.message)
            : "Config generation failed";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [projectId, fetchProject]
  );

  const generateScreenUI = useCallback(async () => {
    if (!projectDetail || screenConfig.length === 0) return;
    setLoading(true);

    for (let i = 0; i < screenConfig.length; i++) {
      const screen = screenConfig[i];
      if (screen.code) continue;

      setLoadingMessage(`Generating screen ${i + 1}...`);
      try {
        const { data } = await axios.post("/api/generate-screen-ui", {
          projectId,
          screenId: screen.screenId,
          screenName: screen.screenName,
          purpose: screen.purpose,
          screenDescription: screen.screenDescription,
          projectVisualDescription: projectDetail.projectVisualDescription,
          device: projectDetail.device,
        });
        setScreenConfig((prev) =>
          prev.map((item, idx) => (idx === i ? data : item))
        );
      } catch (err) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.message
            ? String(err.response.data.message)
            : `Failed screen ${i + 1}`;
        toast.error(message);
      }
    }

    setLoading(false);
    saveScreenshotQuiet();
  }, [projectDetail, screenConfig, projectId]);

  const saveScreenshotQuiet = useCallback(async () => {
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const url = await captureAllIframes(getScreenIframes());
      await axios.put("/api/project", {
        projectId,
        screenshot: url,
        projectName: projectDetail?.projectName,
        theme: projectDetail?.theme,
      });
    } catch {
      /* background save */
    }
  }, [projectId, projectDetail]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadingMessage("Loading project...");
      const data = await fetchProject();
      setLoading(false);

      if (!data.screenConfig?.length && data.projectDetail) {
        await generateScreenConfig(data.projectDetail);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (
      !projectDetail ||
      screenConfigOriginal.length === 0 ||
      screenConfig.length === 0
    )
      return;

    const needsUi = screenConfig.some((s) => !s.code);
    if (needsUi) generateScreenUI();
  }, [projectDetail, screenConfigOriginal]);

  const onScreenshot = async (activeTheme: string) => {
    setScreenshotLoading(true);
    try {
      const ready = getScreenIframes();
      if (ready.length === 0) {
        toast.error("Wait until all screens finish loading, then try again.");
        return;
      }
      const url = await captureAllIframes(ready);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectDetail?.projectName ?? "canvas"}.png`;
      a.click();
      await axios.put("/api/project", {
        projectId,
        screenshot: url,
        projectName: projectDetail?.projectName,
        theme: activeTheme,
      });
      setProjectDetail((prev) =>
        prev ? { ...prev, theme: activeTheme, screenshot: url } : prev
      );
      toast.success("Screenshot saved");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Screenshot failed";
      toast.error(msg);
    } finally {
      setScreenshotLoading(false);
    }
  };

  const onNewScreen = (screen: ScreenConfig) => {
    setScreenConfig((prev) => [...prev, screen]);
    setScreenConfigOriginal((prev) => [...prev, screen]);
    (async () => {
      setLoading(true);
      setLoadingMessage("Generating new screen...");
      try {
        const { data } = await axios.post("/api/generate-screen-ui", {
          projectId,
          screenId: screen.screenId,
          screenName: screen.screenName,
          purpose: screen.purpose,
          screenDescription: screen.screenDescription,
          projectVisualDescription: projectDetail?.projectVisualDescription,
          device: projectDetail?.device,
        });
        setScreenConfig((prev) =>
          prev.map((s) =>
            s.screenId === screen.screenId ? data : s
          )
        );
      } finally {
        setLoading(false);
      }
    })();
  };

  if (!projectDetail && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SettingProvider>
      <div className="flex min-h-screen flex-col">
        <ProjectHeader
          onSaved={(updates) =>
            setProjectDetail((prev) => (prev ? { ...prev, ...updates } : prev))
          }
        />
        {loading && (
          <div className="absolute left-1/2 top-24 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingMessage}
          </div>
        )}
        <div className="flex flex-1 flex-col lg:flex-row gap-4 p-4">
          {projectDetail && (
            <>
              <SettingSection
                projectDetail={projectDetail}
                onNewScreen={onNewScreen}
                onScreenshot={onScreenshot}
                screenshotLoading={screenshotLoading}
              />
              <Canvas
                projectDetail={projectDetail}
                screenConfig={screenConfig}
                iframeRefs={iframeRefs}
                onScreenUpdated={(screen, index) => {
                  setScreenConfig((prev) =>
                    prev.map((s, i) => (i === index ? screen : s))
                  );
                }}
                onScreenDeleted={(screenId) => {
                  setScreenConfig((prev) =>
                    prev.filter((s) => s.screenId !== screenId)
                  );
                }}
              />
            </>
          )}
        </div>
      </div>
    </SettingProvider>
  );
}
