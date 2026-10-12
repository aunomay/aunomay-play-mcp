import type { Metadata } from "next";
import "./globals.css";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://aunomay-play-mcp.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: "Aunomay Play MCP Server — free browser games in ChatGPT, Claude & Cursor",
  description:
    "Open MCP server for Aunomay Play. Search, browse and launch free HTML5 browser games from ChatGPT, Claude, Cursor and any Model Context Protocol client.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Aunomay Play MCP Server",
    description: "Find and play free HTML5 browser games from your AI assistant.",
    url: "/",
    siteName: "Aunomay Play",
    type: "website",
  },
  authors: [{ name: "Aunomay", url: "https://play.aunomay.com" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
