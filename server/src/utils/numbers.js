const toNumber = (value, fallback = 0) => {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
};

/** Non-negative number, rounded to `decimals` places. */
const toPositive = (value, decimals = 1) => {
  const n = Math.max(0, toNumber(value, 0));
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
};

const toInt = (value, fallback = 0) => Math.round(toNumber(value, fallback));

const sum = (list, pick) => list.reduce((acc, item) => acc + toNumber(pick(item)), 0);

module.exports = { toNumber, toPositive, toInt, sum };
