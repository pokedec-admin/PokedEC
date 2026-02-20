import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';

interface Suggestion {
    id: number;
    user_id: number;
    trainer_name: string;
    email: string;
    type: string;
    content: string;
    status: string;
    admin_response?: string;
    created_at: string;
    updated_at: string;
    editing?: boolean;
    archived_admin?: boolean;
    archived_user?: boolean;
}

@Component({
    selector: 'app-admin-suggestions',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './suggestions.html',
    styleUrls: ['../admin.css']
})
export class AdminSuggestionsComponent implements OnInit {
    suggestions: Suggestion[] = [];
    errorMessage = '';
    successMessage = '';
    showArchived = false;

    constructor(private http: HttpClient) { }

    ngOnInit() {
        this.loadSuggestions();
    }

    loadSuggestions() {
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.get<Suggestion[]>(`/api/suggestions/admin${this.showArchived ? '?archived=true' : ''}`, { headers }).subscribe({
            next: (data) => {
                this.suggestions = data;
            },
            error: (err) => {
                console.error('Failed to load suggestions', err);
                this.errorMessage = 'Failed to load suggestions';
            }
        });
    }

    toggleShowArchived() {
        this.showArchived = !this.showArchived;
        this.loadSuggestions();
    }

    archiveSuggestion(suggestion: Suggestion) {
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.patch(`/api/suggestions/admin/${suggestion.id}/archive`, {}, { headers }).subscribe({
            next: () => {
                this.successMessage = suggestion.archived_admin ? 'Suggestion désarchivée' : 'Suggestion archivée';
                setTimeout(() => this.successMessage = '', 3000);
                this.loadSuggestions();
            },
            error: (err) => {
                console.error('Failed to archive suggestion', err);
                this.errorMessage = 'Failed to archive suggestion';
                setTimeout(() => this.errorMessage = '', 3000);
            }
        });
    }

    startEditSuggestion(suggestion: Suggestion) {
        suggestion.editing = true;
    }

    cancelEditSuggestion(suggestion: Suggestion) {
        suggestion.editing = false;
        this.loadSuggestions();
    }

    saveSuggestion(suggestion: Suggestion) {
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.patch(`/api/suggestions/admin/${suggestion.id}`, {
            status: suggestion.status,
            admin_response: suggestion.admin_response
        }, { headers }).subscribe({
            next: () => {
                suggestion.editing = false;
                this.successMessage = 'Suggestion updated successfully!';
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: (err) => {
                console.error('Failed to update suggestion', err);
                this.errorMessage = 'Failed to update suggestion. Please try again.';
                setTimeout(() => this.errorMessage = '', 3000);
            }
        });
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

    getTypeBadgeClass(type: string): string {
        return type === 'bug' ? 'type-bug' : 'type-suggestion';
    }

    deleteSuggestion(suggestion: Suggestion) {
        if (!confirm('Supprimer définitivement ce message ?')) return;

        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.delete(`/api/suggestions/admin/${suggestion.id}`, { headers }).subscribe({
            next: () => {
                this.successMessage = 'Message supprimé définitivement';
                setTimeout(() => this.successMessage = '', 3000);
                this.loadSuggestions();
            },
            error: (err) => {
                console.error('Failed to delete suggestion', err);
                this.errorMessage = 'Erreur lors de la suppression';
                setTimeout(() => this.errorMessage = '', 3000);
            }
        });
    }
}
