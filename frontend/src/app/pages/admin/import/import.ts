import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-admin-import',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './import.html',
    styleUrls: ['../admin.css']
})
export class AdminImportComponent {
    showImportConfirmation = false;
    importInProgress = false;
    importStatus: { success: boolean; message: string; stats?: { users: number; pokedex: number } } | null = null;

    constructor(private http: HttpClient, private authService: AuthService) { }

    confirmImport() {
        this.showImportConfirmation = false;
        this.importInProgress = true;
        this.importStatus = null;

        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.post('/api/admin/import/import-prod-data', {}, { headers }).subscribe({
            next: (response: any) => {
                this.importInProgress = false;
                this.importStatus = {
                    success: true,
                    message: '✅ Import PROD → DEV terminé avec succès !',
                    stats: response.stats
                };
            },
            error: (err) => {
                this.importInProgress = false;
                this.importStatus = {
                    success: false,
                    message: `❌ Erreur lors de l'import : ${err.error?.error || err.message}`
                };
                console.error('Import failed', err);
            }
        });
    }
}
