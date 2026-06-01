"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { isClerkConfigured } from "@/lib/clerk-config";

export function AppProviders({ children }: { children: React.ReactNode }) {
  if (!isClerkConfigured) {
    return (
      <>
        {children}
        <Toaster position="top-center" richColors />
      </>
    );
  }

  return (
    <ClerkProvider>
      {children}
      <Toaster position="top-center" richColors />
    </ClerkProvider>
  );
}
