import { Component, HostListener, effect, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DOCUMENT } from '@angular/common';

export type GoalsMetricModalVariant = 'setGoals' | 'addProgress';

export interface GoalsMetricValues {
  steps: string;
  jogKm: string;
  bikeMin: string;
  activityMin: string;
}

@Component({
  selector: 'app-goals-metric-modal',
  standalone: true,
  imports: [FormsModule],
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
  progressAdd = output<{ metric: keyof GoalsMetricValues }>();

  setGoalsModel: GoalsMetricValues = {
    steps: '25',
    jogKm: '45',
    bikeMin: '25',
    activityMin: '45',
  };

  progressModel: GoalsMetricValues = {
    steps: '25',
    jogKm: '45',
    bikeMin: '25',
    activityMin: '45',
  };

  private prevHtmlOverflow = '';
  private prevBodyOverflow = '';

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (isOpen) {
        const values = this.initialValues();
        if (values && this.variant() === 'setGoals') {
          this.setGoalsModel = { ...values };
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
    if (this.open()) {
      this.close();
    }
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    this.close();
  }

  onSubmitSetGoals(): void {
    this.setGoalsSubmit.emit({ ...this.setGoalsModel });
    this.close();
  }

  onAddProgress(metric: keyof GoalsMetricValues): void {
    this.progressAdd.emit({ metric });
  }
}
