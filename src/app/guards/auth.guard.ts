import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const user = await supabase.getUser();

  if (user) {
    console.log('Eingeloggter User:', user);
    return true;
  }

  await router.navigate(['/login']);
  return false;
};
