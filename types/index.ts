export type DeviceType = "website" | "mobile";

export type ProjectType = {
  id: number;
  projectId: string;
  userId: string;
  userInput: string;
  device: DeviceType | string;
  projectName?: string | null;
  theme?: string | null;
  projectVisualDescription?: string | null;
  screenshot?: string | null;
  createdOn: Date | string;
};

export type ScreenConfig = {
  id: number;
  projectId: string;
  screenId: string;
  screenName: string | null;
  purpose: string | null;
  screenDescription: string | null;
  code: string | null;
};

export type LayoutConfigResponse = {
  projectName: string;
  theme: string;
  projectVisualDescription: string;
  screens: {
    screenId: string;
    name: string;
    purpose: string;
    layoutDescription: string;
  }[];
};

export type SettingDetail = ProjectType & {
  theme?: string;
};
