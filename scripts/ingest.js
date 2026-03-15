/**
 * scripts/ingest.js
 *
 * Reads all .alog files from the 'artisan-roasts-data' folder,
 * parses each one as JSON, maps fields to the Roast schema,
 * and upserts each document into MongoDB using roastUUID as the key.
 *
 * Usage:
 *   node scripts/ingest.js
 *
 * Requirements:
 *   - .env.local must contain MONGODB_URI
 *   - Place your .alog files in the artisan-roasts-data/ folder
 */

// Load .env.local before anything else
require('dotenv').config({ path: '.env.local' });

const fs       = require('fs');
const path     = require('path');
const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// Python dict → JSON converter
//
// Artisan saves .alog files as Python dict literals, not valid JSON:
//   - Keys and string values are wrapped in single quotes
//   - Booleans are True/False, null is None
// This function normalises the raw text before JSON.parse.
// ---------------------------------------------------------------------------

function pythonDictToJson(raw) {
  return raw
    // Python literals → JSON literals (word-boundary safe)
    .replace(/\bTrue\b/g,  'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g,  'null')
    // Single-quoted strings → double-quoted strings.
    // Regex breakdown:
    //   '          opening single quote
    //   (          capture group for the string contents:
    //     (?:        non-capturing group for one character, either:
    //       [^'\\]   any char that is NOT a quote or backslash
    //       |        OR
    //       \\.      a backslash followed by any char (escaped sequence)
    //     )*         zero or more times
    //   )          end capture
    //   '          closing single quote
    .replace(/'((?:[^'\\]|\\.)*)'/g, (_match, content) => {
      // 1. Unescape any escaped single quotes inside the string
      // 2. Escape any bare double quotes (so JSON.parse doesn't choke)
      const fixed = content
        .replace(/\\'/g, "'")
        .replace(/"/g, '\\"');
      return `"${fixed}"`;
    });
}

// ---------------------------------------------------------------------------
// Mongoose model (CommonJS-compatible inline version of models/Roast.js)
// We re-define rather than import because this script runs outside Next.js
// ---------------------------------------------------------------------------

const ComputedSchema = new mongoose.Schema(
  {
    chargeET:       { type: Number, default: null },
    chargeBT:       { type: Number, default: null },
    tpTime:         { type: Number, default: null },
    tpBT:           { type: Number, default: null },
    tpET:           { type: Number, default: null },
    dryTime:        { type: Number, default: null },
    dryBT:          { type: Number, default: null },
    dryET:          { type: Number, default: null },
    dropET:         { type: Number, default: null },
    dropBT:         { type: Number, default: null },
    dropTime:       { type: Number, default: null },
    firstCrackTime: { type: Number, default: null },
    firstCrackBT:   { type: Number, default: null },
    fcEndTime:      { type: Number, default: null },
    fcEndBT:        { type: Number, default: null },
    fcEndET:        { type: Number, default: null },
    totalRoastTime: { type: Number, default: null },
    dryPhaseRoR:    { type: Number, default: null },
    midPhaseRoR:    { type: Number, default: null },
    finishPhaseRoR: { type: Number, default: null },
    totalRoR:       { type: Number, default: null },
  },
  { _id: false }
);

const RoastSchema = new mongoose.Schema(
  {
    title:         { type: String, required: true, trim: true },
    beans:         { type: String, required: false, trim: true },
    roastDate:     { type: Date,   required: true },
    roastTime:     { type: String, required: true },
    roastUUID:     { type: String, required: true, unique: true, index: true },
    weightIn:      { type: Number, required: true, min: 0 },
    weightOut:     { type: Number, required: true, min: 0 },
    weightLoss:    { type: Number, default: null },
    roastingNotes: { type: String, default: '' },
    cuppingNotes:  { type: String, default: '' },
    ambientTemp:      { type: Number, default: null },
    ambientHumidity:  { type: Number, default: null },
    computed:      { type: ComputedSchema, default: () => ({}) },
  },
  { timestamps: true }
);

const Roast = mongoose.models.Roast || mongoose.model('Roast', RoastSchema);

// ---------------------------------------------------------------------------
// Field mapping: Artisan .alog JSON  →  Roast schema
//
// Artisan .alog field reference (adjust keys here if your version differs):
//   roastisodate        → roastDate
//   roasttime          → roastTime
//   roastUUID          → roastUUID
//   title              → title
//   beans              → beans
//   weight[0]          → weightIn  (array: [in, out, unit])
//   weight[1]          → weightOut
//   roastingnotes      → roastingNotes
//   cuppingnotes       → cuppingNotes
//
// computed sub-object (Artisan "computed" block):
//   CHARGE_ET          → chargeET
//   CHARGE_BT          → chargeBT
//   DROP_ET            → dropET
//   DROP_BT            → dropBT
//   DROP_time          → dropTime       (seconds)
//   FCs_time           → firstCrackTime (seconds)
//   FCs_BT             → firstCrackBT
//   totaltime          → totalRoastTime (seconds)
//   dry_phase_ror      → dryPhaseRoR    (°/min)
//   mid_phase_ror      → midPhaseRoR    (°/min)
//   finish_phase_ror   → finishPhaseRoR (°/min)
//   total_ror          → totalRoR       (°/min)
// ---------------------------------------------------------------------------

function mapAlogToRoast(alog) {
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
    heavyFC:   alog.heavyFC   ?? false,
    lowFC:     alog.lowFC     ?? false,
    lightCut:  alog.lightCut  ?? false,
    darkCut:   alog.darkCut   ?? false,
    drops:     alog.drops     ?? false,
    oily:      alog.oily      ?? false,
    uneven:    alog.uneven    ?? false,
    tipping:   alog.tipping   ?? false,
    scorching: alog.scorching ?? false,
    divots:    alog.divots    ?? false,
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

// ---------------------------------------------------------------------------
// Main ingestion logic
// ---------------------------------------------------------------------------

async function ingest() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI || MONGODB_URI === 'your_mongodb_uri_here') {
    console.error('❌  MONGODB_URI is not set in .env.local');
    process.exit(1);
  }

  const dataDir = path.resolve(__dirname, '..', 'artisan-roasts-data');
  if (!fs.existsSync(dataDir)) {
    console.error(`❌  Data folder not found: ${dataDir}`);
    console.error('    Create the folder and place your .alog files inside it.');
    process.exit(1);
  }

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.alog'));
  if (files.length === 0) {
    console.warn('⚠️   No .alog files found in', dataDir);
    process.exit(0);
  }

  console.log(`📂  Found ${files.length} .alog file(s) in ${dataDir}`);

  // Connect to MongoDB
  console.log('🔌  Connecting to MongoDB…');
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  console.log('✅  Connected\n');

  let inserted = 0;
  let updated  = 0;
  let skipped  = 0;
  let errored  = 0;

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    try {
      const raw      = fs.readFileSync(filePath, 'utf-8');
      const jsonText = pythonDictToJson(raw);
      const alog     = JSON.parse(jsonText);

      if (!alog.roastUUID) {
        console.warn(`⚠️   Skipping ${file}: missing roastUUID`);
        skipped++;
        continue;
      }

      const data   = mapAlogToRoast(alog);
      const filter = { roastUUID: data.roastUUID };

      const result = await Roast.findOneAndUpdate(
        filter,
        { $set: data },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );

      // findOneAndUpdate with upsert: if createdAt === updatedAt it's a new doc
      const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
      if (isNew) {
        console.log(`  ✅  Inserted  → ${file} (${data.title})`);
        inserted++;
      } else {
        console.log(`  🔄  Updated   → ${file} (${data.title})`);
        updated++;
      }
    } catch (err) {
      console.error(`  ❌  Error processing ${file}:`, err.message);
      errored++;
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`  Inserted : ${inserted}`);
  console.log(`  Updated  : ${updated}`);
  console.log(`  Skipped  : ${skipped}`);
  console.log(`  Errors   : ${errored}`);
  console.log('─────────────────────────────────────────\n');

  await mongoose.disconnect();
  console.log('🔌  Disconnected. Done.');
}

ingest().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
