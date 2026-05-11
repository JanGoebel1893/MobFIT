import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const logoutGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  try {
    await supabase.signOut();
  } catch (e) {
    console.warn('Abmelden (Server):', e);
  }
  await router.navigate(['/login']);
  return false;
};
