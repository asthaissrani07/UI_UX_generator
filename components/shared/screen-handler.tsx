"use client";

import { useState, type RefObject } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Code2,
  Download,
  Pencil,
  Trash2,
  Loader2,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { captureIframe, downloadDataUrl } from "@/lib/capture-screenshot";
import type { ScreenConfig } from "@/types";

type DragHandleProps = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLElement>) => void;
};

type Props = {
  screen: ScreenConfig;
  projectId: string;
  device: string;
  theme: string;
  projectVisualDescription?: string | null;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onUpdated: (screen: ScreenConfig) => void;
  onDeleted: (screenId: string) => void;
  dragHandleProps: DragHandleProps;
  isDragging: boolean;
};

export default function ScreenHandler({
  screen,
  projectId,
  device,
  theme,
  projectVisualDescription,
  iframeRef,
  onUpdated,
  onDeleted,
  dragHandleProps,
  isDragging,
}: Props) {
  const [codeOpen, setCodeOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const [downloading, setDownloading] = useState(false);

  const downloadPng = async () => {
    const frame = iframeRef.current;
    if (!frame) {
      toast.error("Screen still loading — wait a moment and try again.");
      return;
    }
    setDownloading(true);
    try {
      const dataUrl = await captureIframe(frame);
      const name = (screen.screenName ?? "screen").replace(/[^\w\s.-]/g, "_");
      downloadDataUrl(dataUrl, `${name}.png`);
      toast.success("Download started");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Download failed";
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  };

  const onEdit = async () => {
    if (!editPrompt.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.post("/api/generate-screen-ui", {
        projectId,
        screenId: screen.screenId,
        screenName: screen.screenName,
        purpose: screen.purpose,
        screenDescription: screen.screenDescription,
        projectVisualDescription,
        device,
        editPrompt,
      });
      onUpdated(data);
      setEditOpen(false);
      setEditPrompt("");
      toast.success("Screen updated");
    } catch {
      toast.error("Edit failed");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Delete this screen?")) return;
    try {
      await axios.delete("/api/screen", {
        data: { projectId, screenId: screen.screenId },
      });
      onDeleted(screen.screenId);
      toast.success("Screen deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <>
      <div
        {...dragHandleProps}
        className={`drag-handle flex h-11 shrink-0 items-center justify-between gap-2 border-b border-zinc-100 bg-white/95 px-2 backdrop-blur-sm touch-none ${
          isDragging ? "drag-handle-active bg-zinc-50" : ""
        }`}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <GripVertical className="h-4 w-4 shrink-0 text-zinc-400" />
          <span className="truncate text-sm font-medium text-zinc-800">
            {screen.screenName ?? "Screen"}
          </span>
        </div>
        <div
          className="flex shrink-0 items-center gap-0.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCodeOpen(true)}
            title="View code"
          >
            <Code2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={downloadPng}
            disabled={downloading}
            title="Download PNG"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setEditOpen(true)}
            title="Edit with AI"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      <Dialog open={codeOpen} onOpenChange={setCodeOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Source code — {screen.screenName}</DialogTitle>
          </DialogHeader>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[60vh]">
            <code>{screen.code ?? "No code yet"}</code>
          </pre>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit screen with AI</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Describe changes — e.g. make header darker, add chart..."
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            className="min-h-[100px]"
          />
          <Button onClick={onEdit} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Regenerate"
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
