import mongoose, { Schema, models, model } from 'mongoose';

const ComputedSchema = new Schema(
  {
    chargeET:        { type: Number, default: null }, // Environmental temp at charge
    chargeBT:        { type: Number, default: null }, // Bean temp at charge
    tpTime:          { type: Number, default: null }, // Time of turning point (seconds)
    tpBT:            { type: Number, default: null }, // Bean temp at turning point
    tpET:            { type: Number, default: null }, // Environmental temp at turning point
    dryTime:         { type: Number, default: null }, // Time of dry end (seconds)
    dryBT:           { type: Number, default: null }, // Bean temp at dry end
    dryET:           { type: Number, default: null }, // Environmental temp at dry end
    dropET:          { type: Number, default: null }, // Environmental temp at drop
    dropBT:          { type: Number, default: null }, // Bean temp at drop
    dropTime:        { type: Number, default: null }, // Time of drop (seconds)
    firstCrackTime:  { type: Number, default: null }, // Time of first crack (seconds)
    firstCrackBT:    { type: Number, default: null }, // Bean temp at first crack
    fcEndTime:       { type: Number, default: null }, // Time of first crack end (seconds)
    fcEndBT:         { type: Number, default: null }, // Bean temp at first crack end
    fcEndET:         { type: Number, default: null }, // Environmental temp at first crack end
    totalRoastTime:  { type: Number, default: null }, // Total roast duration (seconds)
    dryPhaseRoR:     { type: Number, default: null }, // Rate of Rise during dry phase (°/min)
    midPhaseRoR:     { type: Number, default: null }, // Rate of Rise during mid phase (°/min)
    finishPhaseRoR:  { type: Number, default: null }, // Rate of Rise during finish phase (°/min)
    totalRoR:        { type: Number, default: null }, // Overall Rate of Rise (°/min)
  },
  { _id: false } // embedded object, no separate _id needed
);

const RoastSchema = new Schema(
  {
    title:         { type: String, required: true, trim: true },
    beans:         { type: String, required: true, trim: true },
    beanId:        { type: mongoose.Schema.Types.ObjectId, ref: 'GreenBean', default: null },
    roastDate:     { type: Date,   required: true },
    roastTime:     { type: String, required: true }, // e.g. "14:30"
    roastUUID:     { type: String, required: true, unique: true, index: true },
    weightIn:      { type: Number, required: true, min: 0 }, // grams
    weightOut:     { type: Number, required: true, min: 0 }, // grams
    weightLoss:    { type: Number, default: null },           // grams (or %)
    roastingNotes:    { type: String, default: '' },
    cuppingNotes: [
      {
        method: { type: String, default: '' },
        grindSize: { type: Number },
        grinder: { type: String, default: '' },
        waterTemp: { type: Number }, // stored in Celsius
        ratio: { type: String, default: '' },
        taste: { type: String, default: '' },
        tasteRating: { type: String, enum: ['Excellent', 'Very Good', 'OK', 'Failed', ''], default: '' },
        date: { type: Date, default: Date.now },
      }
    ],
    ambientTemp:      { type: Number, default: null },
    ambientHumidity:  { type: Number, default: null },
    heavyFC:   { type: Boolean, default: false },
    lowFC:     { type: Boolean, default: false },
    lightCut:  { type: Boolean, default: false },
    darkCut:   { type: Boolean, default: false },
    drops:     { type: Boolean, default: false },
    oily:      { type: Boolean, default: false },
    uneven:    { type: Boolean, default: false },
    tipping:   { type: Boolean, default: false },
    scorching: { type: Boolean, default: false },
    divots:    { type: Boolean, default: false },
    computed:         { type: ComputedSchema, default: () => ({}) },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Prevent model recompilation on hot-reload (Next.js dev server), but drop existing
// model cache if it exists, to ensure schema updates (like string -> array) take effect.
if (models.Roast) {
  delete models.Roast;
}

const Roast = model('Roast', RoastSchema);

export default Roast;
