import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';
import { PokemonSearchComponent } from '../../components/pokemon-search/pokemon-search.component';

export interface PokemonEntry {
    id: number | string;
    user_id: number | string;
    pokemon_id: number;
    name: string;
    image_url: string;

    // Master Data
    name_fr?: string;
    name_en?: string;
    region_name?: string;
    type_primary_name?: string;
    type_primary_color?: string;
    type_secondary_name?: string;
    type_secondary_color?: string;

    // Availability (Master)
    can_be_normal?: boolean;
    can_be_shiny?: boolean;
    can_be_lucky?: boolean;
    can_be_xxl?: boolean;
    can_be_xxs?: boolean;
    can_be_gmax?: boolean;
    can_be_dynamax?: boolean;
    can_be_mega?: boolean;
    can_be_obscure?: boolean;
    can_be_purified?: boolean;
    can_be_perfect?: boolean;
    can_be_legendary?: boolean;
    can_be_mythical?: boolean;
    can_be_ultra_beast?: boolean;

    // User State
    has_normal: boolean;
    has_shiny: boolean;
    has_lucky: boolean;
    has_xxl: boolean;
    has_xxs: boolean;
    has_gmax: boolean;
    has_dynamax: boolean;
    has_mega: boolean;
    has_obscure: boolean;
    has_purifie: boolean;
    has_parfait: boolean;
    has_legendary: boolean;
    has_mythical: boolean;
    has_ultra_beast: boolean;

    // Trade State
    has_trade: boolean;
    trade_shiny: boolean;
    trade_xxl: boolean;
    trade_xxs: boolean;
    trade_gmax: boolean;
    trade_dynamax: boolean;
    trade_mega: boolean;
    trade_purified: boolean;
    trade_legendary: boolean;
    trade_mythical: boolean;
    trade_ultra_beast: boolean;

    master_trade_status?: string;
    is_regional?: boolean;
    regional_description?: string;
    form_name: string;
}

@Component({
    selector: 'app-pokedex',
    standalone: true,
    imports: [CommonModule, FormsModule, PokemonSearchComponent],
    templateUrl: './pokedex.html',
    styleUrls: ['./pokedex.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Pokedex implements OnInit {
    // Data Source
    allPokemon: PokemonEntry[] = [];
    filteredPokemon: PokemonEntry[] = [];
    displayedPokemon: PokemonEntry[] = [];

    // Filter Models
    searchQuery: string = '';
    selectedRegion: string = '';
    selectedType: string = '';
    selectedFormType: string = ''; // '', 'normal', 'variant'

    selectedClassification: string = ''; // normal, legendary...
    selectedCategory: string = ''; // shiny, lucky...

    // UI State
    isLoading: boolean = true;
    displayLimit: number = 50;

    showAddSearch: boolean = false; // Toggle for global search

    // Options
    availableRegions: string[] = [];
    availableTypes: string[] = [];

    formTypes = [
        { value: '', label: 'Toutes les formes' },
        { value: 'normal', label: 'Formes de base uniquement' },
        { value: 'variant', label: 'Formes spéciales (Alola, Galar, etc.)' },
        { value: 'mega', label: 'Méga / Primo' },
        { value: 'gmax', label: 'Gigamax' },
        { value: 'dynamax', label: 'Dynamax' }
    ];

    classifications = [
        { value: '', label: 'Toutes les classifications' },
        { value: 'normal', label: 'Normal' },
        { value: 'legendary', label: 'Légendaire' },
        { value: 'mythical', label: 'Fabuleux' },
        { value: 'ultra_beast', label: 'Ultra-Chimère' }
    ];

    categories = [
        { value: '', label: 'Toutes les catégories' },
        { value: 'shiny', label: '✨ Shiny' },
        { value: 'lucky', label: '🍀 Lucky' },
        { value: 'xxl', label: 'XXL' },
        { value: 'xxs', label: 'XXS' },
        { value: 'gmax', label: 'G-MAX' },
        { value: 'dynamax', label: 'Dynamax' },
        { value: 'mega', label: 'Méga' },
        { value: 'obscure', label: 'Obscur' },
        { value: 'purified', label: 'Purifié' },
        { value: 'perfect', label: 'Parfait (100%)' },
        { value: 'trade', label: 'Disponible à l\'échange' },
        { value: 'regional', label: '📍 Régional' },
        { value: 'missing', label: 'Manquants (Non capturés)' }
    ];

    constructor(
        private pokemonService: PokemonService,
        private router: Router,
        private cd: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadPokedex();
    }

    loadPokedex() {
        this.isLoading = true;
        this.cd.markForCheck();

        this.pokemonService.getMyPokedex().subscribe({
            next: (data: any[]) => {
                this.allPokemon = data;
                this.extractOptions();
                this.applyFilters();
                this.isLoading = false;
                this.cd.markForCheck();
            },
            error: (err) => {
                console.error('Error loading pokedex', err);
                this.isLoading = false;
                this.cd.markForCheck();
            }
        });
    }

    extractOptions() {
        const regions = new Set<string>();
        const types = new Set<string>();

        this.allPokemon.forEach(p => {
            if (p.region_name) regions.add(p.region_name);
            if (p.type_primary_name) types.add(p.type_primary_name);
            if (p.type_secondary_name) types.add(p.type_secondary_name);
        });

        this.availableRegions = Array.from(regions).sort();
        this.availableTypes = Array.from(types).sort();
    }

    toggleAddSearch() {
        this.showAddSearch = !this.showAddSearch;
    }

    // --- Filtering Logic ---
    applyFilters() {
        let temp = this.allPokemon;

        // Search (Name or ID)
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase().trim();
            temp = temp.filter(p =>
                (p.name && p.name.toLowerCase().includes(q)) ||
                (p.name_fr && p.name_fr.toLowerCase().includes(q)) ||
                (p.name_en && p.name_en.toLowerCase().includes(q)) ||
                p.pokemon_id.toString().includes(q)
            );
        }

        // Region
        if (this.selectedRegion) {
            temp = temp.filter(p => p.region_name === this.selectedRegion);
        }

        // Type
        if (this.selectedType) {
            temp = temp.filter(p =>
                p.type_primary_name === this.selectedType ||
                p.type_secondary_name === this.selectedType
            );
        }

        // Form Type
        if (this.selectedFormType) {
            if (this.selectedFormType === 'normal') {
                temp = temp.filter(p => p.form_name === 'Normal');
            } else if (this.selectedFormType === 'variant') {
                temp = temp.filter(p => p.form_name !== 'Normal' &&
                    !p.form_name.startsWith('Méga') &&
                    !p.form_name.startsWith('Mega') &&
                    !p.form_name.includes('Primal') &&
                    !p.form_name.startsWith('Gigamax') &&
                    !p.form_name.startsWith('Dynamax'));
            } else if (this.selectedFormType === 'mega') {
                temp = temp.filter(p => p.form_name.startsWith('Méga') || p.form_name.startsWith('Mega') || p.form_name.includes('Primal'));
            } else if (this.selectedFormType === 'gmax') {
                temp = temp.filter(p => p.form_name.startsWith('Gigamax'));
            } else if (this.selectedFormType === 'dynamax') {
                temp = temp.filter(p => p.form_name.startsWith('Dynamax'));
            }
        }

        // Classification (Legendary, etc.)
        if (this.selectedClassification) {
            switch (this.selectedClassification) {
                case 'legendary':
                    temp = temp.filter(p => p.can_be_legendary);
                    break;
                case 'mythical':
                    temp = temp.filter(p => p.can_be_mythical);
                    break;
                case 'ultra_beast':
                    temp = temp.filter(p => p.can_be_ultra_beast);
                    break;
                case 'normal':
                    temp = temp.filter(p =>
                        !p.can_be_legendary && !p.can_be_mythical && !p.can_be_ultra_beast
                    );
                    break;
            }
        }

        // Category (Status)
        if (this.selectedCategory) {
            switch (this.selectedCategory) {
                case 'shiny': temp = temp.filter(p => p.has_shiny); break;
                case 'lucky': temp = temp.filter(p => p.has_lucky); break;
                case 'xxl': temp = temp.filter(p => p.has_xxl); break;
                case 'xxs': temp = temp.filter(p => p.has_xxs); break;
                case 'gmax': temp = temp.filter(p => p.form_name.startsWith('Gigamax') && p.has_normal); break;
                case 'dynamax': temp = temp.filter(p => p.form_name.startsWith('Dynamax') && p.has_normal); break;
                case 'mega': temp = temp.filter(p => (p.form_name.startsWith('Méga') || p.form_name.startsWith('Mega') || p.form_name.includes('Primal')) && p.has_normal); break;
                case 'obscure': temp = temp.filter(p => p.has_obscure); break;
                case 'purified': temp = temp.filter(p => p.has_purifie); break;
                case 'perfect': temp = temp.filter(p => p.has_parfait); break;
                case 'trade': temp = temp.filter(p => p.has_trade); break;
                case 'regional': temp = temp.filter(p => p.is_regional); break;
                case 'missing':
                    // Missing standard form
                    temp = temp.filter(p => !this.isStandardCaught(p));
                    break;
            }
        }

        this.filteredPokemon = temp;
        this.displayLimit = 50;
        this.updateDisplayed();
    }

    updateDisplayed() {
        this.displayedPokemon = this.filteredPokemon.slice(0, this.displayLimit);
        this.cd.markForCheck();
    }

    trackById(index: number, item: PokemonEntry) {
        return item.pokemon_id;
    }

    showMore() {
        this.displayLimit += 50;
        this.updateDisplayed();
    }

    // --- Actions ---

    goToDetail(id: number, form: string = 'Normal') {
        this.router.navigate(['/pokedex', id], { queryParams: { form: form } });
    }

    handleToggleSuccess(pokemon: PokemonEntry, updated: any, field: keyof PokemonEntry) {
        // Find existing index
        const index = this.allPokemon.findIndex(p => p.pokemon_id === pokemon.pokemon_id && p.form_name === pokemon.form_name);
        if (index !== -1) {
            // Update the object in allPokemon
            this.allPokemon[index] = { ...this.allPokemon[index], ...updated };

            // Re-apply filters to sync displayed list
            this.applyFilters();
            this.cd.markForCheck();
        }
    }

    toggleNormal(p: PokemonEntry) {
        this.pokemonService.toggleNormal(p.pokemon_id, p.form_name).subscribe({
            next: (res) => this.handleToggleSuccess(p, res, 'has_normal'),
            error: (err) => console.error(err)
        });
    }

    toggleShiny(p: PokemonEntry) {
        this.pokemonService.toggleShiny(p.pokemon_id, p.form_name).subscribe({
            next: (res) => this.handleToggleSuccess(p, res, 'has_shiny'),
            error: (err) => console.error(err)
        });
    }

    toggleLucky(p: PokemonEntry) {
        this.pokemonService.toggleLucky(p.pokemon_id, p.form_name).subscribe({
            next: (res) => this.handleToggleSuccess(p, res, 'has_lucky'),
            error: (err) => console.error(err)
        });
    }

    toggleXXL(p: PokemonEntry) {
        this.pokemonService.toggleField(p.pokemon_id, 'has_xxl', p.form_name).subscribe({
            next: (res) => this.handleToggleSuccess(p, res, 'has_xxl'),
            error: (err) => console.error(err)
        });
    }

    toggleXXS(p: PokemonEntry) {
        this.pokemonService.toggleField(p.pokemon_id, 'has_xxs', p.form_name).subscribe({
            next: (res) => this.handleToggleSuccess(p, res, 'has_xxs'),
            error: (err) => console.error(err)
        });
    }

    toggleStandard(p: PokemonEntry) {
        // Unified toggle: Always toggle 'has_normal' for standard form,
        // regardless of classification (Legendary, Mythical, etc.)
        this.pokemonService.toggleNormal(p.pokemon_id, p.form_name).subscribe({
            next: (res) => this.handleToggleSuccess(p, res, 'has_normal'),
            error: (err) => console.error(err)
        });
    }

    getStandardLabel(p: PokemonEntry): string {
        // Label remains useful for tooltip, but action is always "Standard"
        if (p.can_be_legendary) return 'Légendaire (Standard)';
        if (p.can_be_mythical) return 'Fabuleux (Standard)';
        if (p.can_be_ultra_beast) return 'Ultra-Chimère (Standard)';
        return 'Normal (Standard)';
    }

    isStandardCaught(p: PokemonEntry): boolean {
        // Single source of truth is now has_normal
        return p.has_normal;
        // Legacy fallback (optional): || p.has_legendary || p.has_mythical... 
        // But since we migrate data, has_normal should be enough.
    }
}
