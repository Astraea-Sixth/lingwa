import withPWA from 'next-pwa'

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig = pwaConfig({
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    const apiUrl = process.env.API_BASE_URL || 'http://localhost:5005'
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
})

export default nextConfig
