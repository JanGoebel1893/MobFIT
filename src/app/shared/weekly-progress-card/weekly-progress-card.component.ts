import { Component, computed, effect, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  ActivityIcon,
  BikeIcon,
  FootprintsIcon,
  LucideIconData,
  ZapIcon,
} from 'lucide-angular/src/icons';

/** Ein Tag in der Wochen-Chart (0–1 = Anteil der Balkenhöhe) */
export interface WeeklyDayData {
  shortLabel: string;
  /** Aktuelle Woche (0–1); `hasCurrent: false` → kein blauer Balken */
  current: number;
  /** Vorwoche / Vergleich (0–1) */
  previous: number;
  hasCurrent: boolean;
  /** Wochentag-Label hervorheben (z. B. heute) */
  isHighlightDay: boolean;
}

export const defaultWeeklyProgressDemo: readonly WeeklyDayData[] = [
  { shortLabel: 'Mo', current: 0.52, previous: 0.5, hasCurrent: true, isHighlightDay: false },
  { shortLabel: 'Di', current: 0.58, previous: 0.5, hasCurrent: true, isHighlightDay: false },
  { shortLabel: 'Mi', current: 0.45, previous: 0.52, hasCurrent: true, isHighlightDay: false },
  { shortLabel: 'Do', current: 0.95, previous: 0.88, hasCurrent: true, isHighlightDay: true },
  { shortLabel: 'Fr', current: 0, previous: 0.78, hasCurrent: false, isHighlightDay: false },
  { shortLabel: 'Sa', current: 0, previous: 0.9, hasCurrent: false, isHighlightDay: false },
  { shortLabel: 'So', current: 0, previous: 0.65, hasCurrent: false, isHighlightDay: false },
];

export type WeeklyRangeFilter = 'week' | 'month';

export interface WeeklyMetricOption {
  key: string;
  title: string;
  icon: LucideIconData;
}

const defaultMetricOptions: readonly WeeklyMetricOption[] = [
  { key: 'steps', title: 'Schritte', icon: FootprintsIcon },
  { key: 'run', title: 'Joggen', icon: ActivityIcon },
  { key: 'bike', title: 'Radfahren', icon: BikeIcon },
  { key: 'bolt', title: 'Aktivitätsminuten', icon: ZapIcon },
];

const demoByMetric: Record<string, readonly WeeklyDayData[]> = {
  steps: defaultWeeklyProgressDemo,
  run: [
    { shortLabel: 'Mo', current: 0.22, previous: 0.18, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Di', current: 0.35, previous: 0.25, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Mi', current: 0.12, previous: 0.28, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Do', current: 0.65, previous: 0.52, hasCurrent: true, isHighlightDay: true },
    { shortLabel: 'Fr', current: 0, previous: 0.4, hasCurrent: false, isHighlightDay: false },
    { shortLabel: 'Sa', current: 0, previous: 0.58, hasCurrent: false, isHighlightDay: false },
    { shortLabel: 'So', current: 0, previous: 0.33, hasCurrent: false, isHighlightDay: false },
  ],
  bike: [
    { shortLabel: 'Mo', current: 0.48, previous: 0.55, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Di', current: 0.62, previous: 0.5, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Mi', current: 0.35, previous: 0.42, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Do', current: 0.88, previous: 0.7, hasCurrent: true, isHighlightDay: true },
    { shortLabel: 'Fr', current: 0, previous: 0.6, hasCurrent: false, isHighlightDay: false },
    { shortLabel: 'Sa', current: 0, previous: 0.8, hasCurrent: false, isHighlightDay: false },
    { shortLabel: 'So', current: 0, previous: 0.52, hasCurrent: false, isHighlightDay: false },
  ],
  bolt: [
    { shortLabel: 'Mo', current: 0.4, previous: 0.35, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Di', current: 0.5, previous: 0.4, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Mi', current: 0.6, previous: 0.52, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Do', current: 0.72, previous: 0.6, hasCurrent: true, isHighlightDay: true },
    { shortLabel: 'Fr', current: 0, previous: 0.55, hasCurrent: false, isHighlightDay: false },
    { shortLabel: 'Sa', current: 0, previous: 0.68, hasCurrent: false, isHighlightDay: false },
    { shortLabel: 'So', current: 0, previous: 0.44, hasCurrent: false, isHighlightDay: false },
  ],
  calories: [
    { shortLabel: 'Mo', current: 0.55, previous: 0.5, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Di', current: 0.6, previous: 0.52, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Mi', current: 0.48, previous: 0.58, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Do', current: 0.72, previous: 0.66, hasCurrent: true, isHighlightDay: true },
    { shortLabel: 'Fr', current: 0, previous: 0.6, hasCurrent: false, isHighlightDay: false },
    { shortLabel: 'Sa', current: 0, previous: 0.7, hasCurrent: false, isHighlightDay: false },
    { shortLabel: 'So', current: 0, previous: 0.54, hasCurrent: false, isHighlightDay: false },
  ],
  sleep: [
    { shortLabel: 'Mo', current: 0.62, previous: 0.58, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Di', current: 0.7, previous: 0.6, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Mi', current: 0.56, previous: 0.64, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Do', current: 0.78, previous: 0.72, hasCurrent: true, isHighlightDay: true },
    { shortLabel: 'Fr', current: 0, previous: 0.68, hasCurrent: false, isHighlightDay: false },
    { shortLabel: 'Sa', current: 0, previous: 0.74, hasCurrent: false, isHighlightDay: false },
    { shortLabel: 'So', current: 0, previous: 0.6, hasCurrent: false, isHighlightDay: false },
  ],
  weight: [
    { shortLabel: 'Mo', current: 0.4, previous: 0.45, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Di', current: 0.42, previous: 0.44, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Mi', current: 0.38, previous: 0.43, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Do', current: 0.41, previous: 0.42, hasCurrent: true, isHighlightDay: true },
    { shortLabel: 'Fr', current: 0, previous: 0.4, hasCurrent: false, isHighlightDay: false },
    { shortLabel: 'Sa', current: 0, previous: 0.41, hasCurrent: false, isHighlightDay: false },
    { shortLabel: 'So', current: 0, previous: 0.39, hasCurrent: false, isHighlightDay: false },
  ],
  water: [
    { shortLabel: 'Mo', current: 0.5, previous: 0.45, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Di', current: 0.58, previous: 0.5, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Mi', current: 0.46, previous: 0.52, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'Do', current: 0.66, previous: 0.6, hasCurrent: true, isHighlightDay: true },
    { shortLabel: 'Fr', current: 0, previous: 0.55, hasCurrent: false, isHighlightDay: false },
    { shortLabel: 'Sa', current: 0, previous: 0.62, hasCurrent: false, isHighlightDay: false },
    { shortLabel: 'So', current: 0, previous: 0.48, hasCurrent: false, isHighlightDay: false },
  ],
};

const demoMonthByMetric: Record<string, readonly WeeklyDayData[]> = {
  steps: [
    { shortLabel: 'W1', current: 0.62, previous: 0.55, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W2', current: 0.7, previous: 0.6, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W3', current: 0.58, previous: 0.64, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W4', current: 0.82, previous: 0.76, hasCurrent: true, isHighlightDay: true },
  ],
  run: [
    { shortLabel: 'W1', current: 0.25, previous: 0.2, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W2', current: 0.4, previous: 0.35, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W3', current: 0.3, previous: 0.42, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W4', current: 0.55, previous: 0.48, hasCurrent: true, isHighlightDay: true },
  ],
  bike: [
    { shortLabel: 'W1', current: 0.5, previous: 0.58, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W2', current: 0.66, previous: 0.6, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W3', current: 0.6, previous: 0.52, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W4', current: 0.78, previous: 0.7, hasCurrent: true, isHighlightDay: true },
  ],
  bolt: [
    { shortLabel: 'W1', current: 0.45, previous: 0.4, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W2', current: 0.6, previous: 0.52, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W3', current: 0.55, previous: 0.6, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W4', current: 0.72, previous: 0.66, hasCurrent: true, isHighlightDay: true },
  ],
  calories: [
    { shortLabel: 'W1', current: 0.6, previous: 0.55, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W2', current: 0.68, previous: 0.6, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W3', current: 0.58, previous: 0.62, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W4', current: 0.74, previous: 0.7, hasCurrent: true, isHighlightDay: true },
  ],
  sleep: [
    { shortLabel: 'W1', current: 0.66, previous: 0.62, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W2', current: 0.72, previous: 0.65, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W3', current: 0.6, previous: 0.68, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W4', current: 0.78, previous: 0.73, hasCurrent: true, isHighlightDay: true },
  ],
  weight: [
    { shortLabel: 'W1', current: 0.42, previous: 0.44, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W2', current: 0.41, previous: 0.43, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W3', current: 0.4, previous: 0.42, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W4', current: 0.41, previous: 0.41, hasCurrent: true, isHighlightDay: true },
  ],
  water: [
    { shortLabel: 'W1', current: 0.56, previous: 0.5, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W2', current: 0.62, previous: 0.55, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W3', current: 0.54, previous: 0.6, hasCurrent: true, isHighlightDay: false },
    { shortLabel: 'W4', current: 0.7, previous: 0.64, hasCurrent: true, isHighlightDay: true },
  ],
};

@Component({
  selector: 'app-weekly-progress-card',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './weekly-progress-card.component.html',
  styleUrl: './weekly-progress-card.component.css',
})
export class WeeklyProgressCardComponent {
  /** Optional: echte Daten vom Parent (statt Demo). */
  daysByMetric = input<Partial<Record<string, readonly WeeklyDayData[]>> | null>(null);
  daysByMetricMonth = input<Partial<Record<string, readonly WeeklyDayData[]>> | null>(null);

  /** Filter-Buttons (nur dort anzeigen, wo gewünscht). */
  showFilters = input(false);
  metricOptions = input<readonly WeeklyMetricOption[] | null>(null);

  /** Zeitraum-Toggle (Woche/Monat) */
  showRangeToggle = input(false);
  range = input<WeeklyRangeFilter>('week');
  rangeChange = output<WeeklyRangeFilter>();

  /**
   * Wenn true: nur Daten vom Parent (kein Demo-Fallback).
   * Leere/fehlende Keys → leeres Chart (Parent soll 0-Balken liefern).
   */
  useParentChartDataOnly = input(false);

  selectedMetric = signal<string>('steps');

  options = computed<readonly WeeklyMetricOption[]>(() => this.metricOptions() ?? defaultMetricOptions);

  constructor() {
    effect(() => {
      const opts = this.options();
      if (!opts.length) return;
      const selected = this.selectedMetric();
      if (opts.some((o) => o.key === selected)) return;
      this.selectedMetric.set(opts[0].key);
    });
  }

  /** Chart-Daten (per Filter) */
  days = computed<readonly WeeklyDayData[]>(() => {
    const metric = this.selectedMetric();
    const parentOnly = this.useParentChartDataOnly();

    if (this.range() === 'month') {
      const bundle = this.daysByMetricMonth();
      const fromParent = bundle?.[metric];
      if (parentOnly) return fromParent ?? [];
      return fromParent ?? demoMonthByMetric[metric] ?? [];
    }

    const bundle = this.daysByMetric();
    const fromParent = bundle?.[metric];
    if (parentOnly) return fromParent ?? [];
    return fromParent ?? demoByMetric[metric] ?? [];
  });

  setMetric(metric: string): void {
    this.selectedMetric.set(metric);
  }

  setRange(range: WeeklyRangeFilter): void {
    if (this.range() === range) return;
    this.rangeChange.emit(range);
  }
}
