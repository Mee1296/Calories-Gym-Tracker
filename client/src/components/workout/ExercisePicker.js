import { useMemo, useState } from 'react';
import { C, RADIUS } from '../../theme/tokens';
import { textInput, sectionLabel, btnDashed } from '../../theme/styles';
import { EmptyState, Sheet, Spinner } from '../ui';
import MovementForm from './MovementForm';

/**
 * Searchable movement library, grouped by muscle group. When `onCreate` is
 * supplied the sheet doubles as a "new movement" form, so a movement the
 * library is missing can be added without leaving the picker.
 */
export default function ExercisePicker({ open, onClose, onPick, groups, loading, onCreate, title = 'Choose a movement' }) {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => ({ ...group, moves: group.moves.filter((m) => m.name.toLowerCase().includes(q)) }))
      .filter((group) => group.moves.length > 0);
  }, [groups, query]);

  const reset = () => { setQuery(''); setCreating(false); };
  const close = () => { reset(); onClose(); };
  const pick = (movement) => { reset(); onPick(movement); };

  if (creating) {
    return (
      <Sheet open={open} onClose={close} title="New movement" doneLabel="Close">
        <MovementForm
          initialName={query.trim()}
          onSubmit={onCreate}
          onSaved={pick}
          onCancel={() => setCreating(false)}
        />
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onClose={close} title={title} doneLabel="Close">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search movements…"
        aria-label="Search movements"
        style={{ ...textInput, marginBottom: 14 }}
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Nothing matches"
          message={query ? `No movements found for “${query}”.` : 'The movement library is empty.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {filtered.map((group) => (
            <div key={group.group}>
              <div style={{ ...sectionLabel, margin: '0 4px 8px' }}>{group.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.moves.map((movement) => (
                  <button
                    key={movement._id}
                    type="button"
                    onClick={() => pick(movement)}
                    style={{
                      border: 'none',
                      background: C.bg,
                      borderRadius: RADIUS.md,
                      padding: '13px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                      font: 'inherit',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{movement.name}</span>
                    <span style={{ fontSize: 12, color: C.stone, flexShrink: 0 }}>
                      {movement.defaultWeight > 0 ? `${movement.defaultWeight} kg × ` : ''}{movement.defaultReps}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {onCreate && !loading && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          style={{ ...btnDashed, padding: 14, marginTop: 18 }}
        >
          {query.trim() ? `+ Create “${query.trim()}”` : '+ New movement'}
        </button>
      )}
    </Sheet>
  );
}
