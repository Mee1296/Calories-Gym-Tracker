import Head from 'next/head';
import { Outfit } from 'next/font/google';
import '../styles/globals.css';

/**
 * Self-hosted at build time. The stylesheet link this replaces was a
 * render-blocking request to a third party before anything could paint.
 */
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-outfit',
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

export default function StrideApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Stride</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="A calm gym and nutrition companion." />
        <meta name="theme-color" content="#F5F6F3" />
      </Head>
      <div className={outfit.variable} style={{ display: 'contents' }}>
        <Component {...pageProps} />
      </div>
    </>
  );
}
