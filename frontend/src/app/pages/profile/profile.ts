import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { PokemonService } from '../../services/pokemon.service';

interface Suggestion {
    id: number;
    type: string;
    content: string;
    status: string;
    admin_response?: string;
    created_at: string;
    updated_at: string;
    is_read?: boolean;
    archived_user?: boolean;
    archived_admin?: boolean;
}

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.html',
    styleUrl: './profile.css'
})
export class Profile implements OnInit {
    user: any = {};
    originalUser: any = {};
    editMode = false;
    errorMessage = '';
    successMessage = '';
    suggestions: Suggestion[] = [];
    showArchivedSuggestions = false;
    
    // 2FA properties
    show2FASetup = false;
    qrCode = '';
    otpCode = '';
    twoFactorError = '';
    twoFactorSuccess = '';

    constructor(
        private authService: AuthService,
        private pokemonService: PokemonService,
        private http: HttpClient,
        private router: Router
    ) { }


    ngOnInit(): void {
        console.log('[Profile] ngOnInit called');

        // Refresh suggestions to ensure we have the latest data
        this.authService.loadSuggestions();

        // Subscribe to suggestions from AuthService
        this.authService.suggestions$.subscribe(suggestions => {
            this.suggestions = suggestions;
        });

        // Load profile data
        this.authService.getProfile().subscribe({
            next: (response: any) => {
                console.log('[Profile] Profile loaded:', response);
                this.user = response.user;
                this.originalUser = { ...this.user };
            },
            error: (err: any) => {
                console.error('[Profile] Failed to load profile:', err);
                this.errorMessage = 'Failed to load profile. Please try again.';
            }
        });
    }

    enableEdit() {
        this.editMode = true;
        this.errorMessage = '';
        this.successMessage = '';
    }

    cancelEdit() {
        this.editMode = false;
        this.errorMessage = '';
        this.authService.refreshUserFromStorage();
    }

    saveChanges() {
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        // Only send allowed fields
        const updateData = {
            trainer_name: this.user.trainer_name,
            team: this.user.team,
            phone: this.user.phone,
            preferred_language: this.user.preferred_language,
            campfire_name: this.user.campfire_name,
            whatsapp_group: this.user.whatsapp_group,
            trade_preference: this.user.trade_preference
        };

        this.http.put('/api/auth/profile', updateData, { headers }).subscribe({
            next: (res: any) => {
                this.authService.updateCurrentUser(res.user);
                this.editMode = false;
                this.successMessage = 'Profil mis à jour avec succès !';
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: (err) => {
                console.error('Update failed', err);
                this.errorMessage = 'Erreur lors de la mise à jour du profil';
                setTimeout(() => this.errorMessage = '', 3000);
            }
        });
    }

    deleteAccount() {
        if (confirm('Êtes‑vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
            this.authService.deleteAccount().subscribe({
                next: () => {
                    this.authService.logout();
                    this.router.navigate(['/signup']);
                },
                error: (err: any) => (this.errorMessage = err.message || 'Erreur lors de la suppression')
            });
        }
    }

    getLanguageName(code: string): string {
        const languages: any = {
            'fr': 'Français',
            'en': 'English',
            'de': 'Deutsch',
            'it': 'Italiano'
        };
        return languages[code] || 'Français';
    }

    toggleReadStatus(suggestion: any) {
        const token = localStorage.getItem('token');
        if (!token) return;

        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.patch(`/api/suggestions/${suggestion.id}/read`, {}, { headers }).subscribe({
            next: (updatedSuggestion: any) => {
                // Update centralized state in AuthService
                this.authService.updateSuggestion(updatedSuggestion);

                this.successMessage = updatedSuggestion.is_read ? 'Suggestion marquée comme lue' : 'Suggestion marquée comme non lue';
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: (err) => {
                console.error('Failed to toggle read status', err);
                this.errorMessage = 'Erreur lors de la mise à jour du statut';
                setTimeout(() => this.errorMessage = '', 3000);
            }
        });
    }

    toggleShowArchivedSuggestions() {
        this.showArchivedSuggestions = !this.showArchivedSuggestions;
        this.authService.loadSuggestions(this.showArchivedSuggestions);
    }

    toggleArchiveSuggestion(suggestion: any) {
        const token = localStorage.getItem('token');
        if (!token) return;

        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.patch(`/api/suggestions/${suggestion.id}/archive`, {}, { headers }).subscribe({
            next: (updatedSuggestion: any) => {
                // Update centralized state in AuthService
                this.authService.updateSuggestion(updatedSuggestion);

                this.successMessage = updatedSuggestion.archived_user ? 'Suggestion archivée' : 'Suggestion désarchivée';
                setTimeout(() => this.successMessage = '', 3000);

                // Reload if we are in non-archived view and just archived something
                if (!this.showArchivedSuggestions && updatedSuggestion.archived_user) {
                    this.authService.loadSuggestions(false);
                }
            },
            error: (err) => {
                console.error('Failed to toggle archive status', err);
                this.errorMessage = 'Erreur lors de l\'archivage';
                setTimeout(() => this.errorMessage = '', 3000);
            }
        });
    }

    deleteSuggestion(suggestion: any) {
        if (!confirm('Supprimer définitivement ce message ?')) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.delete(`/api/suggestions/${suggestion.id}`, { headers }).subscribe({
            next: () => {
                this.successMessage = 'Message supprimé';
                setTimeout(() => this.successMessage = '', 3000);
                this.authService.loadSuggestions(this.showArchivedSuggestions);
            },
            error: (err) => {
                console.error('Failed to delete suggestion', err);
                this.errorMessage = 'Erreur lors de la suppression';
                setTimeout(() => this.errorMessage = '', 3000);
            }
        });
    }

    // Bulk Fill Pokedex
    bulkFillCategories = {
        normal: false,
        shiny: false,
        lucky: false,
        xxl: false,
        xxs: false,
        gmax: false,
        dynamax: false,
        mega: false,
        obscure: false,
        purified: false,
        perfect: false
    };
    bulkFillLoading = false;
    bulkFillSuccess = '';
    bulkFillError = '';

    toggleBulkCategory(category: string) {
        const key = category as keyof typeof this.bulkFillCategories;
        this.bulkFillCategories[key] = !this.bulkFillCategories[key];
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'open': return 'status-open';
            case 'in_progress': return 'status-progress';
            case 'resolved': return 'status-resolved';
            case 'closed': return 'status-closed';
            default: return '';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'open': return 'Ouvert';
            case 'in_progress': return 'En cours';
            case 'resolved': return 'Résolu';
            case 'closed': return 'Fermé';
            default: return status;
        }
    }

    hasNewResponses(): boolean {
        return this.suggestions.some(s => s.admin_response && s.admin_response.trim() !== '');
    }

    // Password change
    currentPassword: string = '';
    newPassword: string = '';
    confirmPassword: string = '';
    passwordError: string = '';
    passwordSuccess: string = '';
    showCurrentPassword: boolean = false;
    showNewPassword: boolean = false;
    showConfirmPassword: boolean = false;

    get passwordRequirements() {
        return {
            minLength: this.newPassword.length >= 8,
            hasUppercase: /[A-Z]/.test(this.newPassword),
            hasNumber: /\d/.test(this.newPassword)
        };
    }

    get isPasswordValid(): boolean {
        return this.passwordRequirements.minLength &&
            this.passwordRequirements.hasUppercase &&
            this.passwordRequirements.hasNumber &&
            this.newPassword === this.confirmPassword &&
            this.currentPassword.length > 0;
    }

    changePassword() {
        this.passwordError = '';
        this.passwordSuccess = '';

        if (!this.isPasswordValid) {
            this.passwordError = 'Veuillez remplir tous les critères requis';
            return;
        }

        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.post('/api/auth/change-password', {
            currentPassword: this.currentPassword,
            newPassword: this.newPassword,
            confirmPassword: this.confirmPassword
        }, { headers }).subscribe({
            next: () => {
                this.passwordSuccess = 'Mot de passe modifié avec succès !';
                this.currentPassword = '';
                this.newPassword = '';
                this.confirmPassword = '';
                setTimeout(() => this.passwordSuccess = '', 5000);
            },
            error: (err) => {
                console.error('Failed to change password', err);
                this.passwordError = err.error?.error || 'Erreur lors du changement de mot de passe';
                setTimeout(() => this.passwordError = '', 5000);
            }
        });
    }

    // 2FA Methods
    init2FASetup() {
        this.twoFactorError = '';
        this.authService.setup2FA().subscribe({
            next: (res) => {
                this.qrCode = res.qrCode;
                this.show2FASetup = true;
            },
            error: (err) => {
                this.twoFactorError = 'Erreur lors de la configuration 2FA';
            }
        });
    }

    enable2FA() {
        this.twoFactorError = '';
        this.authService.enable2FA(this.otpCode).subscribe({
            next: () => {
                this.user.two_factor_enabled = true;
                this.show2FASetup = false;
                this.qrCode = '';
                this.otpCode = '';
                this.twoFactorSuccess = 'Authentification 2FA activée avec succès !';
                setTimeout(() => this.twoFactorSuccess = '', 5000);
            },
            error: (err) => {
                this.twoFactorError = err.error?.error || 'Code invalide';
            }
        });
    }

    disable2FA() {
        if (!confirm('Êtes-vous sûr de vouloir désactiver la protection 2FA ?')) return;
        
        const code = prompt('Entrez votre code 2FA actuel pour confirmer la désactivation :');
        if (!code) return;

        this.twoFactorError = '';
        this.authService.disable2FA(code).subscribe({
            next: () => {
                this.user.two_factor_enabled = false;
                this.twoFactorSuccess = 'Authentification 2FA désactivée.';
                setTimeout(() => this.twoFactorSuccess = '', 5000);
            },
            error: (err) => {
                this.twoFactorError = err.error?.error || 'Code invalide';
            }
        });
    }

    bulkFillPokedex() {
        const selectedCategories = Object.keys(this.bulkFillCategories)
            .filter(key => this.bulkFillCategories[key as keyof typeof this.bulkFillCategories]);

        if (selectedCategories.length === 0) {
            this.bulkFillError = 'Veuillez sélectionner au moins une catégorie.';
            return;
        }

        if (!confirm(`Êtes-vous sûr de vouloir remplir automatiquement votre Pokédex pour les catégories sélectionnées ? (${selectedCategories.join(', ')})`)) {
            return;
        }

        this.bulkFillLoading = true;
        this.bulkFillError = '';
        this.bulkFillSuccess = '';

        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.post('/api/pokedex/bulk-fill', { categories: selectedCategories }, { headers }).subscribe({
            next: (res: any) => {
                this.bulkFillSuccess = `Pokédex mis à jour avec succès ! (${res.count} Pokémon traités)`;
                this.bulkFillLoading = false;
                // Reset selection
                Object.keys(this.bulkFillCategories).forEach(key => {
                    this.bulkFillCategories[key as keyof typeof this.bulkFillCategories] = false;
                });
            },
            error: (err) => {
                console.error('Bulk fill failed', err);
                this.bulkFillError = 'Erreur lors du remplissage automatique.';
                this.bulkFillLoading = false;
            }
        });
    }

    exportPokedex() {
        this.pokemonService.exportPokedexCsv().subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `pokedec_export_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                window.URL.revokeObjectURL(url);
                this.successMessage = 'Exportation réussie !';
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: (err) => {
                console.error('Export failed', err);
                this.errorMessage = 'Erreur lors de l\'exportation';
                setTimeout(() => this.errorMessage = '', 3000);
            }
        });
    }
}
