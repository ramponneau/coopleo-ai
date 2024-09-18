/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  env: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
}

module.exports = nextConfig;