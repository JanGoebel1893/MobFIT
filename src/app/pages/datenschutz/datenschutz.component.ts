import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GoalsTopNavComponent } from '../../shared/goals-top-nav/goals-top-nav.component';
import { DashboardFooterComponent } from '../../shared/dashboard-footer/dashboard-footer.component';

@Component({
  selector: 'app-datenschutz',
  standalone: true,
  imports: [RouterLink, GoalsTopNavComponent, DashboardFooterComponent],
  templateUrl: './datenschutz.component.html',
  styleUrls: [
    '../../shared/styles/legal-route-layout.css',
    './datenschutz.component.css',
    '../../shared/styles/dashboard-shell.css',
  ],
})
export class DatenschutzComponent {}
