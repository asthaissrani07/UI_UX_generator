/**
 * Run: node scripts/test-ai.mjs
 * Tests GROQ_API_KEY from .env.local
 */
import { readFileSync } from "fs";
import { resolve } from "path";

try {
  const raw = readFileSync(resolve(".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
} catch {
  console.log("No .env.local");
}

const key = process.env.GROQ_API_KEY;
if (!key) {
  console.log("GROQ_API_KEY not set in .env.local");
  process.exit(1);
}

const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: "Say OK" }],
    max_tokens: 10,
  }),
});

const body = await res.json();
console.log(
  res.status,
  body.error?.message ?? body.choices?.[0]?.message?.content
);
