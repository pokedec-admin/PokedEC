import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface Suggestion {
    id: number;
    admin_response?: string;
    is_read?: boolean;
}

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './footer.html',
    styleUrl: './footer.css'
})
export class Footer implements OnInit {
    version = environment.version;
    isLoggedIn = false;
    currentUser: any = null;
    suggestions: Suggestion[] = [];

    constructor(
        private authService: AuthService,
        private http: HttpClient,
        private router: Router
    ) {
        this.authService.currentUser$.subscribe(user => {
            this.isLoggedIn = !!user;
            this.currentUser = user;
        });

        // Subscribe to suggestions from AuthService
        this.authService.suggestions$.subscribe(suggestions => {
            this.suggestions = suggestions;
        });
    }

    ngOnInit() {
        // No need to call loadSuggestions here, AuthService handles it
    }

    get hasNewResponses(): boolean {
        return this.suggestions.some(s => s.admin_response && s.admin_response.trim() !== '' && !s.is_read);
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
