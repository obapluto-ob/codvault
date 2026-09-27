import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../lib/api';
import { Spinner, EmptyState, FilterBar, SeoHead } from '../components/ui';
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react';

const PLAYSTYLES = [
  { value: '', label: 'All Styles' },
  { value: 'aggressive', label: 'Aggressive' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'passive', label: 'Passive' },
  { value: 'sniper', label: 'Sniper' },
];
const DEVICES = [
  { value: '', label: 'All Devices' },
  { value: 'phone', label: 'Phone' },
  { value: 'tablet', label: 'Tablet' },
];

const SENS_FIELDS = [
  { key: 'fps_sensitivity',  label: 'FPS / TPP' },
  { key: 'ads_sensitivity',  label: 'ADS' },
  { key: 'scope_3x',         label: '3x Scope' },
  { key: 'scope_4x',         label: '4x Scope' },
  { key: 'sniper_scope',     label: 'Sniper Scope' },
  { key: 'gyroscope',        label: 'Gyroscope' },
];

/* Real CODM sensitivity conversion ratios (based on FOV scaling) */
const RATIOS = { ads_sensitivity: 0.67, scope_3x: 0.50, scope_4x: 0.42, sniper_scope: 0.35, gyroscope: 0.80 };

function clamp(v) { return Math.min(300, Math.max(1, Math.round(v))); }

function SensCalculator() {
  const [fps, setFps] = useState('');
  const [open, setOpen] = useState(true);

  const base = parseInt(fps, 10);
  const valid = !isNaN(base) && base >= 1 && base <= 300;

  const calculated = valid ? {
    fps_sensitivity: base,
    ads_sensitivity: clamp(base * RATIOS.ads_sensitivity),
    scope_3x:        clamp(base * RATIOS.scope_3x),
    scope_4x:        clamp(base * RATIOS.scope_4x),
    sniper_scope:    clamp(base * RATIOS.sniper_scope),
    gyroscope:       clamp(base * RATIOS.gyroscope),
  } : null;

  return (
    <div className="card mb-8 border-cod-accent/30">
      <button className="w-full flex items-center justify-between" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2">
          <Calculator size={18} className="text-cod-accent" />
          <span className="font-bold text-white">Sensitivity Calculator</span>
          <span className="badge-info text-xs">Live</span>
        </div>
        {open ? <ChevronUp size={16} className="text-cod-muted" /> : <ChevronDown size={16} className="text-cod-muted" />}
      </button>

      {open && (
        <div className="mt-4">
          <p className="text-cod-muted text-xs mb-3">
            Enter your FPS sensitivity — all other values are auto-calculated using CODM's FOV scaling ratios.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <label className="text-xs text-cod-muted mb-1 block">FPS / TPP Sensitivity (1–300)</label>
              <input
                type="number" min="1" max="300"
                className="input text-lg font-bold text-cod-accent"
                placeholder="e.g. 130"
                value={fps}
                onChange={e => setFps(e.target.value)}
              />
            </div>
          </div>

          {valid && calculated && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SENS_FIELDS.map(f => (
                <div key={f.key} className="bg-cod-surface rounded-lg px-3 py-2.5 flex items-center justify-between">
                  <span className="text-cod-muted text-xs">{f.label}</span>
                  <span className={`font-bold text-sm ${f.key === 'fps_sensitivity' ? 'text-white' : 'text-cod-accent'}`}>
                    {calculated[f.key]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {fps && !valid && (
            <p className="text-cod-red text-xs mt-2">Enter a value between 1 and 300.</p>
          )}

          {valid && (
            <p className="text-cod-muted text-xs mt-3">
              💡 These are starting points. Fine-tune ±5 in Training Mode until flicks feel natural.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Sensitivity() {
  const [playstyle, setPlaystyle] = useState('');
  const [device, setDevice] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sensitivity', playstyle, device],
    queryFn: () => settingsApi.getSensitivity({
      playstyle: playstyle || undefined,
      device_type: device || undefined,
    }),
  });

  return (
    <>
      <SeoHead title="Sensitivity Calculator" description="Best CODM sensitivity settings for every playstyle and device type." />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Sensitivity Settings</h1>
        <p className="text-cod-muted text-sm mb-6">
          Calculate your optimal sensitivity or browse community presets. Apply in Settings → Sensitivity.
        </p>

        <SensCalculator />

        <h2 className="font-bold text-white mb-3">Community Presets</h2>
        <div className="flex flex-col gap-3 mb-6">
          <FilterBar filters={PLAYSTYLES} active={playstyle} onChange={setPlaystyle} />
          <FilterBar filters={DEVICES} active={device} onChange={setDevice} />
        </div>

        {isLoading && <Spinner />}
        {isError && <p className="text-cod-red text-sm text-center py-8">Failed to load sensitivity presets.</p>}
        {data && data.length === 0 && <EmptyState title="No presets found" description="No sensitivity presets have been added yet." />}

        {data && data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map(preset => (
              <div key={preset.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{preset.title}</h3>
                  <div className="flex gap-2">
                    <span className="badge-info">{preset.playstyle}</span>
                    <span className="badge-info">{preset.device_type}</span>
                  </div>
                </div>
                {preset.description && <p className="text-cod-muted text-xs mb-3">{preset.description}</p>}
                <div className="grid grid-cols-2 gap-2">
                  {SENS_FIELDS.map(f => preset[f.key] != null && (
                    <div key={f.key} className="bg-cod-surface rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="text-cod-muted text-xs">{f.label}</span>
                      <span className="text-cod-accent font-bold text-sm">{preset[f.key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
