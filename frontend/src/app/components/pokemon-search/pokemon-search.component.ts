import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PokemonService } from '../../services/pokemon.service';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
    selector: 'app-pokemon-search',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './pokemon-search.component.html',
    styleUrls: ['./pokemon-search.component.css']
})
export class PokemonSearchComponent {
    @Input() placeholder = 'Search Pokemon by name or ID...';
    @Input() navigateToDetail = true; // If true, navigates to detail page on select
    @Input() adminMode = false; // If true, navigates to admin detail page

    @Output() pokemonSelected = new EventEmitter<any>();

    searchQuery = '';
    searchResults: any[] = [];
    showDropdown = false;
    loading = false;

    private searchSubject = new Subject<string>();

    constructor(
        private pokemonService: PokemonService,
        private router: Router
    ) {
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(query => {
                if (!query || query.length < 2) {
                    return of([]);
                }
                this.loading = true;
                return this.pokemonService.searchPokemonMultilingual(query).pipe(
                    catchError(() => of([]))
                );
            })
        ).subscribe(results => {
            this.searchResults = results.slice(0, 10); // Limit to 10 results
            this.loading = false;
            this.showDropdown = results.length > 0;
        });
    }

    onSearchInput() {
        this.searchSubject.next(this.searchQuery);
        if (!this.searchQuery) {
            this.searchResults = [];
            this.showDropdown = false;
        }
    }

    selectPokemon(pokemon: any) {
        this.searchQuery = '';
        this.searchResults = [];
        this.showDropdown = false;

        this.pokemonSelected.emit(pokemon);

        if (this.navigateToDetail) {
            if (this.adminMode) {
                this.router.navigate(['/admin/pokemon', pokemon.pokemon_id]);
            } else {
                this.router.navigate(['/pokedex', pokemon.pokemon_id]);
            }
        }
    }

    // Handle clicking outside to close dropdown
    onBlur() {
        setTimeout(() => {
            this.showDropdown = false;
        }, 200);
    }
}
