import type { NextConfig } from 'next';
import MillionLint from '@million/lint'

const nextConfig: NextConfig = {
  rewrites: async () => {
    return [
      {
        source: '/((?!api/).*)',
        destination: '/static-app-shell',
      },
    ];
  },
};

export default MillionLint.next({ rsc: true})(nextConfig);