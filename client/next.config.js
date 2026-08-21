/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Emits .next/standalone with a minimal node_modules for the Docker image.
  // Vercel produces its own build output and does not want this.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  // Nothing gained by advertising the framework and version.
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,

  async headers() {
    // The app is all first-party: its own JS, inline styles from the theme
    // tokens, self-hosted fonts, and XHR to the API. connect-src has to allow
    // the API origin, which differs per deployment, so it is derived from the
    // same env var the client already builds against.
    const api = process.env.NEXT_PUBLIC_API_URL || '';
    const apiOrigin = (() => {
      try { return new URL(api).origin; } catch { return ''; }
    })();

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ''}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [{
      source: '/:path*',
      headers: [
        { key: 'Content-Security-Policy', value: csp },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' },
      ],
    }];
  },

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
