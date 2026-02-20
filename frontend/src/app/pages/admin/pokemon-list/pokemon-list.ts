import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminPokemonService, PokemonMaster, Classification, Region, PokemonType } from '../../../services/admin-pokemon.service';

@Component({
    selector: 'app-admin-pokemon-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './pokemon-list.html',
    styleUrls: ['../admin.css']
})
export class AdminPokemonListComponent implements OnInit {
    pokemonList: PokemonMaster[] = [];
    filteredPokemon: PokemonMaster[] = [];

    // Search & Filters
    pokemonSearchQuery = '';
    selectedClassification: number | null = null;
    selectedRegion: number | null = null;
    selectedType: number | null = null;
    filterRegional: boolean | null = null; // null=all, true=yes, false=no
    filterForm: 'all' | 'normal' | 'variants' | 'mega' | 'gmax' | 'dynamax' = 'all';

    // Reference Data
    classifications: Classification[] = [];
    regions: Region[] = [];
    types: PokemonType[] = [];

    loadingPokemon = false;
    errorMessage = '';

    constructor(private adminPokemonService: AdminPokemonService) { }

    ngOnInit() {
        this.loadState();
        this.loadReferenceData();
        this.loadPokemon();
    }

    loadState() {
        const s = this.adminPokemonService.filterState;
        this.pokemonSearchQuery = s.pokemonSearchQuery;
        this.selectedClassification = s.selectedClassification;
        this.selectedRegion = s.selectedRegion;
        this.selectedType = s.selectedType;
        this.filterRegional = s.filterRegional;
        this.filterForm = s.filterForm;
    }

    saveState() {
        this.adminPokemonService.filterState = {
            pokemonSearchQuery: this.pokemonSearchQuery,
            selectedClassification: this.selectedClassification,
            selectedRegion: this.selectedRegion,
            selectedType: this.selectedType,
            filterRegional: this.filterRegional,
            filterForm: this.filterForm
        };
    }

    loadReferenceData() {
        this.adminPokemonService.getClassifications().subscribe(data => this.classifications = data);
        this.adminPokemonService.getRegions().subscribe(data => this.regions = data);
        this.adminPokemonService.getTypes().subscribe(data => this.types = data);
    }

    loadPokemon() {
        this.loadingPokemon = true;
        this.adminPokemonService.getAllPokemon().subscribe({
            next: (data) => {
                this.pokemonList = data;
                this.applyFilters();
                this.loadingPokemon = false;
            },
            error: (err) => {
                console.error('Failed to load Pokemon', err);
                this.errorMessage = 'Échec du chargement des Pokémon';
                this.loadingPokemon = false;
            }
        });
    }

    resetFilters() {
        this.selectedClassification = null;
        this.selectedRegion = null;
        this.selectedType = null;
        this.filterRegional = null;
        this.filterForm = 'all';
        this.pokemonSearchQuery = '';
        this.applyFilters();
    }

    applyFilters() {
        let result = this.pokemonList;

        // 1. Text Search
        const query = this.pokemonSearchQuery.toLowerCase().trim();
        if (query) {
            result = result.filter(p =>
                p.pokemon_id.toString().includes(query) ||
                p.name_fr?.toLowerCase().includes(query) ||
                p.name_en?.toLowerCase().includes(query) ||
                p.name_de?.toLowerCase().includes(query) ||
                p.name_it?.toLowerCase().includes(query) ||
                p.form_name.toLowerCase().includes(query)
            );
        }

        // 2. Dropdown Filters
        if (this.selectedClassification) {
            result = result.filter(p => p.classification_id == this.selectedClassification);
        }

        if (this.selectedRegion) {
            result = result.filter(p => p.region_id == this.selectedRegion);
        }

        if (this.selectedType) {
            result = result.filter(p => p.type_primary_id == this.selectedType || p.type_secondary_id == this.selectedType);
        }

        // 3. Regional Boolean Filter
        if (this.filterRegional !== null) {
            result = result.filter(p => (p.is_regional === true) === this.filterRegional);
        }

        // 4. Form Variant Filter
        if (this.filterForm === 'normal') {
            result = result.filter(p => p.form_name === 'Normal');
        } else if (this.filterForm === 'variants') {
            result = result.filter(p => p.form_name !== 'Normal' &&
                !p.form_name.startsWith('Méga') &&
                !p.form_name.startsWith('Mega') &&
                !p.form_name.includes('Primal') &&
                !p.form_name.startsWith('Gigamax') &&
                !p.form_name.startsWith('Dynamax'));
        } else if (this.filterForm === 'mega') {
            result = result.filter(p => p.form_name.startsWith('Méga') || p.form_name.startsWith('Mega') || p.form_name.includes('Primal'));
        } else if (this.filterForm === 'gmax') {
            result = result.filter(p => p.form_name.startsWith('Gigamax'));
        } else if (this.filterForm === 'dynamax') {
            result = result.filter(p => p.form_name.startsWith('Dynamax'));
        }

        this.saveState();
        this.filteredPokemon = result;
    }
}
