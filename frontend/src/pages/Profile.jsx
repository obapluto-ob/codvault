import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Search, Save, Trash2, Sliders, Layout } from 'lucide-react';
import { settingsApi, codmPlayerApi, profilesApi } from '../lib/api';
import { Spinner, SeoHead } from '../components/ui';

function PlayerCard({ player }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-cod-surface rounded-xl border border-cod-border mb-4">
      {player.avatar
        ? <img src={player.avatar} alt={player.nickname} className="w-14 h-14 rounded-full border-2 border-cod-accent object-cover" />
        : <div className="w-14 h-14 rounded-full border-2 border-cod-accent bg-cod-card flex items-center justify-center text-cod-accent text-xl font-bold">{player.nickname?.[0]?.toUpperCase()}</div>
      }
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-lg truncate">{player.nickname}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-cod-muted text-xs">UID: <span className="font-mono text-cod-accent">{player.uid}</span></span>
          <span className="text-cod-muted text-xs">•</span>
          <span className="text-cod-muted text-xs">Level <span className="text-white font-semibold">{player.level}</span></span>
          {player.country && <span className="badge-info">{player.country}</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        {player.rank?.imageUrl && (
          <img src={player.rank.imageUrl} alt={player.rank.label} className="w-10 h-10 mx-auto mb-1" />
        )}
        <p className="text-cod-accent text-xs font-semibold">{player.rank?.label}</p>
        {player.rank?.rating > 0 && <p className="text-cod-muted text-xs">{player.rank.rating} pts</p>}
      </div>
    </div>
  );
}

export default function Profile() {
  const qc = useQueryClient();
  const [uidInput, setUidInput] = useState('');
  const [activeUid, setActiveUid] = useState('');
  const [sensId, setSensId] = useState('');
  const [hudId, setHudId] = useState('');
  const [notes, setNotes] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  const { data: sensPresets } = useQuery({ queryKey: ['sensitivity'], queryFn: () => settingsApi.getSensitivity({}) });
  const { data: hudPresets } = useQuery({ queryKey: ['hud'], queryFn: () => settingsApi.getHud({}) });

  // Real CODM player data from Codashop API
  const { data: player, isLoading: playerLoading, isError: playerError, error: playerErr } = useQuery({
    queryKey: ['codm-player', activeUid],
    queryFn: () => codmPlayerApi.lookup(activeUid),
    enabled: !!activeUid,
    retry: false,
    staleTime: 5 * 60_000,
  });

  // Local saved preferences
  const { data: profile } = useQuery({
    queryKey: ['profile', activeUid],
    queryFn: () => profilesApi.get(activeUid),
    enabled: !!activeUid,
    retry: false,
  });

  useEffect(() => {
    if (!profile) return;
    if (profile.sensitivity_preset_id) setSensId(String(profile.sensitivity_preset_id));
    if (profile.hud_preset_id) setHudId(String(profile.hud_preset_id));
    if (profile.notes) setNotes(profile.notes);
  }, [profile]);

  const save = useMutation({
    mutationFn: () => profilesApi.save({
      uid: activeUid,
      username: player?.nickname || undefined,
      sensitivity_preset_id: sensId ? parseInt(sensId) : null,
      hud_preset_id: hudId ? parseInt(hudId) : null,
      notes: notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries(['profile', activeUid]);
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2000);
    },
  });

  const remove = useMutation({
    mutationFn: () => profilesApi.remove(activeUid),
    onSuccess: () => {
      qc.removeQueries(['profile', activeUid]);
      setActiveUid(''); setUidInput('');
      setSensId(''); setHudId(''); setNotes('');
    },
  });

  const handleLookup = (e) => {
    e.preventDefault();
    const uid = uidInput.trim();
    if (!uid) return;
    setSensId(''); setHudId(''); setNotes('');
    setActiveUid(uid);
  };

  const selectedSens = sensPresets?.find(s => s.id === parseInt(sensId));
  const playerNotFound = playerError && playerErr?.response?.status === 404;

  return (
    <>
      <SeoHead title="Player Profile" description="Look up your CODM player stats and save your sensitivity and HUD presets." />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-1">
          <User size={22} className="text-cod-accent" />
          <h1 className="text-2xl font-bold">Player Profile</h1>
        </div>
        <p className="text-cod-muted text-sm mb-6">
          Enter your CODM UID to load your real in-game stats, then save your preferred sensitivity and HUD presets.
        </p>

        <form onSubmit={handleLookup} className="card mb-6">
          <label className="text-xs text-cod-muted uppercase tracking-wider mb-2 block">CODM UID</label>
          <div className="flex gap-2">
            <input
              className="input flex-1 font-mono"
              placeholder="e.g. 123456789"
              value={uidInput}
              onChange={e => setUidInput(e.target.value)}
            />
            <button type="submit" className="btn-primary flex items-center gap-2 shrink-0">
              <Search size={15} /> Look Up
            </button>
          </div>
          <p className="text-cod-muted text-xs mt-2">
            Find your UID in CODM: tap your avatar → copy the number below your name.
          </p>
        </form>

        {playerLoading && <Spinner />}

        {playerNotFound && (
          <div className="card border-cod-red/30 mb-4">
            <p className="text-cod-red text-sm">Player not found. Make sure you entered a valid numeric CODM UID.</p>
          </div>
        )}

        {playerError && !playerNotFound && (
          <div className="card border-cod-red/30 mb-4">
            <p className="text-cod-red text-sm">Could not reach the CODM player service. Try again in a moment.</p>
          </div>
        )}

        {player && (
          <>
            <PlayerCard player={player} />

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Saved Preferences</h2>
                {profile && (
                  <button onClick={() => remove.mutate()} disabled={remove.isPending}
                    className="text-cod-red hover:text-red-400 p-1.5 transition-colors" title="Delete saved preferences">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-cod-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Sliders size={12} /> Sensitivity Preset
                  </label>
                  <select className="input" value={sensId} onChange={e => setSensId(e.target.value)}>
                    <option value="">— None —</option>
                    {sensPresets?.map(s => (
                      <option key={s.id} value={s.id}>{s.title} ({s.playstyle} / {s.device_type})</option>
                    ))}
                  </select>
                  {selectedSens && (
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {[['FPS', selectedSens.fps_sensitivity], ['ADS', selectedSens.ads_sensitivity], ['3x', selectedSens.scope_3x], ['4x', selectedSens.scope_4x], ['Sniper', selectedSens.sniper_scope], ['Gyro', selectedSens.gyroscope]].map(([l, v]) => v != null && (
                        <div key={l} className="bg-cod-surface rounded-lg px-2 py-1.5 flex items-center justify-between">
                          <span className="text-cod-muted text-xs">{l}</span>
                          <span className="text-cod-accent font-bold text-xs">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs text-cod-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Layout size={12} /> HUD Preset
                  </label>
                  <select className="input" value={hudId} onChange={e => setHudId(e.target.value)}>
                    <option value="">— None —</option>
                    {hudPresets?.map(h => (
                      <option key={h.id} value={h.id}>{h.title} ({h.playstyle} / {h.device_type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-cod-muted uppercase tracking-wider mb-1 block">Notes</label>
                  <textarea className="input resize-y min-h-[60px]" placeholder="e.g. main phone, aggressive playstyle…"
                    value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                <button onClick={() => save.mutate()} disabled={save.isPending}
                  className="btn-primary flex items-center gap-2 justify-center">
                  <Save size={15} /> {save.isPending ? 'Saving…' : 'Save Preferences'}
                </button>
                {saveMsg && <p className="text-cod-green text-sm text-center">{saveMsg}</p>}
                {save.isError && <p className="text-cod-red text-sm text-center">Failed to save.</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
