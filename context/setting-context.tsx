"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SettingDetail } from "@/types";

type SettingContextValue = {
  settingDetail: SettingDetail | null;
  setSettingDetail: React.Dispatch<
    React.SetStateAction<SettingDetail | null>
  >;
  activeTheme: string;
};

export const SettingContext = createContext<SettingContextValue | null>(null);

export function SettingProvider({ children }: { children: ReactNode }) {
  const [settingDetail, setSettingDetail] = useState<SettingDetail | null>(
    null
  );

  const value = useMemo(
    () => ({
      settingDetail,
      setSettingDetail,
      activeTheme: settingDetail?.theme ?? "Polar Mint",
    }),
    [settingDetail]
  );

  return (
    <SettingContext.Provider value={value}>{children}</SettingContext.Provider>
  );
}

export function useSetting() {
  const ctx = useContext(SettingContext);
  if (!ctx) throw new Error("useSetting must be used within SettingProvider");
  return ctx;
}

export function useActiveTheme(fallback = "Polar Mint") {
  const ctx = useContext(SettingContext);
  return ctx?.activeTheme ?? fallback;
}
