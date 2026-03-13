import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, fromEvent, merge, of } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { HealthCheckService } from './health-check.service';

export type NetworkStatus = 'online' | 'backend-offline' | 'offline';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService implements OnDestroy {
  private statusSubject = new BehaviorSubject<NetworkStatus>(
    navigator.onLine ? 'online' : 'offline'
  );

  public status$ = this.statusSubject.asObservable();

  private subscriptions = new Subscription();

  constructor(private healthCheck: HealthCheckService) {
    this.initBrowserEvents();
    this.initBackendMonitor();
  }

  private initBrowserEvents(): void {
    // Écoute les événements online/offline du navigateur
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

    this.subscriptions.add(
      merge(online$, offline$)
        .pipe(distinctUntilChanged())
        .subscribe(isOnline => {
          if (!isOnline) {
            this.statusSubject.next('offline');
          } else {
            // Revenu en ligne : re-vérifier le backend
            this.healthCheck.checkHealth();
          }
        })
    );
  }

  private initBackendMonitor(): void {
    this.subscriptions.add(
      this.healthCheck.isBackendOnline$.subscribe(isBackendAlive => {
        if (!navigator.onLine) {
          this.statusSubject.next('offline');
          return;
        }
        this.statusSubject.next(isBackendAlive ? 'online' : 'backend-offline');
      })
    );
  }

  get currentStatus(): NetworkStatus {
    return this.statusSubject.getValue();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
