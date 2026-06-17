import { useState, useEffect, useRef, useCallback } from 'react';
import { createBeepSound, buildTimerSequence, formatTime, SEGMENT_TYPES, resumeAudioContext } from './utils';

const CIRCLE_RADIUS = 130;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

function getSegmentColor(type) {
  switch (type) {
    case 'work':  return 'var(--timer-work)';
    case 'break': return 'var(--timer-break)';
    case 'rest':  return 'var(--timer-rest)';
    default:      return 'var(--accent-primary)';
  }
}

function getPhaseClass(type) {
  switch (type) {
    case 'work':  return 'phase-work';
    case 'break': return 'phase-break';
    case 'rest':  return 'phase-rest';
    default:      return 'phase-work';
  }
}

export default function TimerDisplay({ config, onToast }) {
  const [sequence, setSequence] = useState([]);
  const [seqIndex, setSeqIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [popAnimation, setPopAnimation] = useState(false);

  // Refs for stable access inside setInterval closures
  const intervalRef   = useRef(null);
  const seqRef        = useRef([]);
  const seqIndexRef   = useRef(0);
  const timeLeftRef   = useRef(0);
  const configRef     = useRef(config);
  const onToastRef    = useRef(onToast);

  // Keep refs in sync without triggering re-renders
  configRef.current  = config;
  onToastRef.current = onToast;

  /* ── Helpers ──────────────────────────────────────────────────────── */
  const playEndSound = useCallback((seg) => {
    if (!seg || seg.sound === 'none') return;
    const repeats = seg.soundRepeats || 1;
    for (let i = 0; i < repeats; i++) {
      setTimeout(() => {
        createBeepSound(seg.sound, (seg.volume || 70) / 100, seg.frequency || 880, 0.35);
      }, i * 500);
    }
  }, []);

  const doReset = useCallback((seq) => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setCompleted(false);
    seqIndexRef.current = 0;
    setSeqIndex(0);
    const t = (seq ?? seqRef.current)[0]?.duration ?? 0;
    timeLeftRef.current = t;
    setTimeLeft(t);
  }, []);

  /* ── Rebuild sequence when config changes ─────────────────────────── */
  useEffect(() => {
    const seq = buildTimerSequence(config);
    seqRef.current = seq;
    setSequence(seq);
    doReset(seq);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);  // doReset is stable; intentionally omit it to avoid loop

  /* ── Cleanup on unmount ───────────────────────────────────────────── */
  useEffect(() => () => clearInterval(intervalRef.current), []);

  /* ── Advance to next step ─────────────────────────────────────────── */
  const advance = useCallback(() => {
    const seq  = seqRef.current;
    const cfg  = configRef.current;
    const next = seqIndexRef.current + 1;

    if (next >= seq.length) {
      if (cfg.loopAll) {
        seqIndexRef.current = 0;
        setSeqIndex(0);
        timeLeftRef.current = seq[0].duration;
        setTimeLeft(seq[0].duration);
        onToastRef.current({ icon: '🔁', text: 'Looping program...' });
      } else {
        clearInterval(intervalRef.current);
        setRunning(false);
        setCompleted(true);
        setPopAnimation(true);
        setTimeout(() => setPopAnimation(false), 600);
        onToastRef.current({ icon: '🎉', text: 'Timer complete! Great job!' });
        if (cfg.notify) {
          try { new Notification('Timer Complete!', { body: 'All segments finished!' }); } catch (_) {}
        }
      }
      return;
    }

    seqIndexRef.current = next;
    setSeqIndex(next);
    const nextSeg = seq[next];
    timeLeftRef.current = nextSeg.duration;
    setTimeLeft(nextSeg.duration);
    onToastRef.current({
      icon: nextSeg.isAutoBreak || nextSeg.type === 'break' ? '☕' : '▶',
      text: `Starting: ${nextSeg.name}`,
    });

    if (!cfg.autoStart) {
      clearInterval(intervalRef.current);
      setRunning(false);
    }
  }, []);

  /* ── Tick (interval callback) ─────────────────────────────────────── */
  const tick = useCallback(() => {
    timeLeftRef.current -= 1;
    setTimeLeft(timeLeftRef.current);
    if (timeLeftRef.current <= 0) {
      playEndSound(seqRef.current[seqIndexRef.current]);
      advance();
    }
  }, [advance, playEndSound]);

  /* ── Controls ─────────────────────────────────────────────────────── */
  const startTimer = useCallback(() => {
    resumeAudioContext();
    setCompleted(false);
    setRunning(true);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, 1000);
    if (config.notify && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [tick, config.notify]);

  const pauseTimer = useCallback(() => {
    resumeAudioContext();
    clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  const skipSegment = useCallback(() => {
    resumeAudioContext();
    playEndSound(seqRef.current[seqIndexRef.current]);
    advance();
  }, [advance, playEndSound]);

  const reset = useCallback(() => {
    resumeAudioContext();
    doReset();
  }, [doReset]);

  /* ── Derived display values ───────────────────────────────────────── */
  const currentSeg   = sequence[seqIndex];
  const totalDuration = currentSeg?.duration || 1;
  const progress      = timeLeft / totalDuration;
  const dashOffset    = CIRCUMFERENCE * (1 - progress);
  const strokeColor   = currentSeg ? getSegmentColor(currentSeg.type) : 'var(--accent-primary)';
  const cycle         = currentSeg?.cycle || 1;
  const phaseClass    = currentSeg ? getPhaseClass(currentSeg.type) : 'phase-work';
  const totalSteps    = sequence.length;
  const doneSteps     = seqIndex;

  return (
    <div className="main-panel">
      <div className={`timer-container${running ? ' timer-running' : ''}`}>

        {/* ── Session info ── */}
        <div className="timer-session-info">
          <div className="timer-session-name">
            {currentSeg?.isAutoBreak ? '☕ Auto Break' : (currentSeg?.name || 'Ready')}
          </div>
          <div className="timer-session-round">
            {totalSteps > 0
              ? <>Step {seqIndex + 1} of {totalSteps}{config.cycles > 1 && ` · Cycle ${cycle}/${config.cycles}`}</>
              : 'Add segments to begin'}
          </div>
        </div>

        {/* ── Circular progress ring ── */}
        <div className={`timer-circle-wrapper${popAnimation ? ' completion-pop' : ''}`}>
          <svg width="300" height="300" className="timer-circle-svg">
            <circle
              className="timer-circle-track"
              cx="150" cy="150" r={CIRCLE_RADIUS}
            />
            <circle
              className="timer-circle-progress"
              cx="150" cy="150" r={CIRCLE_RADIUS}
              stroke={strokeColor}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={completed ? CIRCUMFERENCE : dashOffset}
            />
          </svg>
          <div className="timer-display">
            <div className="timer-time mono">{formatTime(timeLeft)}</div>
            <div className={`timer-phase ${phaseClass}`}>
              {completed ? '✓ Done' : (currentSeg?.type || 'ready')}
            </div>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="timer-controls">
          <button className="control-btn control-btn-secondary" onClick={reset} title="Reset">⟳</button>
          <button
            className="control-btn control-btn-main"
            onClick={running ? pauseTimer : startTimer}
            title={running ? 'Pause' : 'Start'}
          >
            {running ? '⏸' : (completed ? '↺' : '▶')}
          </button>
          <button
            className="control-btn control-btn-secondary"
            onClick={skipSegment}
            title="Skip to next segment"
            disabled={completed}
            style={{ opacity: completed ? 0.4 : 1 }}
          >⏭</button>
        </div>

        {/* ── Overall progress bar ── */}
        {totalSteps > 1 && (
          <div className="session-progress">
            <div className="session-progress-label">
              <span>Overall Progress</span>
              <span>{doneSteps}/{totalSteps} steps</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${(doneSteps / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Timeline ── */}
      {totalSteps > 0 && (
        <div className="timeline">
          <div className="timeline-label">Session Timeline · {totalSteps} steps</div>
          <div className="timeline-track">
            {sequence.map((seg, i) => {
              const typeInfo = SEGMENT_TYPES.find(t => t.value === seg.type) || SEGMENT_TYPES[0];
              const maxDur = Math.max(...sequence.map(s => s.duration), 1);
              const width  = Math.max(36, Math.min(110, (seg.duration / maxDur) * 110));
              const cls    = i === seqIndex ? 'current' : i < seqIndex ? 'completed' : '';

              return (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span
                    className={`timeline-segment ${typeInfo.cssClass} ${cls}`}
                    style={{ width, color: '#fff' }}
                    title={`${seg.name} · ${formatTime(seg.duration)}`}
                  >
                    {seg.isAutoBreak ? '☕' : seg.name.slice(0, 4)}
                  </span>
                  {i < totalSteps - 1 && <span className="timeline-arrow">›</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
