import { Component, HostListener, effect, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DOCUMENT } from '@angular/common';

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
  imports: [FormsModule],
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

  private prevHtmlOverflow = '';
  private prevBodyOverflow = '';

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (isOpen) {
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
  onSave(): void { this.save.emit({ ...this.form }); this.close(); }

}
