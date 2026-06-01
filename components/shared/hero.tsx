"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { toast } from "sonner";
import { Send, Loader2, ChevronDown } from "lucide-react";
import { PROMPT_SUGGESTIONS } from "@/data/prompts";
import type { DeviceType } from "@/types";

export default function Hero() {
  const [userInput, setUserInput] = useState("");
  const [device, setDevice] = useState<DeviceType>("mobile");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const onCreate = async () => {
    if (!userInput.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    setLoading(true);
    try {
      const projectId = crypto.randomUUID();
      await axios.post("/api/project", {
        userInput,
        device,
        projectId,
      });
      router.push(`/project/${projectId}`);
    } catch {
      toast.error("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative px-6 pb-10 pt-10 md:px-10 md:pt-14">
      <div className="mx-auto max-w-4xl text-center">
        <div
          className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm text-[#374151] shadow-sm backdrop-blur-sm"
          style={{ animationDelay: "0.05s" }}
        >
          <span>🎉</span>
          <span className="text-[#9ca3af]">|</span>
          <span>Introducing Magic UI</span>
          <span className="text-[#9ca3af]">&gt;</span>
        </div>

        <h1
          className="animate-fade-in-up font-heading text-4xl font-light leading-tight tracking-tight text-[#1f2937] md:text-5xl lg:text-[3.25rem]"
          style={{ animationDelay: "0.12s" }}
        >
          Design High Quality{" "}
          <span className="text-[#ff6b6b]">Website and Mobile App</span> Designs
        </h1>

        <p
          className="animate-fade-in-up mx-auto mt-5 max-w-2xl text-base text-[#6b7280] md:text-lg"
          style={{ animationDelay: "0.2s" }}
        >
          From websites to mobile apps, we turn ideas into intuitive, high-impact
          digital experiences. ✨
        </p>

        <div
          className="animate-fade-in-up mx-auto mt-10 w-full max-w-md"
          style={{ animationDelay: "0.28s" }}
        >
          <div className="rounded-2xl bg-gradient-to-b from-white to-[#faf9fc] p-[1px] shadow-[0_12px_40px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.04]">
            <div className="rounded-[15px] bg-white px-4 py-3.5">
              <textarea
                placeholder="Describe the app you want to design…"
                rows={3}
                className="w-full resize-none border-0 bg-transparent text-[15px] leading-relaxed text-[#374151] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-0"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onCreate();
                }}
              />
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-100 pt-3">
                <div className="relative">
                  <select
                    value={device}
                    onChange={(e) => setDevice(e.target.value as DeviceType)}
                    className="appearance-none rounded-lg border border-[#ececef] bg-[#fafafa] py-2 pl-3 pr-9 text-sm font-medium text-[#374151] transition-colors hover:border-[#e4e4e7] focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/25"
                  >
                    <option value="mobile">Mobile</option>
                    <option value="website">Website</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a1a1aa]" />
                </div>
                <button
                  type="button"
                  onClick={onCreate}
                  disabled={loading}
                  className="flex h-10 items-center gap-2 rounded-full bg-[#ff6b6b] px-4 text-sm font-medium text-white shadow-md transition-all hover:bg-[#ff5252] hover:shadow-lg disabled:opacity-60"
                  aria-label="Generate design"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 -rotate-45" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          <p className="mt-2.5 text-center text-xs text-[#a1a1aa]">
            Press Ctrl+Enter to generate
          </p>
        </div>

        <div
          className="animate-fade-in-up mx-auto mt-8 flex max-w-5xl flex-wrap justify-center gap-3"
          style={{ animationDelay: "0.36s" }}
        >
          {PROMPT_SUGGESTIONS.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setUserInput(s.description)}
              className="flex min-w-[120px] flex-col items-center gap-2 rounded-2xl border border-white/80 bg-white/95 px-4 py-4 text-sm font-medium text-[#374151] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-2xl">{s.emoji}</span>
              <span className="max-w-[110px] text-center text-xs leading-snug">
                {s.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
