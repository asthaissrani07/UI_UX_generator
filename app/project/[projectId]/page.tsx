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
  compressDataUrlForStorage,
  downloadDataUrl,
  getScreenIframes,
} from "@/lib/capture-screenshot";
import type { ProjectType, ScreenConfig } from "@/types";
import { isScreenCodeComplete } from "@/lib/validate-screen-html";
import { postGenerateWithModelRotation } from "@/lib/api-retry";

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
        await postGenerateWithModelRotation("/api/generate-config", (modelAttempt) => ({
          projectId,
          userInput: detail.userInput,
          device: detail.device,
          modelAttempt,
        }));
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
      if (screen.code && isScreenCodeComplete(screen.code)) continue;

      setLoadingMessage(`Generating screen ${i + 1} of ${screenConfig.length}...`);
      try {
        if (i > 0) {
          await new Promise((r) => setTimeout(r, 1500));
        }
        const data = await postGenerateWithModelRotation<ScreenConfig>(
          "/api/generate-screen-ui",
          (modelAttempt) => ({
            projectId,
            screenId: screen.screenId,
            screenName: screen.screenName,
            purpose: screen.purpose,
            screenDescription: screen.screenDescription,
            projectVisualDescription: projectDetail.projectVisualDescription,
            device: projectDetail.device,
            modelAttempt,
          })
        );
        setScreenConfig((prev) =>
          prev.map((item, idx) => (idx === i ? data : item))
        );
      } catch (err) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.message
            ? String(err.response.data.message)
            : err instanceof Error &&
                /504|timeout|timed out/i.test(err.message)
              ? `Screen ${i + 1} timed out — click Generate again or edit that screen.`
              : `Failed screen ${i + 1}`;
        toast.error(message);
      }
    }

    setLoading(false);
    saveScreenshotQuiet();
  }, [projectDetail, screenConfig, projectId]);

  const saveScreenshotQuiet = useCallback(async () => {
    try {
      await new Promise((r) => setTimeout(r, 3500));
      const ready = getScreenIframes();
      if (ready.length === 0) return;
      const full = await captureAllIframes(ready);
      const thumbnail = await compressDataUrlForStorage(full);
      await axios.put("/api/project", {
        projectId,
        screenshot: thumbnail,
        projectName: projectDetail?.projectName,
        theme: projectDetail?.theme,
      });
      setProjectDetail((prev) =>
        prev ? { ...prev, screenshot: thumbnail } : prev
      );
    } catch {
      /* background save */
    }
  }, [projectId, projectDetail?.projectName, projectDetail?.theme]);

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

    const needsUi = screenConfig.some(
      (s) => !s.code || !isScreenCodeComplete(s.code)
    );
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
      const full = await captureAllIframes(ready);
      const name = (projectDetail?.projectName ?? "canvas").replace(
        /[^\w\s.-]/g,
        "_"
      );
      downloadDataUrl(full, `${name}.png`);

      const thumbnail = await compressDataUrlForStorage(full);
      await axios.put("/api/project", {
        projectId,
        screenshot: thumbnail,
        projectName: projectDetail?.projectName,
        theme: activeTheme,
      });
      setProjectDetail((prev) =>
        prev
          ? { ...prev, theme: activeTheme, screenshot: thumbnail }
          : prev
      );
      toast.success("Screenshot downloaded and saved");
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
        const data = await postGenerateWithModelRotation<ScreenConfig>(
          "/api/generate-screen-ui",
          (modelAttempt) => ({
            projectId,
            screenId: screen.screenId,
            screenName: screen.screenName,
            purpose: screen.purpose,
            screenDescription: screen.screenDescription,
            projectVisualDescription: projectDetail?.projectVisualDescription,
            device: projectDetail?.device,
            modelAttempt,
          })
        );
        setScreenConfig((prev) =>
          prev.map((s) =>
            s.screenId === screen.screenId ? data : s
          )
        );
      } catch {
        toast.error("New screen generation failed — try Edit on that screen to retry.");
      } finally {
        setLoading(false);
      }
    })();
  };

  if (!projectDetail && loading) {
    return (
      <div className="project-workspace flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#3d5e86]" />
      </div>
    );
  }

  return (
    <SettingProvider>
      <div className="project-workspace flex min-h-screen flex-col">
        <ProjectHeader
          onSaved={(updates) =>
            setProjectDetail((prev) => (prev ? { ...prev, ...updates } : prev))
          }
        />
        {loading && (
          <div className="workspace-status absolute left-1/2 top-24 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-full px-5 py-2.5 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-[#3d5e86]" />
            {loadingMessage}
          </div>
        )}
        <div className="flex flex-1 flex-col gap-5 p-5 lg:flex-row lg:p-6">
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
