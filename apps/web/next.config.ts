import type { NextConfig } from "next";
import { config } from "dotenv";

config({ path: "../../.env", quiet: true });

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
