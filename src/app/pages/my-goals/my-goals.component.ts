import { Component } from '@angular/core';

@Component({
  selector: 'app-my-goals',
  standalone: true,
  template: `
    <section class="page">
      <h1 class="page__title">My Goals</h1>
      <p class="page__lead">Hier kommt dein Goals-Dashboard hin – Inhalt folgt.</p>
    </section>
  `,
  styles: [
    `
      .page {
        max-width: 42rem;
      }
      .page__title {
        margin: 0 0 0.5rem;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        font-weight: 700;
        font-size: 28px;
        color: #1a1c1f;
      }
      .page__lead {
        margin: 0;
        font-size: 15px;
        line-height: 1.5;
        color: #64748b;
      }
    `,
  ],
})
export class MyGoalsComponent {}
