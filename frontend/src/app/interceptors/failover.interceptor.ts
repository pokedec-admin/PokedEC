import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FailoverService } from '../services/failover.service';

export const failoverInterceptor: HttpInterceptorFn = (req, next) => {
    const failoverService = inject(FailoverService);

    // Si on utilise déjà le backup, on change l'URL directement
    let finalReq = req;
    const backupUrlBase = failoverService.getCurrentBaseUrl();

    // Only use backup if configured and active
    if (failoverService.isUsingBackup() && backupUrlBase && req.url.startsWith('/api')) {
        const backupUrl = req.url.replace('/api', backupUrlBase);
        finalReq = req.clone({ url: backupUrl });
    }

    return next(finalReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Si erreur de connexion (status 0 ou 504 Gateway Timeout du NAS)
            // et qu'on n'est pas déjà sur le backup
            const isConnectionError = error.status === 0 || error.status === 504 || error.status === 502;

            if (isConnectionError && !failoverService.isUsingBackup() && backupUrlBase && req.url.startsWith('/api')) {
                failoverService.switchToBackup();

                // On rejoue la requête avec la nouvelle URL
                const backupUrl = req.url.replace('/api', failoverService.getCurrentBaseUrl());
                const retryRequest = req.clone({ url: backupUrl });
                return next(retryRequest);
            }
            return throwError(() => error);
        })
    );
};
