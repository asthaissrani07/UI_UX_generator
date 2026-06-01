import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <span
        className="h-9 w-9 rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-105"
        style={{
          background:
            "conic-gradient(from 180deg, #6366f1, #ec4899, #f97316, #8b5cf6, #6366f1)",
        }}
        aria-hidden
      />
      <span className="font-heading text-lg font-light tracking-tight text-[#1a1a2e]">
        UIUX <span className="font-normal">MOCK</span>
      </span>
    </Link>
  );
}
