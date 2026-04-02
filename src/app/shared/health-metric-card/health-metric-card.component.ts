import { Component, input } from '@angular/core';

export type HealthMetricAccent = 'blue' | 'red' | 'green';
export type HealthMetricIcon = 'steps' | 'run' | 'bike' | 'bolt';

export interface HealthMetricTileConfig {
  label: string;
  currentValue: string;
  currentSuffix?: string;
  goalText: string;
  progressPercent: number;
  accent: HealthMetricAccent;
  icon: HealthMetricIcon;
  goalReached?: boolean;
}

@Component({
  selector: 'app-health-metric-card',
  standalone: true,
  templateUrl: './health-metric-card.component.html',
  styleUrl: './health-metric-card.component.css',
})
export class HealthMetricCardComponent {
  tile = input.required<HealthMetricTileConfig>();

  fillPercent(): number {
    const t = this.tile();
    return t.goalReached ? 100 : t.progressPercent;
  }
}
