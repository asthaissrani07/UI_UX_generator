"use client";

import Link from "next/link";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSetting } from "@/context/setting-context";

type Props = {
  onSaved?: (updates: { projectName?: string; theme?: string }) => void;
};

export default function ProjectHeader({ onSaved }: Props) {
  const { settingDetail } = useSetting();
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    if (!settingDetail?.projectId) return;
    setLoading(true);
    try {
      await axios.put("/api/project", {
        projectId: settingDetail.projectId,
        projectName: settingDetail.projectName,
        theme: settingDetail.theme,
      });
      onSaved?.({
        projectName: settingDetail.projectName ?? undefined,
        theme: settingDetail.theme ?? undefined,
      });
      toast.success("Settings saved");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? String(err.response.data.message)
          : "Save failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="workspace-header flex items-center justify-between border-b px-5 py-3.5 lg:px-6">
      <Link href="/" className="workspace-back flex items-center gap-2">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>
      <h1 className="workspace-title max-w-[50%] truncate text-lg md:text-xl">
        {settingDetail?.projectName ?? "Project"}
      </h1>
      <Button
        size="sm"
        className="workspace-btn-primary gap-2 px-5"
        onClick={onSave}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save
      </Button>
    </header>
  );
}
