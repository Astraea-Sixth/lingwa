import withPWA from 'next-pwa'

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

const isHosted = process.env.NEXT_PUBLIC_MODE === 'hosted'

const nextConfig = pwaConfig({
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    if (isHosted) return [] // No Python API in hosted mode
    const apiUrl = process.env.API_BASE_URL || 'http://localhost:5003'
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
})

export default nextConfig
