import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Users, Calendar, ExternalLink, ChevronDown, ChevronUp, UserPlus, Trash2, Play, Flag, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { tournamentsApi, codmPlayerApi } from '../lib/api';
import { useAdmin } from '../lib/adminContext';
import { Spinner, SeoHead, EmptyState } from '../components/ui';

function PlayerPreview({ uid }) {
  const [debouncedUid, setDebouncedUid] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUid(uid.trim()), 700);
    return () => clearTimeout(t);
  }, [uid]);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['codm-player', debouncedUid],
    queryFn: () => codmPlayerApi.lookup(debouncedUid),
    enabled: debouncedUid.length >= 4,
    retry: false,
    staleTime: 5 * 60_000,
  });

  if (!debouncedUid || debouncedUid.length < 4) return null;
  if (isFetching) return (
    <div className="flex items-center gap-2 text-cod-muted text-xs mt-2">
      <Loader size={12} className="animate-spin" /> Verifying UID…
    </div>
  );
  if (isError || !data?.nickname) return (
    <div className="flex items-center gap-2 text-cod-red text-xs mt-2">
      <AlertCircle size={12} /> UID not found — double-check your CODM UID
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

function RegisterForm({ tournamentId, challongeUrl }) {
  const qc = useQueryClient();
  const [uid, setUid] = useState('');
  const [done, setDone] = useState(null); // stores { player, participant }

  // lookup for the verified player name
  const [debouncedUid, setDebouncedUid] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedUid(uid.trim()), 700);
    return () => clearTimeout(t);
  }, [uid]);

  const { data: player } = useQuery({
    queryKey: ['codm-player', debouncedUid],
    queryFn: () => codmPlayerApi.lookup(debouncedUid),
    enabled: debouncedUid.length >= 4,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: () => tournamentsApi.register(tournamentId, {
      name: player?.nickname || uid,
      codm_uid: uid,
    }),
    onSuccess: (res) => {
      setDone({ player, participant: res.participant });
      qc.invalidateQueries(['tournament', tournamentId]);
    },
  });

  if (done) return (
    <div className="mt-4 border-t border-cod-border pt-4">
      <div className="bg-cod-green/10 border border-cod-green/30 rounded-xl p-4 flex flex-col items-center gap-3 text-center">
        <CheckCircle size={28} className="text-cod-green" />
        <div>
          <p className="text-white font-bold text-base">{done.player?.nickname || done.participant?.name}</p>
          {done.player?.rankLabel && (
            <p className="text-cod-muted text-xs mt-0.5">{done.player.rank?.label || 'Unranked'} · Lv.{done.player.level}</p>
          )}
          <p className="text-cod-green text-sm font-semibold mt-1">Successfully registered!</p>
        </div>
        {challongeUrl && (
          <a href={challongeUrl} target="_blank" rel="noopener noreferrer"
            className="btn-ghost text-xs flex items-center gap-1.5 py-1.5 px-3">
            <ExternalLink size={12} /> View bracket on Challonge
          </a>
        )}
      </div>
    </div>
  );

  const canSubmit = uid.trim().length >= 4 && player?.nickname;

  return (
    <div className="mt-4 border-t border-cod-border pt-4">
      <p className="text-xs text-cod-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <UserPlus size={12} /> Register
      </p>
      <input className="input font-mono w-full" placeholder="Enter your CODM UID *" value={uid} onChange={e => setUid(e.target.value)} />
      <PlayerPreview uid={uid} />
      {isError && <p className="text-cod-red text-xs mt-2">{error?.response?.data?.error || 'Registration failed.'}</p>}
      <button className="btn-primary mt-3 text-sm flex items-center gap-2"
        onClick={() => mutate()} disabled={isPending || !canSubmit}>
        <UserPlus size={14} /> {isPending ? 'Registering…' : canSubmit ? `Register as ${player.nickname}` : 'Verify UID first'}
      </button>
      <p className="text-cod-muted text-xs mt-2">Your in-game name is pulled automatically from your UID.</p>
    </div>
  );
}

function ParticipantRow({ p, isAdmin, onRemove }) {
  const uid = p.misc || p.name?.match(/\[(.+)\]$/)?.[1] || null;
  const displayName = p.name?.replace(/\s*\[.+\]$/, '') || p.name;

  const { data: player, isFetching, isError } = useQuery({
    queryKey: ['codm-player', uid],
    queryFn: () => codmPlayerApi.lookup(uid),
    enabled: !!uid,
    retry: false,
    staleTime: 10 * 60_000,
  });

  const unverified = !uid || (!isFetching && (isError || !player?.nickname));

  return (
    <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
      unverified ? 'bg-cod-red/10 border border-cod-red/30' : 'bg-cod-surface'
    }`}>
      {player?.rank?.imageUrl
        ? <img src={player.rank.imageUrl} alt={player.rank.label} className="w-7 h-7 object-contain shrink-0" />
        : <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${
            unverified ? 'bg-cod-red/20' : 'bg-cod-border'
          }`}>
            {unverified && <AlertCircle size={14} className="text-cod-red" />}
          </div>}
      <div className="flex-1 min-w-0">
        <span className="text-white text-sm font-medium truncate block">{player?.nickname || displayName}</span>
        <span className={`text-xs ${ unverified ? 'text-cod-red' : 'text-cod-muted' }`}>
          {isFetching ? 'Verifying…'
            : unverified ? (uid ? 'UID not found — unverified' : 'No UID — unverified')
            : `${player.rank?.label || 'Unranked'} · Lv.${player.level}`}
        </span>
      </div>
      {p.final_rank && <span className="badge-info shrink-0">#{p.final_rank}</span>}
      {isAdmin && (
        <button onClick={onRemove} className="text-cod-red hover:text-red-400 p-1 shrink-0" title="Remove">
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

function TournamentCard({ t }) {
  const { isAdmin, token } = useAdmin();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);

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
    mutationFn: (pid) => tournamentsApi.removeParticipant(t.url || t.id, pid, token),
    onSuccess: () => qc.invalidateQueries(['tournament', t.id]),
  });

  const startTournament = useMutation({
    mutationFn: () => tournamentsApi.start(t.url || t.id, token),
    onSuccess: () => qc.invalidateQueries(['tournaments']),
  });

  const finalize = useMutation({
    mutationFn: () => tournamentsApi.finalize(t.url || t.id, token),
    onSuccess: () => qc.invalidateQueries(['tournaments']),
  });

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
              ● {t.state}
            </span>
            <span className="badge-info capitalize">{t.tournament_type?.replace('_', ' ')}</span>
            {t.participants_count != null && (
              <span className="flex items-center gap-1 text-xs text-cod-muted">
                <Users size={11} /> {t.participants_count}/{t.game_on_two_fields ? '' : t.signup_cap || '∞'}
              </span>
            )}
            {start && <span className="flex items-center gap-1 text-xs text-cod-muted"><Calendar size={11} /> {start}</span>}
            {isOpen && <span className="text-xs text-cod-green font-semibold">● Open</span>}
          </div>
          {t.game_name && <p className="text-cod-muted text-xs mt-0.5">{t.game_name}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {t.full_challonge_url && (
            <a href={t.full_challonge_url} target="_blank" rel="noopener noreferrer"
              className="text-cod-muted hover:text-cod-accent transition-colors p-1">
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
          {/* Admin controls */}
          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-cod-border flex gap-2 flex-wrap">
              {['pending', 'checking_in', 'awaiting_review'].includes(t.state) && (
                <button onClick={() => startTournament.mutate()} disabled={startTournament.isPending}
                  className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3">
                  <Play size={12} /> {startTournament.isPending ? 'Starting…' : 'Start Tournament'}
                </button>
              )}
              {t.state === 'underway' && (
                <button onClick={() => finalize.mutate()} disabled={finalize.isPending}
                  className="btn-ghost text-xs flex items-center gap-1.5 py-1.5 px-3">
                  <Flag size={12} /> {finalize.isPending ? 'Finalizing…' : 'Finalize'}
                </button>
              )}
            </div>
          )}

          {/* Participants */}
          {participants.length > 0 && (
            <div className="mt-4 pt-4 border-t border-cod-border">
              <p className="text-xs text-cod-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Users size={12} /> Participants ({participants.length})
              </p>
              <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
                {participants.map(p => (
                  <ParticipantRow key={p.id} p={p} isAdmin={isAdmin} onRemove={() => remove.mutate(p.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Registration */}
          {isOpen && <RegisterForm tournamentId={tid} challongeUrl={t.full_challonge_url} />}
          {!isOpen && t.state !== 'complete' && (
            <p className="text-cod-muted text-xs mt-4 pt-4 border-t border-cod-border text-center">
              Registrations are closed for this tournament.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function CreateTournamentForm() {
  const { token } = useAdmin();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', tournament_type: 'single elimination', description: '' });
  const [show, setShow] = useState(false);

  const { mutate, isPending, isError, error, isSuccess } = useMutation({
    mutationFn: () => tournamentsApi.create(form, token),
    onSuccess: () => { qc.invalidateQueries(['tournaments']); setShow(false); setForm({ name: '', tournament_type: 'single elimination', description: '' }); },
  });

  if (!show) return (
    <button onClick={() => setShow(true)} className="btn-primary flex items-center gap-2 text-sm mb-6">
      <Trophy size={15} /> Create Tournament
    </button>
  );

  return (
    <div className="card border-cod-accent/30 mb-6">
      <h2 className="font-bold mb-4">Create Tournament</h2>
      <div className="flex flex-col gap-3">
        <input className="input" placeholder="Tournament name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <select className="input" value={form.tournament_type} onChange={e => setForm(p => ({ ...p, tournament_type: e.target.value }))}>
          <option value="single elimination">Single Elimination</option>
          <option value="double elimination">Double Elimination</option>
          <option value="round robin">Round Robin</option>
          <option value="swiss">Swiss</option>
        </select>
        <textarea className="input resize-y min-h-[60px]" placeholder="Description (optional)"
          value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
      </div>
      {isError && <p className="text-cod-red text-sm mt-2">{error?.response?.data?.error || 'Failed to create.'}</p>}
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
          Register with your CODM UID. Click a tournament to expand and join.
        </p>

        {isAdmin && <CreateTournamentForm />}

        {isLoading && <Spinner />}

        {noApiKey && (
          <div className="card border-cod-accent/30 text-center py-8">
            <Trophy size={32} className="text-cod-accent mx-auto mb-3" />
            <p className="font-semibold text-white mb-2">Challonge API key not configured</p>
            <p className="text-cod-muted text-sm mb-3">
              Get your free key at{' '}
              <a href="https://challonge.com/settings/developer" target="_blank" rel="noopener noreferrer" className="text-cod-accent hover:underline">
                challonge.com/settings/developer
              </a>
            </p>
            <code className="text-xs bg-cod-surface px-2 py-1 rounded">CHALLONGE_API_KEY=your_key</code>
            <p className="text-cod-muted text-xs mt-1">in <code className="bg-cod-surface px-1 rounded">backend/.env</code>, then restart.</p>
          </div>
        )}

        {isError && !noApiKey && (
          <p className="text-cod-red text-sm text-center py-8">Failed to load tournaments.</p>
        )}

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
