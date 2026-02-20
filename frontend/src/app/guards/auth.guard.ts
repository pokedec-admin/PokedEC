import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        console.warn('[Auth Guard] No token or user found, redirecting to login');
        router.navigate(['/login']);
        return false;
    }

    // Ensure user is loaded in AuthService
    if (!authService.isAuthenticated()) {
        authService.refreshUserFromStorage();
    }

    console.log('[Auth Guard] Authentication verified, allowing access');
    return true;
};
