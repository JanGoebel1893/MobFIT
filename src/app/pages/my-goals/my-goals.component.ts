import { Component, OnInit, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ActivityIcon, BikeIcon, FootprintsIcon, PencilIcon, PlusIcon, ZapIcon } from 'lucide-angular/src/icons';
import { GoalsTopNavComponent } from '../../shared/goals-top-nav/goals-top-nav.component';
import { HealthMetricCardComponent, HealthMetricTileConfig } from '../../shared/health-metric-card/health-metric-card.component';
import { GoalsMetricModalComponent, GoalsMetricValues, ProgressEntry } from '../../shared/goals-metric-modal/goals-metric-modal.component';
import { WeeklyProgressCardComponent, WeeklyDayData } from '../../shared/weekly-progress-card/weekly-progress-card.component';
import { DashboardFooterComponent } from '../../shared/dashboard-footer/dashboard-footer.component';
import { SupabaseService } from '../../services/supabase.service';
import { toLocalDateString } from '../../shared/utils/local-date.utils';

type GoalsModalKind = 'off' | 'setGoals' | 'addProgress';
type GoalsStatsRange = 'week' | 'month';

// Mo=0 … So=6  →  deutsch: Mo Di Mi Do Fr Sa So
const DE_DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WEEK_LABELS   = ['W1', 'W2', 'W3', 'W4'];

/** Monats-Chart braucht bis zu 55 Tage zurück; Puffer für lokale Daten → 70 Tage laden */
const ACTIVITY_LOGS_LOOKBACK_DAYS = 69;

const GOALS_MOTIVATION_QUOTES = [
  'Sicher, dass du den Kühlschrank heute noch aufmachen willst?',
  'So wirst du nie einen Partner bekommen',
  'Dein zukünftiges Ich schämt sich gerade für dich',
  'Wenn Ausreden Kalorien verbrennen würden, wärst du schon Weltmeister',
  'Wenn ich darauf wetten würde, dass du es nicht schaffst, würde ich reich werden',
  'Dein Spiegelbild schämt sich für dich',
  'Selbst deine Ausreden haben Übergewicht',
  'Hör auf zu schwitzen, bevor du trainierst',
] as const;

@Component({
  selector: 'app-my-goals',
  standalone: true,
  imports: [
    LucideAngularModule,
    GoalsTopNavComponent,
    HealthMetricCardComponent,
    GoalsMetricModalComponent,
    WeeklyProgressCardComponent,
    DashboardFooterComponent,
  ],
  templateUrl: './my-goals.component.html',
  styleUrls: [
    '../../shared/styles/legal-route-layout.css',
    './my-goals.component.css',
    '../../shared/styles/dashboard-shell.css',
  ],
})
export class MyGoalsComponent implements OnInit {
  modal: GoalsModalKind = 'off';
  isLoading = signal(true);
  statsRange = signal<GoalsStatsRange>('week');
  readonly icons = { Pencil: PencilIcon, Plus: PlusIcon };
  readonly weeklyMetricOptions = [
    { key: 'steps',       title: 'Schritte',           icon: FootprintsIcon },
    { key: 'run',         title: 'Joggen',              icon: ActivityIcon   },
    { key: 'bike',        title: 'Radfahren',           icon: BikeIcon       },
    { key: 'bolt',        title: 'Aktivitätsminuten',   icon: ZapIcon        },
  ] as const;

  setGoalsValues = signal<GoalsMetricValues>({
    steps: '10000', jogKm: '20', bikeMin: '60', activityMin: '30',
  });

  private todaySums = { steps: 0, jogKm: 0, bikeMin: 0, activityMin: 0 };

  /** Für Charts und Vergleichszeile (ca. 10 Wochen) */
  activityLogsCache = signal<any[]>([]);

  tiles: HealthMetricTileConfig[] = [
    { label: 'Schritte',          currentValue: '0', goalText: '/ –',      progressPercent: 0, accent: 'blue',  icon: 'steps' },
    { label: 'Joggen',            currentValue: '0', currentSuffix: ' km',  goalText: '/ –',   progressPercent: 0, accent: 'blue',  icon: 'run'  },
    { label: 'Radfahren',         currentValue: '0', currentSuffix: ' min', goalText: '/ –',   progressPercent: 0, accent: 'red',   icon: 'bike' },
    { label: 'Aktivitätsminuten', currentValue: '0', currentSuffix: ' min', goalText: '/ –',   progressPercent: 0, accent: 'green', icon: 'bolt' },
  ];

  quote = signal<string>('');

  // Chart-Daten für WeeklyProgressCard
  chartWeek  = signal<Partial<Record<string, readonly WeeklyDayData[]>>>({});
  chartMonth = signal<Partial<Record<string, readonly WeeklyDayData[]>>>({});

  constructor(private supabase: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    this.pickRandomMotivationQuote();

    const user = await this.supabase.getUser();
    if (!user) { this.isLoading.set(false); return; }

    const today = new Date();
    const sinceWide = this.isoDate(this.addDays(today, -ACTIVITY_LOGS_LOOKBACK_DAYS));

    const [goalsRes, logsRes, rangeRes] = await Promise.all([
      this.supabase.getGoalTargets(user.id),
      this.supabase.getTodayActivitySums(user.id),
      this.supabase.getActivityLogsRange(user.id, sinceWide),
    ]);

    // Ziele laden
    if (goalsRes.data) {
      const g = goalsRes.data;
      this.setGoalsValues.set({
        steps:       g.steps        != null ? String(g.steps)        : '',
        jogKm:       g.jog_km       != null ? String(g.jog_km)       : '',
        bikeMin:     g.bike_min     != null ? String(g.bike_min)     : '',
        activityMin: g.activity_min != null ? String(g.activity_min) : '',
      });
    }

    // Tagessummen für Kacheln
    if (logsRes.data?.length) {
      this.todaySums = logsRes.data.reduce(
        (acc, row) => ({
          steps:       acc.steps       + (row.steps        ?? 0),
          jogKm:       acc.jogKm       + Number(row.jog_km ?? 0),
          bikeMin:     acc.bikeMin     + (row.bike_min     ?? 0),
          activityMin: acc.activityMin + (row.activity_min ?? 0),
        }),
        { steps: 0, jogKm: 0, bikeMin: 0, activityMin: 0 }
      );
    }

    this.activityLogsCache.set(rangeRes.data ?? []);
    const logs = this.activityLogsCache();
    this.chartWeek.set(this.buildWeekChart(logs, today));
    this.chartMonth.set(this.buildMonthChart(logs, today));

    this.rebuildTiles();
    this.isLoading.set(false);
  }

  openSetGoalsModal(): void  { this.modal = 'setGoals';    }
  openProgressModal(): void  { this.modal = 'addProgress'; }
  closeModal(): void         { this.modal = 'off';         }
  setStatsRange(r: GoalsStatsRange): void {
    this.statsRange.set(r);
  }

  async onSetGoalsSubmit(values: GoalsMetricValues): Promise<void> {
    this.setGoalsValues.set(values);
    this.rebuildTiles();
    this.closeModal();
    const user = await this.supabase.getUser();
    if (!user) return;
    await this.supabase.upsertGoalTargets(user.id, {
      steps:        this.toInt(values.steps),
      jog_km:       this.toFloat(values.jogKm),
      bike_min:     this.toInt(values.bikeMin),
      activity_min: this.toInt(values.activityMin),
    });
  }

  async onProgressAdd(entry: ProgressEntry): Promise<void> {
    const user = await this.supabase.getUser();
    if (!user) return;

    const payload = {
      steps:        entry.metric === 'steps'       ? this.toIntOrNull(entry.value)   : null,
      jog_km:       entry.metric === 'jogKm'       ? this.toFloatOrNull(entry.value) : null,
      bike_min:     entry.metric === 'bikeMin'     ? this.toIntOrNull(entry.value)   : null,
      activity_min: entry.metric === 'activityMin' ? this.toIntOrNull(entry.value)   : null,
    };

    await this.supabase.addActivityLog(user.id, payload);

    switch (entry.metric) {
      case 'steps':       this.todaySums.steps       += this.toInt(entry.value);   break;
      case 'jogKm':       this.todaySums.jogKm       += this.toFloat(entry.value); break;
      case 'bikeMin':     this.todaySums.bikeMin     += this.toInt(entry.value);   break;
      case 'activityMin': this.todaySums.activityMin += this.toInt(entry.value);   break;
    }

    const today = new Date();
    const sinceWide = this.isoDate(this.addDays(today, -ACTIVITY_LOGS_LOOKBACK_DAYS));
    const { data } = await this.supabase.getActivityLogsRange(user.id, sinceWide);
    this.activityLogsCache.set(data ?? []);
    const logs = this.activityLogsCache();
    this.chartWeek.set(this.buildWeekChart(logs, today));
    this.chartMonth.set(this.buildMonthChart(logs, today));

    this.rebuildTiles();
  }

  // ─── Chart-Builder ──────────────────────────────────────────────

  /**
   * Wochen-Chart: pro Wochentag zwei Balken (diese Woche / Vorwoche).
   * Pro Tag: Höhe = Anteil am max(dieser Tag, gleicher Tag Vorwoche) → direkter Längenvergleich.
   */
  private buildWeekChart(
    logs: any[],
    today: Date
  ): Partial<Record<string, WeeklyDayData[]>> {

    const metrics: Array<{ key: string; field: string }> = [
      { key: 'steps', field: 'steps'        },
      { key: 'run',   field: 'jog_km'       },
      { key: 'bike',  field: 'bike_min'     },
      { key: 'bolt',  field: 'activity_min' },
    ];

    const result: Partial<Record<string, WeeklyDayData[]>> = {};
    const todayIso = this.isoDate(today);
    const todayDow = (today.getDay() + 6) % 7; // Mo=0 … So=6

    for (const { key, field } of metrics) {
      const sumByDate: Record<string, number> = {};
      for (const row of logs) {
        const v = Number(row[field] ?? 0);
        if (v > 0) sumByDate[row.date] = (sumByDate[row.date] ?? 0) + v;
      }

      const currWeekDays: WeeklyDayData[] = [];
      for (let i = 0; i < 7; i++) {
        const date = this.addDays(today, i - todayDow);
        const dateIso = this.isoDate(date);
        const isPast = dateIso <= todayIso;
        const currVal = sumByDate[dateIso] ?? 0;
        const prevDate = this.isoDate(this.addDays(date, -7));
        const prevVal = sumByDate[prevDate] ?? 0;
        const denom = Math.max(1, currVal, prevVal);

        currWeekDays.push({
          shortLabel:     DE_DAY_LABELS[i],
          current:        isPast ? Math.min(1, currVal / denom) : 0,
          previous:       Math.min(1, prevVal / denom),
          hasCurrent:     isPast,
          isHighlightDay: dateIso === todayIso,
        });
      }

      result[key] = currWeekDays;
    }

    return result;
  }

  /** Baut Monats-Chart: 4 Kalenderwochen, aktuelle vs. Vormonat (28 Tage davor) */
  private buildMonthChart(
    logs: any[],
    today: Date
  ): Partial<Record<string, WeeklyDayData[]>> {

    const metrics: Array<{ key: string; field: string }> = [
      { key: 'steps', field: 'steps'        },
      { key: 'run',   field: 'jog_km'       },
      { key: 'bike',  field: 'bike_min'     },
      { key: 'bolt',  field: 'activity_min' },
    ];

    const result: Partial<Record<string, WeeklyDayData[]>> = {};

    for (const { key, field } of metrics) {
      const sumByDate: Record<string, number> = {};
      for (const row of logs) {
        const v = Number(row[field] ?? 0);
        if (v > 0) sumByDate[row.date] = (sumByDate[row.date] ?? 0) + v;
      }

      // Wochensummen: W4=letzte Woche, W3=..., W1=älteste
      const weekSums   = [0, 0, 0, 0]; // aktueller Monat
      const weekSumsPrev = [0, 0, 0, 0]; // Monat davor

      for (let w = 0; w < 4; w++) {
        for (let d = 0; d < 7; d++) {
          const offset  = -(3 - w) * 7 - (6 - d);
          const date    = this.isoDate(this.addDays(today, offset));
          const prevDt  = this.isoDate(this.addDays(today, offset - 28));
          weekSums[w]      += sumByDate[date]   ?? 0;
          weekSumsPrev[w]  += sumByDate[prevDt] ?? 0;
        }
      }

      result[key] = WEEK_LABELS.map((label, i) => {
        const denom = Math.max(1, weekSums[i], weekSumsPrev[i]);
        return {
          shortLabel:     label,
          current:        Math.min(1, weekSums[i] / denom),
          previous:       Math.min(1, weekSumsPrev[i] / denom),
          hasCurrent:     true,
          isHighlightDay: i === 3,
        };
      });
    }

    return result;
  }

  // ─── Tile-Builder ────────────────────────────────────────────────

  private rebuildTiles(): void {
    const goals        = this.setGoalsValues();
    const stepsGoal    = this.toInt(goals.steps);
    const jogGoal      = this.toFloat(goals.jogKm);
    const bikeGoal     = this.toInt(goals.bikeMin);
    const activityGoal = this.toInt(goals.activityMin);
    const { steps, jogKm, bikeMin, activityMin } = this.todaySums;

    this.tiles = [
      { ...this.tiles[0], currentValue: steps.toLocaleString('de-DE'), goalText: stepsGoal ? `/ ${stepsGoal.toLocaleString('de-DE')}` : '/ –', progressPercent: this.calcPercent(steps, stepsGoal), goalReached: stepsGoal > 0 && steps >= stepsGoal },
      { ...this.tiles[1], currentValue: this.formatNumber(jogKm), goalText: jogGoal ? `/ ${this.formatNumber(jogGoal)} km` : '/ –', progressPercent: this.calcPercent(jogKm, jogGoal), goalReached: jogGoal > 0 && jogKm >= jogGoal },
      { ...this.tiles[2], currentValue: String(bikeMin), goalText: bikeGoal ? `/ ${bikeGoal} min` : '/ –', progressPercent: this.calcPercent(bikeMin, bikeGoal), goalReached: bikeGoal > 0 && bikeMin >= bikeGoal },
      { ...this.tiles[3], currentValue: String(activityMin), goalText: activityGoal ? `/ ${activityGoal} min` : '/ –', progressPercent: this.calcPercent(activityMin, activityGoal), goalReached: activityGoal > 0 && activityMin >= activityGoal },
    ];
  }

  // ─── Helpers ────────────────────────────────────────────────────

  private pickRandomMotivationQuote(): void {
    const i = Math.floor(Math.random() * GOALS_MOTIVATION_QUOTES.length);
    this.quote.set(GOALS_MOTIVATION_QUOTES[i]);
  }

  private calcPercent(current: number, goal: number): number {
    if (!goal || goal <= 0) return 0;
    return Math.min(100, Math.round((current / goal) * 100));
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  /** Lokales Kalenderdatum — gleiche Konvention wie `activity_logs.date` / Supabase-Abfragen */
  private isoDate(date: Date): string {
    return toLocalDateString(date);
  }

  private toInt(value: string): number {
    const n = parseInt(value.replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? 0 : n;
  }

  private toIntOrNull(value: string): number | null {
    const n = parseInt(value.replace(/\D/g, ''), 10);
    return Number.isNaN(n) || n === 0 ? null : n;
  }

  private toFloat(value: string): number {
    const n = parseFloat(value.replace(',', '.'));
    return Number.isNaN(n) ? 0 : n;
  }

  private toFloatOrNull(value: string): number | null {
    const n = parseFloat(value.replace(',', '.'));
    return Number.isNaN(n) || n === 0 ? null : n;
  }

  private formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toString().replace('.', ',');
  }
}
