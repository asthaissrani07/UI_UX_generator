"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Logo from "./logo";
import { isClerkConfigured } from "@/lib/clerk-config";

const nav = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-10">
        <Logo />
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "text-[#1a1a2e]"
                  : "text-[#6b7280] hover:text-[#1a1a2e]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <nav className="flex md:hidden items-center gap-4 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  pathname === item.href ? "font-medium" : "text-muted-foreground"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {isClerkConfigured ? (
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: { avatarBox: "h-9 w-9" },
              }}
            />
          ) : (
            <Link
              href="/sign-in"
              className="text-sm font-medium text-[#1a1a2e] hover:underline"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
