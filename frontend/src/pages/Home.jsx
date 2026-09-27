import { Link } from 'react-router-dom';
import { Crosshair, Tag, Swords, Sliders, Layout, BookOpen, User, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { codesApi, weaponsApi, tipsApi } from '../lib/api';
import { SeoHead } from '../components/ui';

const FEATURES = [
  {
    to: '/codes', icon: <Tag size={22} />, title: 'Redeem Codes',
    desc: 'Active & expired codes with rewards, platforms and seasons.',
    img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80',
  },
  {
    to: '/weapons', icon: <Swords size={22} />, title: 'Weapon Database',
    desc: 'Stats, recommended loadouts and attachment guides.',
    img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80',
  },
  {
    to: '/sensitivity', icon: <Sliders size={22} />, title: 'Sensitivity',
    desc: 'Live calculator + presets for every playstyle and device.',
    img: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&q=80',
  },
  {
    to: '/hud', icon: <Layout size={22} />, title: 'HUD & Settings',
    desc: 'Visual HUD builder with phone mockup preview by playstyle.',
    img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80',
  },
  {
    to: '/guides', icon: <BookOpen size={22} />, title: 'Guides & Secrets',
    desc: 'Tips, Easter eggs, unlock guides and advanced strategies.',
    img: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=600&q=80',
  },
  {
    to: '/profile', icon: <User size={22} />, title: 'My Profile',
    desc: 'Look up real CODM stats by UID and save your sensitivity and HUD presets.',
    img: 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=600&q=80',
  },
  {
    to: '/tournaments', icon: <Trophy size={22} />, title: 'Tournaments',
    desc: 'Register for live CODM tournaments with your UID. Brackets powered by Challonge.',
    img: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=600&q=80',
  },
];

const BG_IMAGES = [
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80',
  'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&q=80',
  'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80',
  'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80',
];

function LiveStats() {
  const { data: codes }   = useQuery({ queryKey: ['codes-stat'],   queryFn: () => codesApi.list({ status: 'active', limit: 1 }),  staleTime: 60_000 });
  const { data: weapons } = useQuery({ queryKey: ['weapons-stat'], queryFn: () => weaponsApi.list({}),                            staleTime: 60_000 });
  const { data: guides }  = useQuery({ queryKey: ['guides-stat'],  queryFn: () => tipsApi.list({ limit: 1 }),                     staleTime: 60_000 });

  const stats = [
    { label: 'Active Codes', value: codes?.total   ?? '—' },
    { label: 'Weapons',      value: weapons?.length ?? '—' },
    { label: 'Guides',       value: guides?.total   ?? '—' },
  ];

  return (
    <div className="flex justify-center gap-10 mb-10">
      {stats.map(s => (
        <div key={s.label} className="text-center">
          <div className="text-3xl font-extrabold text-cod-accent">{s.value}</div>
          <div className="text-cod-muted text-xs mt-0.5 uppercase tracking-wider">{s.label}</div>
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
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">

        {/* Mosaic background */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-0.5 opacity-40">
          {BG_IMAGES.map((src, i) => (
            <div key={i} className="overflow-hidden">
              <img src={src} alt="" className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-[8s]" loading={i < 3 ? 'eager' : 'lazy'} />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-cod-bg/80 to-cod-bg" />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(245,166,35,0.03) 3px, rgba(245,166,35,0.03) 4px)' }} />

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <div className="flex justify-center mb-5">
            <div className="p-4 rounded-full border border-cod-accent/40 bg-cod-accent/10 backdrop-blur-sm">
              <Crosshair size={52} className="text-cod-accent drop-shadow-[0_0_20px_rgba(245,166,35,0.8)]" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 drop-shadow-2xl">
            COD<span className="text-cod-accent [text-shadow:0_0_30px_rgba(245,166,35,0.6)]">Vault</span>
          </h1>

          <p className="text-gray-300 text-lg md:text-xl max-w-xl mx-auto mb-3 leading-relaxed">
            The ultimate <span className="text-cod-accent font-semibold">Call of Duty: Mobile</span> resource hub.
          </p>
          <p className="text-cod-muted text-sm md:text-base mb-8">
            Codes · Loadouts · Sensitivity · HUD · Guides — all in one place.
          </p>

          <LiveStats />

          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/codes" className="btn-primary text-base px-7 py-3 shadow-[0_0_20px_rgba(245,166,35,0.4)] hover:shadow-[0_0_30px_rgba(245,166,35,0.6)]">
              Browse Codes
            </Link>
            <Link to="/weapons" className="btn-ghost text-base px-7 py-3 backdrop-blur-sm">
              Weapon Database
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cod-bg to-transparent" />
      </section>

      {/* ── FEATURE CARDS ── */}
      <section className="max-w-7xl mx-auto px-4 pb-16 -mt-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <Link key={f.to} to={f.to}
              className="group relative overflow-hidden rounded-2xl border border-cod-border hover:border-cod-accent/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(245,166,35,0.2)]">
              <div className="absolute inset-0">
                <img src={f.img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
              </div>
              <div className="relative z-10 p-5 pt-28">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-cod-accent group-hover:scale-110 transition-transform inline-block">{f.icon}</span>
                  <h2 className="font-bold text-white text-base">{f.title}</h2>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                <span className="mt-3 inline-block text-cod-accent text-xs font-semibold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
