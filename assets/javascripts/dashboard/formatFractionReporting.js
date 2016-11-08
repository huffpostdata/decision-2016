module.exports = function formatFractionReporting(fraction) {
  if (fraction === 0) return '0%';
  if (!fraction) return ''; // NaN, null, undefined
  if (fraction === 1) return '100%';
  if (fraction < 0.01) return '<1%';
  if (fraction > 0.99) return '>99%';
  return Math.round(fraction * 100) + '%';
};
