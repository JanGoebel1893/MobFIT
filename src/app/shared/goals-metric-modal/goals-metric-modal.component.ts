import { Component, HostListener, effect, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ActivityIcon, BikeIcon, FootprintsIcon, PlusIcon, XIcon, ZapIcon } from 'lucide-angular/src/icons';

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
    this.setGoalsSubmit.emit({ ...this.setGoalsModel });
    this.close();
  }

  // Plus-Button: emittet nur das eine Feld + Wert, leert das Feld danach
  onAddProgress(metric: keyof GoalsMetricValues): void {
    const value = this.progressModel[metric];
    if (!value || value.trim() === '' || value === '0') return;

    this.progressAdd.emit({ metric, value });
    this.progressModel[metric] = '0'; // Feld nach dem Speichern leeren
  }
}
