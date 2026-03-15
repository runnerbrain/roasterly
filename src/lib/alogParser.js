/**
 * src/lib/alogParser.js
 *
 * Transformation functions for Artisan .alog files.
 */

export function pythonDictToJson(raw) {
  return raw
    // Python literals → JSON literals (word-boundary safe)
    .replace(/\bTrue\b/g,  'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g,  'null')
    // Single-quoted strings → double-quoted strings.
    .replace(/'((?:[^'\\]|\\.)*)'/g, (_match, content) => {
      // 1. Unescape any escaped single quotes inside the string
      // 2. Escape any bare double quotes (so JSON.parse doesn't choke)
      const fixed = content
        .replace(/\\'/g, "'")
        .replace(/"/g, '\\"');
      return `"${fixed}"`;
    });
}

export function mapAlogToRoast(alog) {
  const w   = alog.weight  || [];
  const c   = alog.computed || {};

  const weightIn  = parseFloat(w[0]) || 0;
  const weightOut = parseFloat(w[1]) || 0;
  const weightLoss = weightIn > 0
    ? parseFloat(((weightIn - weightOut) / weightIn * 100).toFixed(2))
    : null;

  return {
    title:         alog.title         || 'Untitled Roast',
    beans:         alog.beans         || 'Unknown',
    roastDate:     alog.roastisodate  ? new Date(alog.roastisodate) : new Date(),
    roastTime:     alog.roasttime     || '',
    roastUUID:     alog.roastUUID,
    weightIn,
    weightOut,
    weightLoss,
    roastingNotes:   alog.roastingnotes || '',
    cuppingNotes:    alog.cuppingnotes  || '',
    ambientTemp:     alog.ambientTemp      ?? null,
    ambientHumidity: alog.ambient_humidity ?? null,
    computed: {
      chargeET:       c.CHARGE_ET       ?? null,
      chargeBT:       c.CHARGE_BT       ?? null,
      tpTime:         c.TP_time         ?? null,
      tpBT:           c.TP_BT           ?? null,
      tpET:           c.TP_ET           ?? null,
      dryTime:        c.DRY_time        ?? null,
      dryBT:          c.DRY_BT          ?? null,
      dryET:          c.DRY_ET          ?? null,
      dropET:         c.DROP_ET         ?? null,
      dropBT:         c.DROP_BT         ?? null,
      dropTime:       c.DROP_time       ?? null,
      firstCrackTime: c.FCs_time        ?? null,
      firstCrackBT:   c.FCs_BT          ?? null,
      fcEndTime:      c.FCe_time        ?? null,
      fcEndBT:        c.FCe_BT          ?? null,
      fcEndET:        c.FCe_ET          ?? null,
      totalRoastTime: c.totaltime       ?? null,
      dryPhaseRoR:    c.dry_phase_ror   ?? null,
      midPhaseRoR:    c.mid_phase_ror   ?? null,
      finishPhaseRoR: c.finish_phase_ror ?? null,
      totalRoR:       c.total_ror       ?? null,
    },
  };
}
