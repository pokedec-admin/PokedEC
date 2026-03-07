import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

interface Suggestion {
    id: number;
    status: string;
    admin_response?: string;
    is_read?: boolean;
}

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, CommonModule],
    templateUrl: './header.html',
    styleUrl: './header.css'
})
export class Header implements OnInit {
    isLoggedIn = false;
    currentUser: any = null;
    isMenuOpen = false;
    suggestions: Suggestion[] = [];

    adminSuggestionsCount = 0;

    constructor(
        private authService: AuthService,
        private router: Router,
        public themeService: ThemeService
    ) {
        // Subscribe to auth state changes
        this.authService.currentUser$.subscribe(user => {
            this.isLoggedIn = !!user;
            this.currentUser = user;
        });

        // Subscribe to suggestions from AuthService
        this.authService.suggestions$.subscribe(suggestions => {
            this.suggestions = suggestions;
        });

        // Subscribe to admin suggestions count
        this.authService.adminOpenSuggestionsCount$.subscribe(count => {
            this.adminSuggestionsCount = count;
        });
    }

    ngOnInit() {
        // No need to call loadSuggestions here, AuthService handles it
    }

    get isAdmin(): boolean {
        return this.authService.isAdmin();
    }

    get openSuggestionsCount(): number {
        return this.adminSuggestionsCount;
    }

    get hasNewResponses(): boolean {
        return this.suggestions.some(s => s.admin_response && s.admin_response.trim() !== '' && !s.is_read);
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
        this.closeMenu();
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
    }

    toggleTheme() {
        this.themeService.toggleTheme();
    }

    closeMenu() {
        this.isMenuOpen = false;
    }
}
