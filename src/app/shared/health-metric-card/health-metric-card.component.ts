import { Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ActivityIcon, BikeIcon, FootprintsIcon, ZapIcon } from 'lucide-angular/src/icons';

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
  imports: [LucideAngularModule],
  templateUrl: './health-metric-card.component.html',
  styleUrl: './health-metric-card.component.css',
})
export class HealthMetricCardComponent {
  tile = input.required<HealthMetricTileConfig>();
  readonly icons = { Footprints: FootprintsIcon, Activity: ActivityIcon, Bike: BikeIcon, Zap: ZapIcon };

  fillPercent(): number {
    const t = this.tile();
    return t.goalReached ? 100 : t.progressPercent;
  }
}
