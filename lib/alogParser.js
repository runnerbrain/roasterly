export function pythonDictToJson(raw) {
  let jsStr = raw
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null');

  jsStr = jsStr.replace(/'((?:[^'\\]|\\.)*)'/g, (match, content) => {
    const unescapedSingle = content.replace(/\\'/g, "'");
    const escapedDouble = unescapedSingle.replace(/"/g, '\\"');
    return `"${escapedDouble}"`;
  });

  return jsStr;
}

export function mapAlogToRoast(alog) {
  const weightIn = alog.weight?.[0];
  const weightOut = alog.weight?.[1];
  const weightLoss = (weightIn !== undefined && weightOut !== undefined)
    ? weightIn - weightOut
    : undefined;

  const comp = alog.computed || alog;

  return {
    title: alog.title,
    beans: alog.beans,
    roastDate: alog.roastisodate,
    roastTime: alog.roasttime,
    roastUUID: alog.roastUUID,
    weightIn,
    weightOut,
    weightLoss,
    roastingNotes: alog.roastingNotes,
    jscuppingNotes: [],
    ambientTemp: alog.ambientTemp,
    ambientHumidity: alog.ambient_humidity,
    heavyFC: alog.heavyFC || false,
    lowFC: alog.lowFC || false,
    lightCut: alog.lightCut || false,
    darkCut: alog.darkCut || false,
    drops: alog.drops || false,
    oily: alog.oily || false,
    uneven: alog.uneven || false,
    tipping: alog.tipping || false,
    scorching: alog.scorching || false,
    divots: alog.divots || false,
    computed: {
      chargeET: comp.chargeET,
      chargeBT: comp.chargeBT,
      tpTime: comp.TP_time,
      tpBT: comp.tpBT,
      tpET: comp.tpET,
      dryTime: comp.DRY_time,
      dryBT: comp.dryBT,
      dryET: comp.dryET,
      dropET: comp.dropET,
      dropBT: comp.dropBT,
      dropTime: comp.DROP_time,
      firstCrackTime: comp.FCs_time,
      firstCrackBT: comp.FCs_BT,
      fcEndTime: comp.FCe_time,
      fcEndBT: comp.fcEndBT,
      fcEndET: comp.fcEndET,
      totalRoastTime: comp.totaltime,
      dryPhaseRoR: comp.dryPhaseRoR,
      midPhaseRoR: comp.midPhaseRoR,
      finishPhaseRoR: comp.finishPhaseRoR,
      totalRoR: comp.totalRoR
    }
  };
}
