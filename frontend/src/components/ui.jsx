export function StatBar({ label, value, max = 100 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-cod-muted">{label}</span>
        <span className="text-white font-medium">{value}</span>
      </div>
      <div className="h-1.5 bg-cod-border rounded-full overflow-hidden">
        <div className="stat-bar-fill h-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Spinner({ size = 20 }) {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="border-2 border-cod-border border-t-cod-accent rounded-full animate-spin"
        style={{ width: size, height: size }} />
    </div>
  );
}

export function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      {icon && <div className="text-cod-muted opacity-40 text-5xl">{icon}</div>}
      <p className="text-white font-semibold text-lg">{title}</p>
      {description && <p className="text-cod-muted text-sm max-w-xs">{description}</p>}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Prev
      </button>
      <span className="text-cod-muted text-sm">{page} / {pages}</span>
      <button className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next →
      </button>
    </div>
  );
}

export function SeoHead({ title, description }) {
  const full = title ? `${title} | CODVault` : 'CODVault – Call of Duty: Mobile Hub';
  return (
    <>
      <title>{full}</title>
      <meta name="description" content={description || 'The ultimate Call of Duty: Mobile resource — redeem codes, weapon loadouts, sensitivity settings, guides and more.'} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={description || ''} />
    </>
  );
}

export function FilterBar({ filters, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(f => (
        <button key={f.value}
          onClick={() => onChange(f.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${active === f.value ? 'bg-cod-accent text-black' : 'bg-cod-card border border-cod-border text-cod-muted hover:text-white'}`}>
          {f.label}
        </button>
      ))}
    </div>
  );
}
