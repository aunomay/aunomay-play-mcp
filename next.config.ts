import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        // MCP clients (browser-based inspectors, ChatGPT) call the endpoint cross-origin.
        source: "/mcp",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID" },
          { key: "Access-Control-Expose-Headers", value: "Mcp-Session-Id, Mcp-Protocol-Version" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

export default nextConfig;
