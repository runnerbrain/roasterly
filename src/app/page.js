'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function fmtSecs(secs) {
  if (secs == null || secs === '') return '—';
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function fmtTemp(val) {
  return val != null ? `${Math.round(val)}°` : '—';
}

function fmtWeight(val, unit = 'g') {
  return val != null ? `${val}${unit}` : '—';
}

function getSeason(isoDate) {
  if (!isoDate) return null;
  const month = new Date(isoDate).getMonth() + 1;
  if ([12, 1, 2].includes(month))  return 'Winter';
  if ([3, 4, 5].includes(month))   return 'Spring';
  if ([6, 7, 8].includes(month))   return 'Summer';
  if ([9, 10, 11].includes(month)) return 'Fall';
  return null;
}

function unique(arr) {
  return [...new Set(arr.filter(Boolean))].sort();
}

// ── Stat ───────────────────────────────────────────────────────────────────

function Stat({ label, value, em, className }) {
  return (
    <div className={['stat', className].filter(Boolean).join(' ')}>
      <span className="stat-label">{label}</span>
      <span className={`stat-value${em ? ' em' : ''}`}>{value}</span>
    </div>
  );
}

// ── Card (no notes) ────────────────────────────────────────────────────────

function RoastCard({ roast, onClick }) {
  const c = roast.computed || {};
  const weightLoss = roast.weightLoss != null
    ? `${roast.weightLoss}%`
    : roast.weightIn && roast.weightOut
      ? `${(((roast.weightIn - roast.weightOut) / roast.weightIn) * 100).toFixed(1)}%`
      : '—';

  return (
    <article className="roast-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="card-header">
        <h2 className="card-title">{roast.title || 'Untitled'}</h2>
        <div className="card-meta">
          <span>{fmtDate(roast.roastDate)}</span>
          {roast.roastTime && <><span className="dot">·</span><span>{roast.roastTime}</span></>}
        </div>
      </div>

      <div className="card-stats">
        {/* Row 1 */}
        <Stat label="Drop BT"      value={fmtTemp(c.dropBT)} />
        <Stat label="Charge BT"    value={fmtTemp(c.chargeBT)} />
        <Stat label="Roast Time"   value={fmtSecs(c.totalRoastTime)} />

        {/* Row 2 */}
        <Stat label="Weight In"    value={fmtWeight(roast.weightIn)} />
        <Stat label="Ambient Temp" value={roast.ambientTemp != null ? fmtTemp(roast.ambientTemp) : '—'} />
        <Stat label="Humidity"     value={roast.ambientHumidity != null ? `${roast.ambientHumidity}%` : '—'} />

        {/* Row 3 */}
        <Stat label="TP Time/BT"   value={`${fmtSecs(c.tpTime)} @ ${fmtTemp(c.tpBT)}`} />
        <Stat label="Dry Time/BT"  value={`${fmtSecs(c.dryTime)} @ ${fmtTemp(c.dryBT)}`} />
        <Stat label="1C Start Time/BT" value={`${fmtSecs(c.firstCrackTime)} @ ${fmtTemp(c.firstCrackBT)}`} />

        {/* Row 4 */}
        <Stat label="1C End Time/BT" value={`${fmtSecs(c.fcEndTime)} @ ${fmtTemp(c.fcEndBT)}`} />
      </div>
    </article>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────

function RoastModal({ roast, onClose }) {
  const c = roast.computed || {};
  const weightLoss = roast.weightLoss != null
    ? `${roast.weightLoss}%`
    : roast.weightIn && roast.weightOut
      ? `${(((roast.weightIn - roast.weightOut) / roast.weightIn) * 100).toFixed(1)}%`
      : '—';

  // Close on Escape
  useEffect(() => {
    const handler = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="modal-header">
          <h2 className="modal-title">{roast.title || 'Untitled'}</h2>
          <div className="card-meta">
            <span>{fmtDate(roast.roastDate)}</span>
            {roast.roastTime && <><span className="dot">·</span><span>{roast.roastTime}</span></>}
          </div>
          {roast.beans && <span className="card-beans">{roast.beans}</span>}
        </div>

        <div className="modal-section-label">Roast Stats</div>
        <div className="modal-stats">
          <Stat label="Weight In"    value={fmtWeight(roast.weightIn)} />
          <Stat label="Weight Out"   value={fmtWeight(roast.weightOut)} />
          <Stat label="Loss"         value={weightLoss} em />
          <Stat label="Roast Time"   value={fmtSecs(c.totalRoastTime)} />
          <Stat label="Charge BT"    value={fmtTemp(c.chargeBT)} />
          <Stat label="Charge ET"    value={fmtTemp(c.chargeET)} />
          <Stat label="TP Time/BT"   value={`${fmtSecs(c.tpTime)} @ ${fmtTemp(c.tpBT)}`} />
          <Stat label="TP ET"        value={fmtTemp(c.tpET)} />
          <Stat label="Dry Time/BT"  value={`${fmtSecs(c.dryTime)} @ ${fmtTemp(c.dryBT)}`} />
          <Stat label="Dry ET"       value={fmtTemp(c.dryET)} />
          <Stat label="1C Time/BT"   value={`${fmtSecs(c.firstCrackTime)} @ ${fmtTemp(c.firstCrackBT)}`} />
          <Stat label="Drop Time/BT" value={`${fmtSecs(c.dropTime)} @ ${fmtTemp(c.dropBT)}`} />
          <Stat label="Drop ET"      value={fmtTemp(c.dropET)} />
          <Stat label="Ambient Temp" value={roast.ambientTemp     != null ? fmtTemp(roast.ambientTemp)  : '—'} />
          <Stat label="Humidity"     value={roast.ambientHumidity != null ? `${roast.ambientHumidity}%` : '—'} />
        </div>

        <div className="modal-section-label">Rate of Rise (°/min)</div>
        <div className="modal-stats">
          <Stat label="Dry Phase"    value={c.dryPhaseRoR    != null ? `${c.dryPhaseRoR.toFixed(1)}°/m`    : '—'} />
          <Stat label="Mid Phase"    value={c.midPhaseRoR    != null ? `${c.midPhaseRoR.toFixed(1)}°/m`    : '—'} />
          <Stat label="Finish Phase" value={c.finishPhaseRoR != null ? `${c.finishPhaseRoR.toFixed(1)}°/m` : '—'} />
          <Stat label="Total RoR"    value={c.totalRoR       != null ? `${c.totalRoR.toFixed(1)}°/m`       : '—'} em />
        </div>

        {roast.roastingNotes?.trim() && (
          <>
            <div className="modal-section-label">Roasting Notes</div>
            <p className="modal-notes">{roast.roastingNotes}</p>
          </>
        )}

        <div className="modal-section-label">Cupping Notes</div>
        <p className={`modal-notes${roast.cuppingNotes?.trim() ? '' : ' empty'}`}>
          {roast.cuppingNotes?.trim() || 'No cupping notes yet'}
        </p>
      </div>
    </div>
  );
}

// ── Filter Bar ─────────────────────────────────────────────────────────────

function FilterBar({ roasts, filters, setFilters }) {
  const originOptions = useMemo(() => unique(roasts.map(r => r.title)), [roasts]);

  const afterOrigin = useMemo(() =>
    filters.origin ? roasts.filter(r => r.title === filters.origin) : roasts,
    [roasts, filters.origin]
  );
  const regionOptions = useMemo(() => unique(afterOrigin.map(r => r.beans)), [afterOrigin]);

  const afterRegion = useMemo(() =>
    filters.region ? afterOrigin.filter(r => r.beans === filters.region) : afterOrigin,
    [afterOrigin, filters.region]
  );
  const seasonOptions = useMemo(() =>
    unique(afterRegion.map(r => getSeason(r.roastDate))),
    [afterRegion]
  );

  const hasFilters = filters.origin || filters.region || filters.season;

  return (
    <div className="filters-bar">
      <div className="filter-group">
        <label htmlFor="filter-origin">Origin</label>
        <select id="filter-origin" value={filters.origin}
          onChange={e => setFilters({ origin: e.target.value, region: '', season: '' })}>
          <option value="">All</option>
          {originOptions.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <span className="filter-divider">›</span>

      <div className="filter-group">
        <label htmlFor="filter-region">Region</label>
        <select id="filter-region" value={filters.region}
          onChange={e => setFilters(f => ({ ...f, region: e.target.value, season: '' }))}
          disabled={!filters.origin && regionOptions.length === 0}>
          <option value="">All</option>
          {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <span className="filter-divider">›</span>

      <div className="filter-group">
        <label htmlFor="filter-season">Season</label>
        <select id="filter-season" value={filters.season}
          onChange={e => setFilters(f => ({ ...f, season: e.target.value }))}
          disabled={seasonOptions.length === 0}>
          <option value="">All</option>
          {seasonOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {hasFilters && (
        <button className="btn-clear"
          onClick={() => setFilters({ origin: '', region: '', season: '' })}>
          Clear filters
        </button>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

import Header from '@/components/Header';

export default function DashboardPage() {
  const [roasts,   setRoasts]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filters,  setFilters]  = useState({ origin: '', region: '', season: '' });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch('/api/roasts')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { setRoasts(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return roasts.filter(r => {
      if (filters.origin && r.title !== filters.origin)               return false;
      if (filters.region && r.beans !== filters.region)               return false;
      if (filters.season && getSeason(r.roastDate) !== filters.season) return false;
      return true;
    });
  }, [roasts, filters]);

  const handleClose = useCallback(() => setSelected(null), []);

  return (
    <div className="page-wrapper">
      <Header />

      {!loading && !error && (
        <>
          <FilterBar roasts={roasts} filters={filters} setFilters={setFilters} />
          <div className="results-count" style={{ marginTop: '-14px', marginBottom: '20px' }}>
            {filtered.length} of {roasts.length} roast{roasts.length !== 1 ? 's' : ''}
          </div>
        </>
      )}

      {loading && (
        <div className="state-msg"><strong>Loading…</strong>Fetching your roast profiles</div>
      )}
      {error && (
        <div className="state-msg"><strong>Could not load roasts</strong>{error}</div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="state-msg">
          <strong>No roasts match your filters</strong>
          Try adjusting or clearing the filters above
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="roast-grid">
          {filtered.map(r => (
            <RoastCard key={r._id} roast={r} onClick={() => setSelected(r)} />
          ))}
        </div>
      )}

      {selected && <RoastModal roast={selected} onClose={handleClose} />}
    </div>
  );
}
