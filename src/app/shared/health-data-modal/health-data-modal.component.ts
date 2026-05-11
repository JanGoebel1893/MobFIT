import { Component, HostListener, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DropletIcon, FlameIcon, MoonIcon, WeightIcon, XIcon } from 'lucide-angular/src/icons';
import {
  METRIC_LIMITS,
  validateOptionalNonNegativeDecimal,
  validateOptionalNonNegativeInt,
  validateOptionalWeightKg,
  validateSleepParts,
} from '../utils/numeric-form.utils';

export interface HealthDataFormValues {
  caloriesKcal: string;
  sleepHours: string;
  sleepMinutes: string;
  weightKg: string;
  waterLiters: string;
}

@Component({
  selector: 'app-health-data-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './health-data-modal.component.html',
  styleUrl: './health-data-modal.component.css',
})
export class HealthDataModalComponent {
  private readonly document = inject(DOCUMENT);

  open = input(false);
  initialValues = input<HealthDataFormValues | null>(null); // NEU

  closed = output<void>();
  save = output<HealthDataFormValues>();

  form: HealthDataFormValues = {
    caloriesKcal: '',
    sleepHours: '',
    sleepMinutes: '',
    weightKg: '',
    waterLiters: '',
  };

  validationMessage = signal<string | null>(null);

  readonly icons = {
    X: XIcon,
    Flame: FlameIcon,
    Moon: MoonIcon,
    Weight: WeightIcon,
    Droplet: DropletIcon,
  };

  private prevHtmlOverflow = '';
  private prevBodyOverflow = '';

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (isOpen) {
        this.validationMessage.set(null);
        // Nur beim Öffnen die Werte setzen
        const values = this.initialValues();
        this.form = values
          ? { ...values }
          : { caloriesKcal: '', sleepHours: '', sleepMinutes: '', weightKg: '', waterLiters: '' };

        this.prevHtmlOverflow = this.document.documentElement.style.overflow;
        this.prevBodyOverflow = this.document.body.style.overflow;
        this.document.documentElement.style.overflow = 'hidden';
        this.document.body.style.overflow = 'hidden';
      } else {
        this.document.documentElement.style.overflow = this.prevHtmlOverflow;
        this.document.body.style.overflow = this.prevBodyOverflow;
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.close();
  }

  close(): void  { this.closed.emit(); }
  onBackdropClick(): void { this.close(); }

  onSave(): void {
    this.validationMessage.set(null);
    const checks = [
      validateOptionalNonNegativeInt(this.form.caloriesKcal, METRIC_LIMITS.caloriesKcal, 'Kalorien (kcal)'),
      validateSleepParts(this.form.sleepHours, this.form.sleepMinutes),
      validateOptionalWeightKg(this.form.weightKg),
      validateOptionalNonNegativeDecimal(
        this.form.waterLiters,
        METRIC_LIMITS.waterLitersMax,
        'Flüssigkeit (Liter)',
        3
      ),
    ] as const;
    for (const c of checks) {
      if (!c.ok) {
        this.validationMessage.set(c.message);
        return;
      }
    }
    this.save.emit({ ...this.form });
    this.close();
  }

}
