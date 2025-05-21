// next.config.js
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.mjs"; // Updated to .mjs

/** @type {import("next").NextConfig} */
const config = {
  // Add any other Next.js specific configurations here if needed.
  // For example, if you have image domains, experimental features, etc.
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'example.com', // Replace with actual image hostnames
  //     },
  //   ],
  // },
};

export default config;