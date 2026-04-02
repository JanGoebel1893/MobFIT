import { Component } from '@angular/core';

@Component({
  selector: 'app-health',
  standalone: true,
  template: `
    <section class="page">
      <h1>Health</h1>
      <p>Hier erscheint deine Gesundheitsübersicht.</p>
    </section>
  `,
  styles: [
    `
      .page {
        max-width: 42rem;
      }
      h1 {
        font-size: 1.75rem;
        font-weight: 600;
        margin: 0 0 0.5rem;
        letter-spacing: -0.02em;
      }
      p {
        margin: 0;
        color: oklch(45% 0.02 300);
        line-height: 1.5;
      }
    `,
  ],
})
export class HealthComponent {}
