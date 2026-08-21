import { useEffect } from 'react';
import { C } from '../../theme/tokens';
import { btnGhost } from '../../theme/styles';

/** Bottom sheet on a phone, centred dialog on a desktop. Closes on backdrop click or Escape. */
export default function Sheet({ open, onClose, title, children, doneLabel = 'Done' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheet-scrim" role="dialog" aria-modal="true" aria-label={title}>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(27,31,28,0.35)', animation: 'fadeIn 200ms ease' }}
      />
      <div className="sheet-panel" style={{ background: C.card }}>
        <div className="sheet-grabber" style={{ background: C.faint }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{title}</h2>
          <button type="button" onClick={onClose} style={btnGhost}>{doneLabel}</button>
        </div>
        {children}
      </div>
    </div>
  );
}
