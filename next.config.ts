import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本番は standalone 出力（Docker イメージを最小化。CD は Issue #7）
  output: "standalone",
  reactStrictMode: true,
};

export default nextConfig;
