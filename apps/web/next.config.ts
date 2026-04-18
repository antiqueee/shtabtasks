import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@shtab/db', '@shtab/shared'],
}

export default nextConfig
