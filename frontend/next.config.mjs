/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: {
    buildActivity: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d3s0sywpv84719.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "2424-backoffice.winfordcap.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/appel-offres",
        destination: "/appels-offres",
        permanent: true,
      },
      {
        source: "/appel-offres/:path*",
        destination: "/appels-offres/:path*",
        permanent: true,
      },
      {
        source: "/comments/feed",
        destination: "/actualites",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
