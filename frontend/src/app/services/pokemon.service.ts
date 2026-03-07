import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PokemonService {
    private pokeApiUrl = 'https://pokeapi.co/api/v2/pokemon';
    private pokeApiSpeciesUrl = 'https://pokeapi.co/api/v2/pokemon-species';
    private backendUrl = `${environment.apiUrl}/pokemon`;
    private nameCache: Map<string, string> = new Map(); // Cache for translated names

    constructor(private http: HttpClient, private authService: AuthService) { }

    // Fetch pokemon details from PokeAPI
    getPokemon(idOrName: string, formName: string = 'Normal'): Observable<any> {
        let slug = idOrName.toLowerCase();
        if (formName !== 'Normal') {
            // Very simplified mapping, but PokeAPI uses slugs like pokemon-name-formname
            // For now, we hope idOrName is enough or we use a better slug mapping if needed.
            // If it's a numeric ID, we might need a lookup.
        }
        return this.http.get(`${this.pokeApiUrl}/${slug}`);
    }

    // Get user's pokedex stats
    getStats(): Observable<any> {
        return this.http.get(`${this.backendUrl}/stats`, this.authService.getHttpOptions());
    }

    // Fetch pokemon species (for translated names)
    getPokemonSpecies(id: number): Observable<any> {
        return this.http.get(`${this.pokeApiSpeciesUrl}/${id}`);
    }

    // Get translated Pokemon name
    getTranslatedName(pokemonId: number, language: string = 'fr', formName: string = 'Normal'): Observable<string> {
        const cacheKey = `${pokemonId}-${formName}-${language}`;

        // Check cache first
        if (this.nameCache.has(cacheKey)) {
            return new Observable(observer => {
                observer.next(this.nameCache.get(cacheKey)!);
                observer.complete();
            });
        }

        // Fetch from API
        return new Observable(observer => {
            this.getPokemonSpecies(pokemonId).subscribe({
                next: (species) => {
                    const names = species.names || [];
                    const translatedName = names.find((n: any) => n.language.name === language);
                    let name = translatedName ? translatedName.name : species.name;

                    if (formName !== 'Normal') {
                        name += ` (${formName})`;
                    }

                    // Cache the result
                    this.nameCache.set(cacheKey, name);
                    observer.next(name);
                    observer.complete();
                },
                error: (err) => {
                    // Fallback to English name on error
                    observer.next('');
                    observer.complete();
                }
            });
        });
    }    // Get available forms for a species
    getAvailableForms(pokemonId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.backendUrl}/${pokemonId}/forms`);
    }

    // Get user's pokedex from backend
    getMyPokedex(): Observable<any[]> {
        return this.http.get<any[]>(this.backendUrl);
    }

    // Get specific pokemon from user's pokedex
    getUserPokemon(pokemonId: number, formName: string = 'Normal'): Observable<any> {
        return this.http.get<any>(`${this.backendUrl}/${pokemonId}?form=${encodeURIComponent(formName)}`);
    }

    // Search Pokemon in user's pokedex by name in any language
    searchPokemonMultilingual(query: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.backendUrl}/search/${encodeURIComponent(query)}`);
    }

    // Add pokemon to backend
    addToPokedex(pokemon: any, formName: string = 'Normal'): Observable<any> {
        const body = {
            pokemon_id: pokemon.id,
            name: pokemon.name,
            image_url: pokemon.sprites?.front_default || pokemon.image_url,
            form_name: formName
        };
        return this.http.post(this.backendUrl, body);
    }

    // Remove pokemon from backend
    removeFromPokedex(pokemonId: number, formName: string = 'Normal'): Observable<any> {
        return this.http.delete(`${this.backendUrl}/${pokemonId}?form=${encodeURIComponent(formName)}`);
    }


    // Get Pokemon available for trade from other users
    getTradeAvailable(): Observable<any[]> {
        return this.http.get<any[]>(`${this.backendUrl}/trade-available`);
    }

    // Get recent Pokemon added by other users
    getRecentOthers(): Observable<any[]> {
        return this.http.get<any[]>(`${this.backendUrl}/recent-others`);
    }

    // Get user's most recent Pokemon
    getMyRecent(): Observable<any> {
        return this.http.get<any>(`${this.backendUrl}/my-recent`);
    }

    // Get user's shiny pokemon
    getShinyPokemon(): Observable<any[]> {
        return this.http.get<any[]>(`${this.backendUrl}/shiny`);
    }

    // Get user's variant forms pokemon
    getFormsPokemon(): Observable<any[]> {
        return this.http.get<any[]>(`${this.backendUrl}/forms`);
    }

    // Get user's lucky pokemon
    getLuckyPokemon(): Observable<any[]> {
        return this.http.get<any[]>(`${this.backendUrl}/lucky`);
    }

    // Get tracking data for a category
    getTrackingCategory(category: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.backendUrl}/tracking/${category}`);
    }

    // Generic toggle
    toggleField(pokemonId: number, field: string, formName: string = 'Normal'): Observable<any> {
        return this.http.patch<any>(`${this.backendUrl}/${pokemonId}/toggle/${field}?form=${encodeURIComponent(formName)}`, {});
    }

    // Deprecated specific toggles - redirecting to generic
    toggleNormal(pokemonId: number, formName: string = 'Normal') { return this.toggleField(pokemonId, 'has_normal', formName); }
    toggleShiny(pokemonId: number, formName: string = 'Normal') { return this.toggleField(pokemonId, 'has_shiny', formName); }
    toggleLucky(pokemonId: number, formName: string = 'Normal') { return this.toggleField(pokemonId, 'has_lucky', formName); }
    toggleTrade(pokemonId: number) { return this.toggleField(pokemonId, 'has_trade'); }
    toggleXXL(pokemonId: number) { return this.toggleField(pokemonId, 'has_xxl'); }
    toggleXXS(pokemonId: number) { return this.toggleField(pokemonId, 'has_xxs'); }
    toggleGMax(pokemonId: number) { return this.toggleField(pokemonId, 'has_gmax'); }
    toggleDynamax(pokemonId: number) { return this.toggleField(pokemonId, 'has_dynamax'); }
    toggleMega(pokemonId: number) { return this.toggleField(pokemonId, 'has_mega'); }
    toggleObscure(pokemonId: number) { return this.toggleField(pokemonId, 'has_obscure'); }
    togglePurifie(pokemonId: number) { return this.toggleField(pokemonId, 'has_purifie'); }
    toggleParfait(pokemonId: number) { return this.toggleField(pokemonId, 'has_parfait'); }

    // New granular trade toggles
    toggleTradeShiny(pokemonId: number) { return this.toggleField(pokemonId, 'trade_shiny'); }
    toggleTradeXXL(pokemonId: number) { return this.toggleField(pokemonId, 'trade_xxl'); }
    toggleTradeXXS(pokemonId: number) { return this.toggleField(pokemonId, 'trade_xxs'); }
    toggleTradeGMax(pokemonId: number) { return this.toggleField(pokemonId, 'trade_gmax'); }
    toggleTradeDynamax(pokemonId: number) { return this.toggleField(pokemonId, 'trade_dynamax'); }
    toggleTradeMega(pokemonId: number) { return this.toggleField(pokemonId, 'trade_mega'); }
    toggleTradePurified(pokemonId: number) { return this.toggleField(pokemonId, 'trade_purified'); }

    // Mutually exclusive category toggles (Normal, Legendary, Mythical, Ultra Beast)
    toggleLegendary(pokemonId: number) { return this.toggleField(pokemonId, 'has_legendary'); }
    toggleMythical(pokemonId: number) { return this.toggleField(pokemonId, 'has_mythical'); }
    toggleUltraBeast(pokemonId: number) { return this.toggleField(pokemonId, 'has_ultra_beast'); }

    // Trade toggles for exclusive categories
    toggleTradeLegendary(pokemonId: number) { return this.toggleField(pokemonId, 'trade_legendary'); }
    toggleTradeMythical(pokemonId: number) { return this.toggleField(pokemonId, 'trade_mythical'); }
    toggleTradeUltraBeast(pokemonId: number) { return this.toggleField(pokemonId, 'trade_ultra_beast'); }

    // Get global category availability
    getCategoryAvailability(): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/pokemon-categories/availability`);
    }

    // Get all Pokemon master data (public)
    getAllPokemonMaster(): Observable<any[]> {
        return this.http.get<any[]>(`${this.backendUrl}/master-all`);
    }

    // Trade Requests
    createTradeRequest(targetUserId: number, pokemonId: number): Observable<any> {
        return this.http.post(`${environment.apiUrl}/trade/request`, { target_user_id: targetUserId, pokemon_id: pokemonId }, this.getAuthHeaders());
    }

    getIncomingTradeRequests(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/trade/requests/incoming`, this.getAuthHeaders());
    }

    respondToTradeRequest(requestId: number, status: string): Observable<any> {
        return this.http.put(`${environment.apiUrl}/trade/request/${requestId}/respond`, { status }, this.getAuthHeaders());
    }

    // Trade Matches and Mutual Matches
    getTradeMatches(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/trade/matches`, this.getAuthHeaders());
    }

    getMutualMatches(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/trade/matches/mutual`, this.getAuthHeaders());
    }

    private getAuthHeaders() {

        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No auth token found in localStorage (PokemonService)');
            return { headers: new HttpHeaders() };
        }
        return {
            headers: new HttpHeaders({
                'Authorization': `Bearer ${token}`
            })
        };
    }
}
