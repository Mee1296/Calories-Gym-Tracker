import { C, FONT } from '../../theme/tokens';

/**
 * The app frame. A centred 420px column on a phone; from 900px the same
 * markup lays out as a desktop app with a sidebar (see globals.css).
 */
export default function AppShell({ children }) {
  return (
    <div className="app-shell" style={{ background: C.shell, fontFamily: FONT, color: C.ink }}>
      <div className="app-frame" style={{ background: C.bg }}>
        {children}
      </div>
    </div>
  );
}
