import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, Trash2, LogOut, Eye, EyeOff, Check } from 'lucide-react';
import { useAdmin } from '../lib/adminContext';
import { codesApi, weaponsApi, tipsApi, settingsApi } from '../lib/api';
import { Spinner, SeoHead } from '../components/ui';

// ── Login ──────────────────────────────────────────────────────────────────
function LoginForm() {
  const { login } = useAdmin();
  const [token, setToken] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const base = import.meta.env.VITE_API_URL ?? '';
      const res = await fetch(`${base}/api/admin/verify`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { login(token); }
      else { setError('Invalid token.'); }
    } catch { setError('Cannot reach server.'); }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="text-cod-accent" size={22} />
          <h1 className="text-xl font-bold">Admin Login</h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              className="input pr-10"
              placeholder="Admin token"
              value={token}
              onChange={e => setToken(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cod-muted hover:text-white">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <p className="text-cod-red text-sm">{error}</p>}
          <button type="submit" className="btn-primary">Sign In</button>
        </form>
      </div>
    </div>
  );
}

// ── Shared form field ──────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-cod-muted uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

// ── Codes Tab ──────────────────────────────────────────────────────────────
function CodesTab() {
  const { token } = useAdmin();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-codes'], queryFn: () => codesApi.listAdmin(token, { status: 'all', limit: 100 }) });
  const [form, setForm] = useState({ code: '', reward: '', platform: 'all', season: '', category: 'general', status: 'active', expires_at: '', source: '' });
  const [err, setErr] = useState('');

  const add = useMutation({
    mutationFn: () => codesApi.create(form, token),
    onSuccess: () => { qc.invalidateQueries(['admin-codes']); qc.invalidateQueries(['codes']); setForm({ code: '', reward: '', platform: 'all', season: '', category: 'general', status: 'active', expires_at: '', source: '' }); setErr(''); },
    onError: (e) => setErr(e.response?.data?.error || 'Failed to add code'),
  });

  const del = useMutation({
    mutationFn: (id) => codesApi.remove(id, token),
    onSuccess: () => { qc.invalidateQueries(['admin-codes']); qc.invalidateQueries(['codes']); },
  });

  const approve = useMutation({
    mutationFn: (id) => codesApi.approve(id, token),
    onSuccess: () => { qc.invalidateQueries(['admin-codes']); qc.invalidateQueries(['codes']); },
  });

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const pending = data?.data.filter(c => c.status === 'pending') ?? [];
  const rest = data?.data.filter(c => c.status !== 'pending') ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Pending submissions */}
      {pending.length > 0 && (
        <div className="card border-cod-accent/30">
          <h2 className="font-bold mb-4">Pending Submissions ({pending.length})</h2>
          <div className="flex flex-col gap-2">
            {pending.map(c => (
              <div key={c.id} className="flex items-center gap-3 bg-cod-surface rounded-lg px-3 py-2">
                <span className="badge-info shrink-0">pending</span>
                <span className="font-mono text-sm text-white truncate flex-1">{c.code}</span>
                <span className="text-cod-muted text-xs truncate hidden sm:block flex-1">{c.reward}</span>
                {c.source && <span className="text-cod-muted text-xs truncate hidden md:block">via {c.source}</span>}
                <button onClick={() => approve.mutate(c.id)} className="text-cod-green hover:text-green-400 p-1 shrink-0" title="Approve">
                  <Check size={15} />
                </button>
                <button onClick={() => del.mutate(c.id)} className="text-cod-red hover:text-red-400 p-1 shrink-0" title="Reject">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-bold mb-4">Add Redeem Code</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Code *"><input className="input font-mono uppercase" value={form.code} onChange={f('code')} placeholder="CODM2025XYZ" /></Field>
          <Field label="Reward *"><input className="input" value={form.reward} onChange={f('reward')} placeholder="Legendary Blueprint" /></Field>
          <Field label="Platform">
            <select className="input" value={form.platform} onChange={f('platform')}>
              <option value="all">All</option><option value="android">Android</option><option value="ios">iOS</option>
            </select>
          </Field>
          <Field label="Status">
            <select className="input" value={form.status} onChange={f('status')}>
              <option value="active">Active</option><option value="expired">Expired</option>
            </select>
          </Field>
          <Field label="Season"><input className="input" value={form.season} onChange={f('season')} placeholder="Season 3 2025" /></Field>
          <Field label="Category"><input className="input" value={form.category} onChange={f('category')} placeholder="general" /></Field>
          <Field label="Expires At"><input className="input" type="datetime-local" value={form.expires_at} onChange={f('expires_at')} /></Field>
          <Field label="Source"><input className="input" value={form.source} onChange={f('source')} placeholder="Official Twitter" /></Field>
        </div>
        {err && <p className="text-cod-red text-sm mt-2">{err}</p>}
        <button className="btn-primary mt-4 flex items-center gap-2" onClick={() => add.mutate()} disabled={add.isPending || !form.code || !form.reward}>
          <Plus size={16} /> {add.isPending ? 'Adding…' : 'Add Code'}
        </button>
      </div>

      <div className="card">
        <h2 className="font-bold mb-4">Live Codes ({rest.length})</h2>
        {isLoading ? <Spinner /> : (
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {rest.map(c => (
              <div key={c.id} className="flex items-center gap-3 bg-cod-surface rounded-lg px-3 py-2">
                <span className={c.status === 'active' ? 'badge-active' : 'badge-expired'}>{c.status}</span>
                <span className="font-mono text-sm text-white flex-1 truncate">{c.code}</span>
                <span className="text-cod-muted text-xs truncate hidden sm:block">{c.reward}</span>
                <button onClick={() => del.mutate(c.id)} className="text-cod-red hover:text-red-400 p-1 shrink-0" title="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Weapons Tab ────────────────────────────────────────────────────────────
function WeaponsTab() {
  const { token } = useAdmin();
  const qc = useQueryClient();
  const { data: weapons, isLoading } = useQuery({ queryKey: ['admin-weapons'], queryFn: () => weaponsApi.list({}) });
  const [form, setForm] = useState({ name: '', slug: '', category: 'Assault Rifle', description: '', base_damage: '', fire_rate: '', range: '', mobility: '', control: '' });
  const [loadoutForm, setLoadoutForm] = useState({ weapon_id: '', title: '', playstyle: 'balanced', description: '', attachments: '', perks: '' });
  const [err, setErr] = useState('');

  const add = useMutation({
    mutationFn: () => weaponsApi.create({ ...form, base_damage: form.base_damage || undefined, fire_rate: form.fire_rate || undefined, range: form.range || undefined, mobility: form.mobility || undefined, control: form.control || undefined }, token),
    onSuccess: () => { qc.invalidateQueries(['admin-weapons']); qc.invalidateQueries(['weapons']); setForm({ name: '', slug: '', category: 'Assault Rifle', description: '', base_damage: '', fire_rate: '', range: '', mobility: '', control: '' }); setErr(''); },
    onError: (e) => setErr(e.response?.data?.error || 'Failed'),
  });

  const del = useMutation({
    mutationFn: (id) => weaponsApi.remove(id, token),
    onSuccess: () => { qc.invalidateQueries(['admin-weapons']); qc.invalidateQueries(['weapons']); },
  });

  const addLoadout = useMutation({
    mutationFn: () => weaponsApi.addLoadout(loadoutForm.weapon_id, {
      title: loadoutForm.title, playstyle: loadoutForm.playstyle, description: loadoutForm.description,
      attachments: loadoutForm.attachments.split('\n').map(s => s.trim()).filter(Boolean),
      perks: loadoutForm.perks.split('\n').map(s => s.trim()).filter(Boolean),
    }, token),
    onSuccess: () => { qc.invalidateQueries(['admin-weapons']); setLoadoutForm({ weapon_id: '', title: '', playstyle: 'balanced', description: '', attachments: '', perks: '' }); },
    onError: (e) => setErr(e.response?.data?.error || 'Failed'),
  });

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const lf = (k) => (e) => setLoadoutForm(p => ({ ...p, [k]: e.target.value }));

  const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <div className="flex flex-col gap-6">
      <div className="card">
        <h2 className="font-bold mb-4">Add Weapon</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name *">
            <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: autoSlug(e.target.value) }))} placeholder="AK-47" />
          </Field>
          <Field label="Slug *"><input className="input" value={form.slug} onChange={f('slug')} placeholder="ak-47" /></Field>
          <Field label="Category">
            <select className="input" value={form.category} onChange={f('category')}>
              {['Assault Rifle','SMG','Sniper','LMG','Shotgun','Marksman','Pistol','Launcher'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Description"><input className="input" value={form.description} onChange={f('description')} /></Field>
          {['base_damage','fire_rate','range','mobility','control'].map(k => (
            <Field key={k} label={k.replace('_', ' ')}>
              <input className="input" type="number" min="0" max="100" value={form[k]} onChange={f(k)} placeholder="0–100" />
            </Field>
          ))}
        </div>
        {err && <p className="text-cod-red text-sm mt-2">{err}</p>}
        <button className="btn-primary mt-4 flex items-center gap-2" onClick={() => add.mutate()} disabled={add.isPending || !form.name || !form.slug}>
          <Plus size={16} /> {add.isPending ? 'Adding…' : 'Add Weapon'}
        </button>
      </div>

      <div className="card">
        <h2 className="font-bold mb-4">Add Loadout</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Weapon *">
            <select className="input" value={loadoutForm.weapon_id} onChange={lf('weapon_id')}>
              <option value="">Select weapon…</option>
              {weapons?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </Field>
          <Field label="Title *"><input className="input" value={loadoutForm.title} onChange={lf('title')} placeholder="Aggressive Rusher" /></Field>
          <Field label="Playstyle">
            <select className="input" value={loadoutForm.playstyle} onChange={lf('playstyle')}>
              {['aggressive','balanced','passive','sniper'].map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Description"><input className="input" value={loadoutForm.description} onChange={lf('description')} /></Field>
          <Field label="Attachments (one per line)">
            <textarea className="input min-h-[80px] resize-y" value={loadoutForm.attachments} onChange={lf('attachments')} placeholder="Monolithic Suppressor&#10;Barrel: FSS 26.4&#10;Stock: No Stock" />
          </Field>
          <Field label="Perks (one per line)">
            <textarea className="input min-h-[80px] resize-y" value={loadoutForm.perks} onChange={lf('perks')} placeholder="Lightweight&#10;Toughness&#10;Dead Silence" />
          </Field>
        </div>
        <button className="btn-primary mt-4 flex items-center gap-2" onClick={() => addLoadout.mutate()} disabled={addLoadout.isPending || !loadoutForm.weapon_id || !loadoutForm.title}>
          <Plus size={16} /> {addLoadout.isPending ? 'Adding…' : 'Add Loadout'}
        </button>
      </div>

      <div className="card">
        <h2 className="font-bold mb-4">Weapons ({weapons?.length ?? '…'})</h2>
        {isLoading ? <Spinner /> : (
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {weapons?.map(w => (
              <div key={w.id} className="flex items-center gap-3 bg-cod-surface rounded-lg px-3 py-2">
                <span className="badge-info">{w.category}</span>
                <span className="text-white flex-1 text-sm">{w.name}</span>
                <button onClick={() => del.mutate(w.id)} className="text-cod-red hover:text-red-400 p-1"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tips Tab ───────────────────────────────────────────────────────────────
function TipsTab() {
  const { token } = useAdmin();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-tips'], queryFn: () => tipsApi.list({ limit: 100 }) });
  const [form, setForm] = useState({ title: '', slug: '', category: 'tips', content: '', difficulty: 'beginner', tags: '' });
  const [err, setErr] = useState('');

  const add = useMutation({
    mutationFn: () => tipsApi.create({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }, token),
    onSuccess: () => { qc.invalidateQueries(['admin-tips']); qc.invalidateQueries(['tips']); setForm({ title: '', slug: '', category: 'tips', content: '', difficulty: 'beginner', tags: '' }); setErr(''); },
    onError: (e) => setErr(e.response?.data?.error || 'Failed'),
  });

  const del = useMutation({
    mutationFn: (id) => tipsApi.remove(id, token),
    onSuccess: () => { qc.invalidateQueries(['admin-tips']); qc.invalidateQueries(['tips']); },
  });

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const autoSlug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <div className="flex flex-col gap-6">
      <div className="card">
        <h2 className="font-bold mb-4">Add Guide / Tip</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Title *">
            <input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value, slug: autoSlug(e.target.value) }))} />
          </Field>
          <Field label="Slug *"><input className="input" value={form.slug} onChange={f('slug')} /></Field>
          <Field label="Category">
            <select className="input" value={form.category} onChange={f('category')}>
              {['tips','secrets','easter-eggs','unlock-guides','strategy'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Difficulty">
            <select className="input" value={form.difficulty} onChange={f('difficulty')}>
              {['beginner','intermediate','advanced'].map(d => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Tags (comma-separated)">
            <input className="input" value={form.tags} onChange={f('tags')} placeholder="br, multiplayer, ranked" />
          </Field>
          <Field label="Content *">
            <textarea className="input min-h-[120px] resize-y sm:col-span-2" value={form.content} onChange={f('content')} />
          </Field>
        </div>
        {err && <p className="text-cod-red text-sm mt-2">{err}</p>}
        <button className="btn-primary mt-4 flex items-center gap-2" onClick={() => add.mutate()} disabled={add.isPending || !form.title || !form.content}>
          <Plus size={16} /> {add.isPending ? 'Adding…' : 'Add Guide'}
        </button>
      </div>

      <div className="card">
        <h2 className="font-bold mb-4">All Guides ({data?.total ?? '…'})</h2>
        {isLoading ? <Spinner /> : (
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {data?.data.map(t => (
              <div key={t.id} className="flex items-center gap-3 bg-cod-surface rounded-lg px-3 py-2">
                <span className="badge-info">{t.category}</span>
                <span className="text-white flex-1 text-sm truncate">{t.title}</span>
                <button onClick={() => del.mutate(t.id)} className="text-cod-red hover:text-red-400 p-1"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Settings Tab ───────────────────────────────────────────────────────────
function SettingsTab() {
  const { token } = useAdmin();
  const qc = useQueryClient();
  const { data: sensData } = useQuery({ queryKey: ['admin-sens'], queryFn: () => settingsApi.getSensitivity({}) });
  const { data: hudData } = useQuery({ queryKey: ['admin-hud'], queryFn: () => settingsApi.getHud({}) });

  const [sensForm, setSensForm] = useState({ title: '', playstyle: 'balanced', device_type: 'phone', fps_sensitivity: '', ads_sensitivity: '', scope_3x: '', scope_4x: '', sniper_scope: '', gyroscope: '', description: '' });
  const [hudForm, setHudForm] = useState({ title: '', playstyle: 'balanced', device_type: 'phone', fire_button_size: '', fire_button_position: '', joystick_size: '', description: '' });

  const addSens = useMutation({
    mutationFn: () => settingsApi.addSensitivity(Object.fromEntries(Object.entries(sensForm).map(([k, v]) => [k, v === '' ? undefined : v])), token),
    onSuccess: () => { qc.invalidateQueries(['admin-sens']); setSensForm({ title: '', playstyle: 'balanced', device_type: 'phone', fps_sensitivity: '', ads_sensitivity: '', scope_3x: '', scope_4x: '', sniper_scope: '', gyroscope: '', description: '' }); },
  });

  const delSens = useMutation({
    mutationFn: (id) => settingsApi.deleteSensitivity(id, token),
    onSuccess: () => qc.invalidateQueries(['admin-sens']),
  });

  const addHud = useMutation({
    mutationFn: () => settingsApi.addHud(Object.fromEntries(Object.entries(hudForm).map(([k, v]) => [k, v === '' ? undefined : v])), token),
    onSuccess: () => { qc.invalidateQueries(['admin-hud']); setHudForm({ title: '', playstyle: 'balanced', device_type: 'phone', fire_button_size: '', fire_button_position: '', joystick_size: '', description: '' }); },
  });

  const delHud = useMutation({
    mutationFn: (id) => settingsApi.deleteHud(id, token),
    onSuccess: () => qc.invalidateQueries(['admin-hud']),
  });

  const sf = (k) => (e) => setSensForm(p => ({ ...p, [k]: e.target.value }));
  const hf = (k) => (e) => setHudForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="flex flex-col gap-6">
      {/* Sensitivity */}
      <div className="card">
        <h2 className="font-bold mb-4">Add Sensitivity Preset</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Title *"><input className="input" value={sensForm.title} onChange={sf('title')} /></Field>
          <Field label="Playstyle">
            <select className="input" value={sensForm.playstyle} onChange={sf('playstyle')}>
              {['aggressive','balanced','passive','sniper'].map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Device">
            <select className="input" value={sensForm.device_type} onChange={sf('device_type')}>
              <option value="phone">Phone</option><option value="tablet">Tablet</option>
            </select>
          </Field>
          {[['fps_sensitivity','FPS/TPP'],['ads_sensitivity','ADS'],['scope_3x','3x Scope'],['scope_4x','4x Scope'],['sniper_scope','Sniper'],['gyroscope','Gyro']].map(([k, l]) => (
            <Field key={k} label={l}><input className="input" type="number" min="0" max="300" value={sensForm[k]} onChange={sf(k)} /></Field>
          ))}
          <Field label="Description"><input className="input" value={sensForm.description} onChange={sf('description')} /></Field>
        </div>
        <button className="btn-primary mt-4 flex items-center gap-2" onClick={() => addSens.mutate()} disabled={addSens.isPending || !sensForm.title}>
          <Plus size={16} /> Add Preset
        </button>
        <div className="mt-4 flex flex-col gap-2 max-h-48 overflow-y-auto">
          {sensData?.map(s => (
            <div key={s.id} className="flex items-center gap-3 bg-cod-surface rounded-lg px-3 py-2">
              <span className="badge-info">{s.playstyle}</span>
              <span className="text-white flex-1 text-sm">{s.title}</span>
              <button onClick={() => delSens.mutate(s.id)} className="text-cod-red p-1"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* HUD */}
      <div className="card">
        <h2 className="font-bold mb-4">Add HUD Preset</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Title *"><input className="input" value={hudForm.title} onChange={hf('title')} /></Field>
          <Field label="Playstyle">
            <select className="input" value={hudForm.playstyle} onChange={hf('playstyle')}>
              {['aggressive','balanced','passive'].map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Device">
            <select className="input" value={hudForm.device_type} onChange={hf('device_type')}>
              <option value="phone">Phone</option><option value="tablet">Tablet</option>
            </select>
          </Field>
          <Field label="Fire Button Size %"><input className="input" type="number" value={hudForm.fire_button_size} onChange={hf('fire_button_size')} /></Field>
          <Field label="Fire Position"><input className="input" value={hudForm.fire_button_position} onChange={hf('fire_button_position')} placeholder="Right side" /></Field>
          <Field label="Joystick Size %"><input className="input" type="number" value={hudForm.joystick_size} onChange={hf('joystick_size')} /></Field>
          <Field label="Description"><input className="input" value={hudForm.description} onChange={hf('description')} /></Field>
        </div>
        <button className="btn-primary mt-4 flex items-center gap-2" onClick={() => addHud.mutate()} disabled={addHud.isPending || !hudForm.title}>
          <Plus size={16} /> Add HUD Preset
        </button>
        <div className="mt-4 flex flex-col gap-2 max-h-48 overflow-y-auto">
          {hudData?.map(h => (
            <div key={h.id} className="flex items-center gap-3 bg-cod-surface rounded-lg px-3 py-2">
              <span className="badge-info">{h.playstyle}</span>
              <span className="text-white flex-1 text-sm">{h.title}</span>
              <button onClick={() => delHud.mutate(h.id)} className="text-cod-red p-1"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Page ────────────────────────────────────────────────────────
const TABS = [
  { id: 'codes', label: 'Codes' },
  { id: 'weapons', label: 'Weapons' },
  { id: 'guides', label: 'Guides' },
  { id: 'settings', label: 'Settings' },
];

export default function Admin() {
  const { isAdmin, logout } = useAdmin();
  const [tab, setTab] = useState('codes');

  if (!isAdmin) return <LoginForm />;

  return (
    <>
      <SeoHead title="Admin Dashboard" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="text-cod-accent" size={22} />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <button onClick={logout} className="btn-ghost flex items-center gap-2 text-sm">
            <LogOut size={15} /> Logout
          </button>
        </div>

        <div className="flex gap-1 mb-6 bg-cod-surface rounded-xl p-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 min-w-max px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-cod-accent text-black' : 'text-cod-muted hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'codes' && <CodesTab />}
        {tab === 'weapons' && <WeaponsTab />}
        {tab === 'guides' && <TipsTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </>
  );
}
