/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    // Keep the OCR worker out of the bundle so it can load its own files.
    serverComponentsExternalPackages: ['tesseract.js'],
    // Make sure Vercel ships the OCR engine files with these two routes.
    outputFileTracingIncludes: {
      '/api/upload': [
        './node_modules/tesseract.js-core/**/*',
        './node_modules/tesseract.js/src/worker-script/**/*',
      ],
      '/api/search/refine': [
        './node_modules/tesseract.js-core/**/*',
        './node_modules/tesseract.js/src/worker-script/**/*',
      ],
    },
  },
};

export default nextConfig;