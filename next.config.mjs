/** @type {import('next').NextConfig} */
export default {
  eslint: { ignoreDuringBuilds: true },
  experimental: { serverComponentsExternalPackages: ['youtubei.js'] },
};
