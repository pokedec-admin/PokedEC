import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

interface PokemonCategory {
    pokemon_id: number;
    can_be_normal: boolean;
    can_be_legendary: boolean;
    can_be_mythical: boolean;
    can_be_ultra_beast: boolean;
    can_be_shiny: boolean;
    can_be_lucky: boolean;
    can_be_xxl: boolean;
    can_be_xxs: boolean;
    can_be_gmax: boolean;
    can_be_dynamax: boolean;
    can_be_mega: boolean;
    can_be_obscure: boolean;
    can_be_purified: boolean;
    can_be_perfect: boolean;
    updated_at?: string;
    updated_by_name?: string;
}

interface RegionGroup {
    name: string;
    pokemon: PokemonCategory[];
    expanded?: boolean;
}

@Component({
    selector: 'app-pokemon-categories',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './pokemon-categories.html',
    styleUrl: './pokemon-categories.css'
})
export class PokemonCategoriesComponent implements OnInit {
    allPokemon: PokemonCategory[] = [];
    regions: RegionGroup[] = [];
    errorMessage = '';
    successMessage = '';
    loading = false;

    private regionRanges = [
        { name: 'Kanto (Gen 1)', min: 1, max: 151 },
        { name: 'Johto (Gen 2)', min: 152, max: 251 },
        { name: 'Hoenn (Gen 3)', min: 252, max: 386 },
        { name: 'Sinnoh (Gen 4)', min: 387, max: 493 },
        { name: 'Unova (Gen 5)', min: 494, max: 649 },
        { name: 'Kalos (Gen 6)', min: 650, max: 721 },
        { name: 'Alola (Gen 7)', min: 722, max: 809 },
        { name: 'Galar (Gen 8)', min: 810, max: 905 },
        { name: 'Paldea (Gen 9)', min: 906, max: 1025 }
    ];

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit() {
        if (!this.authService.isAdmin()) {
            this.router.navigate(['/home']);
            return;
        }
        this.loadAllPokemon();
    }

    loadAllPokemon() {
        this.loading = true;
        this.errorMessage = '';

        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        // Load all 1025 Pokemon at once (no pagination for admin)
        this.http.get<any>(`/api/admin/pokemon-categories?limit=1025`, { headers })
            .subscribe({
                next: (response) => {
                    this.allPokemon = response.data;
                    this.groupByRegion();
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Failed to load pokemon categories', err);
                    this.errorMessage = 'Failed to load pokemon categories';
                    this.loading = false;
                }
            });
    }

    groupByRegion() {
        this.regions = this.regionRanges.map(region => ({
            name: region.name,
            pokemon: this.allPokemon.filter(p =>
                p.pokemon_id >= region.min && p.pokemon_id <= region.max
            ),
            expanded: false
        }));
    }

    toggleRegion(region: RegionGroup) {
        region.expanded = !region.expanded;
    }

    getPokemonSpriteUrl(pokemon_id: number): string {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon_id}.png`;
    }

    // Helper to get current category
    getCategory(pokemon: PokemonCategory): string {
        if (pokemon.can_be_legendary) return 'legendary';
        if (pokemon.can_be_mythical) return 'mythical';
        if (pokemon.can_be_ultra_beast) return 'ultra_beast';
        if (pokemon.can_be_normal) return 'normal';
        return 'normal'; // Default
    }

    // Helper to check if any category is enabled
    isAvailable(pokemon: PokemonCategory): boolean {
        return pokemon.can_be_normal || pokemon.can_be_legendary || pokemon.can_be_mythical || pokemon.can_be_ultra_beast;
    }

    // Update category
    setCategory(pokemon: PokemonCategory, category: string) {
        // If not available, we don't set the flag yet, but we might want to track it in a temp property if we had one.
        // For now, we assume if the user changes category, they want it to be available.
        // OR, if it's already available, we switch the flags.

        const available = this.isAvailable(pokemon);

        // Reset all
        pokemon.can_be_normal = false;
        pokemon.can_be_legendary = false;
        pokemon.can_be_mythical = false;
        pokemon.can_be_ultra_beast = false;

        if (available) {
            switch (category) {
                case 'legendary': pokemon.can_be_legendary = true; break;
                case 'mythical': pokemon.can_be_mythical = true; break;
                case 'ultra_beast': pokemon.can_be_ultra_beast = true; break;
                case 'normal': pokemon.can_be_normal = true; break;
            }
            this.savePokemon(pokemon);
        } else {
            // If not available, we just updated the "virtual" category. 
            // Since we can't save "hidden" category, we do nothing or maybe auto-enable?
            // Let's auto-enable if the user explicitly changes the category.
            switch (category) {
                case 'legendary': pokemon.can_be_legendary = true; break;
                case 'mythical': pokemon.can_be_mythical = true; break;
                case 'ultra_beast': pokemon.can_be_ultra_beast = true; break;
                case 'normal': pokemon.can_be_normal = true; break;
            }
            this.savePokemon(pokemon);
        }
    }

    // Toggle availability
    toggleAvailability(pokemon: PokemonCategory, event: any) {
        const isChecked = event.target.checked;

        if (!isChecked) {
            // Disable all
            pokemon.can_be_normal = false;
            pokemon.can_be_legendary = false;
            pokemon.can_be_mythical = false;
            pokemon.can_be_ultra_beast = false;
        } else {
            // Enable default (Normal) if nothing was selected (which shouldn't happen if we default to Normal)
            // Or try to restore previous? We can't. So default to Normal.
            pokemon.can_be_normal = true;
        }
        this.savePokemon(pokemon);
    }

    toggleShiny(pokemon: PokemonCategory) {
        pokemon.can_be_shiny = !pokemon.can_be_shiny;
        this.savePokemon(pokemon);
    }

    toggleLucky(pokemon: PokemonCategory) {
        pokemon.can_be_lucky = !pokemon.can_be_lucky;
        this.savePokemon(pokemon);
    }

    toggleXXL(pokemon: PokemonCategory) {
        pokemon.can_be_xxl = !pokemon.can_be_xxl;
        this.savePokemon(pokemon);
    }

    toggleXXS(pokemon: PokemonCategory) {
        pokemon.can_be_xxs = !pokemon.can_be_xxs;
        this.savePokemon(pokemon);
    }

    toggleGMax(pokemon: PokemonCategory) {
        pokemon.can_be_gmax = !pokemon.can_be_gmax;
        this.savePokemon(pokemon);
    }

    toggleDynamax(pokemon: PokemonCategory) {
        pokemon.can_be_dynamax = !pokemon.can_be_dynamax;
        this.savePokemon(pokemon);
    }

    toggleMega(pokemon: PokemonCategory) {
        pokemon.can_be_mega = !pokemon.can_be_mega;
        this.savePokemon(pokemon);
    }

    toggleObscure(pokemon: PokemonCategory) {
        pokemon.can_be_obscure = !pokemon.can_be_obscure;
        this.savePokemon(pokemon);
    }

    togglePurified(pokemon: PokemonCategory) {
        pokemon.can_be_purified = !pokemon.can_be_purified;
        this.savePokemon(pokemon);
    }

    togglePerfect(pokemon: PokemonCategory) {
        pokemon.can_be_perfect = !pokemon.can_be_perfect;
        this.savePokemon(pokemon);
    }

    private savePokemon(pokemon: PokemonCategory) {
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.put(`/api/admin/pokemon-categories/${pokemon.pokemon_id}`, pokemon, { headers })
            .subscribe({
                next: () => {
                    // Silent save - no success message to avoid clutter
                },
                error: (err) => {
                    console.error('Failed to update pokemon', err);
                    this.errorMessage = `Failed to update Pokemon #${pokemon.pokemon_id}. Please try again.`;
                    setTimeout(() => this.errorMessage = '', 3000);
                }
            });
    }

    getCategoryCount(pokemon: PokemonCategory[], category: keyof PokemonCategory): number {
        return pokemon.filter(p => p[category] === true).length;
    }
}
