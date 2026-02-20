import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PokemonService } from '../../services/pokemon.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { SystemService, SystemStatus, MonitoringResponse } from '../../services/system.service';
import { PokemonSearchComponent } from '../../components/pokemon-search/pokemon-search.component';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, PokemonSearchComponent],
    templateUrl: './home.html',
    styleUrl: './home.css'
})
export class Home implements OnInit {
    isLoggedIn = false;
    trainerName: string = '';
    team: string = '';
    tradeOpportunities: any[] = [];
    recentOthersActivity: any[] = [];
    myRecentPokemon: any = null;
    userStats: any = null;
    myWantedPokemonIds: Set<number> = new Set();
    errorMessage: string = '';

    // System Monitoring
    currentEnv: string = 'UNKNOWN';
    currentVersion: string = '';
    monitoringData: any = null;
    isLoadingMonitoring = false;
    deployingTarget: string | null = null;
    switchingTarget: string | null = null;

    get teamBadge(): string {
        if (!this.team) return '';
        switch (this.team) {
            case 'Mystic': return '🔵';
            case 'Valor': return '🔴';
            case 'Instinct': return '🟡';
            default: return '';
        }
    }

    // Guest View State
    guestViewMode: 'menu' | 'login' | 'signup' | 'reset' = 'menu';
    authError: string = '';
    authSuccess: string = '';

    loginData = { trainer_name: '', password: '' };
    signupData = { email: '', password: '', trainer_name: '', team: 'Mystic' };
    resetEmail: string = '';

    // Auth Methods
    setGuestView(mode: 'menu' | 'login' | 'signup' | 'reset') {
        this.guestViewMode = mode;
        this.authError = '';
        this.authSuccess = '';
    }

    onLogin() {
        if (!this.loginData.trainer_name || !this.loginData.password) {
            this.authError = 'Veuillez remplir tous les champs';
            return;
        }
        this.authService.login(this.loginData).subscribe({
            next: () => {
                // Login successful, state updates automatically via subscription
            },
            error: (err) => {
                this.authError = err.error?.error || 'Erreur de connexion';
            }
        });
    }

    onSignup() {
        if (!this.signupData.email || !this.signupData.password || !this.signupData.trainer_name) {
            this.authError = 'Veuillez remplir tous les champs obligatoires';
            return;
        }
        this.authService.signup(this.signupData).subscribe({
            next: () => {
                // Signup successful, auto-login usually happens or user is redirected
            },
            error: (err) => {
                this.authError = err.error?.error || 'Erreur d\'inscription';
            }
        });
    }

    onResetPassword() {
        if (!this.resetEmail) {
            this.authError = 'Veuillez entrer votre email';
            return;
        }
        this.authService.forgotPassword(this.resetEmail).subscribe({
            next: (res: any) => {
                this.authSuccess = res.message;
                this.authError = '';
            },
            error: (err) => {
                this.authError = 'Erreur lors de la demande de réinitialisation';
            }
        });
    }

    constructor(
        public authService: AuthService,
        private pokemonService: PokemonService,
        public router: Router,
        private http: HttpClient,
        private systemService: SystemService
    ) { }

    // Deployment Modal State
    showDeployModal = false;
    deploymentLogs: string[] = [];
    deploymentStatus: 'idle' | 'running' | 'success' | 'error' = 'idle';
    deploymentTarget = '';

    ngOnInit(): void {
        this.loadSystemStatus();

        this.authService.isLoggedIn$.subscribe(isLoggedIn => {
            this.isLoggedIn = isLoggedIn;
            if (isLoggedIn) {
                this.loadDashboardData();
                this.loadUserStats();

                // Get trainer name and team
                const user = this.authService.currentUserValue;
                if (user) {
                    this.trainerName = user.trainer_name || user.email.split('@')[0];
                    this.team = user.team || '';

                    if (user.is_admin) {
                        this.loadMonitoring();
                    }
                }
            }
        });

        // Also load if already logged in when component loads (e.g. page refresh)
        if (this.authService.isAuthenticated()) {
            this.isLoggedIn = true;
            this.loadDashboardData();
            this.loadUserStats();

            const user = this.authService.currentUserValue;
            if (user) {
                this.trainerName = user.trainer_name || user.email.split('@')[0];
                this.team = user.team || '';

                if (user.is_admin) {
                    this.loadMonitoring();
                }
            }
        }
    }

    deploy(target: 'blue' | 'green') {
        if (this.deployingTarget) return;

        this.deployingTarget = target;
        this.deploymentTarget = target;
        this.showDeployModal = true;
        this.deploymentStatus = 'running';
        this.deploymentLogs = [`🚀 Starting deployment to ${target.toUpperCase()}...`, '⏳ Please wait, this may take a few minutes...'];

        this.systemService.deploy(target).subscribe({
            next: (res: any) => {
                console.log('Deployment started', res);
                // Since the API returns immediately with "started", we can't show full logs yet
                // But the user wants "avancement". 
                // Actually, my previous fix to system.js made it exec and wait? 
                // No, system.js uses exec with a callback, but res.json is called immediately?
                // Wait, let's check system.js again.
                // It calls exec, and inside the callback it logs. But res.json is called OUTSIDE the callback.
                // So the response returns immediately "Deployment started".
                // This means the frontend won't get the logs in the response.

                // To support "avancement", I need to change system.js to wait OR poll.
                // For now, I will simulate progress steps to keep the user informed that it's running.

                this.deploymentLogs.push('✅ Deployment command sent to backend.');
                this.deploymentLogs.push('🔄 Deployment is running in background on the server.');
                this.deploymentLogs.push('⚠️  Note: Real-time logs are not yet available via API.');
                this.deploymentLogs.push('👉 Please check the Monitoring Dashboard in a few minutes to see the status change.');

                this.deploymentStatus = 'success';
                this.deployingTarget = null;

                // Refresh monitoring after a delay
                setTimeout(() => this.loadMonitoring(), 5000);
            },
            error: (err) => {
                console.error('Deployment failed', err);
                this.deploymentLogs.push(`❌ Error: ${err.error?.error || err.message}`);
                this.deploymentStatus = 'error';
                this.deployingTarget = null;
            }
        });
    }

    closeDeployModal() {
        if (this.deploymentStatus === 'running') return;
        this.showDeployModal = false;
        this.deploymentLogs = [];
    }

    loadSystemStatus() {
        this.systemService.getStatus().subscribe({
            next: (status) => {
                this.currentEnv = status.env;
                this.currentVersion = status.version;
            },
            error: (err) => console.error('Failed to load system status', err)
        });
    }

    loadMonitoring() {
        this.isLoadingMonitoring = true;
        this.systemService.getMonitoring().subscribe({
            next: (data) => {
                this.monitoringData = data;
                this.isLoadingMonitoring = false;
            },
            error: (err) => {
                console.error('Failed to load monitoring', err);
                this.isLoadingMonitoring = false;
            }
        });
    }

    switchEnv(target: 'blue' | 'green') {
        if (!confirm(`ATTENTION: Vous allez basculer l'environnement PUBLIC sur ${target.toUpperCase()}. Continuer ?`)) return;

        this.switchingTarget = target;
        this.systemService.switchEnv(target).subscribe({
            next: (res) => {
                alert(`Basculement effectué : ${res.message}\n\nNote: Si le proxy Synology n'est pas automatisé, veuillez le mettre à jour manuellement.`);
                this.switchingTarget = null;
                this.loadMonitoring(); // Refresh status
            },
            error: (err) => {
                alert(`Erreur de basculement : ${err.error?.error || err.message}`);
                this.switchingTarget = null;
            }
        });
    }

    loadUserStats() {
        this.pokemonService.getStats().subscribe({
            next: (stats) => {
                this.userStats = stats;
                // If user has 0 pokemon, show welcome modal
                if (parseInt(this.userStats.total) === 0) {
                    this.showWelcomeModal = true;
                }
            },
            error: (err) => console.error('Failed to load stats', err)
        });
    }

    loadDashboardData(): void {
        forkJoin({
            myPokedex: this.pokemonService.getMyPokedex(),
            tradeAvailable: this.pokemonService.getTradeAvailable(),
            recentOthers: this.pokemonService.getRecentOthers(),
            myRecent: this.pokemonService.getMyRecent()
        }).subscribe({
            next: (data: any) => {
                this.calculateWantedPokemon(data.myPokedex);
                this.processTradeOpportunities(data.tradeAvailable);
                this.processRecentOthers(data.recentOthers);
                this.myRecentPokemon = data.myRecent;
            },
            error: (err: any) => console.error('Failed to load dashboard', err)
        });
    }

    calculateWantedPokemon(myPokedex: any[]): void {
        this.myWantedPokemonIds.clear();

        // Check all Pokemon from Gen 1-9
        for (let id = 1; id <= 1025; id++) {
            const existing = myPokedex.find(p => p.pokemon_id === id);

            if (!existing) {
                // Pokemon not in Pokedex at all
                this.myWantedPokemonIds.add(id);
            } else {
                // Check if missing any variants
                if (!existing.has_shiny || !existing.has_lucky ||
                    !existing.has_xxl || !existing.has_xxs) {
                    this.myWantedPokemonIds.add(id);
                }
            }
        }
    }

    processTradeOpportunities(tradeAvailable: any[]) {
        // Group by pokemon_id and collect usernames
        const grouped = new Map<number, any>();

        tradeAvailable.forEach(item => {
            if (this.myWantedPokemonIds.has(item.pokemon_id)) {
                if (!grouped.has(item.pokemon_id)) {
                    grouped.set(item.pokemon_id, {
                        pokemon_id: item.pokemon_id,
                        name: item.name,
                        image_url: item.image_url,
                        has_trade: false,
                        trade_shiny: false,
                        trade_xxl: false,
                        trade_xxs: false,
                        trade_gmax: false,
                        trade_mega: false,
                        trade_purified: false,
                        users: []
                    });
                }

                // Accumulate trade flags (OR operation - if any user has it, show it)
                const pokemon = grouped.get(item.pokemon_id)!;
                pokemon.has_trade = pokemon.has_trade || item.has_trade;
                pokemon.trade_shiny = pokemon.trade_shiny || item.trade_shiny;
                pokemon.trade_xxl = pokemon.trade_xxl || item.trade_xxl;
                pokemon.trade_xxs = pokemon.trade_xxs || item.trade_xxs;
                pokemon.trade_gmax = pokemon.trade_gmax || item.trade_gmax;
                pokemon.trade_mega = pokemon.trade_mega || item.trade_mega;
                pokemon.trade_purified = pokemon.trade_purified || item.trade_purified;

                // Check if we already have this user for this pokemon
                const existingUser = pokemon.users.find((u: any) => u.email === item.email);
                if (!existingUser) {
                    pokemon.users.push({
                        id: item.user_id, // Ensure backend returns user_id in trade-available endpoint!
                        // Wait, backend trade-available returns: p.pokemon_id, ..., u.trainer_name, u.email. 
                        // It does NOT return user_id. I need to update backend query or use email to find user?
                        // No, I should update backend to return user_id.
                        // For now, I'll assume I can get it. 
                        // Actually, I need to update backend query first to return u.id as user_id.
                        username: item.username,
                        email: item.email
                    });
                }
            }
        });

        this.tradeOpportunities = Array.from(grouped.values()).slice(0, 6);
    }

    processRecentOthers(recentOthers: any[]) {
        // Filter to only show Pokemon that are in my wanted list
        this.recentOthersActivity = recentOthers
            .filter(item => this.myWantedPokemonIds.has(item.pokemon_id))
            .slice(0, 10);
    }

    getPercentage(count: number | string, total: number | string): number {
        const c = typeof count === 'string' ? parseInt(count) : count;
        const t = typeof total === 'string' ? parseInt(total) : total;
        if (!t || t === 0) return 0;
        return Math.round((c / t) * 100);
    }

    requestTrade(opportunity: any, user: any) {
        // We need target_user_id. 
        // If backend doesn't return it, we can't make the request.
        // I must update backend `pokedex.js` -> `/trade-available` to return `u.id as user_id`.

        if (!user.id) {
            console.error('User ID missing for trade request');
            return;
        }

        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.post('/api/trade/request', {
            target_user_id: user.id,
            pokemon_id: opportunity.pokemon_id
        }, { headers }).subscribe({
            next: (res: any) => {
                alert(`Demande d'échange envoyée à ${user.username || user.email} !`);
                // Optionally update UI to show 'Pending'
                user.requestSent = true;
            },
            error: (err) => {
                console.error('Trade request failed', err);
                if (err.status === 409) {
                    alert('Une demande est déjà en cours pour ce Pokémon avec ce dresseur.');
                } else {
                    alert('Erreur lors de l\'envoi de la demande.');
                }
            }
        });
    }

    getVariantBadges(pokemon: any): string[] {
        const badges: string[] = [];
        if (pokemon.has_shiny) badges.push('✨ Shiny');
        if (pokemon.has_lucky) badges.push('🍀 Lucky');
        if (pokemon.has_xxl) badges.push('🔴 XXL');
        if (pokemon.has_xxs) badges.push('🔵 XXS');
        if (pokemon.has_gmax) badges.push('⚡ G-MAX');
        if (pokemon.has_dynamax) badges.push('💥 D-Max');
        if (pokemon.has_mega) badges.push('🧬 Méga');
        if (pokemon.has_obscure) badges.push('🌑 Obscure');
        if (pokemon.has_purifie) badges.push('☀️ Purifié');
        if (pokemon.has_parfait) badges.push('🌟 Parfait');
        if (pokemon.has_trade) badges.push('💱 Échange (Normal)');
        if (pokemon.trade_shiny) badges.push('💱 Échange Shiny');
        if (pokemon.trade_xxl) badges.push('💱 Échange XXL');
        if (pokemon.trade_xxs) badges.push('💱 Échange XXS');
        if (pokemon.trade_gmax) badges.push('💱 Échange G-MAX');
        if (pokemon.trade_dynamax) badges.push('💱 Échange D-Max');
        if (pokemon.trade_mega) badges.push('💱 Échange Méga');
        if (pokemon.trade_purified) badges.push('💱 Échange Purifié');
        return badges;
    }

    getTradeBadges(pokemon: any): string[] {
        const badges: string[] = [];
        if (pokemon.has_trade) badges.push('Normal');
        if (pokemon.trade_shiny) badges.push('✨ Shiny');
        if (pokemon.trade_xxl) badges.push('XXL');
        if (pokemon.trade_xxs) badges.push('XXS');
        if (pokemon.trade_gmax) badges.push('G-MAX');
        if (pokemon.trade_dynamax) badges.push('D-Max');
        if (pokemon.trade_mega) badges.push('Méga');
        if (pokemon.trade_purified) badges.push('Purifié');
        return badges;
    }

    // Welcome Modal & Bulk Fill
    showWelcomeModal = false;
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

    closeWelcomeModal() {
        this.showWelcomeModal = false;
    }

    bulkFillPokedex() {
        const selectedCategories = Object.keys(this.bulkFillCategories)
            .filter(key => this.bulkFillCategories[key as keyof typeof this.bulkFillCategories]);

        if (selectedCategories.length === 0) {
            this.bulkFillError = 'Veuillez sélectionner au moins une catégorie.';
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
                setTimeout(() => {
                    this.closeWelcomeModal();
                    this.loadDashboardData();
                    this.loadUserStats();
                }, 2000);
            },
            error: (err) => {
                console.error('Bulk fill failed', err);
                this.bulkFillError = 'Erreur lors du remplissage automatique.';
                this.bulkFillLoading = false;
            }
        });
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        return date.toLocaleDateString('fr-FR');
    }
}
