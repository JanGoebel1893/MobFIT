import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GoalsTopNavComponent } from '../../shared/goals-top-nav/goals-top-nav.component';
import { DashboardFooterComponent } from '../../shared/dashboard-footer/dashboard-footer.component';

@Component({
  selector: 'app-impressum',
  standalone: true,
  imports: [RouterLink, GoalsTopNavComponent, DashboardFooterComponent],
  templateUrl: './impressum.component.html',
  styleUrls: [
    '../../shared/styles/legal-route-layout.css',
    './impressum.component.css',
    '../../shared/styles/dashboard-shell.css',
  ],
})
export class ImpressumComponent {}
