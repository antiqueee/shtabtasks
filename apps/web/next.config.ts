import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@shtab/db': path.resolve(__dirname, '../../packages/db/dist/index.js'),
      '@shtab/shared': path.resolve(__dirname, '../../packages/shared/dist/index.js'),
    }

    return config
  },
}

export default nextConfig
