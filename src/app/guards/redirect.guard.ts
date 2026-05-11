import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DEFAULT_AUTHENTICATED_ROUTE } from '../core/auth.constants';
import { SupabaseService } from '../services/supabase.service';

export const redirectGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const user = await supabase.getUser();

  if (user) {
    return router.createUrlTree([DEFAULT_AUTHENTICATED_ROUTE]);
  }

  return true;
};
