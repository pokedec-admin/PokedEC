import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FailoverService } from '../services/failover.service';
import { environment } from '../../environments/environment';

export const failoverInterceptor: HttpInterceptorFn = (req, next) => {
    const failoverService = inject(FailoverService);

    let finalReq = req;

    // 1. Manual environment override from Admin
    const overrideEnvUrl = localStorage.getItem('pokedec_env_url');
    const isPrimaryUrl = req.url.startsWith(environment.apiUrl) || req.url.includes('pokedec-backend.onrender.com');

    if (overrideEnvUrl && isPrimaryUrl) {
        console.log('[FailoverInterceptor] Applying manual override:', overrideEnvUrl);
        const overrideUrl = req.url.replace(environment.apiUrl, overrideEnvUrl).replace(/https:\/\/pokedec-backend\.onrender\.com\/api/, overrideEnvUrl);
        finalReq = req.clone({ url: overrideUrl });
    } else {
        // 2. Automatic backup/failover
        const backupUrlBase = failoverService.getCurrentBaseUrl();
        if (failoverService.isUsingBackup() && backupUrlBase && isPrimaryUrl) {
            console.log('[FailoverInterceptor] Using backup for:', req.url);
            const backupUrl = req.url.replace(environment.apiUrl, backupUrlBase).replace(/https:\/\/pokedec-backend\.onrender\.com\/api/, backupUrlBase);
            finalReq = req.clone({ url: backupUrl });
        }
    }

    return next(finalReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Si erreur de connexion (status 0 ou 504 Gateway Timeout du NAS)
            // et qu'on n'est pas déjà sur le backup
            const isConnectionError = error.status === 0 || error.status === 504 || error.status === 502;
            const isPrimaryUrl = req.url.startsWith(environment.apiUrl) || req.url.includes('pokedec-backend.onrender.com');

            if (isConnectionError && !failoverService.isUsingBackup() && environment.backupApiUrl && isPrimaryUrl) {
                if (overrideEnvUrl) {
                    console.warn('[FailoverInterceptor] Overridden URL failed, falling back to backup...', overrideEnvUrl);
                } else {
                    console.warn('[FailoverInterceptor] Connection error detected, switching to backup:', req.url);
                }
                failoverService.switchToBackup();

                // On rejoue la requête avec la nouvelle URL
                const backupUrlBase = environment.backupApiUrl;
                const backupUrl = req.url.replace(environment.apiUrl, backupUrlBase).replace(/https:\/\/pokedec-backend\.onrender\.com\/api/, backupUrlBase);
                console.log('[FailoverInterceptor] Retrying with:', backupUrl);
                const retryRequest = req.clone({ url: backupUrl });
                return next(retryRequest);
            }
            return throwError(() => error);
        })
    );
};
