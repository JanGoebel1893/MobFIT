import { Component } from '@angular/core';
import { GoalsTopNavComponent } from '../../shared/goals-top-nav/goals-top-nav.component';
import {
  HealthMetricCardComponent,
  HealthMetricTileConfig,
} from '../../shared/health-metric-card/health-metric-card.component';

@Component({
  selector: 'app-my-goals',
  standalone: true,
  imports: [GoalsTopNavComponent, HealthMetricCardComponent],
  templateUrl: './my-goals.component.html',
  styleUrls: ['./my-goals.component.css', '../../shared/styles/dashboard-shell.css'],
})
export class MyGoalsComponent {
  /** Demo-Daten bis Backend */
  readonly tiles: readonly HealthMetricTileConfig[] = [
    {
      label: 'Schritte',
      currentValue: '8.432',
      goalText: '/ 10.000',
      progressPercent: 84,
      accent: 'blue',
      icon: 'steps',
    },
    {
      label: 'Joggen',
      currentValue: '12.5',
      currentSuffix: ' km',
      goalText: '/ 20km',
      progressPercent: 84,
      accent: 'blue',
      icon: 'run',
    },
    {
      label: 'Radfahren',
      currentValue: '45',
      currentSuffix: ' min',
      goalText: '/ 60min',
      progressPercent: 72,
      accent: 'red',
      icon: 'bike',
    },
    {
      label: 'Aktivitätsminuten',
      currentValue: '32',
      goalText: '/ 30',
      progressPercent: 100,
      accent: 'green',
      icon: 'bolt',
      goalReached: true,
    },
  ];
}
