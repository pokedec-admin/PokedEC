import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { failoverInterceptor } from './interceptors/failover.interceptor';
import { AuthService } from './services/auth.service';

export function initializeAuth(authService: AuthService): () => Promise<void> {
  return () => new Promise<void>((resolve) => {
    console.log('[APP_INITIALIZER] Starting auth initialization');
    authService.refreshUserFromStorage();
    console.log('[APP_INITIALIZER] Auth initialization complete');
    resolve();
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, failoverInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      multi: true,
      deps: [AuthService]
    }
  ]
};
