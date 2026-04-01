'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—';
  const [year, month, day] = iso.split('T')[0].split('-');
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
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

const fetcher = (url) => fetch(url).then((res) => {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
});

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

function RoastCard({ roast, beans, onClick }) {
  const c = roast.computed || {};
  const weightLoss = roast.weightLoss != null
    ? `${roast.weightLoss}%`
    : roast.weightIn && roast.weightOut
      ? `${(((roast.weightIn - roast.weightOut) / roast.weightIn) * 100).toFixed(1)}%`
      : '—';

      const linkedBean = roast.beanId ? beans.find(b => String(b._id) === String(roast.beanId)) : null;
      console.log('beanId:', roast.beanId, 'linkedBean:', linkedBean, 'beans:', beans.length);

  return (
    <article className="roast-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
          <h2 className="card-title">{roast.title || 'Untitled'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {linkedBean && linkedBean.process && (
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', background: '#c8702a', padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                {linkedBean.process}
              </span>
            )}
            {roast.weightIn && (
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                {fmtWeight(roast.weightIn)} in
              </span>
            )}
          </div>
        </div>
        <div className="card-meta">
          <span>{fmtDate(roast.roastDate)}</span>
          {roast.roastTime && <><span className="dot">·</span><span>{roast.roastTime}</span></>}
        </div>
      </div>

      <div className="card-stats">
        {/* Row 1 */}
        <Stat label="Charge BT"    value={fmtTemp(c.chargeBT)} />
        <Stat label="TP Time/BT"   value={`${fmtSecs(c.tpTime)} @ ${fmtTemp(c.tpBT)}`} />
        <Stat label="" value="" className="stat--detail" />

        {/* Row 2 */}
        <Stat label="Dry Time/BT"      value={`${fmtSecs(c.dryTime)} @ ${fmtTemp(c.dryBT)}`} />
        <Stat label="1C Start Time/BT" value={`${fmtSecs(c.firstCrackTime)} @ ${fmtTemp(c.firstCrackBT)}`} />
        <Stat label="Dry to 1C"        value={c.dryTime && c.firstCrackTime ? fmtSecs(c.firstCrackTime - c.dryTime) : '—'} />

        {/* Row 3 */}
        <Stat label="1C End Time/BT" value={`${fmtSecs(c.fcEndTime)} @ ${fmtTemp(c.fcEndBT)}`} />
        <Stat label="Drop Time/BT"   value={`${fmtSecs(c.dropTime)} @ ${fmtTemp(c.dropBT)}`} />
        <Stat label="1C End to Drop" value={c.fcEndTime && c.dropTime ? fmtSecs(c.dropTime - c.fcEndTime) : '—'} />

        {/* Row 4 */}
        <Stat label="Ambient Temp" value={roast.ambientTemp != null ? fmtTemp(roast.ambientTemp) : '—'} />
        <Stat label="Humidity"     value={roast.ambientHumidity != null ? `${roast.ambientHumidity}%` : '—'} />
        <Stat label="" value="" className="stat--detail" />
      </div>
    </article>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────

function RoastModal({ roast, beans, onClose, onUpdate }) {
  const c = roast.computed || {};
  const weightLoss = roast.weightLoss != null
    ? `${roast.weightLoss}%`
    : roast.weightIn && roast.weightOut
      ? `${(((roast.weightIn - roast.weightOut) / roast.weightIn) * 100).toFixed(1)}%`
      : '—';

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(roast.title || 'Untitled');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [selectedBeanId, setSelectedBeanId] = useState('');
  const [pendingDeleteIdx, setPendingDeleteIdx] = useState(null);
  const [editingNoteIdx, setEditingNoteIdx] = useState(null);
  const [editingNoteState, setEditingNoteState] = useState({});
  const [formState, setFormState] = useState({
    method: '',
    grindSize: '',
    grinder: '',
    waterTemp: '',
    ratio: '',
    taste: '',
    tasteRating: ''
  });

const linkedBean = roast.beanId ? beans.find(b => String(b._id) === String(roast.beanId)) : null;

  const handleLinkBean = async () => {
    if (!selectedBeanId) return;
    setIsLinking(true);
    try {
      const targetBean = beans.find(b => b._id === selectedBeanId);
      const newTitle = targetBean ? `${targetBean.country}-${targetBean.region}` : roast.title;

      const res = await fetch(`/api/roasts/${roast._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beanId: selectedBeanId, title: newTitle }),
      });
      if (!res.ok) throw new Error('Failed to link bean');
      const updatedRoast = await res.json();
      setTitleValue(newTitle); // strictly sync
      if (onUpdate) onUpdate(updatedRoast);
    } catch (err) {
      console.error(err);
      alert('Failed to link green bean');
    } finally {
      setIsLinking(false);
    }
  };

  const handleSaveTitle = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/roasts/${roast._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleValue }),
      });
      if (!res.ok) throw new Error('Failed to update title');
      const updatedRoast = await res.json();
      if (onUpdate) onUpdate(updatedRoast);
      setIsEditingTitle(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save title');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelTitle = () => {
    setTitleValue(roast.title || 'Untitled');
    setIsEditingTitle(false);
  };

  // Ensure cuppingNotes is handled as an array gracefully (fallback for string inputs)
  const notesArray = Array.isArray(roast.cuppingNotes) ? roast.cuppingNotes : [];

  const handleSaveNote = async () => {
    setIsSaving(true);
    try {
      const newNote = { ...formState };
      const updatedNotes = [...notesArray, newNote];

      const res = await fetch(`/api/roasts/${roast._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuppingNotes: updatedNotes }),
      });
      if (!res.ok) throw new Error('Failed to update notes');
      const updatedRoast = await res.json();
      if (onUpdate) onUpdate(updatedRoast);
      setIsEditing(false);
      setFormState({ method: '', grindSize: '', grinder: '', waterTemp: '', ratio: '', taste: '', tasteRating: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to save cupping notes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (indexToRemove) => {
    setIsSaving(true);
    try {
      const updatedNotes = notesArray.filter((_, idx) => idx !== indexToRemove);
      const res = await fetch(`/api/roasts/${roast._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuppingNotes: updatedNotes }),
      });
      if (!res.ok) throw new Error('Failed to update notes');
      const updatedRoast = await res.json();
      if (onUpdate) onUpdate(updatedRoast);
    } catch (err) {
      console.error(err);
      alert('Failed to delete note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateNote = async (idx) => {
    setIsSaving(true);
    try {
      const updatedNotes = notesArray.map((n, i) => i === idx ? { ...n, ...editingNoteState } : n);
      const res = await fetch(`/api/roasts/${roast._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuppingNotes: updatedNotes }),
      });
      if (!res.ok) throw new Error('Failed to update note');
      const updatedRoast = await res.json();
      if (onUpdate) onUpdate(updatedRoast);
      setEditingNoteIdx(null);
      setEditingNoteState({});
    } catch (err) {
      console.error(err);
      alert('Failed to update cupping note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelNote = () => {
    setFormState({ method: '', grindSize: '', grinder: '', waterTemp: '', ratio: '', taste: '', tasteRating: '' });
    setIsEditing(false);
  };

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
            {isEditingTitle ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                <input
                  type="text"
                  value={titleValue}
                  onChange={e => setTitleValue(e.target.value)}
                  style={{ flex: 1, padding: '6px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', fontSize: '1.25rem', fontWeight: 600 }}
                  autoFocus
                />
                <button
                  onClick={handleCancelTitle} disabled={isSaving}
                  style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTitle} disabled={isSaving}
                  style={{ padding: '4px 10px', background: '#c8702a', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 500, cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}
                >
                  Save
                </button>
              </div>
            ) : (
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {roast.title || 'Untitled'}
                <button
                  onClick={() => setIsEditingTitle(true)}
                  disabled={isSaving}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.6, fontSize: '0.9rem', padding: '2px 4px' }}
                  title="Edit title"
                >
                  ✎
                </button>
              </h2>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {linkedBean && linkedBean.process && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', background: '#c8702a', padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                  {linkedBean.process}
                </span>
              )}
              {roast.weightIn && (
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: '14px', whiteSpace: 'nowrap' }}>
                  {fmtWeight(roast.weightIn)} in
                </span>
              )}
            </div>
          </div>
          <div className="card-meta">
            <span>{fmtDate(roast.roastDate)}</span>
            {roast.roastTime && <><span className="dot">·</span><span>{roast.roastTime}</span></>}
          </div>
        </div>

        <div className="modal-section-label">Bean</div>
        <div style={{ marginBottom: '16px', background: 'var(--bg)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px' }}>
          {linkedBean ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text)' }}>
                {linkedBean.country} - {linkedBean.region}
              </span>
              {linkedBean.process && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', background: '#c8702a', padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                  {linkedBean.process}
                </span>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={selectedBeanId}
                onChange={(e) => setSelectedBeanId(e.target.value)}
                style={{ flex: 1, padding: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }}
                disabled={isLinking}
              >
                <option value="">Select a green bean...</option>
                {beans.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.country} - {b.region} {b.process ? `(${b.process})` : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={handleLinkBean}
                disabled={isLinking || !selectedBeanId}
                style={{
                  padding: '8px 12px',
                  background: '#c8702a',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: (isLinking || !selectedBeanId) ? 'not-allowed' : 'pointer',
                  opacity: (isLinking || !selectedBeanId) ? 0.7 : 1
                }}
              >
                {isLinking ? 'Linking…' : 'Link Bean'}
              </button>
            </div>
          )}
        </div>

        <div className="modal-section-label">Roast Stats</div>
        <div className="modal-stats">
          {/* Row 1 - Match Card Header */}
          <Stat label="Drop BT"      value={fmtTemp(c.dropBT)} />
          <Stat label="Drop ET"      value={fmtTemp(c.dropET)} />
          <Stat label="Charge BT"    value={fmtTemp(c.chargeBT)} />
          <Stat label="Charge ET"    value={fmtTemp(c.chargeET)} />

          {/* Row 2 - Match Card Row 2 */}
          <Stat label="Ambient Temp" value={roast.ambientTemp != null ? fmtTemp(roast.ambientTemp) : '—'} />
          <Stat label="Humidity"     value={roast.ambientHumidity != null ? `${roast.ambientHumidity}%` : '—'} />
          <Stat label="TP Time/BT"   value={`${fmtSecs(c.tpTime)} @ ${fmtTemp(c.tpBT)}`} />
          <Stat label="TP ET"        value={fmtTemp(c.tpET)} />

          {/* Row 3 - Match Card Row 3 */}
          <Stat label="Dry Time/BT"  value={`${fmtSecs(c.dryTime)} @ ${fmtTemp(c.dryBT)}`} />
          <Stat label="Dry ET"       value={fmtTemp(c.dryET)} />
          <Stat label="1C Start Time/BT" value={`${fmtSecs(c.firstCrackTime)} @ ${fmtTemp(c.firstCrackBT)}`} />
          <Stat label="Dry to 1C"    value={c.dryTime && c.firstCrackTime ? fmtSecs(c.firstCrackTime - c.dryTime) : '—'} />

          {/* Row 4 - Match Card Row 4 */}
          <Stat label="1C End Time/BT" value={`${fmtSecs(c.fcEndTime)} @ ${fmtTemp(c.fcEndBT)}`} />
          <Stat label="Roast Time"   value={fmtSecs(c.totalRoastTime)} />
          <Stat label="Weight Out"   value={fmtWeight(roast.weightOut)} />
          <Stat label="Loss"         value={weightLoss} em />
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

        <div className="modal-section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Cupping Notes
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              disabled={isSaving}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease, border-color 0.15s ease'
              }}
              title="Add cupping note"
            >
              + Add Note
            </button>
          )}
        </div>

        {notesArray.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {notesArray.map((note, idx) => (
              <div key={idx} style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                padding: '12px',
                borderRadius: '8px',
                position: 'relative'
              }}>
                {editingNoteIdx === idx ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <input
                        type="text" placeholder="Method (e.g. V60, Cupping)"
                        value={editingNoteState.method || ''} onChange={(e) => setEditingNoteState({ ...editingNoteState, method: e.target.value })}
                        style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }}
                      />
                      <input
                        type="text" placeholder="Grinder (e.g. Fellow Ode)"
                        value={editingNoteState.grinder || ''} onChange={(e) => setEditingNoteState({ ...editingNoteState, grinder: e.target.value })}
                        style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }}
                      />
                      <input
                        type="number" placeholder="Grind Size"
                        value={editingNoteState.grindSize || ''} onChange={(e) => setEditingNoteState({ ...editingNoteState, grindSize: e.target.value ? Number(e.target.value) : '' })}
                        style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }}
                      />
                      <input
                        type="number" placeholder="Water Temp (°C)"
                        value={editingNoteState.waterTemp || ''} onChange={(e) => setEditingNoteState({ ...editingNoteState, waterTemp: e.target.value ? Number(e.target.value) : '' })}
                        style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }}
                      />
                      <input
                        type="text" placeholder="Ratio (e.g. 1:15)"
                        value={editingNoteState.ratio || ''} onChange={(e) => setEditingNoteState({ ...editingNoteState, ratio: e.target.value })}
                        style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', gridColumn: '1 / -1' }}
                      />
                    </div>
                    <select
                      value={editingNoteState.tasteRating || ''}
                      onChange={(e) => setEditingNoteState({ ...editingNoteState, tasteRating: e.target.value })}
                      style={{ width: '100%', padding: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', gridColumn: '1 / -1' }}
                    >
                      <option value="">Taste Rating...</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Very Good">Very Good</option>
                      <option value="OK">OK</option>
                      <option value="Failed">Failed</option>
                    </select>
                    <textarea
                      placeholder="Taste notes..."
                      value={editingNoteState.taste || ''} onChange={(e) => setEditingNoteState({ ...editingNoteState, taste: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border)',
                        color: 'var(--text)', borderRadius: '6px', resize: 'vertical', fontFamily: 'inherit'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setEditingNoteIdx(null)} disabled={isSaving}
                        style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', cursor: isSaving ? 'not-allowed' : 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateNote(idx)} disabled={isSaving}
                        style={{ padding: '6px 14px', background: '#c8702a', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 500, cursor: isSaving ? 'not-allowed' : 'pointer' }}
                      >
                        {isSaving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => { setEditingNoteIdx(idx); setEditingNoteState({ ...note }); }}
                      disabled={isSaving}
                      style={{ position: 'absolute', top: '12px', right: '36px', background: 'none', border: 'none', color: 'var(--text-secondary)', opacity: 0.7, cursor: 'pointer', fontSize: '0.85rem' }}
                      title="Edit note"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => setPendingDeleteIdx(idx)}
                      disabled={isSaving}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        opacity: 0.7,
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                      }}
                      title="Delete note"
                    >
                      ✕
                    </button>
                    {pendingDeleteIdx === idx && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Delete this note?</span>
                        <button
                          onClick={() => { handleDeleteNote(idx); setPendingDeleteIdx(null); }}
                          disabled={isSaving}
                          style={{ padding: '3px 10px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setPendingDeleteIdx(null)}
                          style={{ padding: '3px 10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {note.date ? new Date(note.date).toLocaleDateString() : '—'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.9rem', marginBottom: '8px' }}>
                      <div><strong style={{ color: 'var(--text-secondary)' }}>Method:</strong> {note.method || '—'}</div>
                      <div><strong style={{ color: 'var(--text-secondary)' }}>Grinder:</strong> {note.grinder || '—'}</div>
                      <div><strong style={{ color: 'var(--text-secondary)' }}>Grind Size:</strong> {note.grindSize || '—'}</div>
                      <div><strong style={{ color: 'var(--text-secondary)' }}>Water Temp:</strong> {note.waterTemp ? `${note.waterTemp}°C` : '—'}</div>
                      <div><strong style={{ color: 'var(--text-secondary)' }}>Ratio:</strong> {note.ratio || '—'}</div>
                    </div>
                    {note.tasteRating && (
                      <div style={{ marginBottom: '4px' }}>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Taste Rating:</strong>
                        <span style={{ marginLeft: '8px', fontSize: '0.95rem' }}>{note.tasteRating}</span>
                      </div>
                    )}
                    {note.taste && (
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Taste:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', lineHeight: 1.4 }}>{note.taste}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          !isEditing && <p className="modal-notes empty">No cupping notes yet</p>
        )}

        {isEditing && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '12px', marginTop: notesArray.length ? '16px' : '8px',
            background: 'var(--bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px'
          }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Add Cupping Note</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input
                type="text" placeholder="Method (e.g. V60, Cupping)"
                value={formState.method} onChange={(e) => setFormState({ ...formState, method: e.target.value })}
                style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }}
              />
              <input
                type="text" placeholder="Grinder (e.g. Fellow Ode)"
                value={formState.grinder} onChange={(e) => setFormState({ ...formState, grinder: e.target.value })}
                style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }}
              />
              <input
                type="number" placeholder="Grind Size"
                value={formState.grindSize} onChange={(e) => setFormState({ ...formState, grindSize: e.target.value ? Number(e.target.value) : '' })}
                style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }}
              />
              <input
                type="number" placeholder="Water Temp (°C)"
                value={formState.waterTemp} onChange={(e) => setFormState({ ...formState, waterTemp: e.target.value ? Number(e.target.value) : '' })}
                style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }}
              />
              <input
                type="text" placeholder="Ratio (e.g. 1:15)"
                value={formState.ratio} onChange={(e) => setFormState({ ...formState, ratio: e.target.value })}
                style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', gridColumn: '1 / -1' }}
              />
            </div>
            <select
              value={formState.tasteRating || ''}
              onChange={(e) => setFormState({ ...formState, tasteRating: e.target.value })}
              style={{ width: '100%', padding: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', gridColumn: '1 / -1' }}
            >
              <option value="">Taste Rating...</option>
              <option value="Excellent">Excellent</option>
              <option value="Very Good">Very Good</option>
              <option value="OK">OK</option>
              <option value="Failed">Failed</option>
            </select>
            <textarea
              placeholder="Taste notes..."
              value={formState.taste} onChange={(e) => setFormState({ ...formState, taste: e.target.value })}
              rows={3}
              style={{
                width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text)', borderRadius: '6px', resize: 'vertical', fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelNote} disabled={isSaving}
                style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', cursor: isSaving ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote} disabled={isSaving}
                style={{ padding: '6px 14px', background: '#c8702a', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 500, cursor: isSaving ? 'not-allowed' : 'pointer' }}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Filter Bar ─────────────────────────────────────────────────────────────

function FilterBar({ roasts, beans, filters, setFilters, className }) {
  // Origin options now come from the beans collection (country field)
  const originOptions = useMemo(() => unique(beans.map(b => b.country)), [beans]);

  // Region options come from beans filtered by the selected country (region field)
  const regionOptions = useMemo(() => {
    if (!filters.origin) return unique(beans.map(b => b.region));
    return unique(beans.filter(b => b.country === filters.origin).map(b => b.region));
  }, [beans, filters.origin]);

  const processOptions = useMemo(() => {
    let b = beans;
    if (filters.origin) b = b.filter(x => x.country === filters.origin);
    if (filters.region) b = b.filter(x => x.region === filters.region);
    return unique(b.map(x => x.process));
  }, [beans, filters.origin, filters.region]);

  const afterOrigin = useMemo(() =>
    filters.origin ? roasts.filter(r => r.title === filters.origin) : roasts,
    [roasts, filters.origin]
  );
  
  const afterRegion = useMemo(() =>
    filters.region ? afterOrigin.filter(r => r.beans === filters.region) : afterOrigin,
    [afterOrigin, filters.region]
  );

  const afterProcess = useMemo(() => {
    if (!filters.process) return afterRegion;
    return afterRegion.filter(r => {
      if (!r.beanId) return false;
      const linkedBean = beans.find(b => b._id === r.beanId);
      return linkedBean && linkedBean.process === filters.process;
    });
  }, [afterRegion, beans, filters.process]);
  
  // Season still bases directly off the remaining filtered roasts
  const seasonOptions = useMemo(() =>
    unique(afterProcess.map(r => getSeason(r.roastDate))),
    [afterProcess]
  );

  const hasFilters = filters.origin || filters.region || filters.process || filters.season;

  return (
    <div className={`filters-bar${className ? ` ${className}` : ''}`}>
      <div className="filter-group">
        <label htmlFor="filter-origin">Origin</label>
        <select id="filter-origin" value={filters.origin}
          onChange={e => setFilters({ origin: e.target.value, region: '', process: '', season: '' })}>
          <option value="">All</option>
          {originOptions.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <span className="filter-divider">›</span>

      <div className="filter-group">
        <label htmlFor="filter-region">Region</label>
        <select id="filter-region" value={filters.region}
          onChange={e => setFilters(f => ({ ...f, region: e.target.value, process: '', season: '' }))}
          disabled={!filters.origin && regionOptions.length === 0}>
          <option value="">All</option>
          {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <span className="filter-divider">›</span>

      <div className="filter-group">
        <label htmlFor="filter-process">Process</label>
        <select id="filter-process" value={filters.process}
          onChange={e => setFilters(f => ({ ...f, process: e.target.value, season: '' }))}
          disabled={!filters.origin && !filters.region && processOptions.length === 0}>
          <option value="">All</option>
          {processOptions.map(p => <option key={p} value={p}>{p}</option>)}
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
          onClick={() => setFilters({ origin: '', region: '', process: '', season: '' })}>
          Clear filters
        </button>
      )}
    </div>
  );
}

// ── Add Bean Modal ─────────────────────────────────────────────────────────

function AddBeanModal({ onClose, onAddBean }) {
  const [formState, setFormState] = useState({
    country: '',
    region: '',
    process: 'Natural',
    purchaseDate: '',
    totalWeight: ''
  });
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    if (!formState.country || !formState.region || !formState.purchaseDate || !formState.totalWeight) {
      alert('Please fill out all fields.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...formState,
        totalWeight: Number(formState.totalWeight)
      };
      const res = await fetch('/api/beans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create bean');
      const newBean = await res.json();
      if (onAddBean) onAddBean(newBean);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save green bean');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <h2 className="modal-title">Add Green Beans</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Country</label>
            <input
              type="text" placeholder="e.g. Ethiopia"
              value={formState.country} onChange={(e) => setFormState({ ...formState, country: e.target.value })}
              style={{ padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }}
            />
          </div>
          <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Region</label>
            <input
              type="text" placeholder="e.g. Yirgacheffe"
              value={formState.region} onChange={(e) => setFormState({ ...formState, region: e.target.value })}
              style={{ padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }}
            />
          </div>
          <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Process</label>
            <select
              value={formState.process}
              onChange={(e) => setFormState({ ...formState, process: e.target.value })}
              style={{ padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }}
            >
              <option value="Natural">Natural</option>
              <option value="Washed">Washed</option>
              <option value="Honey">Honey</option>
              <option value="Wet-Hulled">Wet-Hulled</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Purchase Date</label>
            <input
              type="date"
              value={formState.purchaseDate} onChange={(e) => setFormState({ ...formState, purchaseDate: e.target.value })}
              style={{ padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }}
            />
          </div>
          <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Weight (g)</label>
            <input
              type="number" placeholder="e.g. 5000"
              value={formState.totalWeight} onChange={(e) => setFormState({ ...formState, totalWeight: e.target.value })}
              style={{ padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              onClick={onClose} disabled={isSaving}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', cursor: isSaving ? 'not-allowed' : 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave} disabled={isSaving}
              style={{ padding: '8px 16px', background: '#c8702a', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 500, cursor: isSaving ? 'not-allowed' : 'pointer' }}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

import Header from '@/components/Header';
import GearMenu from '@/components/GearMenu';
import AlogUploadModal from '@/components/AlogUploadModal';

export default function DashboardPage() {
  const [roasts,   setRoasts]   = useState([]);
  const [beans,    setBeans]    = useState([]);
  const [filters,  setFilters]  = useState({ origin: '', region: '', process: '', season: '' });
  const [selected, setSelected] = useState(null);
  const [isAddingBean, setIsAddingBean] = useState(false);
  const [isUploadingAlog, setIsUploadingAlog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const { data: roastsData, error: roastsError, isLoading: roastsLoading, mutate: mutateRoasts } = useSWR('/api/roasts', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true
  });
  const { data: beansData, error: beansError, isLoading: beansLoading } = useSWR('/api/beans', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true
  });

  const loading = roastsLoading || beansLoading;
  const error = roastsError?.message || beansError?.message;

  useEffect(() => {
    if (roastsData) setRoasts(roastsData);
  }, [roastsData]);

  useEffect(() => {
    if (beansData) setBeans(beansData);
  }, [beansData]);

  const filtered = useMemo(() => {
    return roasts.filter(r => {
      if (filters.origin || filters.region) {
        const linkedBean = beans.find(b => String(b._id) === String(r.beanId));
        if (filters.origin && (!linkedBean || linkedBean.country !== filters.origin)) return false;
        if (filters.region && (!linkedBean || linkedBean.region !== filters.region)) return false;
      }
      if (filters.process) {
        if (!r.beanId) return false;
        const linkedBean = beans.find(b => String(b._id) === String(r.beanId));
        if (!linkedBean || linkedBean.process !== filters.process) return false;
      }
      if (filters.season && getSeason(r.roastDate) !== filters.season) return false;
      return true;
    });
  }, [roasts, beans, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.ceil(filtered.length / 15);
  const paginated = filtered.slice((currentPage - 1) * 15, currentPage * 15);

  const handleClose = useCallback(() => setSelected(null), []);

  const handleUpdateRoast = useCallback((updatedRoast) => {
    setRoasts(prev => prev.map(r => r._id === updatedRoast._id ? updatedRoast : r));
    setSelected(updatedRoast);
  }, []);

  const handleAddBean = useCallback((newBean) => {
    setBeans(prev => [newBean, ...prev]);
  }, []);

  return (
    <div className="page-wrapper">
      <Header />

      {!loading && !error && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
            <GearMenu 
              onAddBeans={() => setIsAddingBean(true)}
              onUploadRoasts={() => setIsUploadingAlog(true)}
              showFilters={showFilters}
              onShowFilters={() => setShowFilters(f => !f)}
            />
          </div>
          <FilterBar roasts={roasts} beans={beans} filters={filters} setFilters={setFilters} className={showFilters ? 'filters-open' : ''} />
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
          {paginated.map(r => (
            <RoastCard key={r._id} roast={r} beans={beans} onClick={() => setSelected(r)} />
          ))}
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px', marginBottom: '16px' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            Next
          </button>
        </div>
      )}

      {selected && <RoastModal roast={selected} beans={beans} onClose={handleClose} onUpdate={handleUpdateRoast} />}
      {isAddingBean && <AddBeanModal onClose={() => setIsAddingBean(false)} onAddBean={handleAddBean} />}
      {isUploadingAlog && <AlogUploadModal onClose={() => setIsUploadingAlog(false)} onUploadComplete={() => { mutateRoasts(); setIsUploadingAlog(false); }} />}
    </div>
  );
}
