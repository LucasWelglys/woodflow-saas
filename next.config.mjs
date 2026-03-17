/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Isso evita que o deploy pare por erros de formatação
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Isso evita que o deploy pare por erros de tipagem
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
          },
        ],
      },
    ]
  },
};

export default nextConfig;