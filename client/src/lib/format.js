/** mm:ss, or h:mm:ss past an hour. */
export const fmtTime = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
};

/** Trims trailing zeros: 82.0 -> "82", 82.55 -> "82.6". */
export const fmtNum = (n) => (Math.round((Number(n) || 0) * 10) / 10).toString();

/** Lenient number parse that accepts commas and returns 0 for junk. */
export const num = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const n = parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isNaN(n) ? 0 : n;
};

export const fmtKcal = (n) => Math.round(num(n)).toLocaleString();

export const fmtDate = (value) =>
  new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export const greeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

/** Local YYYY-MM-DD — the format the API expects for a day. */
export const dayKey = (date = new Date()) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const plural = (count, word, suffix = 's') => `${count} ${word}${count === 1 ? '' : suffix}`;
