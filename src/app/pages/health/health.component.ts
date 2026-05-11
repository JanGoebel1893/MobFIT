import { Component, OnInit, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { DropletIcon, FlameIcon, MoonIcon, PlusIcon, WeightIcon } from 'lucide-angular/src/icons';
import { GoalsTopNavComponent } from '../../shared/goals-top-nav/goals-top-nav.component';
import { HealthStatCardComponent, HealthStatCardConfig } from '../../shared/health-stat-card/health-stat-card.component';
import { HealthDataFormValues, HealthDataModalComponent } from '../../shared/health-data-modal/health-data-modal.component';
import { SupabaseService } from '../../services/supabase.service';
import { WeeklyProgressCardComponent, WeeklyDayData } from '../../shared/weekly-progress-card/weekly-progress-card.component';
import { DashboardFooterComponent } from '../../shared/dashboard-footer/dashboard-footer.component';

type HealthStatsRange = 'week' | 'month';

const DE_DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WEEK_LABELS   = ['W1', 'W2', 'W3', 'W4'];

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
    { variant: 'calories', label: 'Kalorien', primaryValue: '-', primaryUnit: 'kcal',  trendText: 'Noch kein Eintrag' },
    { variant: 'sleep',    label: 'Schlaf',   primaryValue: '-',                        trendText: 'Noch kein Eintrag' },
    { variant: 'weight',   label: 'Gewicht',  primaryValue: '-', primaryUnit: 'kg',     trendText: 'Noch kein Eintrag' },
    { variant: 'water',    label: 'Wasser',   primaryValue: '-', primaryUnit: 'Liter',  trendText: 'Noch kein Eintrag' },
  ];

  chartWeek  = signal<Partial<Record<string, readonly WeeklyDayData[]>>>({});
  chartMonth = signal<Partial<Record<string, readonly WeeklyDayData[]>>>({});

  constructor(private supabase: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    const user = await this.supabase.getUser();
    if (!user) { this.isLoading.set(false); return; }

    const today     = new Date();
    const sincePrev = this.isoDate(this.addDays(today, -13));

    const [latestRes, rangeRes] = await Promise.all([
      this.supabase.getLatestHealthEntry(user.id),
      this.supabase.getHealthEntriesRange(user.id, sincePrev),
    ]);

    if (latestRes.data) {
      this.applyEntryToStats(latestRes.data);
      this.currentFormValues.set(this.buildFormValues(latestRes.data));
    }

    if (rangeRes.data) {
      this.chartWeek.set(this.buildWeekChart(rangeRes.data, today));

      // Monatsdaten nachladen (28 + 28 Tage)
      const sincePrevMonth = this.isoDate(this.addDays(today, -55));
      const { data: monthData } = await this.supabase.getHealthEntriesRange(user.id, sincePrevMonth);
      if (monthData) this.chartMonth.set(this.buildMonthChart(monthData, today));
    }

    this.isLoading.set(false);
  }

  openHealthDataModal(): void  { this.showHealthDataModal = true;  }
  closeHealthDataModal(): void { this.showHealthDataModal = false; }
  setStatsRange(range: HealthStatsRange): void { this.statsRange.set(range); }

  async onHealthDataSave(v: HealthDataFormValues): Promise<void> {
    this.updateStatsFromForm(v);
    this.currentFormValues.set(v);
    this.showHealthDataModal = false;

    const user = await this.supabase.getUser();
    if (!user) return;

    const calNum = parseInt(v.caloriesKcal.replace(/\D/g, ''), 10);
    const shNum  = parseInt(v.sleepHours.trim(), 10);
    const smNum  = parseInt(v.sleepMinutes.trim(), 10);
    const wgtNum = parseFloat(v.weightKg.trim().replace(',', '.'));
    const watNum = parseFloat(v.waterLiters.trim().replace(',', '.'));

    await this.supabase.upsertHealthEntry(user.id, {
      calories:    isNaN(calNum) ? null : calNum,
      sleep_hours: isNaN(shNum)  ? null : shNum,
      sleep_mins:  isNaN(smNum)  ? null : smNum,
      weight_kg:   isNaN(wgtNum) ? null : wgtNum,
      water:       isNaN(watNum) ? null : watNum,
    });

    // Chart nach Speichern aktualisieren
    const today      = new Date();
    const sincePrev  = this.isoDate(this.addDays(today, -13));
    const { data }   = await this.supabase.getHealthEntriesRange(user.id, sincePrev);
    if (data) this.chartWeek.set(this.buildWeekChart(data, today));
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

      const maxPrev = Math.max(
        1,
        ...Array.from({ length: 7 }, (_, i) => {
          const d = this.isoDate(this.addDays(today, i - 7 - todayDow));
          return valByDate[d] ?? 0;
        })
      );

      const days: WeeklyDayData[] = [];
      for (let i = 0; i < 7; i++) {
        const date    = this.addDays(today, i - todayDow);
        const dateIso = this.isoDate(date);
        const isPast  = dateIso <= todayIso;
        const curr    = valByDate[dateIso] ?? 0;
        const prev    = valByDate[this.isoDate(this.addDays(date, -7))] ?? 0;

        days.push({
          shortLabel:     DE_DAY_LABELS[i],
          current:        isPast ? Math.min(1, curr / maxPrev) : 0,
          previous:       Math.min(1, prev / maxPrev),
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

      const maxVal = Math.max(1, ...curr, ...prev);
      result[key] = WEEK_LABELS.map((label, i) => ({
        shortLabel:     label,
        current:        Math.min(1, curr[i] / maxVal),
        previous:       Math.min(1, prev[i] / maxVal),
        hasCurrent:     true,
        isHighlightDay: i === 3,
      }));
    }

    return result;
  }

  // ─── Stats-Builder ──────────────────────────────────────────────

  private applyEntryToStats(data: any): void {
    const sleepDisplay = (data.sleep_hours != null && data.sleep_mins != null)
      ? `${data.sleep_hours}h ${data.sleep_mins}m` : '-';

    this.stats = [
      { ...this.stats[0], primaryValue: data.calories  != null ? data.calories.toLocaleString('de-DE') : '-' },
      { ...this.stats[1], primaryValue: sleepDisplay, primaryUnit: undefined },
      { ...this.stats[2], primaryValue: data.weight_kg != null ? String(data.weight_kg) : '-' },
      { ...this.stats[3], primaryValue: data.water     != null ? String(data.water)     : '-' },
    ];
  }

  private updateStatsFromForm(v: HealthDataFormValues): void {
    const calDigits  = v.caloriesKcal.replace(/\D/g, '');
    const calNum     = parseInt(calDigits, 10);
    const calDisplay = calDigits && !isNaN(calNum) ? calNum.toLocaleString('de-DE') : '-';

    this.stats = [
      { ...this.stats[0], primaryValue: calDisplay },
      { ...this.stats[1], primaryValue: `${v.sleepHours.trim()}h ${v.sleepMinutes.trim()}m`, primaryUnit: undefined },
      { ...this.stats[2], primaryValue: v.weightKg.trim() },
      { ...this.stats[3], primaryValue: v.waterLiters.trim(), primaryUnit: 'Liter' },
    ];
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

  private isoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
