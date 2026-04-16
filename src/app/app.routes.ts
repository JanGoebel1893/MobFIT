import { Routes } from '@angular/router';
import { HealthComponent } from './pages/health/health.component';
import { LoginComponent } from './pages/login/login.component';
import { MyGoalsComponent } from './pages/my-goals/my-goals.component';
import { RegisterComponent } from './pages/register/register.component';
import { authGuard } from './guards/auth.guard';
import { redirectGuard } from './guards/redirect.guard';
import { logoutGuard } from './guards/logout.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', canActivate: [redirectGuard], component: LoginComponent },
  { path: 'login', canActivate: [redirectGuard], component: LoginComponent },
  { path: 'register', canActivate: [redirectGuard], component: RegisterComponent },
  { path: 'logout', canActivate: [logoutGuard], component: LoginComponent },
  { path: 'health', component: HealthComponent, canActivate: [authGuard] },
  { path: 'my-goals', component: MyGoalsComponent, canActivate: [authGuard] },
];
