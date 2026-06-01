import { THEME_NAMES } from "./themes";

export const APP_LAYOUT_CONFIG_PROMPT = `You are the lead UI/UX developer designing a complete ${"{deviceType}"} app flow.

Available themes (pick ONE that best fits the product): ${THEME_NAMES.join(", ")}

Return ONLY valid JSON (no markdown) with this exact structure:
{
  "projectName": "string",
  "theme": "one theme name from the list",
  "projectVisualDescription": "2-3 sentences describing overall visual language",
  "screens": [
    {
      "screenId": "1",
      "name": "Screen title",
      "purpose": "why this screen exists",
      "layoutDescription": "detailed layout: sections, components, copy placeholders, navigation"
    }
  ]
}

Rules:
- Generate 3-5 screens for a coherent user journey (splash/welcome, main flows, key actions).
- Device: ${"{deviceType}"} — mobile = portrait phone UI; website = desktop web layout.
- Match screen count and complexity to the user prompt.
- Theme must be exactly one name from the available themes list.`;

export const GENERATE_SCREEN_PROMPT = `You are an expert UI engineer. Generate a single high-fidelity screen as raw HTML using Tailwind CSS utility classes only.

Requirements:
- Output ONLY the inner HTML for the screen body (no <html>, <head>, or <body> tags).
- Use semantic structure: header, main, sections, buttons, cards as needed.
- Use placeholder images: https://picsum.photos/seed/{random}/400/300
- Use realistic placeholder text matching the screen purpose.
- Avatar URLs: https://i.pravatar.cc/150?u={random}
- Mobile: max-width feel ~390px content; Website: wider layout ~1200px content area.
- MUST use semantic Tailwind classes tied to theme: bg-background, text-foreground, bg-primary, text-primary-foreground, bg-secondary, bg-card, text-card-foreground, bg-muted, text-muted-foreground, border-border, bg-accent. Do NOT use raw hex colors or generic gray-*/blue-* utilities.
- Make it polished, modern SaaS quality — spacing, typography hierarchy, subtle shadows.
- Do not include <script> tags.`;

export const EDIT_SCREEN_PROMPT = `You are an expert UI engineer. The user wants to MODIFY an existing screen.

Return ONLY the updated inner HTML (Tailwind CSS utilities). Keep the same general purpose unless the user asks to change it dramatically.

Existing context will be provided. Apply the user's edit request precisely.`;

export const PROMPT_SUGGESTIONS = [
  {
    emoji: "✈️",
    name: "Travel Planner App",
    description:
      "Mobile travel planner with destination search, itinerary timeline, map view, and booking confirmation screens. Clean airy design with soft blues.",
  },
  {
    emoji: "🤖",
    name: "AI Learning Platform",
    description:
      "Ed-tech website with course catalog, AI tutor chat, lesson player, and progress dashboard. Modern purple and white SaaS aesthetic.",
  },
  {
    emoji: "💳",
    name: "Finance Tracker",
    description:
      "Mobile finance app with spending overview, category charts, add transaction flow, and monthly budget goals. Fintech mint green style.",
  },
  {
    emoji: "🛒",
    name: "E-Commerce Store",
    description:
      "Online store with product grid, product detail, cart, and checkout. Warm minimal retail UI with coral accents.",
  },
  {
    emoji: "🗓️",
    name: "Smart To-Do Planner",
    description:
      "Productivity app with today view, task lists, calendar, and focus timer. Soft neutral UI with indigo highlights.",
  },
  {
    emoji: "🍔",
    name: "Food Delivery App",
    description:
      "Food delivery mobile app with restaurant browse, menu, cart, and live order tracking. Warm appetizing orange and cream palette.",
  },
  {
    emoji: "👶",
    name: "Kids Learning App",
    description:
      "Playful kids learning app with colorful home, game selection, rewards, and parent dashboard. Rounded friendly UI.",
  },
];
