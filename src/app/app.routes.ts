import { Routes } from '@angular/router';
import { HealthComponent } from './pages/health/health.component';
import { MyGoalsComponent } from './pages/my-goals/my-goals.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'health' },
  { path: 'health', component: HealthComponent },
  { path: 'my-goals', component: MyGoalsComponent },
];
