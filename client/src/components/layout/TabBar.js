import Link from 'next/link';
import { C, FONT } from '../../theme/tokens';

export const TABS = [
  { id: 'today', href: '/today', label: 'Today', icon: '☀️' },
  { id: 'workout', href: '/workout', label: 'Workout', icon: '🏋️' },
  { id: 'progress', href: '/progress', label: 'Progress', icon: '📈' },
];

/** Bottom tab bar on a phone, left sidebar from 900px — see globals.css. */
export default function TabBar({ active }) {
  return (
    <nav className="app-nav">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className="app-nav-link"
            aria-current={isActive ? 'page' : undefined}
            style={{ fontFamily: FONT }}
          >
            <span
              className="app-nav-icon"
              style={{
                filter: isActive ? 'none' : 'grayscale(1) opacity(.55)',
                transform: isActive ? 'translateY(-2px)' : 'none',
              }}
            >
              {tab.icon}
            </span>
            <span className="app-nav-label" style={{ color: isActive ? C.moss : C.stone }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
