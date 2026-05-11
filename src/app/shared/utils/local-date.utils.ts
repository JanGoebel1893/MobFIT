/**
 * Kalendertag als `YYYY-MM-DD` in der **lokalen** Zeitzone des Browsers.
 * Wichtig für Abgleich mit Supabase-`date`-Spalten (nicht `toISOString()`, das UTC ist).
 */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Heutiger Kalendertag (lokal), z. B. für `date = heute` in Queries */
export function todayLocalDateString(): string {
  return toLocalDateString(new Date());
}
