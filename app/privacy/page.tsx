import Header from "@/components/shared/header";
import MarketingShell from "@/components/shared/marketing-shell";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-12 md:py-16">
        <h1 className="text-3xl font-bold text-[#1a1a2e]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="mt-8 space-y-6 text-[#374151] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#1a1a2e]">Overview</h2>
            <p className="mt-2 text-sm">
              UIUX Mock is a project for generating AI mockups. We collect only
              what is needed to run the app: your account email (via Clerk),
              project prompts, and generated designs stored in your database.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a2e]">
              Data we store
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>Account info from Clerk (email, profile)</li>
              <li>Projects, prompts, and generated screen HTML</li>
              <li>Optional project thumbnails (base64 screenshots)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a2e]">
              Third-party services
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>Clerk — authentication</li>
              <li>Neon — database hosting</li>
              <li>OpenRouter — AI generation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a2e]">Contact</h2>
            <p className="mt-2 text-sm">
              Questions about your data? Delete your projects from the home
              screen or contact the app owner.
            </p>
          </section>
        </div>

        <p className="mt-10">
          <Link
            href="/"
            className="text-sm font-medium text-[#ff6b6b] hover:underline"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </MarketingShell>
  );
}
