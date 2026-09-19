import type { NextConfig } from 'next';
const nextConfig: NextConfig = { images: { formats:['image/avif','image/webp'] }, allowedDevOrigins:['*.e2b.app'] };
export default nextConfig;
