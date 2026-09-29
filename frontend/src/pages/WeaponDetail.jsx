import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Swords } from 'lucide-react';
import { weaponsApi } from '../lib/api';
import { Spinner, StatBar, SeoHead } from '../components/ui';

const PLAYSTYLE_COLOR = {
  aggressive: 'text-cod-red',
  balanced: 'text-cod-accent',
  passive: 'text-cod-blue',
  sniper: 'text-cod-green',
};

export default function WeaponDetail() {
  const { slug } = useParams();
  const { data: weapon, isLoading, isError } = useQuery({
    queryKey: ['weapon', slug],
    queryFn: () => weaponsApi.get(slug),
  });

  if (isLoading) return <Spinner />;
  if (isError || !weapon) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-cod-red mb-4">Weapon not found.</p>
      <Link to="/weapons" className="btn-ghost">← Back to Weapons</Link>
    </div>
  );

  const stats = [
    { label: 'Damage', value: weapon.base_damage },
    { label: 'Fire Rate', value: weapon.fire_rate },
    { label: 'Range', value: weapon.range },
    { label: 'Mobility', value: weapon.mobility },
    { label: 'Control', value: weapon.control },
  ].filter(s => s.value != null);

  return (
    <>
      <SeoHead title={weapon.name} description={weapon.description || `${weapon.name} stats and loadouts in CODM.`} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/weapons" className="inline-flex items-center gap-1.5 text-cod-muted hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Weapons
        </Link>

        <div className="card mb-6">
          <div className="flex items-start gap-4 flex-wrap">
            {weapon.image_url
              ? <img src={weapon.image_url} alt={weapon.name} className="w-24 h-24 object-contain rounded-xl bg-cod-surface border border-cod-border shrink-0" />
              : <div className="w-24 h-24 rounded-xl bg-cod-surface border border-cod-border flex items-center justify-center shrink-0"><Swords size={32} className="text-cod-muted" /></div>
            }
            <div>
              <h1 className="text-2xl font-bold">{weapon.name}</h1>
              <span className="badge-info mt-1">{weapon.category}</span>
            </div>
          </div>
          {weapon.description && <p className="text-cod-muted mt-3 text-sm">{weapon.description}</p>}

          {stats.length > 0 && (
            <div className="mt-5 flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-cod-muted uppercase tracking-wider">Base Stats</h2>
              {stats.map(s => <StatBar key={s.label} label={s.label} value={s.value} />)}
            </div>
          )}
        </div>

        {weapon.loadouts?.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3">Recommended Loadouts</h2>
            <div className="flex flex-col gap-4">
              {weapon.loadouts.map(l => (
                <div key={l.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{l.title}</h3>
                    <span className={`text-xs font-semibold uppercase ${PLAYSTYLE_COLOR[l.playstyle] || 'text-cod-muted'}`}>
                      {l.playstyle}
                    </span>
                  </div>
                  {l.description && <p className="text-cod-muted text-sm mb-3">{l.description}</p>}
                  {l.attachments?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-cod-muted uppercase tracking-wider mb-2">Attachments</p>
                      <div className="flex flex-wrap gap-2">
                        {l.attachments.map((a, i) => (
                          <span key={i} className="bg-cod-surface border border-cod-border text-white text-xs px-2 py-1 rounded-lg">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {l.perks?.length > 0 && (
                    <div>
                      <p className="text-xs text-cod-muted uppercase tracking-wider mb-2">Perks</p>
                      <div className="flex flex-wrap gap-2">
                        {l.perks.map((p, i) => (
                          <span key={i} className="bg-cod-accent/10 border border-cod-accent/30 text-cod-accent text-xs px-2 py-1 rounded-lg">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {weapon.loadouts?.length === 0 && (
          <div className="card text-center py-8 text-cod-muted text-sm">
            No loadouts added yet for this weapon.
          </div>
        )}
      </div>
    </>
  );
}
