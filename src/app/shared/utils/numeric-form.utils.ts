/** Obergrenzen für sinnvolle Eingaben (Frontend-Schutz, kein Ersatz für Backend-Regeln) */
export const METRIC_LIMITS = {
  stepsGoal: 2_000_000,
  stepsProgress: 500_000,
  jogGoalKm: 10_000,
  jogProgressKm: 999,
  minutesGoal: 100_080,
  minutesProgress: 24 * 60,
  caloriesKcal: 50_000,
  weightKgMin: 20,
  weightKgMax: 400,
  waterLitersMax: 30,
} as const;

export type FieldOk = { ok: true };
export type FieldErr = { ok: false; message: string };
export type FieldResult = FieldOk | FieldErr;

function trimNorm(raw: string): string {
  return raw.trim().replace(/\s/g, '');
}

/** Leer = optional gültig. Sonst nichtnegative ganze Zahl ≤ max. */
export function validateOptionalNonNegativeInt(
  raw: string,
  max: number,
  fieldLabel: string
): FieldResult {
  const t = trimNorm(raw);
  if (t === '') return { ok: true };
  if (!/^\d+$/.test(t)) {
    return { ok: false, message: `${fieldLabel}: Bitte eine gültige ganze Zahl eingeben (ohne Minus, ohne Komma).` };
  }
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, message: `${fieldLabel}: Keine negativen Werte.` };
  }
  if (n > max) {
    return { ok: false, message: `${fieldLabel}: Maximal ${max.toLocaleString('de-DE')}.` };
  }
  return { ok: true };
}

/** Leer = optional. Sonst nichtnegative Dezimalzahl (Komma oder Punkt) ≤ max. */
export function validateOptionalNonNegativeDecimal(
  raw: string,
  max: number,
  fieldLabel: string,
  maxFractionDigits = 2
): FieldResult {
  const t = trimNorm(raw).replace(',', '.');
  if (t === '') return { ok: true };
  if (!/^\d+(\.\d+)?$/.test(t)) {
    return { ok: false, message: `${fieldLabel}: Bitte eine gültige positive Zahl eingeben.` };
  }
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, message: `${fieldLabel}: Keine negativen Werte.` };
  }
  const parts = t.split('.');
  if (parts[1] && parts[1].length > maxFractionDigits) {
    return { ok: false, message: `${fieldLabel}: Maximal ${maxFractionDigits} Nachkommastellen.` };
  }
  if (n > max) {
    return { ok: false, message: `${fieldLabel}: Maximal ${max.toLocaleString('de-DE')}.` };
  }
  return { ok: true };
}

/** Fortschritt: muss > 0 und gültig sein (kein leeres Feld). */
export function parseStrictPositiveInt(
  raw: string,
  max: number,
  fieldLabel: string
): { ok: true; value: number } | FieldErr {
  const t = trimNorm(raw);
  if (t === '' || t === '0') {
    return { ok: false, message: `${fieldLabel}: Bitte einen Wert größer als 0 eingeben.` };
  }
  const r = validateOptionalNonNegativeInt(raw, max, fieldLabel);
  if (!r.ok) return r;
  const n = Number(trimNorm(raw));
  if (n <= 0) return { ok: false, message: `${fieldLabel}: Bitte einen Wert größer als 0 eingeben.` };
  return { ok: true, value: n };
}

export function parseStrictPositiveDecimal(
  raw: string,
  max: number,
  fieldLabel: string
): { ok: true; value: number } | FieldErr {
  const t = trimNorm(raw).replace(',', '.');
  if (t === '' || t === '0' || t === '0.0' || t === '0.00') {
    return { ok: false, message: `${fieldLabel}: Bitte einen Wert größer als 0 eingeben.` };
  }
  const r = validateOptionalNonNegativeDecimal(raw, max, fieldLabel);
  if (!r.ok) return r;
  const n = Number(trimNorm(raw).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, message: `${fieldLabel}: Bitte einen Wert größer als 0 eingeben.` };
  }
  return { ok: true, value: n };
}

/** Leer = optional. Sonst Gewicht zwischen weightKgMin und weightKgMax. */
export function validateOptionalWeightKg(raw: string): FieldResult {
  const t = trimNorm(raw).replace(',', '.');
  if (t === '') return { ok: true };
  const dec = validateOptionalNonNegativeDecimal(raw, METRIC_LIMITS.weightKgMax, 'Gewicht (kg)');
  if (!dec.ok) return dec;
  const n = Number(t);
  if (n < METRIC_LIMITS.weightKgMin) {
    return { ok: false, message: `Gewicht (kg): Mindestens ${METRIC_LIMITS.weightKgMin} kg.` };
  }
  return { ok: true };
}

export function validateSleepParts(
  hoursRaw: string,
  minutesRaw: string
): FieldResult {
  const hEmpty = trimNorm(hoursRaw) === '';
  const mEmpty = trimNorm(minutesRaw) === '';
  if (hEmpty && mEmpty) return { ok: true };

  const hRes = validateOptionalNonNegativeInt(hoursRaw, 24, 'Schlaf (Stunden)');
  if (!hRes.ok) return hRes;
  const mRes = validateOptionalNonNegativeInt(minutesRaw, 59, 'Schlaf (Minuten)');
  if (!mRes.ok) return mRes;

  const h = hEmpty ? 0 : Number(trimNorm(hoursRaw));
  const m = mEmpty ? 0 : Number(trimNorm(minutesRaw));
  const totalMin = h * 60 + m;
  if (totalMin > 24 * 60) {
    return { ok: false, message: 'Schlaf: Insgesamt höchstens 24 Stunden pro Tag.' };
  }
  return { ok: true };
}

export function isValidEmailFormat(email: string): boolean {
  const t = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}
