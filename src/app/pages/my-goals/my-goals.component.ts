import { Component, OnInit, signal } from '@angular/core';
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
import { SupabaseService } from '../../services/supabase.service';

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
export class MyGoalsComponent implements OnInit {
  modal: GoalsModalKind = 'off';
  isLoading = signal(true);

  setGoalsValues = signal<GoalsMetricValues>({
    steps: '10000',
    jogKm: '20',
    bikeMin: '60',
    activityMin: '30',
  });

  tiles: HealthMetricTileConfig[] = [
    {
      label: 'Schritte',
      currentValue: '4000',
      goalText: '/ ',
      progressPercent: 40,
      accent: 'blue',
      icon: 'steps',
    },
    {
      label: 'Joggen',
      currentValue: '2',
      currentSuffix: ' km',
      goalText: '/ ',
      progressPercent: 6,
      accent: 'blue',
      icon: 'run',
    },
    {
      label: 'Radfahren',
      currentValue: '20',
      currentSuffix: ' min',
      goalText: '/ ',
      progressPercent: 80,
      accent: 'red',
      icon: 'bike',
    },
    {
      label: 'Aktivitätsminuten',
      currentValue: '32',
      goalText: '/ ',
      progressPercent: 53,
      accent: 'green',
      icon: 'bolt',
      goalReached: true,
    },
  ];

  constructor(private supabase: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    const user = await this.supabase.getUser();
    if (!user) return;

    const { data, error } = await this.supabase.getGoalTargets(user.id);
    if (error || !data) return;

    const values: GoalsMetricValues = {
      steps: data.steps != null ? String(data.steps) : '',
      jogKm: data.jog_km != null ? String(data.jog_km) : '',
      bikeMin: data.bike_min != null ? String(data.bike_min) : '',
      activityMin: data.activity_min != null ? String(data.activity_min) : '',
    };

    this.setGoalsValues.set(values);
    this.applyGoalsToTiles(values);
  }

  openSetGoalsModal(): void {
    this.modal = 'setGoals';
  }

  openProgressModal(): void {
    this.modal = 'addProgress';
  }

  closeModal(): void {
    this.modal = 'off';
  }

  async onSetGoalsSubmit(values: GoalsMetricValues): Promise<void> {
    this.setGoalsValues.set(values);
    this.applyGoalsToTiles(values);
    this.closeModal();

    const user = await this.supabase.getUser();
    if (!user) return;

    const result = await this.supabase.upsertGoalTargets(user.id, {
      steps: this.toInt(values.steps),
      jog_km: this.toFloat(values.jogKm),
      bike_min: this.toInt(values.bikeMin),
      activity_min: this.toInt(values.activityMin),
    });

    console.log('Goal upsert result:', result);
  }

  private applyGoalsToTiles(values: GoalsMetricValues): void {
    const stepsGoal = this.toInt(values.steps);
    const jogGoal = this.toFloat(values.jogKm);
    const bikeGoal = this.toInt(values.bikeMin);
    const activityGoal = this.toInt(values.activityMin);

    const currentSteps = this.toInt(this.tiles[0].currentValue.replace(/\./g, ''));
    const currentJog = this.toFloat(this.tiles[1].currentValue);
    const currentBike = this.toInt(this.tiles[2].currentValue);
    const currentActivity = this.toInt(this.tiles[3].currentValue);

    this.tiles = [
      {
        ...this.tiles[0],
        goalText: `/ ${stepsGoal.toLocaleString('de-DE')}`,
        progressPercent: this.calcPercent(currentSteps, stepsGoal),
      },
      {
        ...this.tiles[1],
        goalText: `/ ${this.formatNumber(jogGoal)} km`,
        progressPercent: this.calcPercent(currentJog, jogGoal),
      },
      {
        ...this.tiles[2],
        goalText: `/ ${bikeGoal} min`,
        progressPercent: this.calcPercent(currentBike, bikeGoal),
      },
      {
        ...this.tiles[3],
        goalText: `/ ${activityGoal}`,
        progressPercent: this.calcPercent(currentActivity, activityGoal),
        goalReached: currentActivity >= activityGoal,
      },
    ];
  }

  private calcPercent(current: number, goal: number): number {
    if (!goal || goal <= 0) return 0;
    return Math.min(100, Math.round((current / goal) * 100));
  }

  private toInt(value: string): number {
    const n = parseInt(value.replace(/[^\d]/g, ''), 10);
    return Number.isNaN(n) ? 0 : n;
  }

  private toFloat(value: string): number {
    const n = parseFloat(value.replace(',', '.'));
    return Number.isNaN(n) ? 0 : n;
  }

  private formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toString().replace('.', ',');
  }
}
