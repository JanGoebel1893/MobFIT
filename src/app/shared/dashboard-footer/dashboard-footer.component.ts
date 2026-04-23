import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard-footer.component.html',
  styleUrl: './dashboard-footer.component.css',
})
export class DashboardFooterComponent {}
