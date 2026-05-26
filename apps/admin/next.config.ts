import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@qpulse/shared'],
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

export default nextConfig;
