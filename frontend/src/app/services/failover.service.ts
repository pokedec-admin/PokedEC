import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class FailoverService {
    private useBackup = new BehaviorSubject<boolean>(false);
    public useBackup$ = this.useBackup.asObservable();

    constructor() {
        const saved = localStorage.getItem('pokedec_use_backup');
        if (saved === 'true') {
            this.useBackup.next(true);
        }
    }

    switchToBackup() {
        console.warn('⚠️ Switching to Backup API...');
        this.useBackup.next(true);
        localStorage.setItem('pokedec_use_backup', 'true');
    }

    switchToPrimary() {
        console.log('🔄 Switching back to Primary API...');
        this.useBackup.next(false);
        localStorage.removeItem('pokedec_use_backup');
    }

    getCurrentBaseUrl(): string {
        return this.useBackup.value ? environment.backupApiUrl : environment.apiUrl;
    }

    isUsingBackup(): boolean {
        return this.useBackup.value;
    }
}
