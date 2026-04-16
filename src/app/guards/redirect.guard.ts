import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const redirectGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const user = await supabase.getUser();

  if (user) {
    await router.navigate(['/health']);
  } else {
    await router.navigate(['/login']);
  }

  return false;
};
