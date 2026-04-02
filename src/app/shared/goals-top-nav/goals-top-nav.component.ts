import { Component, input } from '@angular/core';

@Component({
  selector: 'app-goals-top-nav',
  standalone: true,
  templateUrl: './goals-top-nav.component.html',
  styleUrl: './goals-top-nav.component.css',
})
export class GoalsTopNavComponent {
  /** Seitentitel in der oberen Leiste */
  title = input('My Goals Dashboard');
}
