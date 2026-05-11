import { Component, HostListener, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ActivityIcon, BikeIcon, FootprintsIcon, PlusIcon, XIcon, ZapIcon } from 'lucide-angular/src/icons';
import {
  METRIC_LIMITS,
  parseStrictPositiveDecimal,
  parseStrictPositiveInt,
  validateOptionalNonNegativeDecimal,
  validateOptionalNonNegativeInt,
} from '../utils/numeric-form.utils';

export type GoalsMetricModalVariant = 'setGoals' | 'addProgress';

export interface GoalsMetricValues {
  steps: string;
  jogKm: string;
  bikeMin: string;
  activityMin: string;
}

export interface ProgressEntry {
  metric: keyof GoalsMetricValues;
  value: string;
}

@Component({
  selector: 'app-goals-metric-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './goals-metric-modal.component.html',
  styleUrl: './goals-metric-modal.component.css',
})
export class GoalsMetricModalComponent {
  private readonly document = inject(DOCUMENT);

  open = input(false);
  variant = input.required<GoalsMetricModalVariant>();
  initialValues = input<GoalsMetricValues | null>(null);

  closed = output<void>();
  setGoalsSubmit = output<GoalsMetricValues>();
  progressAdd = output<ProgressEntry>(); // ← ein Feld + Wert

  setGoalsModel: GoalsMetricValues = {
    steps: '',
    jogKm: '',
    bikeMin: '',
    activityMin: '',
  };

  progressModel: GoalsMetricValues = {
    steps: '0',
    jogKm: '0',
    bikeMin: '0',
    activityMin: '0',
  };

  /** Hinweis bei ungültiger Eingabe (Ziele speichern oder Fortschritt hinzufügen) */
  validationMessage = signal<string | null>(null);

  readonly icons = {
    X: XIcon,
    Plus: PlusIcon,
    Footprints: FootprintsIcon,
    Activity: ActivityIcon,
    Bike: BikeIcon,
    Zap: ZapIcon,
  };

  private prevHtmlOverflow = '';
  private prevBodyOverflow = '';

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (isOpen) {
        this.validationMessage.set(null);
        if (this.variant() === 'setGoals') {
          const values = this.initialValues();
          if (values) this.setGoalsModel = { ...values };
        }
        if (this.variant() === 'addProgress') {
          this.progressModel = { steps: '0', jogKm: '0', bikeMin: '0', activityMin: '0' };
        }
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

  close(): void { this.closed.emit(); }
  onBackdropClick(): void { this.close(); }

  onSubmitSetGoals(): void {
    this.validationMessage.set(null);
    const v = this.validateSetGoalsModel();
    if (!v.ok) {
      this.validationMessage.set(v.message);
      return;
    }
    this.setGoalsSubmit.emit({ ...this.setGoalsModel });
    this.close();
  }

  // Plus-Button: emittet nur das eine Feld + Wert, leert das Feld danach
  onAddProgress(metric: keyof GoalsMetricValues): void {
    this.validationMessage.set(null);
    const raw = this.progressModel[metric];
    const parsed =
      metric === 'jogKm'
        ? parseStrictPositiveDecimal(raw, METRIC_LIMITS.jogProgressKm, 'Joggen (km)')
        : parseStrictPositiveInt(
            raw,
            metric === 'steps' ? METRIC_LIMITS.stepsProgress : METRIC_LIMITS.minutesProgress,
            metric === 'steps' ? 'Schritte' : metric === 'bikeMin' ? 'Radfahren (min)' : 'Aktivitätsminuten'
          );
    if (!parsed.ok) {
      this.validationMessage.set(parsed.message);
      return;
    }
    const value = metric === 'jogKm' ? String(parsed.value).replace('.', ',') : String(parsed.value);
    this.progressAdd.emit({ metric, value });
    this.progressModel[metric] = '0';
  }

  private validateSetGoalsModel(): { ok: true } | { ok: false; message: string } {
    const checks = [
      validateOptionalNonNegativeInt(this.setGoalsModel.steps, METRIC_LIMITS.stepsGoal, 'Schritte'),
      validateOptionalNonNegativeDecimal(this.setGoalsModel.jogKm, METRIC_LIMITS.jogGoalKm, 'Joggen (km)'),
      validateOptionalNonNegativeInt(this.setGoalsModel.bikeMin, METRIC_LIMITS.minutesGoal, 'Radfahren (min)'),
      validateOptionalNonNegativeInt(this.setGoalsModel.activityMin, METRIC_LIMITS.minutesGoal, 'Aktivitätsminuten'),
    ] as const;
    for (const c of checks) {
      if (!c.ok) return c;
    }
    return { ok: true };
  }
}
