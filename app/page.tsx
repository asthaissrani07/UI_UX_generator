import Header from "@/components/shared/header";
import MarketingShell from "@/components/shared/marketing-shell";
import Hero from "@/components/shared/hero";
import ProjectList from "@/components/shared/project-list";
import Link from "next/link";

export default function HomePage() {
  return (
    <MarketingShell>
      <Header />
      <Hero />
      <ProjectList />
      <footer className="border-t border-white/60 py-8 text-center text-sm text-[#9ca3af]">
        <Link href="/privacy" className="hover:text-[#374151] hover:underline">
          Privacy Policy
        </Link>
      </footer>
    </MarketingShell>
  );
}
