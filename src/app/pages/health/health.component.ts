import { Component, OnInit, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { DropletIcon, FlameIcon, MoonIcon, PlusIcon, WeightIcon } from 'lucide-angular/src/icons';
import { GoalsTopNavComponent } from '../../shared/goals-top-nav/goals-top-nav.component';
import { HealthStatCardComponent, HealthStatCardConfig } from '../../shared/health-stat-card/health-stat-card.component';
import { HealthDataFormValues, HealthDataModalComponent } from '../../shared/health-data-modal/health-data-modal.component';
import { SupabaseService } from '../../services/supabase.service';
import { toLocalDateString } from '../../shared/utils/local-date.utils';
import { WeeklyProgressCardComponent, WeeklyDayData } from '../../shared/weekly-progress-card/weekly-progress-card.component';
import { DashboardFooterComponent } from '../../shared/dashboard-footer/dashboard-footer.component';

type HealthStatsRange = 'week' | 'month';

const DE_DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WEEK_LABELS   = ['W1', 'W2', 'W3', 'W4'];

/** Monats-Chart + Vorperiode: bis 55 Tage zurück; Puffer → 70 Tage */
const HEALTH_ENTRIES_LOOKBACK_DAYS = 69;

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [
    LucideAngularModule,
    GoalsTopNavComponent,
    HealthStatCardComponent,
    HealthDataModalComponent,
    WeeklyProgressCardComponent,
    DashboardFooterComponent,
  ],
  templateUrl: './health.component.html',
  styleUrls: [
    '../../shared/styles/legal-route-layout.css',
    './health.component.css',
    '../../shared/styles/dashboard-shell.css',
  ],
})
export class HealthComponent implements OnInit {
  showHealthDataModal = false;
  isLoading = signal(true);
  statsRange = signal<HealthStatsRange>('week');
  readonly icons = { Plus: PlusIcon };
  readonly weeklyMetricOptions = [
    { key: 'calories', title: 'Kalorien', icon: FlameIcon  },
    { key: 'sleep',    title: 'Schlaf',   icon: MoonIcon   },
    { key: 'weight',   title: 'Gewicht',  icon: WeightIcon },
    { key: 'water',    title: 'Wasser',   icon: DropletIcon },
  ] as const;

  currentFormValues = signal<HealthDataFormValues>({
    caloriesKcal: '', sleepHours: '', sleepMinutes: '', weightKg: '', waterLiters: '',
  });

  stats: HealthStatCardConfig[] = [
    { variant: 'calories', label: 'Kalorien', primaryValue: '0', primaryUnit: 'kcal',  trendText: '' },
    { variant: 'sleep',    label: 'Schlaf',   primaryValue: '0h 0m',                 trendText: '' },
    { variant: 'weight',   label: 'Gewicht',  primaryValue: '0', primaryUnit: 'kg',     trendText: '' },
    { variant: 'water',    label: 'Wasser',   primaryValue: '0', primaryUnit: 'Liter',  trendText: '' },
  ];

  /** Rohdaten für Karten, Charts und Vergleichszeile */
  healthEntriesCache = signal<any[]>([]);

  chartWeek  = signal<Partial<Record<string, readonly WeeklyDayData[]>>>({});
  chartMonth = signal<Partial<Record<string, readonly WeeklyDayData[]>>>({});

  constructor(private supabase: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    const user = await this.supabase.getUser();
    if (!user) { this.isLoading.set(false); return; }

    const today = new Date();
    const sinceWide = this.isoDate(this.addDays(today, -HEALTH_ENTRIES_LOOKBACK_DAYS));

    const [latestRes, rangeRes] = await Promise.all([
      this.supabase.getLatestHealthEntry(user.id),
      this.supabase.getHealthEntriesRange(user.id, sinceWide),
    ]);

    if (latestRes.data) {
      this.currentFormValues.set(this.buildFormValues(latestRes.data));
    }

    this.healthEntriesCache.set(rangeRes.data ?? []);
    const entries = this.healthEntriesCache();
    this.chartWeek.set(this.buildWeekChart(entries, today));
    this.chartMonth.set(this.buildMonthChart(entries, today));
    this.rebuildHealthStatCards();

    this.isLoading.set(false);
  }

  openHealthDataModal(): void  { this.showHealthDataModal = true;  }
  closeHealthDataModal(): void { this.showHealthDataModal = false; }
  setStatsRange(range: HealthStatsRange): void {
    this.statsRange.set(range);
    this.rebuildHealthStatCards();
  }

  async onHealthDataSave(v: HealthDataFormValues): Promise<void> {
    const user = await this.supabase.getUser();
    if (!user) return;

    const calNum = parseInt(v.caloriesKcal.replace(/\D/g, ''), 10);
    const shNum  = parseInt(v.sleepHours.trim(), 10);
    const smNum  = parseInt(v.sleepMinutes.trim(), 10);
    const wgtNum = parseFloat(v.weightKg.trim().replace(',', '.'));
    const watNum = parseFloat(v.waterLiters.trim().replace(',', '.'));

    try {
      await this.supabase.upsertHealthEntry(user.id, {
        calories:    isNaN(calNum) ? null : calNum,
        sleep_hours: isNaN(shNum)  ? null : shNum,
        sleep_mins:  isNaN(smNum)  ? null : smNum,
        weight_kg:   isNaN(wgtNum) ? null : wgtNum,
        water:       isNaN(watNum) ? null : watNum,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Health-Daten konnten nicht gespeichert werden.';
      alert(`${msg}\n\nPrüfe in Supabase: Row Level Security (INSERT/UPDATE) für „health_entries“ und Unique (user_id, date) für Upsert.`);
      return;
    }

    this.currentFormValues.set(v);
    this.showHealthDataModal = false;

    const today = new Date();
    const sinceWide = this.isoDate(this.addDays(today, -HEALTH_ENTRIES_LOOKBACK_DAYS));
    const { data } = await this.supabase.getHealthEntriesRange(user.id, sinceWide);
    this.healthEntriesCache.set(data ?? []);
    const entries = this.healthEntriesCache();
    this.chartWeek.set(this.buildWeekChart(entries, today));
    this.chartMonth.set(this.buildMonthChart(entries, today));
    this.rebuildHealthStatCards();
  }

  // ─── Chart-Builder ──────────────────────────────────────────────

  private buildWeekChart(
    entries: any[],
    today: Date
  ): Partial<Record<string, WeeklyDayData[]>> {

    const metrics: Array<{ key: string; getValue: (r: any) => number }> = [
      { key: 'calories', getValue: r => r.calories    ?? 0 },
      { key: 'sleep',    getValue: r => (r.sleep_hours ?? 0) * 60 + (r.sleep_mins ?? 0) },
      { key: 'weight',   getValue: r => r.weight_kg   ?? 0 },
      { key: 'water',    getValue: r => r.water        ?? 0 },
    ];

    const result: Partial<Record<string, WeeklyDayData[]>> = {};
    const todayIso = this.isoDate(today);
    const todayDow = (today.getDay() + 6) % 7;

    for (const { key, getValue } of metrics) {
      const valByDate: Record<string, number> = {};
      for (const row of entries) {
        const v = getValue(row);
        if (v > 0) valByDate[row.date] = v; // health_entries: 1 pro Tag → kein Summieren nötig
      }

      const days: WeeklyDayData[] = [];
      for (let i = 0; i < 7; i++) {
        const date    = this.addDays(today, i - todayDow);
        const dateIso = this.isoDate(date);
        const isPast  = dateIso <= todayIso;
        const curr    = valByDate[dateIso] ?? 0;
        const prev    = valByDate[this.isoDate(this.addDays(date, -7))] ?? 0;
        const denom   = Math.max(1, curr, prev);

        days.push({
          shortLabel:     DE_DAY_LABELS[i],
          current:        isPast ? Math.min(1, curr / denom) : 0,
          previous:       Math.min(1, prev / denom),
          hasCurrent:     isPast,
          isHighlightDay: dateIso === todayIso,
        });
      }

      result[key] = days;
    }

    return result;
  }

  private buildMonthChart(
    entries: any[],
    today: Date
  ): Partial<Record<string, WeeklyDayData[]>> {

    const metrics: Array<{ key: string; getValue: (r: any) => number }> = [
      { key: 'calories', getValue: r => r.calories    ?? 0 },
      { key: 'sleep',    getValue: r => (r.sleep_hours ?? 0) * 60 + (r.sleep_mins ?? 0) },
      { key: 'weight',   getValue: r => r.weight_kg   ?? 0 },
      { key: 'water',    getValue: r => r.water        ?? 0 },
    ];

    const result: Partial<Record<string, WeeklyDayData[]>> = {};

    for (const { key, getValue } of metrics) {
      const valByDate: Record<string, number> = {};
      for (const row of entries) {
        const v = getValue(row);
        if (v > 0) valByDate[row.date] = v;
      }

      const weekSums     = [0, 0, 0, 0];
      const weekSumsPrev = [0, 0, 0, 0];
      const weekCounts     = [0, 0, 0, 0];
      const weekCountsPrev = [0, 0, 0, 0];

      for (let w = 0; w < 4; w++) {
        for (let d = 0; d < 7; d++) {
          const offset = -(3 - w) * 7 - (6 - d);
          const date   = this.isoDate(this.addDays(today, offset));
          const prevDt = this.isoDate(this.addDays(today, offset - 28));
          if (valByDate[date]   != null) { weekSums[w]     += valByDate[date];   weekCounts[w]++;     }
          if (valByDate[prevDt] != null) { weekSumsPrev[w] += valByDate[prevDt]; weekCountsPrev[w]++; }
        }
      }

      // Für Weight: Durchschnitt statt Summe sinnvoller
      const isAvg = key === 'weight';
      const curr  = weekSums.map((s, i) => isAvg && weekCounts[i]     > 0 ? s / weekCounts[i]     : s);
      const prev  = weekSumsPrev.map((s, i) => isAvg && weekCountsPrev[i] > 0 ? s / weekCountsPrev[i] : s);

      result[key] = WEEK_LABELS.map((label, i) => {
        const denom = Math.max(1, curr[i], prev[i]);
        return {
          shortLabel:     label,
          current:        Math.min(1, curr[i] / denom),
          previous:       Math.min(1, prev[i] / denom),
          hasCurrent:     true,
          isHighlightDay: i === 3,
        };
      });
    }

    return result;
  }

  // ─── Stats-Builder (Backend, Zeitraum vs. Vorperiode) ───────────

  private rebuildHealthStatCards(): void {
    const today = new Date();
    const b = this.healthPeriodBounds(today, this.statsRange());
    const entries = this.healthEntriesCache();

    const curCal = this.sumCaloriesBetween(entries, b.curStart, b.curEnd);
    const curSleep = this.avgSleepMinutesBetween(entries, b.curStart, b.curEnd);
    const curW = this.avgWeightBetween(entries, b.curStart, b.curEnd);
    const curWater = this.sumWaterBetween(entries, b.curStart, b.curEnd);

    this.stats = [
      {
        variant: 'calories',
        label: 'Kalorien',
        periodLabel: b.periodTitle,
        primaryValue: curCal.toLocaleString('de-DE'),
        primaryUnit: 'kcal',
        trendText: '',
      },
      {
        variant: 'sleep',
        label: 'Schlaf',
        periodLabel: b.periodTitle,
        primaryValue: this.formatSleepMinutes(curSleep),
        trendText: '',
      },
      {
        variant: 'weight',
        label: 'Gewicht',
        periodLabel: b.periodTitle,
        primaryValue: curW != null ? curW.toFixed(1).replace('.', ',') : '0',
        primaryUnit: 'kg',
        trendText: '',
      },
      {
        variant: 'water',
        label: 'Wasser',
        periodLabel: b.periodTitle,
        primaryValue: curWater.toFixed(1).replace('.', ','),
        primaryUnit: 'Liter',
        trendText: '',
      },
    ];
  }

  private healthPeriodBounds(
    today: Date,
    range: HealthStatsRange
  ): {
    curStart: string;
    curEnd: string;
    prevStart: string;
    prevEnd: string;
    periodTitle: string;
    prevTitle: string;
  } {
    const curEnd = this.isoDate(today);
    if (range === 'week') {
      const todayDow = (today.getDay() + 6) % 7;
      const monday = this.addDays(today, -todayDow);
      const curStart = this.isoDate(monday);
      const prevEnd = this.isoDate(this.addDays(monday, -1));
      const prevStart = this.isoDate(this.addDays(monday, -7));
      return {
        curStart,
        curEnd,
        prevStart,
        prevEnd,
        periodTitle: 'Diese Woche',
        prevTitle: 'Vorwoche',
      };
    }
    const curStart = this.isoDate(this.addDays(today, -27));
    const prevEnd = this.isoDate(this.addDays(today, -28));
    const prevStart = this.isoDate(this.addDays(today, -55));
    return {
      curStart,
      curEnd,
      prevStart,
      prevEnd,
      periodTitle: 'Letzte 28 Tage',
      prevTitle: 'Vorherige 28 Tage',
    };
  }

  private sumCaloriesBetween(entries: any[], fromIso: string, toIso: string): number {
    let s = 0;
    for (const row of entries) {
      if (row.date < fromIso || row.date > toIso) continue;
      if (row.calories == null) continue;
      s += Number(row.calories);
    }
    return s;
  }

  private sumWaterBetween(entries: any[], fromIso: string, toIso: string): number {
    let s = 0;
    for (const row of entries) {
      if (row.date < fromIso || row.date > toIso) continue;
      if (row.water == null) continue;
      s += Number(row.water);
    }
    return s;
  }

  /** Durchschnittliche Schlafdauer in Minuten (nur Tage mit Stunden+Minuten) */
  private avgSleepMinutesBetween(entries: any[], fromIso: string, toIso: string): number {
    let sum = 0;
    let n = 0;
    for (const row of entries) {
      if (row.date < fromIso || row.date > toIso) continue;
      if (row.sleep_hours == null || row.sleep_mins == null) continue;
      sum += Number(row.sleep_hours) * 60 + Number(row.sleep_mins);
      n++;
    }
    return n ? sum / n : 0;
  }

  private avgWeightBetween(entries: any[], fromIso: string, toIso: string): number | null {
    let sum = 0;
    let n = 0;
    for (const row of entries) {
      if (row.date < fromIso || row.date > toIso) continue;
      if (row.weight_kg == null) continue;
      sum += Number(row.weight_kg);
      n++;
    }
    return n ? sum / n : null;
  }

  private formatSleepMinutes(totalMin: number): string {
    const h = Math.floor(totalMin / 60);
    const m = Math.round(totalMin % 60);
    return `${h}h ${m}m`;
  }

  private buildFormValues(data: any): HealthDataFormValues {
    return {
      caloriesKcal: data.calories    != null ? String(data.calories)    : '',
      sleepHours:   data.sleep_hours != null ? String(data.sleep_hours) : '',
      sleepMinutes: data.sleep_mins  != null ? String(data.sleep_mins)  : '',
      weightKg:     data.weight_kg   != null ? String(data.weight_kg)   : '',
      waterLiters:  data.water       != null ? String(data.water)       : '',
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  /** Lokales Kalenderdatum — gleiche Konvention wie `health_entries.date` */
  private isoDate(date: Date): string {
    return toLocalDateString(date);
  }
}
