/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
    outputFileTracing: true, // Enable output file tracing
  },
  output: 'standalone', // Create a minimal deployment
  env: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
}

module.exports = nextConfig;