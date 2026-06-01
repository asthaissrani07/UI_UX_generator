import Header from "@/components/shared/header";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-12 prose prose-neutral dark:prose-invert">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground not-prose">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <h2>Use of the service</h2>
        <p>
          UI/UX Mock is provided as-is for personal and educational use. AI
          generated designs may be inaccurate or unsuitable for production
          without review.
        </p>
        <h2>Your content</h2>
        <p>
          You own the prompts you submit. Generated HTML mockups are yours to
          use, but verify licensing for any third-party assets (images, icons)
          embedded by the AI.
        </p>
        <h2>Acceptable use</h2>
        <p>
          Do not use the service for illegal content, spam, or attempts to
          overload AI or database providers.
        </p>
        <p className="not-prose pt-4">
          <Link href="/" className="text-primary hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
