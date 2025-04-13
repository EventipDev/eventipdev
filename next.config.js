/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'vpqeqhriawxbafmwiwjs.supabase.co',
      'via.placeholder.com',
      'res.cloudinary.com',
      'placehold.co',
      'images.unsplash.com',
      'randomuser.me',
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
