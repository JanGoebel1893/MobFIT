import { Component, OnInit, signal } from '@angular/core';
import { GoalsTopNavComponent } from '../../shared/goals-top-nav/goals-top-nav.component';
import {
  HealthStatCardComponent,
  HealthStatCardConfig,
} from '../../shared/health-stat-card/health-stat-card.component';
import {
  HealthDataFormValues,
  HealthDataModalComponent,
} from '../../shared/health-data-modal/health-data-modal.component';
import { SupabaseService } from '../../services/supabase.service';
import { WeeklyProgressCardComponent } from '../../shared/weekly-progress-card/weekly-progress-card.component';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [GoalsTopNavComponent, HealthStatCardComponent, HealthDataModalComponent, WeeklyProgressCardComponent],
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.css', '../../shared/styles/dashboard-shell.css'],
})
export class HealthComponent implements OnInit {
  showHealthDataModal = false;
  isLoading = signal(true);
  currentFormValues = signal<HealthDataFormValues>({
    caloriesKcal: '', sleepHours: '', sleepMinutes: '', weightKg: '', waterLiters: '',
  });

  stats: HealthStatCardConfig[] = [
    { variant: 'calories', label: 'Kalorien',  primaryValue: '-', primaryUnit: 'kcal',   trendText: 'Noch kein Eintrag' },
    { variant: 'sleep',    label: 'Schlaf',    primaryValue: '-',                         trendText: 'Noch kein Eintrag' },
    { variant: 'weight',   label: 'Gewicht',   primaryValue: '-', primaryUnit: 'kg',      trendText: 'Noch kein Eintrag' },
    { variant: 'water',    label: 'Wasser',    primaryValue: '-', primaryUnit: 'Liter',   trendText: 'Noch kein Eintrag' },
  ];

  constructor(private supabase: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    const user = await this.supabase.getUser();
    if (!user) { this.isLoading.set(false); return; }

    const { data } = await this.supabase.getLatestHealthEntry(user.id);
    if (data) {
      this.applyEntryToStats(data);
      this.currentFormValues.set(this.buildFormValues(data));
    }

    this.isLoading.set(false);
  }

  openHealthDataModal(): void  { this.showHealthDataModal = true; }
  closeHealthDataModal(): void { this.showHealthDataModal = false; }

  async onHealthDataSave(v: HealthDataFormValues): Promise<void> {
    this.updateStatsFromForm(v);
    this.currentFormValues.set(v);
    this.showHealthDataModal = false;

    const user = await this.supabase.getUser();
    if (!user) return;

    const calNum  = parseInt(v.caloriesKcal.replace(/[^\d]/g, ''), 10);
    const shNum   = parseInt(v.sleepHours.trim(), 10);
    const smNum   = parseInt(v.sleepMinutes.trim(), 10);
    const wgtNum  = parseFloat(v.weightKg.trim().replace(',', '.'));
    const watNum  = parseFloat(v.waterLiters.trim().replace(',', '.'));

    await this.supabase.upsertHealthEntry(user.id, {
      calories:    isNaN(calNum)  ? null : calNum,
      sleep_hours: isNaN(shNum)   ? null : shNum,
      sleep_mins:  isNaN(smNum)   ? null : smNum,
      weight_kg:   isNaN(wgtNum)  ? null : wgtNum,
      water:       isNaN(watNum)  ? null : watNum,
    });
  }

  private buildFormValues(data: any): HealthDataFormValues {
    return {
      caloriesKcal: data.calories != null ? String(data.calories) : '',
      sleepHours:   data.sleep_hours != null ? String(data.sleep_hours) : '',
      sleepMinutes: data.sleep_mins != null ? String(data.sleep_mins) : '',
      weightKg:     data.weight_kg != null ? String(data.weight_kg) : '',
      waterLiters:  data.water != null ? String(data.water) : '',
    };
  }

  private updateStatsFromForm(v: HealthDataFormValues): void {
    const calDigits  = v.caloriesKcal.replace(/[^\d]/g, '');
    const calNum     = parseInt(calDigits, 10);
    const calDisplay = calDigits && !isNaN(calNum) ? calNum.toLocaleString('de-DE') : '-';
    const sleepDisplay = `${v.sleepHours.trim()}h ${v.sleepMinutes.trim()}m`;

    this.stats = [
      { ...this.stats[0], primaryValue: calDisplay },
      { ...this.stats[1], primaryValue: sleepDisplay, primaryUnit: undefined },
      { ...this.stats[2], primaryValue: v.weightKg.trim() },
      { ...this.stats[3], primaryValue: v.waterLiters.trim(), primaryUnit: 'Liter' },
    ];
  }

  private applyEntryToStats(data: any): void {
    const sleepDisplay = (data.sleep_hours != null && data.sleep_mins != null)
      ? `${data.sleep_hours}h ${data.sleep_mins}m`
      : '-';

    this.stats = [
      { ...this.stats[0], primaryValue: data.calories != null ? data.calories.toLocaleString('de-DE') : '-' },
      { ...this.stats[1], primaryValue: sleepDisplay, primaryUnit: undefined },
      { ...this.stats[2], primaryValue: data.weight_kg != null ? String(data.weight_kg) : '-' },
      { ...this.stats[3], primaryValue: data.water != null ? String(data.water) : '-' },
    ];
  }
}
