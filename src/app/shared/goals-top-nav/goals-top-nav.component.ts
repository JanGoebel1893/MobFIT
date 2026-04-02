import { Component, input } from '@angular/core';

@Component({
  selector: 'app-goals-top-nav',
  standalone: true,
  templateUrl: './goals-top-nav.component.html',
  styleUrl: './goals-top-nav.component.css',
})
export class GoalsTopNavComponent {
  /** Kurz `navTitle`, damit es nicht mit dem HTML-Attribut `title` kollidiert */
  navTitle = input('Dashboard');
}
