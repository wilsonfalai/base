import type { NextConfig } from "next";
import { config } from "dotenv";

config({ path: "../../.env", quiet: true });

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
