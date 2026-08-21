import Link from 'next/link';
import AppShell from '../components/layout/AppShell';
import { EmptyState } from '../components/ui';
import { btnSoft } from '../theme/styles';

export default function NotFoundPage() {
  return (
    <AppShell>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState
          icon="🧭"
          title="Nothing here"
          message="That page doesn't exist."
          action={<Link href="/today" style={{ ...btnSoft, textDecoration: 'none' }}>Back to Today</Link>}
        />
      </div>
    </AppShell>
  );
}
