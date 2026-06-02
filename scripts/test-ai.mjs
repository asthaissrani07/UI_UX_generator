/**
 * Run: node scripts/test-ai.mjs
 * Loads .env.local and tests Groq / Gemini keys.
 */
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch {
    console.log("No .env.local found");
  }
}

loadEnv();

async function testGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!key) return console.log("GROQ: skip (no key)");
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
  console.log("GROQ:", res.status, body.error?.message ?? body.choices?.[0]?.message?.content?.slice(0, 50));
}

async function testGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return console.log("GEMINI: skip (no key)");
  const model = "gemini-2.0-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: "Say OK" }] }],
    }),
  });
  const body = await res.json();
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log("GEMINI:", res.status, body.error?.message ?? text?.slice(0, 50));
}

await testGroq();
await testGemini();
