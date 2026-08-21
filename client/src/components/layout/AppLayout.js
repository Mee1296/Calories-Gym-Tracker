import Head from 'next/head';
import AppShell from './AppShell';
import TabBar from './TabBar';

/**
 * Wraps a tab screen: scrollable body + navigation.
 * `overlay` renders above both (the active workout takes the whole frame).
 */
export default function AppLayout({ tab, title, children, overlay, sheets }) {
  return (
    <AppShell>
      <Head><title>{title ? `${title} · Stride` : 'Stride'}</title></Head>
      <div className="app-content">{children}</div>
      <TabBar active={tab} />
      {sheets}
      {overlay}
    </AppShell>
  );
}
