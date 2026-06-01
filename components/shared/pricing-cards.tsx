"use client";

import Link from "next/link";
import { Check } from "lucide-react";

const freeFeatures = [
  { text: "Limited Only 2 Project", highlight: true },
  { text: "No UIUX HTML Code", highlight: false },
  { text: "No New Screen", highlight: false },
];

const unlimitedFeatures = [
  "Generate unlimited Project",
  "View UIUX Html Code",
  "Add Unlimited New screens",
  "Edit Screens",
  "24/7 Email Support",
];

export default function PricingCards() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      {/* Free plan */}
      <div
        className="animate-fade-in-up flex flex-col rounded-2xl bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
        style={{ animationDelay: "0.1s" }}
      >
        <h2 className="font-heading text-xl font-light text-[#1a1a2e]">Free</h2>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="font-heading text-5xl font-light text-[#1a1a2e]">$0</span>
        </div>
        <p className="mt-1 text-sm text-[#9ca3af]">Always free</p>

        <ul className="mt-8 flex-1 space-y-4">
          {freeFeatures.map((f) => (
            <li key={f.text} className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#3b82f6]" />
              <span
                className={`text-sm ${
                  f.highlight
                    ? "rounded-md bg-[#dbeafe] px-2 py-0.5 text-[#1e40af]"
                    : "text-[#374151]"
                }`}
              >
                {f.text}
              </span>
            </li>
          ))}
        </ul>

        <Link
          href="/"
          className="mt-8 block w-full rounded-xl bg-[#1a1a2e] py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#2d2d44]"
        >
          Switch to this plan
        </Link>
      </div>

      {/* Unlimited plan */}
      <div
        className="animate-fade-in-up relative flex flex-col rounded-2xl bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
        style={{ animationDelay: "0.2s" }}
      >
        <span className="absolute right-6 top-6 rounded-full bg-[#1a1a2e] px-3 py-1 text-xs font-medium text-white">
          Free trial
        </span>

        <h2 className="font-heading text-xl font-light text-[#1a1a2e]">Unlimited</h2>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="font-heading text-5xl font-light text-[#1a1a2e]">$7.99</span>
          <span className="text-[#9ca3af]">/month</span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="relative h-5 w-9 rounded-full bg-[#1a1a2e]">
            <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow" />
          </div>
          <span className="text-sm text-[#6b7280]">Billed annually</span>
        </div>

        <ul className="mt-8 flex-1 space-y-4">
          {unlimitedFeatures.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#9ca3af]" />
              <span className="text-sm text-[#374151]">{f}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/sign-in"
          className="mt-8 block w-full rounded-xl border border-[#e5e7eb] py-3.5 text-center text-sm font-semibold text-[#1a1a2e] transition-colors hover:bg-[#f9fafb]"
        >
          Start free trial
        </Link>

        <p className="mt-4 text-center text-sm text-[#9ca3af]">
          Trial ends Dec 31 · All features unlocked in this build
        </p>
      </div>
    </div>
  );
}
