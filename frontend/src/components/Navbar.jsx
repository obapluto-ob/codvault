import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Search, Shield, Crosshair, User, Trophy } from 'lucide-react';
import { searchApi } from '../lib/api';

const NAV_LINKS = [
  { to: '/codes', label: 'Redeem Codes' },
  { to: '/weapons', label: 'Weapons' },
  { to: '/sensitivity', label: 'Sensitivity' },
  { to: '/hud', label: 'HUD & Settings' },
  { to: '/guides', label: 'Guides' },
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/profile', label: 'My Profile' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (query.length < 2) { setResults(null); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { setResults(await searchApi.search(query)); }
      catch { setResults(null); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e) => { if (!searchRef.current?.contains(e.target)) setResults(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (path) => { setQuery(''); setResults(null); navigate(path); };

  return (
    <nav className="sticky top-0 z-50 bg-cod-surface/95 backdrop-blur border-b border-cod-border">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0 mr-2">
          <Crosshair className="text-cod-accent" size={22} />
          <span className="font-bold text-lg tracking-tight">COD<span className="text-cod-accent">Vault</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${location.pathname.startsWith(l.to) ? 'bg-cod-card text-cod-accent' : 'text-cod-muted hover:text-white hover:bg-cod-card'}`}>
              {l.label}
            </Link>
          ))}
        </div>

        <div ref={searchRef} className="relative flex-1 md:max-w-xs ml-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cod-muted pointer-events-none" />
          <input
            className="input pl-8 py-1.5 text-sm h-9"
            placeholder="Search codes, weapons…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {results && (
            <div className="absolute top-full mt-1 w-full bg-cod-card border border-cod-border rounded-xl shadow-2xl overflow-hidden z-50">
              {results.codes.length === 0 && results.weapons.length === 0 && results.tips.length === 0
                ? <p className="text-cod-muted text-sm p-3">No results for "{query}"</p>
                : <>
                  {results.codes.map(c => (
                    <button key={c.id} onClick={() => go('/codes')}
                      className="w-full text-left px-3 py-2 hover:bg-cod-surface text-sm flex items-center gap-2">
                      <span className="text-cod-accent font-mono text-xs">{c.code}</span>
                      <span className="text-cod-muted truncate">{c.reward}</span>
                    </button>
                  ))}
                  {results.weapons.map(w => (
                    <button key={w.id} onClick={() => go(`/weapons/${w.slug}`)}
                      className="w-full text-left px-3 py-2 hover:bg-cod-surface text-sm flex items-center gap-2">
                      <span className="text-white">{w.name}</span>
                      <span className="badge-info">{w.category}</span>
                    </button>
                  ))}
                  {results.tips.map(t => (
                    <button key={t.id} onClick={() => go(`/guides/${t.slug}`)}
                      className="w-full text-left px-3 py-2 hover:bg-cod-surface text-sm flex items-center gap-2">
                      <span className="text-white truncate">{t.title}</span>
                      <span className="badge-info shrink-0">{t.category}</span>
                    </button>
                  ))}
                </>
              }
            </div>
          )}
        </div>

        <Link to="/admin" className="hidden md:flex items-center gap-1.5 text-cod-muted hover:text-white transition-colors text-sm shrink-0">
          <Shield size={16} />
        </Link>

        <button className="md:hidden p-1.5 text-cod-muted hover:text-white" onClick={() => setOpen(o => !o)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-cod-border bg-cod-surface px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium ${location.pathname.startsWith(l.to) ? 'bg-cod-card text-cod-accent' : 'text-cod-muted'}`}>
              {l.label}
            </Link>
          ))}
          <Link to="/admin" className="px-3 py-2.5 rounded-lg text-sm font-medium text-cod-muted flex items-center gap-2">
            <Shield size={15} /> Admin
          </Link>
        </div>
      )}
    </nav>
  );
}
