import { Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  ChevronUpIcon,
  DropletIcon,
  FlameIcon,
  MoonIcon,
  WeightIcon,
} from 'lucide-angular/src/icons';

export type HealthStatVariant = 'calories' | 'sleep' | 'weight' | 'water';

export interface HealthStatCardConfig {
  variant: HealthStatVariant;
  label: string;
  /** z. B. „Diese Woche“ / „Letzte 28 Tage“ */
  periodLabel?: string;
  primaryValue: string;
  /** z. B. kcal, kg, Gläser — bei reinem Text wie „7h 12m“ weglassen */
  primaryUnit?: string;
  /** Vorperiode, z. B. „Vorwoche: 0 kcal“ */
  trendText: string;
}

@Component({
  selector: 'app-health-stat-card',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './health-stat-card.component.html',
  styleUrl: './health-stat-card.component.css',
})
export class HealthStatCardComponent {
  stat = input.required<HealthStatCardConfig>();
  readonly icons = {
    Flame: FlameIcon,
    Moon: MoonIcon,
    Weight: WeightIcon,
    Droplet: DropletIcon,
    ChevronUp: ChevronUpIcon,
  };
}
