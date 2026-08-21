import { useEffect, useMemo, useState } from 'react';
import { C, RADIUS } from '../../theme/tokens';
import { btnDashed, sectionLabel, textInput } from '../../theme/styles';
import { Button, EmptyState, Notice, Sheet, Spinner } from '../ui';
import MovementForm from './MovementForm';
import { movements as movementsApi } from '../../lib/endpoints';
import { errorMessage } from '../../lib/api';
import { plural } from '../../lib/format';

/** Confirmation step: says what a delete will actually disturb before doing it. */
function DeleteConfirm({ movement, onCancel, onConfirm }) {
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    movementsApi.usage(movement._id)
      .then((data) => { if (live) setUsage(data); })
      .catch((err) => { if (live) setError(errorMessage(err)); });
    return () => { live = false; };
  }, [movement._id]);

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(errorMessage(err, 'Could not delete this movement'));
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 15, lineHeight: 1.5 }}>
        Delete <strong>{movement.name}</strong>?
      </div>

      {usage === null && !error ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}><Spinner /></div>
      ) : (
        <>
          {usage?.routines?.length > 0 && (
            <Notice tone="gold">
              It will be removed from {plural(usage.routines.length, 'routine')}: {usage.routines.join(', ')}.
            </Notice>
          )}
          {usage?.loggedSessions > 0 && (
            <Notice tone="neutral">
              {plural(usage.loggedSessions, 'logged session')} used it. Those stay in your
              history — the movement is just retired from the picker.
            </Notice>
          )}
          {usage?.routines?.length === 0 && usage?.loggedSessions === 0 && (
            <Notice tone="neutral">Nothing else uses it.</Notice>
          )}
        </>
      )}

      {error && <Notice tone="danger">{error}</Notice>}

      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="ghost" onClick={onCancel} style={{ flex: 1 }}>Keep it</Button>
        <Button
          onClick={remove}
          loading={busy}
          style={{ flex: 1, background: C.danger }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

/**
 * Browse, add, edit and delete movements. `mode` walks between the list and the
 * add / edit / confirm-delete steps inside the one sheet.
 */
export default function MovementLibrary({ open, onClose, groups, loading, onCreate, onUpdate, onRemove }) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState(null); // null | 'new' | {edit} | {remove}

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => ({ ...group, moves: group.moves.filter((m) => m.name.toLowerCase().includes(q)) }))
      .filter((group) => group.moves.length > 0);
  }, [groups, query]);

  const backToList = () => setMode(null);
  const close = () => { setQuery(''); setMode(null); onClose(); };

  if (mode === 'new') {
    return (
      <Sheet open={open} onClose={close} title="New movement" doneLabel="Close">
        <MovementForm
          initialName={query.trim()}
          onSubmit={onCreate}
          onSaved={backToList}
          onCancel={backToList}
        />
      </Sheet>
    );
  }

  if (mode?.edit) {
    return (
      <Sheet open={open} onClose={close} title="Edit movement" doneLabel="Close">
        <MovementForm
          movement={mode.edit}
          onSubmit={(draft) => onUpdate(mode.edit._id, draft)}
          onSaved={backToList}
          onCancel={backToList}
        />
      </Sheet>
    );
  }

  if (mode?.remove) {
    return (
      <Sheet open={open} onClose={close} title="Delete movement" doneLabel="Close">
        <DeleteConfirm
          movement={mode.remove}
          onCancel={backToList}
          onConfirm={async () => {
            await onRemove(mode.remove._id);
            backToList();
          }}
        />
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onClose={close} title="Movements" doneLabel="Close">
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
          message={query ? `No movements found for “${query}”.` : 'Your library is empty.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {filtered.map((group) => (
            <div key={group.group}>
              <div style={{ ...sectionLabel, margin: '0 4px 8px' }}>{group.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.moves.map((movement) => (
                  <div
                    key={movement._id}
                    style={{
                      background: C.bg,
                      borderRadius: RADIUS.md,
                      padding: '10px 10px 10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{movement.name}</div>
                      <div style={{ fontSize: 12, color: C.stone }}>
                        {movement.defaultWeight > 0 ? `${movement.defaultWeight} kg × ` : ''}
                        {movement.defaultReps} reps
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMode({ edit: movement })}
                      aria-label={`Edit ${movement.name}`}
                      style={iconBtn}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode({ remove: movement })}
                      aria-label={`Delete ${movement.name}`}
                      style={iconBtn}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <button type="button" onClick={() => setMode('new')} style={{ ...btnDashed, padding: 14, marginTop: 18 }}>
          {query.trim() ? `+ Create “${query.trim()}”` : '+ New movement'}
        </button>
      )}
    </Sheet>
  );
}

const iconBtn = {
  border: 'none',
  background: 'transparent',
  fontSize: 15,
  lineHeight: 1,
  width: 34,
  height: 34,
  borderRadius: 10,
  cursor: 'pointer',
  flexShrink: 0,
};
