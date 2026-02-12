/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.1.109', // Allow your LAN device
    '*.local',        // Optional: wildcard for local subdomains
  ],
}

export default nextConfig
