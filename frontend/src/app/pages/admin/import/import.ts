import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';
@Component({
    selector: 'app-admin-import',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './import.html',
    styleUrls: ['../admin.css']
})
export class AdminImportComponent {
    showImportConfirmation = false;
    importInProgress = false;
    currentStep = '';
    importStatus: { success: boolean; message: string; stats?: any } | null = null;

    sourceEnv = 'CLOUD';
    targetEnv = 'ACTUEL';

    environments = [
        { id: 'ACTUEL', name: 'Environnement Actuel (DEV/Local)', url: environment.apiUrl },
        { id: 'BACKUP', name: 'Environnement Backup (NAS)', url: environment.backupApiUrl },
        { id: 'CLOUD', name: 'CLOUD (Production)', url: 'https://pokedec-backend.onrender.com/api' }
    ];

    constructor(private http: HttpClient, private authService: AuthService) { }

    confirmImport() {
        if (this.sourceEnv === this.targetEnv) {
            this.importStatus = { success: false, message: 'La source et la destination doivent être différentes.' };
            return;
        }

        this.showImportConfirmation = false;
        this.importInProgress = true;
        this.currentStep = '📥 Export depuis la source...';
        this.importStatus = null;

        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        const sourceUrl = this.environments.find(e => e.id === this.sourceEnv)?.url;
        const targetUrl = this.environments.find(e => e.id === this.targetEnv)?.url;

        // Step 1: Export from Source
        this.http.get(`${sourceUrl}/admin/import/export-all`, { headers }).subscribe({
            next: (data: any) => {
                this.currentStep = '📤 Import vers la destination...';

                // Step 2: Import to Target
                this.http.post(`${targetUrl}/admin/import/import-all`, data, { headers }).subscribe({
                    next: (response: any) => {
                        this.importInProgress = false;
                        this.currentStep = '';
                        this.importStatus = {
                            success: true,
                            message: `✅ Synchronisation ${this.sourceEnv} → ${this.targetEnv} terminée avec succès !`,
                            stats: response.stats
                        };
                    },
                    error: (err) => {
                        this.importInProgress = false;
                        this.currentStep = '';
                        this.importStatus = {
                            success: false,
                            message: `❌ Erreur lors de l'import : ${err.error?.error || err.message}`
                        };
                    }
                });
            },
            error: (err) => {
                this.importInProgress = false;
                this.currentStep = '';
                this.importStatus = {
                    success: false,
                    message: `❌ Erreur lors de l'export : ${err.error?.error || err.message}`
                };
            }
        });
    }
}
