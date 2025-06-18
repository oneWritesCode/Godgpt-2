// import type { NextConfig } from 'next';


// const nextConfig: NextConfig = {
//   rewrites: async () => {
//     return [
//       {
//         source: '/((?!api/).*)',
//         destination: '/static-app-shell',
//       },
//     ];
//   },
// };

// export default nextConfig

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Remove the custom rewrites for now - we'll test them later
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

export default nextConfig;