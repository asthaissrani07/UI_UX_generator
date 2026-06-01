export type ThemeColors = {
  name: string;
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  border: string;
};

export const THEME_LIST: ThemeColors[] = [
  {
    name: "Polar Mint",
    background: "#f0fdf9",
    foreground: "#134e4a",
    primary: "#0d9488",
    primaryForeground: "#f0fdf9",
    secondary: "#ccfbf1",
    secondaryForeground: "#115e59",
    accent: "#5eead4",
    accentForeground: "#134e4a",
    muted: "#99f6e4",
    mutedForeground: "#0f766e",
    card: "#ffffff",
    cardForeground: "#134e4a",
    popover: "#ffffff",
    popoverForeground: "#134e4a",
    border: "#99f6e4",
  },
  {
    name: "Netflix",
    background: "#141414",
    foreground: "#ffffff",
    primary: "#e50914",
    primaryForeground: "#ffffff",
    secondary: "#2b2b2b",
    secondaryForeground: "#ffffff",
    accent: "#b20710",
    accentForeground: "#ffffff",
    muted: "#333333",
    mutedForeground: "#b3b3b3",
    card: "#1f1f1f",
    cardForeground: "#ffffff",
    popover: "#1f1f1f",
    popoverForeground: "#ffffff",
    border: "#333333",
  },
  {
    name: "Spotify",
    background: "#121212",
    foreground: "#ffffff",
    primary: "#1db954",
    primaryForeground: "#000000",
    secondary: "#282828",
    secondaryForeground: "#ffffff",
    accent: "#1ed760",
    accentForeground: "#000000",
    muted: "#535353",
    mutedForeground: "#b3b3b3",
    card: "#181818",
    cardForeground: "#ffffff",
    popover: "#282828",
    popoverForeground: "#ffffff",
    border: "#535353",
  },
  {
    name: "Shopify",
    background: "#f6f6f7",
    foreground: "#212326",
    primary: "#008060",
    primaryForeground: "#ffffff",
    secondary: "#e3e3e3",
    secondaryForeground: "#212326",
    accent: "#95bf47",
    accentForeground: "#212326",
    muted: "#f1f1f1",
    mutedForeground: "#6d7175",
    card: "#ffffff",
    cardForeground: "#212326",
    popover: "#ffffff",
    popoverForeground: "#212326",
    border: "#c9cccf",
  },
  {
    name: "Amazon",
    background: "#ffffff",
    foreground: "#0f1111",
    primary: "#ff9900",
    primaryForeground: "#0f1111",
    secondary: "#f3f3f3",
    secondaryForeground: "#0f1111",
    accent: "#232f3e",
    accentForeground: "#ffffff",
    muted: "#eaeded",
    mutedForeground: "#565959",
    card: "#ffffff",
    cardForeground: "#0f1111",
    popover: "#ffffff",
    popoverForeground: "#0f1111",
    border: "#d5d9d9",
  },
  {
    name: "Stripe",
    background: "#f6f9fc",
    foreground: "#0a2540",
    primary: "#635bff",
    primaryForeground: "#ffffff",
    secondary: "#e6ebf1",
    secondaryForeground: "#0a2540",
    accent: "#00d4ff",
    accentForeground: "#0a2540",
    muted: "#f6f9fc",
    mutedForeground: "#697386",
    card: "#ffffff",
    cardForeground: "#0a2540",
    popover: "#ffffff",
    popoverForeground: "#0a2540",
    border: "#e6ebf1",
  },
];

export const THEME_NAMES = THEME_LIST.map((t) => t.name);

export function themeToCssVariables(themeName: string): string {
  const theme =
    THEME_LIST.find((t) => t.name === themeName) ?? THEME_LIST[0];
  return `:root {
  --background: ${theme.background};
  --foreground: ${theme.foreground};
  --primary: ${theme.primary};
  --primary-foreground: ${theme.primaryForeground};
  --secondary: ${theme.secondary};
  --secondary-foreground: ${theme.secondaryForeground};
  --accent: ${theme.accent};
  --accent-foreground: ${theme.accentForeground};
  --muted: ${theme.muted};
  --muted-foreground: ${theme.mutedForeground};
  --card: ${theme.card};
  --card-foreground: ${theme.cardForeground};
  --popover: ${theme.popover};
  --popover-foreground: ${theme.popoverForeground};
  --border: ${theme.border};
}`;
}
