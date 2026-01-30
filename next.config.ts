import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
// Configure server to use localhost instead of 0.0.0.0
if (typeof require !== 'undefined') {
  const { createServer } = require('http');
}

