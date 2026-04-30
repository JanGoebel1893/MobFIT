import { Component, OnInit, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ActivityIcon, BikeIcon, FootprintsIcon, PencilIcon, PlusIcon, ZapIcon } from 'lucide-angular/src/icons';
import { GoalsTopNavComponent } from '../../shared/goals-top-nav/goals-top-nav.component';
import {
  HealthMetricCardComponent,
  HealthMetricTileConfig,
} from '../../shared/health-metric-card/health-metric-card.component';
import {
  GoalsMetricModalComponent,
  GoalsMetricValues,
  ProgressEntry,
} from '../../shared/goals-metric-modal/goals-metric-modal.component';
import { WeeklyProgressCardComponent } from '../../shared/weekly-progress-card/weekly-progress-card.component';
import { DashboardFooterComponent } from '../../shared/dashboard-footer/dashboard-footer.component';
import { SupabaseService } from '../../services/supabase.service';

type GoalsModalKind = 'off' | 'setGoals' | 'addProgress';
type GoalsStatsRange = 'week' | 'month';

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
    { key: 'steps', title: 'Schritte', icon: FootprintsIcon },
    { key: 'run', title: 'Joggen', icon: ActivityIcon },
    { key: 'bike', title: 'Radfahren', icon: BikeIcon },
    { key: 'bolt', title: 'Aktivitätsminuten', icon: ZapIcon },
  ] as const;

  setGoalsValues = signal<GoalsMetricValues>({
    steps: '10000',
    jogKm: '20',
    bikeMin: '60',
    activityMin: '30',
  });

  private todaySums = { steps: 0, jogKm: 0, bikeMin: 0, activityMin: 0 };

  tiles: HealthMetricTileConfig[] = [
    { label: 'Schritte',          currentValue: '0', goalText: '/ –',      progressPercent: 0, accent: 'blue',  icon: 'steps' },
    { label: 'Joggen',            currentValue: '0', currentSuffix: ' km',  goalText: '/ –',   progressPercent: 0, accent: 'blue',  icon: 'run'  },
    { label: 'Radfahren',         currentValue: '0', currentSuffix: ' min', goalText: '/ –',   progressPercent: 0, accent: 'red',   icon: 'bike' },
    { label: 'Aktivitätsminuten', currentValue: '0', currentSuffix: ' min', goalText: '/ –',   progressPercent: 0, accent: 'green', icon: 'bolt' },
  ];

  constructor(private supabase: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    const user = await this.supabase.getUser();
    if (!user) { this.isLoading.set(false); return; }

    const [goalsRes, logsRes] = await Promise.all([
      this.supabase.getGoalTargets(user.id),
      this.supabase.getTodayActivitySums(user.id),
    ]);

    if (goalsRes.data) {
      const g = goalsRes.data;
      this.setGoalsValues.set({
        steps:       g.steps        != null ? String(g.steps)        : '',
        jogKm:       g.jog_km       != null ? String(g.jog_km)       : '',
        bikeMin:     g.bike_min     != null ? String(g.bike_min)     : '',
        activityMin: g.activity_min != null ? String(g.activity_min) : '',
      });
    }

    if (logsRes.data && logsRes.data.length > 0) {
      this.todaySums = logsRes.data.reduce(
        (acc, row) => ({
          steps:       acc.steps       + (row.steps         ?? 0),
          jogKm:       acc.jogKm       + Number(row.jog_km  ?? 0),
          bikeMin:     acc.bikeMin     + (row.bike_min      ?? 0),
          activityMin: acc.activityMin + (row.activity_min  ?? 0),
        }),
        { steps: 0, jogKm: 0, bikeMin: 0, activityMin: 0 }
      );
    }

    this.rebuildTiles();
    this.isLoading.set(false);
  }

  openSetGoalsModal(): void { this.modal = 'setGoals'; }
  openProgressModal(): void { this.modal = 'addProgress'; }
  closeModal(): void        { this.modal = 'off'; }
  setStatsRange(r: GoalsStatsRange): void { this.statsRange.set(r); }

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

    // Lokale Summe sofort aktualisieren
    switch (entry.metric) {
      case 'steps':       this.todaySums.steps       += this.toInt(entry.value);   break;
      case 'jogKm':       this.todaySums.jogKm        += this.toFloat(entry.value); break;
      case 'bikeMin':     this.todaySums.bikeMin      += this.toInt(entry.value);   break;
      case 'activityMin': this.todaySums.activityMin  += this.toInt(entry.value);   break;
    }

    this.rebuildTiles();
  }

  // ─── private ────────────────────────────────────────────────────

  private rebuildTiles(): void {
    const goals = this.setGoalsValues();
    const stepsGoal    = this.toInt(goals.steps);
    const jogGoal      = this.toFloat(goals.jogKm);
    const bikeGoal     = this.toInt(goals.bikeMin);
    const activityGoal = this.toInt(goals.activityMin);

    const { steps, jogKm, bikeMin, activityMin } = this.todaySums;

    this.tiles = [
      {
        ...this.tiles[0],
        currentValue:    steps.toLocaleString('de-DE'),
        goalText:        stepsGoal    ? `/ ${stepsGoal.toLocaleString('de-DE')}` : '/ –',
        progressPercent: this.calcPercent(steps, stepsGoal),
        goalReached:     stepsGoal > 0 && steps >= stepsGoal,
      },
      {
        ...this.tiles[1],
        currentValue:    this.formatNumber(jogKm),
        goalText:        jogGoal      ? `/ ${this.formatNumber(jogGoal)} km` : '/ –',
        progressPercent: this.calcPercent(jogKm, jogGoal),
        goalReached:     jogGoal > 0 && jogKm >= jogGoal,
      },
      {
        ...this.tiles[2],
        currentValue:    String(bikeMin),
        goalText:        bikeGoal     ? `/ ${bikeGoal} min` : '/ –',
        progressPercent: this.calcPercent(bikeMin, bikeGoal),
        goalReached:     bikeGoal > 0 && bikeMin >= bikeGoal,
      },
      {
        ...this.tiles[3],
        currentValue:    String(activityMin),
        goalText:        activityGoal ? `/ ${activityGoal} min` : '/ –',
        progressPercent: this.calcPercent(activityMin, activityGoal),
        goalReached:     activityGoal > 0 && activityMin >= activityGoal,
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

  private toIntOrNull(value: string): number | null {
    const n = parseInt(value.replace(/[^\d]/g, ''), 10);
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
