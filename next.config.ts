import type { NextConfig } from 'next';
const nextConfig:NextConfig={
 images:{
  formats:['image/avif','image/webp'],
  remotePatterns:[
   {protocol:'https',hostname:'**.supabase.co',pathname:'/storage/v1/object/public/**'},
   {protocol:'https',hostname:'images.pexels.com',pathname:'/photos/**'}
  ]
 },
 allowedDevOrigins:['*.e2b.app'],
 poweredByHeader:false,
 async headers(){return [{source:'/(.*)',headers:[
  {key:'X-Content-Type-Options',value:'nosniff'},
  {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
  {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=(self)'}
 ]}]}
};
export default nextConfig;
