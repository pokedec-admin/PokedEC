import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokemonService } from '../../services/pokemon.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PokemonSearchComponent } from '../../components/pokemon-search/pokemon-search.component';

interface PokemonEntry {
    id: number;
    pokemon_id: number;
    name: string;
    name_fr: string;
    name_en: string;
    form_name: string;
    image_url: string;
    region_id: number;
    region_name: string;
    type_primary_name: string;
    type_primary_color: string;
    type_secondary_name: string;
    type_secondary_color: string;
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
    has_trade: boolean;
    can_be_normal: boolean;
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
    can_be_legendary: boolean;
    can_be_mythical: boolean;
    can_be_ultra_beast: boolean;
    is_regional: boolean;
    regional_description: string;
}

interface RegionGroup {
    name: string;
    id: number;
    pokemon: PokemonEntry[];
    expanded: boolean;
}

@Component({
    selector: 'app-pokedex',
    standalone: true,
    imports: [CommonModule, FormsModule, PokemonSearchComponent],
    templateUrl: './pokedex.html',
    styleUrls: ['./pokedex.css']
})
export class PokedexComponent implements OnInit {
    allPokemon: PokemonEntry[] = [];
    filteredPokemon: PokemonEntry[] = [];
    regions: RegionGroup[] = [];
    isLoading = true;
    showAddSearch = false;

    // Filters
    searchQuery = '';
    selectedRegion = '';
    selectedType = '';
    selectedClassification = '';
    selectedCategory = '';
    selectedFormType = '';

    // Options for filters
    availableRegions: string[] = [];
    availableTypes: string[] = [];

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

    formTypes = [
        { value: '', label: 'Toutes les formes' },
        { value: 'normal', label: 'Formes Normales' },
        { value: 'variant', label: 'Variantes (Alola, Galar, etc)' },
        { value: 'mega', label: 'Méga-Évolutions' },
        { value: 'gmax', label: 'Gigamax' },
        { value: 'dynamax', label: 'Dynamax' }
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

    applyFilters() {
        let temp = this.allPokemon;

        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase().trim();
            temp = temp.filter(p =>
                (p.name && p.name.toLowerCase().includes(q)) ||
                (p.name_fr && p.name_fr.toLowerCase().includes(q)) ||
                (p.name_en && p.name_en.toLowerCase().includes(q)) ||
                p.pokemon_id.toString().includes(q)
            );
        }

        if (this.selectedRegion) {
            temp = temp.filter(p => p.region_name === this.selectedRegion);
        }

        if (this.selectedType) {
            temp = temp.filter(p =>
                p.type_primary_name === this.selectedType ||
                p.type_secondary_name === this.selectedType
            );
        }

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
                    temp = temp.filter(p => !p.has_normal);
                    break;
            }
        }

        this.filteredPokemon = temp;
        this.groupByRegion();
        this.cd.markForCheck();
    }

    groupByRegion() {
        const groups: { [key: number]: RegionGroup } = {};

        this.filteredPokemon.forEach(p => {
            const regionId = p.region_id || 11;
            const regionName = p.region_name || 'Inconnue';

            if (!groups[regionId]) {
                groups[regionId] = {
                    id: regionId,
                    name: regionName,
                    pokemon: [],
                    expanded: true
                };
            }
            groups[regionId].pokemon.push(p);
        });

        this.regions = Object.values(groups).sort((a, b) => a.id - b.id);
    }

    toggleRegion(region: RegionGroup) {
        region.expanded = !region.expanded;
    }

    trackById(index: number, item: PokemonEntry) {
        return `${item.pokemon_id}-${item.form_name}`;
    }

    goToDetail(id: number, form: string = 'Normal') {
        this.router.navigate(['/pokedex', id], { queryParams: { form: form } });
    }

    toggleField(p: PokemonEntry, field: string) {
        this.pokemonService.toggleField(p.pokemon_id, field, p.form_name).subscribe({
            next: (updated) => {
                const index = this.allPokemon.findIndex(x => x.pokemon_id === p.pokemon_id && x.form_name === p.form_name);
                if (index !== -1) {
                    this.allPokemon[index] = { ...this.allPokemon[index], ...updated };
                    this.applyFilters();
                }
            },
            error: (err) => console.error(err)
        });
    }

    isOwned(p: PokemonEntry): boolean {
        return p.has_normal;
    }
}
