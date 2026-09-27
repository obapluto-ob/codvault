import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { weaponsApi } from '../lib/api';
import { Spinner, EmptyState, FilterBar, StatBar, SeoHead } from '../components/ui';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'Assault Rifle', label: 'AR' },
  { value: 'SMG', label: 'SMG' },
  { value: 'Sniper', label: 'Sniper' },
  { value: 'LMG', label: 'LMG' },
  { value: 'Shotgun', label: 'Shotgun' },
  { value: 'Marksman', label: 'Marksman' },
  { value: 'Pistol', label: 'Pistol' },
  { value: 'Launcher', label: 'Launcher' },
];

export default function Weapons() {
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');

  const { data: weapons, isLoading, isError } = useQuery({
    queryKey: ['weapons', category, q],
    queryFn: () => weaponsApi.list({ category: category || undefined, q: q || undefined }),
  });

  return (
    <>
      <SeoHead title="Weapon Database" description="Call of Duty: Mobile weapon stats, categories and recommended loadouts." />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Weapon Database</h1>
        <p className="text-cod-muted text-sm mb-6">Browse all CODM weapons with stats and loadout recommendations.</p>

        <div className="flex flex-col gap-3 mb-6">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cod-muted pointer-events-none" />
            <input className="input pl-8" placeholder="Search weapons…"
              value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <FilterBar filters={CATEGORIES} active={category} onChange={setCategory} />
        </div>

        {isLoading && <Spinner />}
        {isError && <p className="text-cod-red text-sm text-center py-8">Failed to load weapons.</p>}

        {weapons && weapons.length === 0 && (
          <EmptyState title="No weapons found" description="Try a different category or search term." />
        )}

        {weapons && weapons.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {weapons.map(w => (
              <Link key={w.id} to={`/weapons/${w.slug}`}
                className="card hover:border-cod-accent/50 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-bold text-white group-hover:text-cod-accent transition-colors">{w.name}</h2>
                    <span className="badge-info mt-1">{w.category}</span>
                  </div>
                </div>
                {w.description && <p className="text-cod-muted text-xs mb-3 line-clamp-2">{w.description}</p>}
                {(w.base_damage || w.fire_rate || w.range) && (
                  <div className="flex flex-col gap-2 mt-2">
                    {w.base_damage != null && <StatBar label="Damage" value={w.base_damage} />}
                    {w.fire_rate != null && <StatBar label="Fire Rate" value={w.fire_rate} />}
                    {w.range != null && <StatBar label="Range" value={w.range} />}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
