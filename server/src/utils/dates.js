const DAY_MS = 24 * 60 * 60 * 1000;

/** Parses "YYYY-MM-DD" (or a Date/ISO string) into the local-midnight Date. */
const startOfDay = (value = new Date()) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return startOfDay(new Date());
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const endOfDay = (value = new Date()) => new Date(startOfDay(value).getTime() + DAY_MS - 1);

const dayKey = (value = new Date()) => {
  const d = startOfDay(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const daysAgo = (days, from = new Date()) => new Date(startOfDay(from).getTime() - days * DAY_MS);

/** Whole days between two dates, ignoring time-of-day. */
const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);

module.exports = { DAY_MS, startOfDay, endOfDay, dayKey, daysAgo, daysBetween };
