import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../lib/api';
import { Spinner, EmptyState, FilterBar, SeoHead } from '../components/ui';
import { Smartphone, Tablet } from 'lucide-react';

const PLAYSTYLES = [
  { value: '', label: 'All Styles' },
  { value: 'aggressive', label: 'Aggressive' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'passive', label: 'Passive' },
];
const DEVICES = [
  { value: '', label: 'All Devices' },
  { value: 'phone', label: 'Phone' },
  { value: 'tablet', label: 'Tablet' },
];

const BUTTON_LABELS = {
  fire: 'Fire', aim: 'ADS/Aim', jump: 'Jump', crouch: 'Crouch',
  reload: 'Reload', joystick: 'Move', map: 'Map', scorestreak: 'Scorestreak',
};

function PhoneMockup({ layout, deviceType }) {
  const isTablet = deviceType === 'tablet';
  const entries = Object.entries(layout);
  if (entries.length === 0) return (
    <div className={`relative mx-auto bg-black rounded-[2rem] border-4 border-gray-700 flex items-center justify-center
      ${isTablet ? 'w-full max-w-lg aspect-[16/10]' : 'w-64 aspect-[9/19]'}`}>
      <p className="text-cod-muted text-xs">No layout data</p>
    </div>
  );
  return (
    <div className={`relative mx-auto bg-black rounded-[2rem] border-4 border-gray-700 overflow-hidden shadow-2xl
      ${isTablet ? 'w-full max-w-lg aspect-[16/10]' : 'w-64 aspect-[9/19]'}`}>
      <div className="absolute inset-1 rounded-[1.5rem] overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <img
          src="https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=600&q=60"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0">
          <div className="absolute top-2 left-2 right-2 flex items-center gap-1">
            <div className="h-1.5 w-16 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-cod-green rounded-full" />
            </div>
            <span className="text-cod-green text-[8px] font-bold">75</span>
          </div>
          <div className="absolute top-2 right-2 text-right">
            <span className="text-white text-[9px] font-bold">30/90</span>
          </div>
          {entries.map(([key, btn]) => (
            <div
              key={key}
              className="absolute flex items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-white font-bold select-none"
              style={{
                left: `${btn.x}%`,
                top: `${btn.y}%`,
                width: `${btn.size}%`,
                height: `${btn.size * (isTablet ? 1.6 : 0.55)}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${btn.size * 0.9}px`,
                ...(key === 'fire' ? { background: 'rgba(255,60,60,0.35)', borderColor: 'rgba(255,60,60,0.7)' } : {}),
              }}
              title={BUTTON_LABELS[key] || key}
            >
              {btn.label || key[0].toUpperCase()}
            </div>
          ))}
        </div>
      </div>
      {!isTablet && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-600 rounded-full" />
      )}
    </div>
  );
}

export default function Hud() {
  const [playstyle, setPlaystyle] = useState('');
  const [device, setDevice] = useState('');
  const [previewId, setPreviewId] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('phone');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['hud', playstyle, device],
    queryFn: () => settingsApi.getHud({
      playstyle: playstyle || undefined,
      device_type: device || undefined,
    }),
  });

  const presets = data ?? [];
  const activePreset = presets.find(h => h.id === previewId) ?? presets[0] ?? null;
  const activeLayout = activePreset?.hud_layout ?? {};

  return (
    <>
      <SeoHead title="HUD & Settings" description="Optimized HUD layouts and graphics settings for Call of Duty: Mobile." />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">HUD & Settings</h1>
        <p className="text-cod-muted text-sm mb-6">
          Visual HUD layouts by playstyle. Apply in Settings → Controls → Custom HUD.
        </p>

        {/* Visual HUD Preview — driven by DB presets */}
        <div className="card mb-8 border-cod-accent/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">HUD Preview</h2>
            <div className="flex gap-2">
              {['phone', 'tablet'].map(d => (
                <button key={d} onClick={() => setPreviewDevice(d)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${previewDevice === d ? 'bg-cod-accent text-black' : 'bg-cod-surface text-cod-muted hover:text-white'}`}>
                  {d === 'phone' ? <Smartphone size={13} /> : <Tablet size={13} />}
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {isLoading && <Spinner />}
          {!isLoading && presets.length === 0 && (
            <p className="text-cod-muted text-sm text-center py-4">No HUD presets saved yet. Add one via the Admin panel.</p>
          )}

          {presets.length > 0 && (
            <>
              <div className="flex gap-2 mb-5 flex-wrap">
                {presets.map(h => (
                  <button key={h.id} onClick={() => setPreviewId(h.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors
                      ${(previewId === h.id || (!previewId && presets[0]?.id === h.id)) ? 'bg-cod-accent text-black' : 'bg-cod-surface text-cod-muted hover:text-white'}`}>
                    {h.title}
                  </button>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1 flex justify-center">
                  <PhoneMockup layout={activeLayout} deviceType={previewDevice} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-cod-muted uppercase tracking-wider mb-3">Button Positions</p>
                  {Object.keys(activeLayout).length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(activeLayout).map(([key, btn]) => (
                        <div key={key} className="bg-cod-surface rounded-lg px-3 py-2 flex items-center justify-between">
                          <span className="text-white text-xs font-medium">{BUTTON_LABELS[key] || key}</span>
                          <div className="flex gap-3 text-xs text-cod-muted">
                            <span>X: <span className="text-cod-accent font-bold">{btn.x}%</span></span>
                            <span>Y: <span className="text-cod-accent font-bold">{btn.y}%</span></span>
                            <span>Size: <span className="text-cod-accent font-bold">{btn.size}%</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-cod-muted text-xs">
                      <p className="mb-2">This preset stores:</p>
                      {activePreset?.fire_button_size && <p>Fire button size: <span className="text-cod-accent font-bold">{activePreset.fire_button_size}%</span></p>}
                      {activePreset?.joystick_size && <p>Joystick size: <span className="text-cod-accent font-bold">{activePreset.joystick_size}%</span></p>}
                      {activePreset?.fire_button_position && <p>Fire position: <span className="text-white">{activePreset.fire_button_position}</span></p>}
                    </div>
                  )}
                  <p className="text-cod-muted text-xs mt-3">
                    💡 In-game: Settings → Controls → Custom HUD Layout → match these positions.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Saved Presets list */}
        <h2 className="font-bold text-white mb-3">Saved Presets</h2>
        <div className="flex flex-col gap-3 mb-6">
          <FilterBar filters={PLAYSTYLES} active={playstyle} onChange={setPlaystyle} />
          <FilterBar filters={DEVICES} active={device} onChange={setDevice} />
        </div>

        {isLoading && <Spinner />}
        {isError && <p className="text-cod-red text-sm text-center py-8">Failed to load HUD settings.</p>}
        {!isLoading && presets.length === 0 && <EmptyState title="No presets saved yet" description="Add presets via the Admin panel." />}

        {presets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presets.map(h => (
              <div key={h.id} className="card cursor-pointer hover:border-cod-accent/50 transition-all"
                onClick={() => setPreviewId(h.id)}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{h.title}</h3>
                  <div className="flex gap-2">
                    <span className="badge-info">{h.playstyle}</span>
                    <span className="badge-info">{h.device_type}</span>
                  </div>
                </div>
                {h.description && <p className="text-cod-muted text-xs mb-3">{h.description}</p>}
                <div className="grid grid-cols-2 gap-2">
                  {h.fire_button_size != null && (
                    <div className="bg-cod-surface rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="text-cod-muted text-xs">Fire Button</span>
                      <span className="text-cod-accent font-bold text-sm">{h.fire_button_size}%</span>
                    </div>
                  )}
                  {h.joystick_size != null && (
                    <div className="bg-cod-surface rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="text-cod-muted text-xs">Joystick</span>
                      <span className="text-cod-accent font-bold text-sm">{h.joystick_size}%</span>
                    </div>
                  )}
                  {h.fire_button_position && (
                    <div className="bg-cod-surface rounded-lg px-3 py-2 flex items-center justify-between col-span-2">
                      <span className="text-cod-muted text-xs">Fire Position</span>
                      <span className="text-white text-sm">{h.fire_button_position}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
