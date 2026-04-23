import { Component } from '@angular/core';
import { GoalsTopNavComponent } from '../../shared/goals-top-nav/goals-top-nav.component';
import {
  HealthMetricCardComponent,
  HealthMetricTileConfig,
} from '../../shared/health-metric-card/health-metric-card.component';
import {
  GoalsMetricModalComponent,
  GoalsMetricValues,
} from '../../shared/goals-metric-modal/goals-metric-modal.component';
import { WeeklyProgressCardComponent } from '../../shared/weekly-progress-card/weekly-progress-card.component';
import { DashboardFooterComponent } from '../../shared/dashboard-footer/dashboard-footer.component';

type GoalsModalKind = 'off' | 'setGoals' | 'addProgress';

@Component({
  selector: 'app-my-goals',
  standalone: true,
  imports: [
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
export class MyGoalsComponent {
  /** Welches Metrik-Popup offen ist (nur eines) */
  modal: GoalsModalKind = 'off';

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

  openSetGoalsModal(): void {
    this.modal = 'setGoals';
  }

  openProgressModal(): void {
    this.modal = 'addProgress';
  }

  closeModal(): void {
    this.modal = 'off';
  }

  onSetGoalsSubmit(_values: GoalsMetricValues): void {
    // Anbindung API folgt
  }
}
