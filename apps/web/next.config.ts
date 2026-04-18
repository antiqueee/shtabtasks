import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@shtab/db', '@shtab/shared'],
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@shtab/db': path.resolve(__dirname, '../../packages/db/dist'),
      '@shtab/shared': path.resolve(__dirname, '../../packages/shared/dist'),
      '@shtab/shared/llm': path.resolve(__dirname, '../../packages/shared/dist/llm/openrouter.js'),
      '@shtab/shared/utils/rrule': path.resolve(
        __dirname,
        '../../packages/shared/dist/utils/rrule.js',
      ),
    }

    return config
  },
}

export default nextConfig
