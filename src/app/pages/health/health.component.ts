import { Component } from '@angular/core';
import { GoalsTopNavComponent } from '../../shared/goals-top-nav/goals-top-nav.component';
import {
  HealthStatCardComponent,
  HealthStatCardConfig,
} from '../../shared/health-stat-card/health-stat-card.component';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [GoalsTopNavComponent, HealthStatCardComponent],
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.css', '../../shared/styles/dashboard-shell.css'],
})
export class HealthComponent {
  /** Statische Demo-Daten bis Backend-Anbindung */
  readonly stats: readonly HealthStatCardConfig[] = [
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
}
