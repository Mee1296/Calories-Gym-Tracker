/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Emits .next/standalone with a minimal node_modules — used by the Docker image.
  output: 'standalone',
  async redirects() {
    // The old flat routes are gone; send anyone holding a link into the app.
    return [
      { source: '/dashboard', destination: '/today', permanent: false },
      { source: '/calories', destination: '/today', permanent: false },
      { source: '/weight', destination: '/today', permanent: false },
      { source: '/training', destination: '/workout', permanent: false },
      { source: '/lift-history', destination: '/workout', permanent: false },
    ];
  },
};
