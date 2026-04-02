import { Component, input } from '@angular/core';

@Component({
  selector: 'app-goals-top-nav',
  standalone: true,
  templateUrl: './goals-top-nav.component.html',
  styleUrl: './goals-top-nav.component.css',
})
export class GoalsTopNavComponent {
  /** Titelzeile (nicht `title` nennen – Kollision mit HTML-Attribut) */
  pageTitle = input('Dashboard');
}
