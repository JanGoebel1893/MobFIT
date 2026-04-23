import { Component, input } from '@angular/core';

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

@Component({
  selector: 'app-weekly-progress-card',
  standalone: true,
  templateUrl: './weekly-progress-card.component.html',
  styleUrl: './weekly-progress-card.component.css',
})
export class WeeklyProgressCardComponent {
  /** Später: vom Backend; vorerst Testdaten */
  days = input<readonly WeeklyDayData[]>(defaultWeeklyProgressDemo);
}
