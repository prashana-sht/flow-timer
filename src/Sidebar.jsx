import { useState } from 'react';
import SegmentEditor, { createDefaultSegment } from './SegmentEditor';
import { SEGMENT_TYPES, formatTime, generateId } from './utils';

/* ─── Preset factory – generates fresh IDs on each call ─────────────── */
function makePresets() {
  return {
    pomodoro: {
      segments: [
        { id: generateId(), name: 'Focus', type: 'work', durationMinutes: 25, durationSeconds: 0, duration: 1500, sound: 'ding', frequency: 880, volume: 70, soundRepeats: 1 },
        { id: generateId(), name: 'Short Break', type: 'break', durationMinutes: 5, durationSeconds: 0, duration: 300, sound: 'chime', frequency: 660, volume: 60, soundRepeats: 1 },
      ],
      cycles: 4, breakAfterCycles: 4,
      breakSegment: { id: generateId(), name: 'Long Break', type: 'rest', durationMinutes: 15, durationSeconds: 0, duration: 900, sound: 'chime', frequency: 528, volume: 70, soundRepeats: 2 },
      autoStart: true, loopAll: false, notify: true,
    },
    hiit: {
      segments: [
        { id: generateId(), name: 'Work', type: 'work', durationMinutes: 0, durationSeconds: 20, duration: 20, sound: 'alert', frequency: 1000, volume: 80, soundRepeats: 2 },
        { id: generateId(), name: 'Rest', type: 'break', durationMinutes: 0, durationSeconds: 10, duration: 10, sound: 'beep', frequency: 660, volume: 60, soundRepeats: 1 },
      ],
      cycles: 8, breakAfterCycles: 0, breakSegment: null,
      autoStart: true, loopAll: false, notify: true,
    },
    study: {
      segments: [
        { id: generateId(), name: 'Study', type: 'work', durationMinutes: 50, durationSeconds: 0, duration: 3000, sound: 'ding', frequency: 880, volume: 70, soundRepeats: 1 },
        { id: generateId(), name: 'Break', type: 'break', durationMinutes: 10, durationSeconds: 0, duration: 600, sound: 'chime', frequency: 660, volume: 60, soundRepeats: 1 },
      ],
      cycles: 4, breakAfterCycles: 0, breakSegment: null,
      autoStart: true, loopAll: false, notify: true,
    },
    tabata: {
      segments: [
        { id: generateId(), name: 'Exercise', type: 'work', durationMinutes: 0, durationSeconds: 20, duration: 20, sound: 'double-beep', frequency: 1000, volume: 80, soundRepeats: 3 },
        { id: generateId(), name: 'Rest', type: 'break', durationMinutes: 0, durationSeconds: 10, duration: 10, sound: 'beep', frequency: 600, volume: 60, soundRepeats: 1 },
      ],
      cycles: 8, breakAfterCycles: 0, breakSegment: null,
      autoStart: true, loopAll: false, notify: true,
    },
  };
}

/* ─── Single Segment Row ─────────────────────────────────────────────── */
function SegmentItem({ seg, index, isExpanded, onToggle, onUpdate, onDelete, onMoveUp, onMoveDown, total, isActive }) {
  const typeInfo = SEGMENT_TYPES.find(t => t.value === seg.type) || SEGMENT_TYPES[0];

  return (
    <div className={`segment-item${isActive ? ' active-segment' : ''}`}>
      <div className="segment-header" onClick={onToggle}>
        <span className="drag-handle" title="Reorder">⣿</span>
        <span className={`segment-type-dot ${typeInfo.dotClass}`} />
        <div className="segment-info">
          <div className="segment-name">{seg.name}</div>
          <div className="segment-meta">
            <span>⏱ {formatTime(seg.duration)}</span>
            <span>🔊 {seg.sound}</span>
            {seg.soundRepeats > 1 && <span className="rounds-badge">{seg.soundRepeats}×</span>}
          </div>
        </div>
        <div className="segment-actions" onClick={e => e.stopPropagation()}>
          {index > 0 && (
            <button className="btn-icon" title="Move up" onClick={onMoveUp}>↑</button>
          )}
          {index < total - 1 && (
            <button className="btn-icon" title="Move down" onClick={onMoveDown}>↓</button>
          )}
          <button className="btn-icon" title="Delete" onClick={onDelete} style={{ color: 'var(--accent-danger)', borderColor: 'rgba(255,83,112,0.3)' }}>✕</button>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>{isExpanded ? '▲' : '▼'}</span>
      </div>
      {isExpanded && (
        <div className="segment-body">
          <SegmentEditor
            segment={seg}
            onSave={(updated) => onUpdate(updated)}
            isNew={false}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Sidebar ────────────────────────────────────────────────────────── */
export default function Sidebar({ config, onConfigChange, activeSegmentId }) {
  const [expandedId, setExpandedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSegment, setNewSegment] = useState(() => createDefaultSegment());
  const [activeTab, setActiveTab] = useState('segments');

  const updateSegments = (segs) => onConfigChange({ ...config, segments: segs });

  const handleAdd = (seg) => {
    updateSegments([...config.segments, seg]);
    setShowAddForm(false);
    setNewSegment(createDefaultSegment());
  };

  const handleUpdate = (id, updated) => {
    updateSegments(config.segments.map(s => s.id === id ? { ...s, ...updated } : s));
  };

  const handleDelete = (id) => {
    if (config.segments.length <= 1) { alert('You need at least one segment!'); return; }
    updateSegments(config.segments.filter(s => s.id !== id));
  };

  const handleMove = (index, direction) => {
    const segs = [...config.segments];
    const target = index + direction;
    if (target < 0 || target >= segs.length) return;
    [segs[index], segs[target]] = [segs[target], segs[index]];
    updateSegments(segs);
  };

  return (
    <div className="sidebar">
      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn${activeTab === 'segments' ? ' active' : ''}`} onClick={() => setActiveTab('segments')}>
          📋 Segments
        </button>
        <button className={`tab-btn${activeTab === 'settings' ? ' active' : ''}`} onClick={() => setActiveTab('settings')}>
          ⚙️ Settings
        </button>
      </div>

      {activeTab === 'segments' && (
        <>
          {/* Segments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {config.segments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">⏱</div>
                <div className="empty-state-text">No segments yet.<br />Add one below to get started.</div>
              </div>
            ) : (
              config.segments.map((seg, i) => (
                <SegmentItem
                  key={seg.id}
                  seg={seg}
                  index={i}
                  total={config.segments.length}
                  isExpanded={expandedId === seg.id}
                  isActive={activeSegmentId === seg.id}
                  onToggle={() => setExpandedId(expandedId === seg.id ? null : seg.id)}
                  onUpdate={(updated) => handleUpdate(seg.id, updated)}
                  onDelete={() => handleDelete(seg.id)}
                  onMoveUp={() => handleMove(i, -1)}
                  onMoveDown={() => handleMove(i, 1)}
                />
              ))
            )}
          </div>

          {/* Add Segment */}
          {showAddForm ? (
            <div className="card">
              <div className="card-header">
                <span className="card-title">New Segment</span>
              </div>
              <div className="card-body">
                <SegmentEditor
                  segment={newSegment}
                  onSave={handleAdd}
                  onCancel={() => setShowAddForm(false)}
                  isNew
                />
              </div>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => { setNewSegment(createDefaultSegment()); setShowAddForm(true); }}
            >
              + Add Segment
            </button>
          )}
        </>
      )}

      {activeTab === 'settings' && (
        <SettingsPanel config={config} onConfigChange={onConfigChange} />
      )}
    </div>
  );
}

/* ─── Settings Panel ─────────────────────────────────────────────────── */
function SettingsPanel({ config, onConfigChange }) {
  const set = (key, val) => onConfigChange({ ...config, [key]: val });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Cycles */}
      <div className="card">
        <div className="card-header"><span className="card-title">Cycles</span></div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Total Cycles (Repeats)</label>
            <input
              className="form-input"
              type="number"
              min={1}
              max={99}
              value={config.cycles}
              onChange={e => set('cycles', Math.max(1, parseInt(e.target.value) || 1))}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              All segments repeat this many times in sequence.
            </span>
          </div>
        </div>
      </div>

      {/* Auto Break */}
      <div className="card">
        <div className="card-header"><span className="card-title">Auto Break</span></div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Insert Break After Every N Cycles</label>
            <input
              className="form-input"
              type="number"
              min={0}
              max={99}
              value={config.breakAfterCycles}
              onChange={e => set('breakAfterCycles', Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0 = disabled"
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              0 = disabled. E.g. 5 → long break after every 5 cycles.
            </span>
          </div>

          {config.breakAfterCycles > 0 && (
            <>
              <div className="form-group">
                <label className="form-label">Break Duration</label>
                <div className="input-row">
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type="number"
                      min={0}
                      value={config.breakSegment?.durationMinutes ?? 0}
                      onChange={e => {
                        const m = parseInt(e.target.value) || 0;
                        set('breakSegment', {
                          ...(config.breakSegment || {}),
                          durationMinutes: m,
                          duration: m * 60 + (config.breakSegment?.durationSeconds ?? 30),
                          id: config.breakSegment?.id || generateId(),
                          name: config.breakSegment?.name || 'Long Break',
                          type: config.breakSegment?.type || 'rest',
                          sound: config.breakSegment?.sound || 'chime',
                          frequency: config.breakSegment?.frequency || 528,
                          volume: config.breakSegment?.volume || 70,
                          soundRepeats: config.breakSegment?.soundRepeats || 1,
                        });
                      }}
                    />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-muted)', pointerEvents: 'none' }}>min</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type="number"
                      min={0}
                      max={59}
                      value={config.breakSegment?.durationSeconds ?? 30}
                      onChange={e => {
                        const s = Math.min(59, parseInt(e.target.value) || 0);
                        set('breakSegment', {
                          ...(config.breakSegment || {}),
                          durationSeconds: s,
                          duration: (config.breakSegment?.durationMinutes ?? 0) * 60 + s,
                          id: config.breakSegment?.id || generateId(),
                          name: config.breakSegment?.name || 'Long Break',
                          type: config.breakSegment?.type || 'rest',
                          sound: config.breakSegment?.sound || 'chime',
                          frequency: config.breakSegment?.frequency || 528,
                          volume: config.breakSegment?.volume || 70,
                          soundRepeats: config.breakSegment?.soundRepeats || 1,
                        });
                      }}
                    />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-muted)', pointerEvents: 'none' }}>sec</span>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Break End Sound</label>
                <select
                  className="form-select"
                  value={config.breakSegment?.sound || 'chime'}
                  onChange={e => set('breakSegment', { ...(config.breakSegment || {}), sound: e.target.value })}
                >
                  {['beep', 'double-beep', 'ding', 'buzz', 'alert', 'chime', 'none'].map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Behavior */}
      <div className="card">
        <div className="card-header"><span className="card-title">Behavior</span></div>
        <div className="card-body">
          <div className="toggle-row">
            <span className="toggle-label">Auto-start next segment</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={config.autoStart} onChange={e => set('autoStart', e.target.checked)} />
              <span className="toggle-track" />
            </label>
          </div>
          <div className="toggle-row">
            <span className="toggle-label">Loop entire program</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={config.loopAll} onChange={e => set('loopAll', e.target.checked)} />
              <span className="toggle-track" />
            </label>
          </div>
          <div className="toggle-row">
            <span className="toggle-label">Notify on complete</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={config.notify} onChange={e => set('notify', e.target.checked)} />
              <span className="toggle-track" />
            </label>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="card">
        <div className="card-header"><span className="card-title">Quick Presets</span></div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { key: 'pomodoro', emoji: '🍅', label: 'Pomodoro (25/5)' },
            { key: 'hiit',     emoji: '🏃', label: 'HIIT (20s on / 10s off)' },
            { key: 'study',    emoji: '📚', label: 'Study (50/10)' },
            { key: 'tabata',   emoji: '💪', label: 'Tabata (20s/10s × 8)' },
          ].map(({ key, emoji, label }) => (
            <button
              key={key}
              className="btn btn-ghost"
              style={{ justifyContent: 'flex-start', gap: 10 }}
              onClick={() => onConfigChange(makePresets()[key])}
            >
              {emoji} <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
