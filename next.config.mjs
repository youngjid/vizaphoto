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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fal.media',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  env: {
    NEXT_PUBLIC_FAL_KEY: process.env.NEXT_PUBLIC_FAL_KEY,
  },
  webpack: (config, { isServer }) => {
    // Ensure fal-ai client and face-api.js dependencies are properly bundled
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        encoding: false,
        stream: false,
        https: false,
        http: false,
        url: false,
        zlib: false,
      };
    }
    return config;
  },
}

export default nextConfig
