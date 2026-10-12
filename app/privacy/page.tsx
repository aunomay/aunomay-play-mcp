import type { Metadata } from "next";
import { SITE_URL } from "@/lib/aunomay";

export const metadata: Metadata = {
  title: "Privacy — Aunomay Play MCP Server",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <main>
      <h1>Privacy policy — Aunomay Play MCP Server</h1>
      <p>Last updated: 12 October 2026</p>
      <ul>
        <li>The server is read-only. It needs no account, login or API key and does not ask for personal data.</li>
        <li>
          The only input it receives is what your AI assistant sends to its tools: search keywords, category, sort order,
          language and game slugs. These are used to query the public <a href={`${SITE_URL}/api/v1`}>Aunomay Play catalog API</a> and
          are not stored with any identifier, sold or shared.
        </li>
        <li>
          Our hosting provider (Vercel) keeps standard request logs (time, path, status, IP address) for security and
          troubleshooting for a limited period.
        </li>
        <li>
          Game links include <code>utm_*</code> parameters so we can count visits that come from AI assistants. Playing a
          game happens on <a href={SITE_URL}>play.aunomay.com</a> and is covered by the{" "}
          <a href={`${SITE_URL}/page/privacy`}>Aunomay Play privacy policy</a>.
        </li>
        <li>The service is meant for a general audience and does not knowingly collect data from children.</li>
      </ul>
      <p>
        Questions or deletion requests: <a href="mailto:support@aunomay.com">support@aunomay.com</a>
      </p>
      <p><a href="/">← Back</a></p>
    </main>
  );
}
