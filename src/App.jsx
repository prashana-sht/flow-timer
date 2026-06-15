import { useState, useCallback, useEffect } from 'react';
import './App.css';
import Sidebar from './Sidebar';
import TimerDisplay from './TimerDisplay';
import { generateId } from './utils';
import { useTheme } from './useTheme';

const DEFAULT_CONFIG = {
  segments: [
    {
      id: generateId(),
      name: 'Focus',
      type: 'work',
      durationMinutes: 0,
      durationSeconds: 20,
      duration: 20,
      sound: 'beep',
      frequency: 880,
      volume: 70,
      soundRepeats: 1,
    },
    {
      id: generateId(),
      name: 'Short Break',
      type: 'break',
      durationMinutes: 0,
      durationSeconds: 20,
      duration: 20,
      sound: 'chime',
      frequency: 660,
      volume: 60,
      soundRepeats: 1,
    },
  ],
  cycles: 5,
  breakAfterCycles: 5,
  breakSegment: {
    id: generateId(),
    name: 'Long Break',
    type: 'rest',
    durationMinutes: 0,
    durationSeconds: 30,
    duration: 30,
    sound: 'chime',
    frequency: 528,
    volume: 70,
    soundRepeats: 2,
  },
  autoStart: true,
  loopAll: false,
  notify: true,
};

function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast">
          <span className="toast-icon">{t.icon}</span>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

const STORAGE_KEY = 'flowtimer-config';

function loadConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
  } catch {
    // ignore corrupt data
  }
  return DEFAULT_CONFIG;
}

export default function App() {
  const [config, setConfig] = useState(loadConfig);
  const [toasts, setToasts] = useState([]);
  const [activeSegmentId, setActiveSegmentId] = useState(null);
  const [theme, toggleTheme] = useTheme();

  // Persist config to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore storage errors (e.g. private browsing quota)
    }
  }, [config]);

  const showToast = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <div className="app">
      {/* Background blobs */}
      <div className="bg-blobs">
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
        <div className="bg-blob bg-blob-3" />
      </div>

      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <div className="logo-icon">⏱</div>
          <span className="logo-text">FlowTimer</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="header-badge">Multi-Segment Timer</span>

          {/* Theme toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            <span className="theme-toggle-track">
              <span className="theme-toggle-thumb">
                {theme === 'dark' ? '🌙' : '☀️'}
              </span>
            </span>
            <span className="theme-toggle-label">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="main-layout">
        <Sidebar
          config={config}
          onConfigChange={setConfig}
          activeSegmentId={activeSegmentId}
        />
        <TimerDisplay
          config={config}
          onToast={showToast}
          onActiveSegmentChange={setActiveSegmentId}
        />
      </div>

      <Toast toasts={toasts} />
    </div>
  );
}
