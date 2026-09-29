import { Link } from 'react-router-dom';
import { Crosshair, Tag, Swords, Sliders, BookOpen, User, Trophy, ChevronRight, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { weaponsApi, tipsApi, tournamentsApi } from '../lib/api';
import { SeoHead } from '../components/ui';

const FEATURES = [
  {
    to: '/weapons', icon: <Swords size={20} />, title: 'Weapon Database',
    desc: 'Stats and meta loadouts for every CODM weapon.',
    accent: '#f5a623',
    img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=700&q=80',
  },
  {
    to: '/sensitivity', icon: <Sliders size={20} />, title: 'Sensitivity Calculator',
    desc: 'Enter your FPS sens — all scopes auto-calculated.',
    accent: '#00e5ff',
    img: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=700&q=80',
  },
  {
    to: '/tournaments', icon: <Trophy size={20} />, title: 'Tournaments',
    desc: 'Register for live CODM tournaments with your UID.',
    accent: '#ff3c3c',
    img: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=700&q=80',
  },
  {
    to: '/profile', icon: <User size={20} />, title: 'Player Profile',
    desc: 'Real nickname, rank and level pulled from CODM.',
    accent: '#a855f7',
    img: 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=700&q=80',
  },
  {
    to: '/guides', icon: <BookOpen size={20} />, title: 'Guides & Secrets',
    desc: 'Tips, Easter eggs, unlock guides and strategies.',
    accent: '#22c55e',
    img: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=700&q=80',
  },
  {
    to: '/codes', icon: <Tag size={20} />, title: 'Redeem Codes',
    desc: 'Community-submitted codes reviewed before going live.',
    accent: '#f5a623',
    img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=700&q=80',
  },
];

function LiveStats() {
  const { data: weapons }     = useQuery({ queryKey: ['weapons-stat'],     queryFn: () => weaponsApi.list({}),        staleTime: 60_000 });
  const { data: guides }      = useQuery({ queryKey: ['guides-stat'],      queryFn: () => tipsApi.list({ limit: 1 }), staleTime: 60_000 });
  const { data: tournaments } = useQuery({ queryKey: ['tournaments-stat'], queryFn: () => tournamentsApi.list(),      staleTime: 60_000 });

  const liveTournaments = tournaments?.data?.filter(t => t.state === 'underway' || t.state === 'pending').length ?? '—';

  const stats = [
    { label: 'Weapons',     value: weapons?.length ?? '—' },
    { label: 'Guides',      value: guides?.total   ?? '—' },
    { label: 'Tournaments', value: liveTournaments },
  ];

  return (
    <div className="flex justify-center gap-8 sm:gap-14 mb-10">
      {stats.map((s, i) => (
        <div key={s.label} className="text-center relative">
          {i < stats.length - 1 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-7 h-8 w-px bg-cod-border hidden sm:block" />
          )}
          <div className="text-3xl sm:text-4xl font-extrabold text-cod-accent tabular-nums"
            style={{ textShadow: '0 0 20px rgba(245,166,35,0.5)' }}>
            {s.value}
          </div>
          <div className="text-cod-muted text-xs mt-1 uppercase tracking-widest">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SeoHead />

      {/* ── HERO ── */}
      <section className="relative min-h-[94vh] flex items-center justify-center overflow-hidden bg-black">

        {/* Base dark image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=85"
            alt=""
            className="w-full h-full object-cover opacity-25 scale-105"
            style={{ filter: 'saturate(0.4) brightness(0.6)' }}
          />
        </div>

        {/* Hex / grid overlay */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(245,166,35,0.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(245,166,35,0.6) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)',
          }}
        />

        {/* Vignette */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)' }}
        />

        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cod-accent to-transparent opacity-80" />

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cod-bg to-transparent" />

        {/* Corner decorations */}
        <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-cod-accent/60" />
        <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-cod-accent/60" />
        <div className="absolute bottom-10 left-6 w-8 h-8 border-b-2 border-l-2 border-cod-accent/40" />
        <div className="absolute bottom-10 right-6 w-8 h-8 border-b-2 border-r-2 border-cod-accent/40" />

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-cod-accent/40 bg-cod-accent/10 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-cod-green animate-pulse" />
            <span className="text-cod-accent text-xs font-bold uppercase tracking-widest">Call of Duty: Mobile Hub</span>
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-5">
            <div className="relative p-4 rounded-full border border-cod-accent/30 bg-black/40 backdrop-blur-sm"
              style={{ boxShadow: '0 0 40px rgba(245,166,35,0.3), inset 0 0 20px rgba(245,166,35,0.05)' }}>
              <Crosshair size={56} className="text-cod-accent"
                style={{ filter: 'drop-shadow(0 0 16px rgba(245,166,35,0.9))' }} />
            </div>
          </div>

          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-4 leading-none"
            style={{ textShadow: '0 2px 40px rgba(0,0,0,0.8)' }}>
            COD<span className="text-cod-accent"
              style={{ textShadow: '0 0 40px rgba(245,166,35,0.7), 0 0 80px rgba(245,166,35,0.3)' }}>Vault</span>
          </h1>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-cod-accent/60" />
            <Zap size={14} className="text-cod-accent" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-cod-accent/60" />
          </div>

          <p className="text-gray-300 text-lg md:text-xl max-w-xl mx-auto mb-2 leading-relaxed font-light">
            The ultimate <span className="text-cod-accent font-semibold">Call of Duty: Mobile</span> resource hub.
          </p>
          <p className="text-cod-muted text-sm mb-10 uppercase tracking-widest">
            Codes · Loadouts · Sensitivity · HUD · Guides
          </p>

          <LiveStats />

          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/weapons"
              className="btn-primary text-base px-8 py-3 flex items-center gap-2"
              style={{ boxShadow: '0 0 24px rgba(245,166,35,0.4)' }}>
              <Swords size={17} /> Weapon Database
            </Link>
            <Link to="/tournaments"
              className="btn-ghost text-base px-8 py-3 flex items-center gap-2 backdrop-blur-sm">
              <Trophy size={17} /> Join Tournament
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURE CARDS ── */}
      <section className="max-w-7xl mx-auto px-4 pb-20 pt-4 relative z-10">

        {/* Section header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-cod-border to-transparent" />
          <span className="text-cod-muted text-xs uppercase tracking-widest font-semibold">Arsenal</span>
          <div className="h-px flex-1 bg-gradient-to-l from-cod-border to-transparent" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <Link key={f.to} to={f.to}
              className="group relative overflow-hidden rounded-xl border border-cod-border bg-black
                hover:border-opacity-80 transition-all duration-300 hover:-translate-y-1"
              style={{ '--accent': f.accent }}
              onMouseEnter={e => e.currentTarget.style.borderColor = f.accent + '80'}
              onMouseLeave={e => e.currentTarget.style.borderColor = ''}>

              {/* Background image */}
              <div className="absolute inset-0">
                <img src={f.img} alt="" className="w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
              </div>

              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${f.accent}, transparent)` }} />

              {/* Corner bracket */}
              <div className="absolute top-3 right-3 w-4 h-4 border-t border-r opacity-40 group-hover:opacity-80 transition-opacity"
                style={{ borderColor: f.accent }} />

              <div className="relative z-10 p-5 pt-24">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="p-1.5 rounded-lg transition-colors"
                    style={{ color: f.accent, background: f.accent + '20' }}>
                    {f.icon}
                  </span>
                  <h2 className="font-bold text-white text-base">{f.title}</h2>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">{f.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: f.accent }}>
                  Explore <ChevronRight size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
