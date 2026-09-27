import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { tipsApi } from '../lib/api';
import { Spinner, EmptyState, FilterBar, Pagination, SeoHead } from '../components/ui';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'tips', label: 'Tips' },
  { value: 'secrets', label: 'Secrets' },
  { value: 'easter-eggs', label: 'Easter Eggs' },
  { value: 'unlock-guides', label: 'Unlock Guides' },
  { value: 'strategy', label: 'Strategy' },
];
const DIFFICULTIES = [
  { value: '', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const DIFF_COLOR = { beginner: 'text-cod-green', intermediate: 'text-cod-accent', advanced: 'text-cod-red' };

export default function Guides() {
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tips', category, difficulty, q, page],
    queryFn: () => tipsApi.list({
      category: category || undefined,
      difficulty: difficulty || undefined,
      q: q || undefined,
      page, limit: 20,
    }),
    keepPreviousData: true,
  });

  return (
    <>
      <SeoHead title="Guides & Secrets" description="CODM tips, secrets, Easter eggs, unlock guides and advanced strategies." />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Guides & Secrets</h1>
        <p className="text-cod-muted text-sm mb-6">Tips, Easter eggs, unlock guides and advanced strategies.</p>

        <div className="flex flex-col gap-3 mb-6">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cod-muted pointer-events-none" />
            <input className="input pl-8" placeholder="Search guides…"
              value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
          </div>
          <FilterBar filters={CATEGORIES} active={category} onChange={v => { setCategory(v); setPage(1); }} />
          <FilterBar filters={DIFFICULTIES} active={difficulty} onChange={v => { setDifficulty(v); setPage(1); }} />
        </div>

        {isLoading && <Spinner />}
        {isError && <p className="text-cod-red text-sm text-center py-8">Failed to load guides.</p>}

        {data && data.data.length === 0 && (
          <EmptyState title="No guides found" description="Try different filters or check back later." />
        )}

        {data && data.data.length > 0 && (
          <>
            <div className="flex flex-col gap-3">
              {data.data.map(tip => (
                <Link key={tip.id} to={`/guides/${tip.slug}`}
                  className="card hover:border-cod-accent/50 transition-all group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold group-hover:text-cod-accent transition-colors truncate">{tip.title}</h2>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className="badge-info">{tip.category}</span>
                        <span className={`text-xs font-semibold ${DIFF_COLOR[tip.difficulty] || 'text-cod-muted'}`}>
                          {tip.difficulty}
                        </span>
                        {tip.tags?.map(tag => (
                          <span key={tag} className="text-xs text-cod-muted">#{tag}</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-cod-muted text-xs shrink-0 mt-1">
                      {new Date(tip.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <Pagination page={data.page} pages={data.pages} onChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
