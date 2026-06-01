import Header from "@/components/shared/header";
import MarketingShell from "@/components/shared/marketing-shell";
import PricingCards from "@/components/shared/pricing-cards";
import Link from "next/link";

export default function PricingPage() {
  return (
    <MarketingShell>
      <Header />
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <h1 className="animate-fade-in-up text-center font-heading text-4xl font-light text-[#1a1a2e]">
          Pricing
        </h1>
        <p className="animate-fade-in-up mx-auto mt-3 max-w-lg text-center text-sm text-[#9ca3af]">
          Personal build: all features are unlocked by default. Plans below match
          the original SaaS design.
        </p>
        <div className="mt-12">
          <PricingCards />
        </div>
      </div>
      <footer className="border-t border-white/60 py-8 text-center text-sm text-[#9ca3af]">
        <Link href="/" className="hover:text-[#374151] hover:underline">
          ← Back to home
        </Link>
      </footer>
    </MarketingShell>
  );
}
