import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Trophy, Users, Calendar, ExternalLink, ChevronDown, ChevronUp,
  UserPlus, Trash2, Play, Flag, CheckCircle, Loader, AlertCircle,
  Swords, Smartphone, Copy, Check, Star,
} from 'lucide-react';
import { tournamentsApi, codmPlayerApi } from '../lib/api';
import { useAdmin } from '../lib/adminContext';
import { Spinner, SeoHead, EmptyState } from '../components/ui';
import { useProfileUid } from '../hooks/useProfileUid';

const GAME_MODES = [
  { value: 'mp', label: 'Multiplayer (1v1)', desc: 'Standard MP — kills decide winner' },
  { value: 'br', label: 'Battle Royale Squad', desc: 'BR/Blackout — up to 4 members, placement + kills' },
  { value: 'blackout', label: 'Blackout Solo', desc: 'Blackout solo — placement decides winner' },
];

function gameModeLabel(mode) {
  return GAME_MODES.find(m => m.value === mode)?.label || mode?.toUpperCase() || 'MP';
}

function isBR(mode) {
  return mode === 'br' || mode === 'blackout';
}

// Detect game mode from tournament game_name string
function detectMode(t) {
  const name = (t.game_name || '').toLowerCase();
  if (name.includes('(br)')) return 'br';
  if (name.includes('(blackout)')) return 'blackout';
  return 'mp';
}

function OpenCODMButton({ opponentUid, opponentName }) {
  const [copied, setCopied] = useState(false);

  const openApp = () => {
    // CODM URI scheme — opens app on mobile, falls back gracefully
    window.location.href = 'callofduty://';
    setTimeout(() => {
      // fallback: open Play Store / App Store
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      window.open(
        isIOS
          ? 'https://apps.apple.com/app/call-of-duty-mobile/id1287282214'
          : 'https://play.google.com/store/apps/details?id=com.activision.callofduty.shooter',
        '_blank'
      );
    }, 1500);
  };

  const copyUid = () => {
    navigator.clipboard.writeText(opponentUid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 p-3 bg-cod-surface rounded-xl border border-cod-border flex flex-col gap-2">
      <p className="text-xs text-cod-muted uppercase tracking-wider">Your opponent</p>
      <div className="flex items-center gap-2">
        <span className="text-white font-bold text-sm flex-1 truncate">{opponentName}</span>
        {opponentUid && (
          <div className="flex items-center gap-1">
            <span className="font-mono text-cod-accent text-xs">{opponentUid}</span>
            <button onClick={copyUid} className="p-1 text-cod-muted hover:text-white" title="Copy UID">
              {copied ? <Check size={12} className="text-cod-green" /> : <Copy size={12} />}
            </button>
          </div>
        )}
      </div>
      <p className="text-cod-muted text-xs">Add them in CODM: Social → Add Friend → search by UID</p>
      <button onClick={openApp}
        className="btn-primary text-xs flex items-center gap-2 justify-center py-2">
        <Smartphone size={13} /> Launch CODM
      </button>
    </div>
  );
}

function PlayerPreview({ uid }) {
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(uid.trim()), 700);
    return () => clearTimeout(t);
  }, [uid]);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['codm-player', debounced],
    queryFn: () => codmPlayerApi.lookup(debounced),
    enabled: debounced.length >= 4,
    retry: false,
    staleTime: 5 * 60_000,
  });

  if (!debounced || debounced.length < 4) return null;
  if (isFetching) return (
    <div className="flex items-center gap-2 text-cod-muted text-xs mt-2">
      <Loader size={12} className="animate-spin" /> Verifying UID…
    </div>
  );
  if (isError || !data?.nickname) return (
    <div className="flex items-center gap-2 text-cod-red text-xs mt-2">
      <AlertCircle size={12} /> UID not found
    </div>
  );
  return (
    <div className="mt-2 flex items-center gap-3 bg-cod-surface border border-cod-green/30 rounded-xl px-3 py-2">
      {data.rank?.imageUrl && <img src={data.rank.imageUrl} alt={data.rank.label} className="w-8 h-8 object-contain shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-bold truncate">{data.nickname}</p>
        <p className="text-cod-muted text-xs">{data.rank?.label || 'Unranked'} · Lv.{data.level}</p>
      </div>
      <CheckCircle size={16} className="text-cod-green shrink-0" />
    </div>
  );
}

function RegisterForm({ tournamentId, challongeUrl, gameMode }) {
  const qc = useQueryClient();
  const { uid: savedUid } = useProfileUid();
  const [uid, setUid] = useState(savedUid);
  const [teamName, setTeamName] = useState('');
  const [teamUids, setTeamUids] = useState(['', '', '']);
  const [done, setDone] = useState(null);
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(uid.trim()), 700);
    return () => clearTimeout(t);
  }, [uid]);

  const { data: player } = useQuery({
    queryKey: ['codm-player', debounced],
    queryFn: () => codmPlayerApi.lookup(debounced),
    enabled: debounced.length >= 4,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: () => tournamentsApi.register(tournamentId, {
      name: player?.nickname || uid,
      codm_uid: uid,
      ...(isBR(gameMode) && teamName ? { team_name: teamName, team_uids: teamUids.filter(Boolean) } : {}),
    }),
    onSuccess: (res) => { setDone({ player, participant: res.participant }); qc.invalidateQueries(['tournament', tournamentId]); },
  });

  if (done) return (
    <div className="mt-4 border-t border-cod-border pt-4">
      <div className="bg-cod-green/10 border border-cod-green/30 rounded-xl p-4 flex flex-col items-center gap-2 text-center">
        <CheckCircle size={24} className="text-cod-green" />
        <p className="text-white font-bold">{done.player?.nickname || done.participant?.name}</p>
        <p className="text-cod-green text-sm font-semibold">Registered!</p>
        {challongeUrl && (
          <a href={challongeUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs flex items-center gap-1.5 py-1.5 px-3">
            <ExternalLink size={12} /> View bracket
          </a>
        )}
      </div>
    </div>
  );

  const canSubmit = uid.trim().length >= 4 && player?.nickname;

  return (
    <div className="mt-4 border-t border-cod-border pt-4 flex flex-col gap-3">
      <p className="text-xs text-cod-muted uppercase tracking-wider flex items-center gap-1.5">
        <UserPlus size={12} /> Register — {gameModeLabel(gameMode)}
      </p>
      <div>
        <label className="text-xs text-cod-muted mb-1 block">Your CODM UID *</label>
        <input className="input font-mono w-full" placeholder="e.g. 123456789" value={uid} onChange={e => setUid(e.target.value)} />
        <PlayerPreview uid={uid} />
        {savedUid && savedUid !== uid && (
          <button className="text-cod-muted text-xs mt-1 hover:text-white" onClick={() => setUid(savedUid)}>Use saved UID ({savedUid})</button>
        )}
      </div>
      {isBR(gameMode) && (
        <div className="flex flex-col gap-2 p-3 bg-cod-surface rounded-xl border border-cod-border">
          <p className="text-xs text-cod-accent font-semibold">Squad (optional — leave blank for solo)</p>
          <input className="input" placeholder="Team name" value={teamName} onChange={e => setTeamName(e.target.value)} />
          {teamUids.map((u, i) => (
            <input key={i} className="input font-mono text-xs" placeholder={`Teammate ${i + 2} UID (optional)`}
              value={u} onChange={e => setTeamUids(p => p.map((v, j) => j === i ? e.target.value : v))} />
          ))}
        </div>
      )}
      {isError && <p className="text-cod-red text-xs">{error?.response?.data?.error || 'Registration failed.'}</p>}
      <button className="btn-primary text-sm flex items-center gap-2" onClick={() => mutate()} disabled={isPending || !canSubmit}>
        <UserPlus size={14} />
        {isPending ? 'Registering…' : canSubmit ? `Register as ${player?.nickname}` : 'Verify UID first'}
      </button>
    </div>
  );
}

function ParticipantRow({ p, isAdmin, onRemove, myUid }) {
  const rawMisc = p.misc || '';
  let uid = null;
  let teamMembers = null;
  try { const parsed = JSON.parse(rawMisc); uid = parsed.uid; teamMembers = parsed.members; } catch { uid = rawMisc || p.name?.match(/\[(.+?)\]$/)?.[1] || null; }
  const displayName = p.name?.replace(/\s*\[.+?\]$/, '') || p.name;
  const isMe = myUid && uid === myUid;
  const hasUid = !!uid;

  const { data: player, isFetching, isError } = useQuery({
    queryKey: ['codm-player', uid],
    queryFn: () => codmPlayerApi.lookup(uid),
    enabled: hasUid,
    retry: false,
    staleTime: 10 * 60_000,
  });

  // Only mark unverified if we have a UID and the lookup definitively failed
  const lookupFailed = hasUid && !isFetching && (isError || !player?.nickname);
  const verified = hasUid && !isFetching && player?.nickname;

  return (
    <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
      isMe ? 'bg-cod-accent/10 border border-cod-accent/40' :
      lookupFailed ? 'bg-cod-red/10 border border-cod-red/30' : 'bg-cod-surface'
    }`}>
      <div className="relative shrink-0 w-9 h-9">
        {player?.avatar
          ? <img src={player.avatar} alt={player.nickname} className="w-9 h-9 rounded-full object-cover" />
          : <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
              lookupFailed ? 'bg-cod-red/20' : 'bg-cod-border'
            }`}>
              {lookupFailed && <AlertCircle size={14} className="text-cod-red" />}
            </div>}
        {player?.rank?.imageUrl && (
          <img src={player.rank.imageUrl} alt={player.rank.label} className="absolute -bottom-1 -right-1 w-4 h-4 object-contain" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-white text-sm font-medium truncate block">{player?.nickname || displayName}{isMe ? ' (you)' : ''}</span>
        <span className={`text-xs ${lookupFailed ? 'text-cod-red' : 'text-cod-muted'}`}>
          {isFetching ? 'Verifying…'
            : verified ? `${player.rank?.label || 'Unranked'} · Lv.${player.level}`
            : lookupFailed ? 'UID not found'
            : 'Registered'}
        </span>
        {teamMembers?.length > 1 && <span className="text-xs text-cod-accent block">Squad: {teamMembers.length} members</span>}
      </div>
      {p.final_rank && <span className="badge-info shrink-0">#{p.final_rank}</span>}
      {isAdmin && <button onClick={onRemove} className="text-cod-red hover:text-red-400 p-1 shrink-0"><Trash2 size={14} /></button>}
    </div>
  );
}

function MatchReportForm({ match, tournamentId, participants, gameMode, onDone }) {
  const { token } = useAdmin();
  const qc = useQueryClient();
  const getName = (id) => participants.find(p => p.id === id)?.name?.replace(/\s*\[.+\]$/, '') || `#${id}`;
  const p1Name = getName(match.player1_id);
  const p2Name = getName(match.player2_id);
  const [form, setForm] = useState({ winner_id: '', p1_kills: '', p1_damage: '', p1_placement: '', p2_kills: '', p2_damage: '', p2_placement: '', mvp_name: '', screenshot_url: '', notes: '' });
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: () => tournamentsApi.reportMatch(tournamentId, match.id, {
      winner_id: parseInt(form.winner_id),
      game_mode: gameMode,
      p1_kills: form.p1_kills ? parseInt(form.p1_kills) : undefined,
      p1_damage: form.p1_damage ? parseInt(form.p1_damage) : undefined,
      p1_placement: form.p1_placement ? parseInt(form.p1_placement) : undefined,
      p2_kills: form.p2_kills ? parseInt(form.p2_kills) : undefined,
      p2_damage: form.p2_damage ? parseInt(form.p2_damage) : undefined,
      p2_placement: form.p2_placement ? parseInt(form.p2_placement) : undefined,
      mvp_name: form.mvp_name || undefined,
      screenshot_url: form.screenshot_url || undefined,
      notes: form.notes || undefined,
    }, token),
    onSuccess: () => { qc.invalidateQueries(['matches', tournamentId]); qc.invalidateQueries(['stats', tournamentId]); onDone(); },
  });

  return (
    <div className="mt-3 p-3 bg-cod-surface rounded-xl border border-cod-accent/30 flex flex-col gap-3">
      <p className="text-xs text-cod-accent font-bold uppercase tracking-wider">Report Result</p>
      <div>
        <label className="text-xs text-cod-muted mb-1 block">Winner *</label>
        <select className="input" value={form.winner_id} onChange={f('winner_id')}>
          <option value="">Select winner…</option>
          <option value={match.player1_id}>{p1Name}</option>
          <option value={match.player2_id}>{p2Name}</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-cod-muted mb-1 font-semibold truncate">{p1Name}</p>
          <input className="input mb-1" type="number" min="0" placeholder={isBR(gameMode) ? 'Placement' : 'Kills'}
            value={isBR(gameMode) ? form.p1_placement : form.p1_kills}
            onChange={isBR(gameMode) ? f('p1_placement') : f('p1_kills')} />
          <input className="input" type="number" min="0" placeholder={isBR(gameMode) ? 'Kills' : 'Damage'}
            value={isBR(gameMode) ? form.p1_kills : form.p1_damage}
            onChange={isBR(gameMode) ? f('p1_kills') : f('p1_damage')} />
        </div>
        <div>
          <p className="text-xs text-cod-muted mb-1 font-semibold truncate">{p2Name}</p>
          <input className="input mb-1" type="number" min="0" placeholder={isBR(gameMode) ? 'Placement' : 'Kills'}
            value={isBR(gameMode) ? form.p2_placement : form.p2_kills}
            onChange={isBR(gameMode) ? f('p2_placement') : f('p2_kills')} />
          <input className="input" type="number" min="0" placeholder={isBR(gameMode) ? 'Kills' : 'Damage'}
            value={isBR(gameMode) ? form.p2_kills : form.p2_damage}
            onChange={isBR(gameMode) ? f('p2_kills') : f('p2_damage')} />
        </div>
      </div>
      <input className="input" placeholder="MVP name (optional)" value={form.mvp_name} onChange={f('mvp_name')} />
      <input className="input" placeholder="Screenshot URL as proof (optional)" value={form.screenshot_url} onChange={f('screenshot_url')} />
      <textarea className="input resize-none" rows={2} placeholder="Notes (optional)" value={form.notes} onChange={f('notes')} />
      {isError && <p className="text-cod-red text-xs">{error?.response?.data?.error || 'Failed.'}</p>}
      <div className="flex gap-2">
        <button className="btn-primary text-xs flex items-center gap-1.5" onClick={() => mutate()} disabled={isPending || !form.winner_id}>
          <Flag size={12} /> {isPending ? 'Saving…' : 'Submit Result'}
        </button>
        <button className="btn-ghost text-xs" onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}

function MatchesBracket({ tournamentId, participants, gameMode }) {
  const { isAdmin } = useAdmin();
  const { uid: myUid } = useProfileUid();
  const [reportingId, setReportingId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['matches', tournamentId],
    queryFn: () => tournamentsApi.getMatches(tournamentId),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const matches = data?.data ?? [];
  const open = matches.filter(m => m.state === 'open');
  const done = matches.filter(m => m.state === 'complete');

  const getName = (id) => participants.find(p => p.id === id)?.name?.replace(/\s*\[.+\]$/, '') || `#${id}`;
  const getUid = (id) => { const p = participants.find(p => p.id === id); if (!p) return null; try { return JSON.parse(p.misc).uid; } catch { return p.misc || null; } };

  // find my match
  const myParticipant = participants.find(p => { try { return JSON.parse(p.misc).uid === myUid; } catch { return p.misc === myUid; } });
  const myMatch = myParticipant ? open.find(m => m.player1_id === myParticipant.id || m.player2_id === myParticipant.id) : null;
  const myOpponentId = myMatch ? (myMatch.player1_id === myParticipant?.id ? myMatch.player2_id : myMatch.player1_id) : null;

  if (isLoading) return <Spinner />;
  if (matches.length === 0) return <p className="text-cod-muted text-xs text-center py-3">No matches yet.</p>;

  return (
    <div className="mt-4 pt-4 border-t border-cod-border">
      <p className="text-xs text-cod-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Swords size={12} /> Matches ({open.length} open · {done.length} done)
      </p>

      {/* My match callout */}
      {myMatch && myOpponentId && (
        <div className="mb-3 p-3 rounded-xl border border-cod-accent/40 bg-cod-accent/5">
          <p className="text-cod-accent text-xs font-bold mb-1">Your match is ready!</p>
          <OpenCODMButton
            opponentName={getName(myOpponentId)}
            opponentUid={getUid(myOpponentId)}
          />
        </div>
      )}

      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
        {matches.map(m => {
          const p1 = getName(m.player1_id);
          const p2 = getName(m.player2_id);
          const isDone = m.state === 'complete';
          const stats = m.stats;
          return (
            <div key={m.id} className={`rounded-lg px-3 py-2 flex flex-col gap-1 ${
              isDone ? 'bg-cod-surface opacity-70' : 'bg-cod-surface border border-cod-border'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-cod-muted text-xs shrink-0">R{m.round}</span>
                <span className={`text-sm flex-1 truncate ${
                  isDone && m.winner_id === m.player1_id ? 'text-cod-green font-bold' : 'text-white'
                }`}>{p1}</span>
                <span className="text-cod-muted text-xs shrink-0">vs</span>
                <span className={`text-sm flex-1 truncate text-right ${
                  isDone && m.winner_id === m.player2_id ? 'text-cod-green font-bold' : 'text-white'
                }`}>{p2}</span>
                {isDone && <span className="text-cod-muted text-xs shrink-0">{m.scores_csv}</span>}
              </div>
              {stats && (
                <div className="flex flex-wrap gap-2 text-xs text-cod-muted">
                  {stats.p1_kills != null && <span>{p1}: {stats.p1_kills}K{stats.p1_damage ? ` / ${stats.p1_damage}dmg` : ''}</span>}
                  {stats.p2_kills != null && <span>{p2}: {stats.p2_kills}K{stats.p2_damage ? ` / ${stats.p2_damage}dmg` : ''}</span>}
                  {stats.mvp_name && <span className="flex items-center gap-1 text-cod-accent"><Star size={10} /> MVP: {stats.mvp_name}</span>}
                  {stats.screenshot_url && <a href={stats.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-cod-accent hover:underline">Proof</a>}
                </div>
              )}
              {isAdmin && !isDone && m.player1_id && m.player2_id && (
                reportingId === m.id
                  ? <MatchReportForm match={m} tournamentId={tournamentId} participants={participants} gameMode={gameMode} onDone={() => setReportingId(null)} />
                  : <button className="text-xs text-cod-accent hover:underline text-left mt-1" onClick={() => setReportingId(m.id)}>Report result</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatsLeaderboard({ tournamentId, participants }) {
  const { data } = useQuery({
    queryKey: ['stats', tournamentId],
    queryFn: () => tournamentsApi.getStats(tournamentId),
    staleTime: 30_000,
  });

  const stats = data?.data ?? [];
  if (stats.length === 0) return null;

  const getName = (id) => participants.find(p => p.id === id)?.name?.replace(/\s*\[.+\]$/, '') || `#${id}`;

  // aggregate kills per participant
  const agg = {};
  stats.forEach(s => {
    if (s.player1_id) { if (!agg[s.player1_id]) agg[s.player1_id] = { kills: 0, damage: 0, mvps: 0 }; agg[s.player1_id].kills += s.p1_kills || 0; agg[s.player1_id].damage += s.p1_damage || 0; }
    if (s.player2_id) { if (!agg[s.player2_id]) agg[s.player2_id] = { kills: 0, damage: 0, mvps: 0 }; agg[s.player2_id].kills += s.p2_kills || 0; agg[s.player2_id].damage += s.p2_damage || 0; }
    if (s.mvp_participant_id) { if (!agg[s.mvp_participant_id]) agg[s.mvp_participant_id] = { kills: 0, damage: 0, mvps: 0 }; agg[s.mvp_participant_id].mvps += 1; }
  });

  const rows = Object.entries(agg).sort((a, b) => b[1].kills - a[1].kills);
  if (rows.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-cod-border">
      <p className="text-xs text-cod-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Star size={12} /> Leaderboard
      </p>
      <div className="flex flex-col gap-1">
        {rows.map(([pid, s], i) => (
          <div key={pid} className="flex items-center gap-3 bg-cod-surface rounded-lg px-3 py-2">
            <span className="text-cod-muted text-xs w-4">{i + 1}</span>
            <span className="text-white text-sm flex-1 truncate">{getName(parseInt(pid))}</span>
            <span className="text-cod-accent text-xs font-bold">{s.kills}K</span>
            {s.damage > 0 && <span className="text-cod-muted text-xs">{s.damage}dmg</span>}
            {s.mvps > 0 && <span className="flex items-center gap-0.5 text-yellow-400 text-xs"><Star size={10} />{s.mvps}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TournamentCard({ t }) {
  const { isAdmin, token } = useAdmin();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const { uid: myUid } = useProfileUid();
  const gameMode = detectMode(t);
  const tid = t.url || t.id;

  const { data: detail } = useQuery({
    queryKey: ['tournament', tid],
    queryFn: () => tournamentsApi.get(tid),
    enabled: expanded,
    staleTime: 30_000,
  });

  const participants = detail?.participants || [];
  const start = t.start_at ? new Date(t.start_at).toLocaleDateString() : null;
  const isOpen = t.open_signup && !['complete', 'underway'].includes(t.state);

  const remove = useMutation({
    mutationFn: (pid) => tournamentsApi.removeParticipant(tid, pid, token),
    onSuccess: () => qc.invalidateQueries(['tournament', tid]),
  });

  const startTournament = useMutation({
    mutationFn: () => tournamentsApi.start(tid, token),
    onSuccess: () => { qc.invalidateQueries(['tournaments']); qc.invalidateQueries(['tournament', tid]); },
  });

  const finalize = useMutation({
    mutationFn: () => tournamentsApi.finalize(tid, token),
    onSuccess: () => qc.invalidateQueries(['tournaments']),
  });

  const canStart = (t.participants_count ?? 0) >= 2;
  const stateColor = { pending: 'text-cod-accent', underway: 'text-cod-green', complete: 'text-cod-muted', checking_in: 'text-yellow-400', awaiting_review: 'text-yellow-400' };

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-cod-surface border border-cod-border flex items-center justify-center shrink-0">
          <Trophy size={20} className="text-cod-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white truncate">{t.name}</h2>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className={`text-xs font-semibold capitalize ${stateColor[t.state] || 'text-cod-muted'}`}>
              ● {t.state?.replace(/_/g, ' ')}
            </span>
            <span className="badge-info capitalize">{t.tournament_type?.replace('_', ' ')}</span>
            <span className="badge-info">{gameModeLabel(gameMode)}</span>
            {t.participants_count != null && (
              <span className="flex items-center gap-1 text-xs text-cod-muted">
                <Users size={11} /> {t.participants_count}{t.signup_cap ? `/${t.signup_cap}` : ''}
              </span>
            )}
            {start && <span className="flex items-center gap-1 text-xs text-cod-muted"><Calendar size={11} /> {start}</span>}
            {isOpen && <span className="text-xs text-cod-green font-semibold">● Open</span>}
          </div>
          {t.description && <p className="text-cod-muted text-xs mt-0.5 truncate">{t.description}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {t.full_challonge_url && (
            <a href={t.full_challonge_url} target="_blank" rel="noopener noreferrer" className="text-cod-muted hover:text-cod-accent transition-colors p-1">
              <ExternalLink size={15} />
            </a>
          )}
          <button onClick={() => setExpanded(e => !e)} className="text-cod-muted hover:text-white transition-colors p-1">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-cod-border flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap">
                {['pending', 'checking_in', 'awaiting_review'].includes(t.state) && (
                  <div className="flex flex-col gap-1">
                    <button onClick={() => startTournament.mutate()} disabled={startTournament.isPending || !canStart}
                      className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed">
                      <Play size={12} /> {startTournament.isPending ? 'Starting…' : 'Start Tournament'}
                    </button>
                    {!canStart && <p className="text-cod-muted text-xs">Need ≥2 participants ({t.participants_count ?? 0} now)</p>}
                    {startTournament.isError && <p className="text-cod-red text-xs">{startTournament.error?.response?.data?.error || 'Failed.'}</p>}
                  </div>
                )}
                {t.state === 'underway' && (
                  <button onClick={() => finalize.mutate()} disabled={finalize.isPending}
                    className="btn-ghost text-xs flex items-center gap-1.5 py-1.5 px-3">
                    <Flag size={12} /> {finalize.isPending ? 'Finalizing…' : 'Finalize Tournament'}
                  </button>
                )}
              </div>
            </div>
          )}

          {participants.length > 0 && (
            <div className="mt-4 pt-4 border-t border-cod-border">
              <p className="text-xs text-cod-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Users size={12} /> Participants ({participants.length})
              </p>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {participants.map(p => (
                  <ParticipantRow key={p.id} p={p} isAdmin={isAdmin} myUid={myUid} onRemove={() => remove.mutate(p.id)} />
                ))}
              </div>
            </div>
          )}

          {['underway', 'complete'].includes(t.state) && (
            <MatchesBracket tournamentId={tid} participants={participants} gameMode={gameMode} />
          )}

          {['underway', 'complete'].includes(t.state) && (
            <StatsLeaderboard tournamentId={tid} participants={participants} />
          )}

          {isOpen && <RegisterForm tournamentId={tid} challongeUrl={t.full_challonge_url} gameMode={gameMode} />}

          {!isOpen && !['complete', 'underway'].includes(t.state) && (
            <p className="text-cod-muted text-xs mt-4 pt-4 border-t border-cod-border text-center">Registrations closed.</p>
          )}

          {t.state === 'complete' && (
            <div className="mt-4 pt-4 border-t border-cod-border text-center">
              <Trophy size={20} className="text-cod-accent mx-auto mb-1" />
              <p className="text-cod-accent text-sm font-bold">Tournament Complete</p>
              {t.full_challonge_url && (
                <a href={t.full_challonge_url} target="_blank" rel="noopener noreferrer"
                  className="text-cod-muted text-xs hover:text-white flex items-center gap-1 justify-center mt-1">
                  <ExternalLink size={11} /> Full results on Challonge
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CreateTournamentForm() {
  const { token } = useAdmin();
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', tournament_type: 'single elimination', game_mode: 'mp', description: '', signup_cap: '', start_at: '' });
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: () => tournamentsApi.create({
      ...form,
      signup_cap: form.signup_cap ? parseInt(form.signup_cap) : undefined,
      start_at: form.start_at || undefined,
    }, token),
    onSuccess: () => { qc.invalidateQueries(['tournaments']); setShow(false); setForm({ name: '', tournament_type: 'single elimination', game_mode: 'mp', description: '', signup_cap: '', start_at: '' }); },
  });

  if (!show) return (
    <button onClick={() => setShow(true)} className="btn-primary flex items-center gap-2 text-sm mb-6">
      <Trophy size={15} /> Create Tournament
    </button>
  );

  return (
    <div className="card border-cod-accent/30 mb-6">
      <h2 className="font-bold mb-4">Create Tournament</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input className="input sm:col-span-2" placeholder="Tournament name *" value={form.name} onChange={f('name')} />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-cod-muted">Format</label>
          <select className="input" value={form.tournament_type} onChange={f('tournament_type')}>
            <option value="single elimination">Single Elimination</option>
            <option value="double elimination">Double Elimination</option>
            <option value="round robin">Round Robin</option>
            <option value="swiss">Swiss</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-cod-muted">Game Mode</label>
          <select className="input" value={form.game_mode} onChange={f('game_mode')}>
            {GAME_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <input className="input" type="number" placeholder="Max participants (optional)" value={form.signup_cap} onChange={f('signup_cap')} />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-cod-muted">Start date (optional)</label>
          <input className="input" type="datetime-local" value={form.start_at} onChange={f('start_at')} />
        </div>
        <textarea className="input resize-y min-h-[60px] sm:col-span-2" placeholder="Description (optional)" value={form.description} onChange={f('description')} />
      </div>
      {form.game_mode !== 'mp' && (
        <p className="text-cod-muted text-xs mt-2">⚠️ BR mode: results must be reported manually by admin after each match (screenshot proof recommended).</p>
      )}
      {isError && <p className="text-cod-red text-sm mt-2">{error?.response?.data?.error || 'Failed.'}</p>}
      <div className="flex gap-2 mt-4">
        <button className="btn-primary flex items-center gap-2" onClick={() => mutate()} disabled={isPending || !form.name}>
          <Trophy size={15} /> {isPending ? 'Creating…' : 'Create'}
        </button>
        <button className="btn-ghost" onClick={() => setShow(false)}>Cancel</button>
      </div>
    </div>
  );
}

export default function Tournaments() {
  const { isAdmin } = useAdmin();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentsApi.list(),
    staleTime: 2 * 60_000,
  });

  const noApiKey = error?.response?.status === 503 || error?.message?.includes('not configured');

  return (
    <>
      <SeoHead title="CODM Tournaments" description="Live and upcoming Call of Duty: Mobile tournaments." />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={22} className="text-cod-accent" />
          <h1 className="text-2xl font-bold">CODM Tournaments</h1>
        </div>
        <p className="text-cod-muted text-sm mb-6">
          Register with your CODM UID. Expand a tournament to view matches, report results and launch CODM.
        </p>

        {isAdmin && <CreateTournamentForm />}
        {isLoading && <Spinner />}

        {noApiKey && (
          <div className="card border-cod-accent/30 text-center py-8">
            <Trophy size={32} className="text-cod-accent mx-auto mb-3" />
            <p className="font-semibold text-white mb-2">Challonge API key not configured</p>
            <p className="text-cod-muted text-sm mb-3">
              Get your free key at{' '}
              <a href="https://challonge.com/settings/developer" target="_blank" rel="noopener noreferrer" className="text-cod-accent hover:underline">challonge.com/settings/developer</a>
            </p>
            <code className="text-xs bg-cod-surface px-2 py-1 rounded">CHALLONGE_API_KEY=your_key</code>
          </div>
        )}

        {isError && !noApiKey && <p className="text-cod-red text-sm text-center py-8">Failed to load tournaments.</p>}

        {data && data.data.length === 0 && !isAdmin && (
          <EmptyState title="No tournaments yet" description="Check back soon for upcoming CODM tournaments." />
        )}

        {data && data.data.length > 0 && (
          <div className="flex flex-col gap-3">
            {data.data.map(t => <TournamentCard key={t.id} t={t} />)}
          </div>
        )}
      </div>
    </>
  );
}
