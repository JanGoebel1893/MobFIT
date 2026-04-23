import { Component } from '@angular/core';
import { GoalsTopNavComponent } from '../../shared/goals-top-nav/goals-top-nav.component';
import {
  HealthStatCardComponent,
  HealthStatCardConfig,
} from '../../shared/health-stat-card/health-stat-card.component';
import {
  HealthDataFormValues,
  HealthDataModalComponent,
} from '../../shared/health-data-modal/health-data-modal.component';
import { WeeklyProgressCardComponent } from '../../shared/weekly-progress-card/weekly-progress-card.component';
import { DashboardFooterComponent } from '../../shared/dashboard-footer/dashboard-footer.component';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [
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
export class HealthComponent {
  showHealthDataModal = false;

  /** Demo-Daten bis Backend-Anbindung */
  stats: HealthStatCardConfig[] = [
    {
      variant: 'calories',
      label: 'Kalorien',
      primaryValue: '1.840',
      primaryUnit: 'kcal',
      trendText: '+15% vs. letzter Eintrag',
    },
    {
      variant: 'sleep',
      label: 'Schlaf',
      primaryValue: '7h 12m',
      trendText: '+15% vs. letzter Eintrag',
    },
    {
      variant: 'weight',
      label: 'Gewicht',
      primaryValue: '82.4',
      primaryUnit: 'kg',
      trendText: '+15% vs. letzter Eintrag',
    },
    {
      variant: 'water',
      label: 'Wasser',
      primaryValue: '1',
      primaryUnit: 'Gläser',
      trendText: '+15% vs. letzter Eintrag',
    },
  ];

  openHealthDataModal(): void {
    this.showHealthDataModal = true;
  }

  closeHealthDataModal(): void {
    this.showHealthDataModal = false;
  }

  onHealthDataSave(v: HealthDataFormValues): void {
    const calDigits = v.caloriesKcal.replace(/[^\d]/g, '');
    const calNum = parseInt(calDigits, 10);
    const calDisplay =
      calDigits && !Number.isNaN(calNum) ? calNum.toLocaleString('de-DE') : v.caloriesKcal.trim();

    const sleepDisplay = `${v.sleepHours.trim()}h ${v.sleepMinutes.trim()}m`.trim();

    this.stats = [
      { ...this.stats[0], primaryValue: calDisplay, primaryUnit: 'kcal' },
      { ...this.stats[1], primaryValue: sleepDisplay, primaryUnit: undefined },
      { ...this.stats[2], primaryValue: v.weightKg.trim(), primaryUnit: 'kg' },
      { ...this.stats[3], primaryValue: v.waterLiters.trim(), primaryUnit: 'Liter' },
    ];
  }
}
