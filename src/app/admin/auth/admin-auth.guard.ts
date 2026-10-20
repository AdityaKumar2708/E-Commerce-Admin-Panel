import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

export const adminAuthGuard: CanActivateFn = (_route, state) => {
    const router = inject(Router);
    const auth = inject(AuthService);

    if (auth.hasValidAdminSession()) return true;

    auth.clearSession();
    return router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
};