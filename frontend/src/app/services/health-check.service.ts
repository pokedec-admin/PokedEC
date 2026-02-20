import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class HealthCheckService {
    private isBackendOnlineSubject = new BehaviorSubject<boolean>(true);
    public isBackendOnline$ = this.isBackendOnlineSubject.asObservable();
    private retryTimer: any;

    constructor(private http: HttpClient) {
        this.checkHealth();
    }

    checkHealth(): void {
        this.http.get(`${environment.apiUrl}/system/status`)
            .subscribe({
                next: () => {
                    this.isBackendOnlineSubject.next(true);
                },
                error: (err) => {
                    console.error('Backend offline', err);
                    this.isBackendOnlineSubject.next(false);
                    this.retryHealthCheck();
                }
            });
    }

    private retryHealthCheck(): void {
        if (this.retryTimer) return;

        this.retryTimer = setInterval(() => {
            this.http.get(`${environment.apiUrl}/system/status`)
                .subscribe({
                    next: () => {
                        this.isBackendOnlineSubject.next(true);
                        this.stopRetry();
                    }
                });
        }, 30000);
    }

    private stopRetry(): void {
        if (this.retryTimer) {
            clearInterval(this.retryTimer);
            this.retryTimer = null;
        }
    }
}
