import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@shtab/db', '@shtab/shared'],
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@workspace/db': path.resolve(__dirname, '../../packages/db/dist/index.js'),
      '@workspace/shared': path.resolve(__dirname, '../../packages/shared/dist/index.js'),
    }

    return config
  },
}

export default nextConfig
