import { Component, input } from '@angular/core';

export type HealthStatVariant = 'calories' | 'sleep' | 'weight' | 'water';

export interface HealthStatCardConfig {
  variant: HealthStatVariant;
  label: string;
  primaryValue: string;
  /** z. B. kcal, kg, Gläser — bei reinem Text wie „7h 12m“ weglassen */
  primaryUnit?: string;
  trendText: string;
}

@Component({
  selector: 'app-health-stat-card',
  standalone: true,
  templateUrl: './health-stat-card.component.html',
  styleUrl: './health-stat-card.component.css',
})
export class HealthStatCardComponent {
  stat = input.required<HealthStatCardConfig>();
}
