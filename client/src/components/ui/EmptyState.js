import { C } from '../../theme/tokens';

export default function EmptyState({ icon, title, message, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: C.stone }}>
      {icon && <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>}
      <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{title}</div>
      {message && <div style={{ fontSize: 14, lineHeight: 1.5 }}>{message}</div>}
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  );
}
