import { useEffect, useState } from 'react';
import { Button, Notice, Sheet, Stepper } from '../ui';
import { errorMessage } from '../../lib/api';
import { fmtNum } from '../../lib/format';

const DEFAULT_KG = 75;

export default function WeightSheet({ open, onClose, latest, onSave }) {
  const [kg, setKg] = useState(latest || DEFAULT_KG);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setKg(latest || DEFAULT_KG);
      setError(null);
    }
  }, [open, latest]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(kg);
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Could not save your weight'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Update weight">
      <div style={{ padding: '10px 0 4px' }}>
        <Stepper label="Body weight" value={kg} onChange={setKg} step={0.1} unit="kg" />
        {error && <Notice tone="danger" style={{ marginTop: 16 }}>{error}</Notice>}
        <Button onClick={save} loading={saving} disabled={kg <= 0} style={{ marginTop: 24 }}>
          Save weight · {fmtNum(kg)} kg
        </Button>
      </div>
    </Sheet>
  );
}
