import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface User {
    id: number | string;
    email: string;
    trainer_name: string;
    team?: string;
    phone?: string;
    email_verified: boolean;
    is_admin?: boolean;
    preferred_language?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = `${environment.apiUrl}/auth`;
    private adminApiUrl = `${environment.apiUrl}/admin`;
    // Original currentUserSubject and currentUser$ declarations are replaced by the new ones below
    // private currentUserSubject = new BehaviorSubject<User | null>(null);
    // public currentUser$ = this.currentUserSubject.asObservable();

    private currentUserSubject: BehaviorSubject<any>;
    public currentUser$: Observable<any>;
    public isLoggedIn$: Observable<boolean>;

    private suggestionsSubject = new BehaviorSubject<any[]>([]);
    public suggestions$ = this.suggestionsSubject.asObservable();

    public adminOpenSuggestionsCount$ = new BehaviorSubject<number>(0);
    private supabase: SupabaseClient;

    constructor(private http: HttpClient) {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
        const storedUser = localStorage.getItem('currentUser');
        this.currentUserSubject = new BehaviorSubject<any>(storedUser ? JSON.parse(storedUser) : null);
        this.currentUser$ = this.currentUserSubject.asObservable();

        this.isLoggedIn$ = this.currentUser$.pipe(
            map(user => !!user)
        );

        // Listen for auth state changes
        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log('[AuthService] Supabase Auth Event:', event);
            if (session?.user) {
                // Map Supabase user to our local format
                const mappedUser = {
                    ...session.user,
                    id: session.user.id, // Supabase uses UUID string, our app might expect number. Caution!
                    email: session.user.email,
                    token: session.access_token,
                    trainer_name: session.user.user_metadata?.['trainer_name'] || 'User',
                    is_admin: session.user.user_metadata?.['is_admin'] || false
                };
                this.currentUserSubject.next(mappedUser);
                localStorage.setItem('user', JSON.stringify(mappedUser));
                localStorage.setItem('token', session.access_token);
                this.loadSuggestions();
            } else if (event === 'SIGNED_OUT') {
                this.logout();
            }
        });
    }

    public get currentUserValue(): any {
        return this.currentUserSubject.value;
    }

    getHttpOptions() {
        const user = this.currentUserValue;
        if (user && user.token) {
            return {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                })
            };
        }
        return {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        };
    }

    loadSuggestions(includeArchived: boolean = false) {
        const token = localStorage.getItem('token');
        if (!token) return;

        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        this.http.get<any[]>(`${environment.apiUrl}/suggestions${includeArchived ? '?archived=true' : ''}`, { headers }).subscribe({
            next: (data) => this.suggestionsSubject.next(data),
            error: (err) => console.error('Failed to load suggestions', err)
        });
    }

    loadAdminStats(includeArchived: boolean = false) {
        const token = localStorage.getItem('token');
        if (!token || !this.isAdmin()) return;

        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        this.http.get<any[]>(`${environment.apiUrl}/suggestions/admin${includeArchived ? '?archived=true' : ''}`, { headers }).subscribe({
            next: (data) => {
                const openCount = data.filter(s => s.status === 'open').length;
                this.adminOpenSuggestionsCount$.next(openCount);
            },
            error: (err) => console.error('Failed to load admin stats', err)
        });
    }

    updateSuggestion(updatedSuggestion: any) {
        const currentSuggestions = this.suggestionsSubject.value;
        const index = currentSuggestions.findIndex(s => s.id === updatedSuggestion.id);
        if (index !== -1) {
            const newSuggestions = [...currentSuggestions];
            newSuggestions[index] = updatedSuggestion;
            this.suggestionsSubject.next(newSuggestions);
        }
    }

    public refreshUserFromStorage() {
        const user = localStorage.getItem('user');
        console.log('[AuthService] Refreshing user from storage. Found:', user ? 'YES' : 'NO');
        if (user) {
            const parsedUser = JSON.parse(user);
            this.currentUserSubject.next(parsedUser);
            console.log('[AuthService] User restored:', parsedUser.email);
            this.loadSuggestions();
            if (this.isAdmin()) {
                this.loadAdminStats();
            }
        }
    }

    signup(data: any): Observable<any> {
        return from(this.supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    trainer_name: data.trainer_name,
                    team: data.team,
                    is_admin: false
                }
            }
        })).pipe(
            map(res => {
                if (res.error) throw res.error;
                return res.data;
            })
        );
    }

    login(data: any): Observable<any> {
        return from(this.supabase.auth.signInWithPassword({
            email: data.email || data.trainer_name,
            password: data.password
        })).pipe(
            map(res => {
                if (res.error) throw res.error;
                return res.data;
            })
        );
    }

    googleLogin(token: string, user: any): Observable<any> {
        // For Google login with Supabase, we usually use signInWithIdToken
        return from(this.supabase.auth.signInWithIdToken({
            provider: 'google',
            token: token
        })).pipe(
            map(res => {
                if (res.error) throw res.error;
                return res.data;
            })
        );
    }

    forgotPassword(email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/forgot-password`, { email });
    }

    async logout() {
        await this.supabase.auth.signOut();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
        this.adminOpenSuggestionsCount$.next(0);
    }

    updateProfile(data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/profile`, data, { headers: this.getAuthHeaders() }).pipe(
            tap((res: any) => {
                if (res.user) {
                    localStorage.setItem('user', JSON.stringify(res.user));
                    this.currentUserSubject.next(res.user);
                }
            })
        );
    }

    getProfile(): Observable<any> {
        return this.http.get(`${this.apiUrl}/profile`, { headers: this.getAuthHeaders() }).pipe(
            tap((res: any) => {
                if (res.user) {
                    localStorage.setItem('user', JSON.stringify(res.user));
                    this.currentUserSubject.next(res.user);
                }
            })
        );
    }


    deleteAccount(): Observable<any> {
        return this.http.delete(`${this.apiUrl}/profile`, { headers: this.getAuthHeaders() }).pipe(
            tap(() => {
                this.logout();
            })
        );
    }

    private handleAuthSuccess(response: any) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        this.loadSuggestions();
        if (this.isAdmin()) {
            this.loadAdminStats();
        }
    }

    isAuthenticated(): boolean {
        const hasUser = !!this.currentUserSubject.value;
        const hasToken = !!localStorage.getItem('token');
        return hasUser && hasToken;
    }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No auth token found in localStorage');
            return new HttpHeaders();
        }
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    // Admin methods
    isAdmin(): boolean {
        return this.currentUserSubject.value?.is_admin || false;
    }

    updateCurrentUser(user: User) {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
    }

    getPreferredLanguage(): string {
        return this.currentUserSubject.value?.preferred_language || 'fr';
    }

    getAllUsers(): Observable<any> {
        return this.http.get(`${this.adminApiUrl}/users`, { headers: this.getAuthHeaders() });
    }

    updateUser(id: number | string, data: any): Observable<any> {
        return this.http.put(`${this.adminApiUrl}/users/${id}`, data, { headers: this.getAuthHeaders() });
    }

    deleteUser(id: number | string): Observable<any> {
        return this.http.delete(`${this.adminApiUrl}/users/${id}`, { headers: this.getAuthHeaders() });
    }

    toggleAdmin(id: number | string, is_admin: boolean): Observable<any> {
        return this.http.put(`${this.adminApiUrl}/users/${id}/admin`, { is_admin }, { headers: this.getAuthHeaders() });
    }
}
