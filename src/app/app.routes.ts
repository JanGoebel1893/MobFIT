import { Routes } from '@angular/router';
import { HealthComponent } from './pages/health/health.component';
import { LoginComponent } from './pages/login/login.component';
import { MyGoalsComponent } from './pages/my-goals/my-goals.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'health' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'health', component: HealthComponent },
  { path: 'my-goals', component: MyGoalsComponent },
];
