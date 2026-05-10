/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Allow <img> tags to load avatars from external providers without Next.js blocking them.
  // Note: we use <img> (not next/image) so remotePatterns only applies if you switch later.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
    ],
  },

  // Expose the API URL to the browser bundle.
  // Fallback to localhost so the app works even if .env.local is missing.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
};

export default nextConfig;
