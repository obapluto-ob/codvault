import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Check, Search, Flag, Plus, X, ExternalLink } from 'lucide-react';
import { codesApi } from '../lib/api';
import { Spinner, EmptyState, Pagination, FilterBar, SeoHead } from '../components/ui';

const STATUS_FILTERS = [
  { value: 'active', label: '✓ Active' },
  { value: 'expired', label: '✗ Expired' },
  { value: 'all', label: 'All' },
];
const PLATFORM_FILTERS = [
  { value: 'all', label: 'All Platforms' },
  { value: 'android', label: 'Android' },
  { value: 'ios', label: 'iOS' },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1.5 rounded-lg hover:bg-cod-surface transition-colors text-cod-muted hover:text-cod-accent" title="Copy code">
      {copied ? <Check size={15} className="text-cod-green" /> : <Copy size={15} />}
    </button>
  );
}

function ReportButton({ code }) {
  const qc = useQueryClient();
  const [reported, setReported] = useState(false);
  const { mutate } = useMutation({
    mutationFn: () => codesApi.report(code.id),
    onSuccess: () => { setReported(true); qc.invalidateQueries(['codes']); },
  });
  if (code.status === 'expired' || reported) return null;
  return (
    <button onClick={() => mutate()}
      className="p-1.5 rounded-lg hover:bg-cod-surface transition-colors text-cod-muted hover:text-cod-red" title="Report as expired">
      <Flag size={13} />
    </button>
  );
}

function SubmitForm({ onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ code: '', reward: '', platform: 'all', season: '', source: '' });
  const [done, setDone] = useState(false);

  const { mutate, isPending, isError } = useMutation({
    mutationFn: () => codesApi.submit(form),
    onSuccess: () => { setDone(true); qc.invalidateQueries(['codes']); },
  });

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  if (done) return (
    <div className="card border-cod-green/40 mb-6 text-center py-6">
      <p className="text-cod-green font-semibold mb-1">✓ Code submitted!</p>
      <p className="text-cod-muted text-sm">It will appear once an admin reviews it.</p>
      <button onClick={onClose} className="btn-ghost mt-3 text-sm">Close</button>
    </div>
  );

  return (
    <div className="card border-cod-accent/30 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold">Submit a Code</h2>
        <button onClick={onClose} className="text-cod-muted hover:text-white"><X size={16} /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-cod-muted uppercase tracking-wider">Code *</label>
          <input className="input font-mono uppercase" placeholder="CODM2025XYZ" value={form.code} onChange={f('code')} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-cod-muted uppercase tracking-wider">Reward *</label>
          <input className="input" placeholder="e.g. 500 Credits + Calling Card" value={form.reward} onChange={f('reward')} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-cod-muted uppercase tracking-wider">Platform</label>
          <select className="input" value={form.platform} onChange={f('platform')}>
            <option value="all">All</option>
            <option value="android">Android</option>
            <option value="ios">iOS</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-cod-muted uppercase tracking-wider">Season</label>
          <input className="input" placeholder="e.g. Season 3 2025" value={form.season} onChange={f('season')} />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs text-cod-muted uppercase tracking-wider">Source (where you found it)</label>
          <input className="input" placeholder="e.g. Official CODM Twitter, YouTube stream" value={form.source} onChange={f('source')} />
        </div>
      </div>
      {isError && <p className="text-cod-red text-sm mt-2">Submission failed. Code may already exist.</p>}
      <button className="btn-primary mt-4" onClick={() => mutate()} disabled={isPending || !form.code || !form.reward}>
        {isPending ? 'Submitting…' : 'Submit for Review'}
      </button>
    </div>
  );
}

export default function Codes() {
  const [status, setStatus] = useState('active');
  const [platform, setPlatform] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showSubmit, setShowSubmit] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['codes', status, platform, q, page],
    queryFn: () => codesApi.list({ status, platform, q: q || undefined, page, limit: 20 }),
    keepPreviousData: true,
  });

  const handleFilter = setter => val => { setter(val); setPage(1); };

  return (
    <>
      <SeoHead title="Redeem Codes" description="Community-submitted Call of Duty: Mobile redeem codes." />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-1 gap-3">
          <div>
            <h1 className="text-2xl font-bold">Redeem Codes</h1>
            <p className="text-cod-muted text-sm mt-0.5">Community-submitted codes, reviewed before going live.</p>
          </div>
          <button onClick={() => setShowSubmit(s => !s)} className="btn-primary flex items-center gap-2 shrink-0 text-sm">
            <Plus size={15} /> Submit Code
          </button>
        </div>

        {/* Where to find real codes */}
        <div className="mt-4 mb-6 p-3 rounded-xl bg-cod-surface border border-cod-border text-xs text-cod-muted flex flex-wrap gap-x-4 gap-y-1 items-center">
          <span className="text-white font-medium">Official sources:</span>
          {[
            ['Twitter/X', 'https://twitter.com/PlayCODMobile'],
            ['Facebook', 'https://facebook.com/CallofDutyMobile'],
            ['YouTube', 'https://youtube.com/@CallofDutyMobile'],
            ['Instagram', 'https://instagram.com/callofdutymobile'],
          ].map(([label, url]) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-cod-accent transition-colors">
              {label} <ExternalLink size={10} />
            </a>
          ))}
        </div>

        {showSubmit && <SubmitForm onClose={() => setShowSubmit(false)} />}

        <div className="flex flex-col gap-3 mb-6">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cod-muted pointer-events-none" />
            <input className="input pl-8" placeholder="Search codes or rewards…"
              value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
          </div>
          <FilterBar filters={STATUS_FILTERS} active={status} onChange={handleFilter(setStatus)} />
          <FilterBar filters={PLATFORM_FILTERS} active={platform} onChange={handleFilter(setPlatform)} />
        </div>

        {isLoading && <Spinner />}
        {isError && <p className="text-cod-red text-sm text-center py-8">Failed to load codes. Is the backend running?</p>}

        {data && (
          <>
            <p className="text-cod-muted text-xs mb-3">{data.total} code{data.total !== 1 ? 's' : ''} found</p>
            {data.data.length === 0
              ? <EmptyState
                  title="No codes right now"
                  description="No active codes at the moment. Check official CODM social media or submit one you found."
                />
              : (
                <div className="flex flex-col gap-2">
                  {data.data.map(code => (
                    <div key={code.id} className="card flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={code.status === 'active' ? 'badge-active' : 'badge-expired'}>
                          {code.status === 'active' ? '● Active' : '✗ Expired'}
                        </span>
                        <span className="font-mono font-bold text-white tracking-widest text-sm truncate">{code.code}</span>
                        <CopyButton text={code.code} />
                        <ReportButton code={code} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-cod-muted flex-1 min-w-0 truncate">{code.reward}</span>
                        {code.platform !== 'all' && <span className="badge-info">{code.platform}</span>}
                        {code.season && <span className="badge-info">{code.season}</span>}
                        {code.source && <span className="text-cod-muted text-xs truncate">via {code.source}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
            <Pagination page={data.page} pages={data.pages} onChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
