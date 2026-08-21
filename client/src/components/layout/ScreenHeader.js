import { C } from '../../theme/tokens';
import { pageTitle } from '../../theme/styles';

export default function ScreenHeader({ eyebrow, title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
      <div>
        {eyebrow && <div style={{ fontSize: 14, color: C.stone, fontWeight: 500 }}>{eyebrow}</div>}
        <h1 style={{ ...pageTitle, marginTop: eyebrow ? 2 : 0 }}>{title}</h1>
      </div>
      {action}
    </div>
  );
}
