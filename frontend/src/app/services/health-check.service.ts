import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { FailoverService } from './failover.service';

@Injectable({
    providedIn: 'root'
})
export class HealthCheckService {
    private healthCheckSubscription?: Subscription;
    private readonly CHECK_INTERVAL = 60000; // 1 minute
    private readonly TIMEOUT_MS = 5000; // 5 secondes

    constructor(
        private http: HttpClient,
        private failoverService: FailoverService
    ) { }

    startMonitoring() {
        // Ne surveiller que si on est en mode backup
        if (!this.failoverService.isUsingBackup()) {
            return;
        }

        console.log('🔍 Health check monitoring started');

        this.healthCheckSubscription = interval(this.CHECK_INTERVAL).subscribe(() => {
            this.checkPrimaryHealth();
        });
    }

    stopMonitoring() {
        if (this.healthCheckSubscription) {
            this.healthCheckSubscription.unsubscribe();
            console.log('⏹️ Health check monitoring stopped');
        }
    }

    private checkPrimaryHealth() {
        // Tenter de ping le serveur primaire
        this.http.get('/api/system/status')
            .pipe(
                timeout(this.TIMEOUT_MS),
                catchError(() => of(null))
            )
            .subscribe(response => {
                if (response) {
                    console.log('✅ Primary server is back online!');
                    this.onPrimaryHealthy();
                }
            });
    }

    private onPrimaryHealthy() {
        // Notifier l'utilisateur
        const shouldSwitch = confirm(
            '✅ Le serveur principal (NAS) est de nouveau accessible.\n\n' +
            'Voulez-vous basculer automatiquement vers le serveur principal ?\n\n' +
            '(Cela rechargera la page)'
        );

        if (shouldSwitch) {
            this.failoverService.switchToPrimary();
            window.location.reload();
        } else {
            // Arrêter la surveillance si l'utilisateur refuse
            this.stopMonitoring();
        }
    }

    // Vérification manuelle
    checkNow(): Promise<boolean> {
        return new Promise((resolve) => {
            this.http.get('/api/system/status')
                .pipe(
                    timeout(this.TIMEOUT_MS),
                    catchError(() => of(null))
                )
                .subscribe(response => {
                    resolve(!!response);
                });
        });
    }
}
