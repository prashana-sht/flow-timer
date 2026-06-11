import { useState, useCallback } from 'react';
import { createBeepSound, generateId } from './utils';

export default function SegmentEditor({ segment, onSave, onCancel, isNew }) {
  const [form, setForm] = useState({ ...segment });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const previewSound = useCallback(() => {
    createBeepSound(form.sound, form.volume / 100, form.frequency || 880, 0.5);
  }, [form.sound, form.volume, form.frequency]);

  const beepTypes = ['beep', 'double-beep', 'ding', 'buzz', 'alert', 'chime', 'none'];
  const segTypes = ['work', 'break', 'rest'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Name */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Segment Name</label>
        <input
          className="form-input"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. Focus, Short Break..."
        />
      </div>

      {/* Type */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Type</label>
        <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
          {segTypes.map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Duration */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Duration</label>
        <div className="input-row">
          <div style={{ position: 'relative' }}>
            <input
              className="form-input"
              type="number"
              min={0}
              max={99}
              value={form.durationMinutes ?? 0}
              onChange={e => set('durationMinutes', Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
            />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-muted)', pointerEvents: 'none' }}>min</span>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              className="form-input"
              type="number"
              min={0}
              max={59}
              value={form.durationSeconds ?? 0}
              onChange={e => set('durationSeconds', Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
              placeholder="0"
            />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-muted)', pointerEvents: 'none' }}>sec</span>
          </div>
        </div>
      </div>

      {/* Sound */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">End Sound</label>
        <select className="form-select" value={form.sound} onChange={e => set('sound', e.target.value)}>
          {beepTypes.map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Frequency */}
      {form.sound !== 'none' && (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Pitch (Hz): {form.frequency || 880}</label>
          <input
            type="range"
            min={200}
            max={2000}
            step={50}
            value={form.frequency || 880}
            onChange={e => set('frequency', parseInt(e.target.value))}
          />
        </div>
      )}

      {/* Volume */}
      {form.sound !== 'none' && (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Volume: {form.volume ?? 70}%</label>
          <div className="volume-row">
            <span className="volume-icon">🔈</span>
            <input
              type="range"
              min={0}
              max={100}
              value={form.volume ?? 70}
              onChange={e => set('volume', parseInt(e.target.value))}
            />
            <span className="volume-icon">🔊</span>
          </div>
        </div>
      )}

      {/* Repeat count */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Sound Repeats at End</label>
        <select className="form-select" value={form.soundRepeats ?? 1} onChange={e => set('soundRepeats', parseInt(e.target.value))}>
          {[1, 2, 3, 4, 5].map(n => (
            <option key={n} value={n}>{n}×</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button className="btn btn-ghost btn-sm" onClick={previewSound} type="button">▶ Preview Sound</button>
        <div style={{ flex: 1 }} />
        {onCancel && <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>}
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            const totalSec = (form.durationMinutes || 0) * 60 + (form.durationSeconds || 0);
            if (totalSec < 1) return alert('Duration must be at least 1 second');
            onSave({ ...form, duration: totalSec });
          }}
        >
          {isNew ? '+ Add' : '✓ Save'}
        </button>
      </div>
    </div>
  );
}

export function createDefaultSegment(overrides = {}) {
  return {
    id: generateId(),
    name: 'Work',
    type: 'work',
    durationMinutes: 0,
    durationSeconds: 20,
    duration: 20,
    sound: 'beep',
    frequency: 880,
    volume: 70,
    soundRepeats: 1,
    ...overrides,
  };
}
