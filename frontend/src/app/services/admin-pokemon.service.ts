import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Classification {
    id: number;
    name_key: string;
    name_fr: string;
    name_en: string;
    display_order: number;
}

export interface Region {
    id: number;
    name_key: string;
    name_fr: string;
    name_en: string;
    display_order: number;
    is_custom: boolean;
}

export interface PokemonType {
    id: number;
    name_key: string;
    name_fr: string;
    name_en: string;
    color_hex: string;
}

export interface FormNamePredefined {
    id: number;
    name: string;
    is_predefined: boolean;
    created_at?: string;
}

export interface PokemonMaster {
    id: number;
    pokemon_id: number;
    form_name: string;
    name_fr: string;
    name_en: string;
    name_de: string;
    name_it: string;
    image_url: string;
    is_available: boolean;
    classification_id: number;
    classification_name?: string;
    classification_key?: string;
    region_id: number;
    region_name?: string;
    region_key?: string;
    type_primary_id: number;
    type_primary_name?: string;
    type_primary_key?: string;
    type_primary_color?: string;
    type_secondary_id: number | null;
    type_secondary_name?: string;
    type_secondary_key?: string;
    type_secondary_color?: string;
    trade_status: 'YES' | 'SPECIAL' | 'NO';
    is_regional?: boolean;
    regional_description?: string;
    created_at?: string;
    updated_at?: string;
    updated_by?: number;
    // Category availability (from pokemon_category_availability)
    can_be_normal?: boolean;
    can_be_legendary?: boolean;
    can_be_mythical?: boolean;
    can_be_ultra_beast?: boolean;
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
}

@Injectable({
    providedIn: 'root'
})
export class AdminPokemonService {
    private baseUrl = `${environment.apiUrl}/admin`;

    public filterState = {
        pokemonSearchQuery: '',
        selectedClassification: null as number | null,
        selectedRegion: null as number | null,
        selectedType: null as number | null,
        filterRegional: null as boolean | null,
        filterForm: 'all' as 'all' | 'normal' | 'variants' | 'mega' | 'gmax' | 'dynamax'
    };

    constructor(private http: HttpClient) { }

    // ==================== POKEMON MASTER ====================

    /**
     * Get list of all Pokemon (master data)
     */
    getAllPokemon(filters?: {
        available?: boolean;
        classification?: number;
        region?: number;
        type?: number;
        is_regional?: boolean;
        form_name?: string;
    }): Observable<PokemonMaster[]> {
        let url = `${this.baseUrl}/pokemon`;
        const params: string[] = [];

        if (filters) {
            if (filters.available !== undefined) {
                params.push(`available=${filters.available}`);
            }
            if (filters.classification !== undefined) {
                params.push(`classification=${filters.classification}`);
            }
            if (filters.region !== undefined) {
                params.push(`region=${filters.region}`);
            }
            if (filters.type !== undefined) {
                params.push(`type=${filters.type}`);
            }
            if (filters.is_regional !== undefined) {
                params.push(`is_regional=${filters.is_regional}`);
            }
            if (filters.form_name !== undefined) {
                params.push(`form_name=${filters.form_name}`);
            }
        }

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        return this.http.get<PokemonMaster[]>(url);
    }

    /**
     * Get all forms for a Pokemon species
     */
    getAllFormsForSpecies(pokemonId: number): Observable<PokemonMaster[]> {
        return this.http.get<PokemonMaster[]>(`${this.baseUrl}/pokemon/species/${pokemonId}`);
    }

    /**
     * Get specific form for a Pokemon species
     */
    getPokemonBySpeciesId(pokemonId: number, formName: string = 'Normal'): Observable<PokemonMaster> {
        return this.http.get<PokemonMaster>(`${this.baseUrl}/pokemon/species/${pokemonId}/${formName}`);
    }

    /**
     * Get Pokemon detail by surrogate ID (legacy)
     */
    getPokemonById(id: number): Observable<PokemonMaster> {
        return this.http.get<PokemonMaster>(`${this.baseUrl}/pokemon/${id}`);
    }

    /**
     * Update Pokemon master data
     */
    updatePokemon(id: number, data: Partial<PokemonMaster>): Observable<PokemonMaster> {
        return this.http.put<PokemonMaster>(`${this.baseUrl}/pokemon/${id}`, data);
    }

    /**
     * Create a new form for a Pokemon species
     */
    createForm(pokemonId: number, formName: string): Observable<PokemonMaster> {
        return this.http.post<PokemonMaster>(`${this.baseUrl}/pokemon/forms`, { pokemon_id: pokemonId, form_name: formName });
    }

    /**
     * Delete a specific form for a Pokemon species
     */
    deleteForm(pokemonId: number, formName: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/pokemon/forms/${pokemonId}/${formName}`);
    }

    /**
     * Upload or replace image for a Pokemon form
     */
    uploadImage(pokemonId: number, formName: string, file: File): Observable<{ imageUrl: string }> {
        const formData = new FormData();
        formData.append('pokemon_id', pokemonId.toString());
        formData.append('form_name', formName);
        formData.append('image', file);

        return this.http.post<{ imageUrl: string }>(`${this.baseUrl}/pokemon/upload-image`, formData);
    }

    // ==================== REFERENCE DATA ====================

    /**
     * Get all classifications
     */
    getClassifications(): Observable<Classification[]> {
        return this.http.get<Classification[]>(`${this.baseUrl}/classifications`);
    }

    /**
     * Get all regions
     */
    getRegions(): Observable<Region[]> {
        return this.http.get<Region[]>(`${this.baseUrl}/regions`);
    }

    /**
     * Create a new custom region
     */
    createRegion(data: { name_fr: string; name_en: string; name_key: string }): Observable<Region> {
        return this.http.post<Region>(`${this.baseUrl}/regions`, data);
    }

    /**
     * Get all Pokemon types
     */
    getTypes(): Observable<PokemonType[]> {
        return this.http.get<PokemonType[]>(`${this.baseUrl}/types`);
    }

    /**
     * Get all predefined form names
     */
    getFormNames(): Observable<FormNamePredefined[]> {
        return this.http.get<FormNamePredefined[]>(`${this.baseUrl}/form-names`);
    }

    /**
     * Create a new predefined form name
     */
    createFormName(name: string): Observable<FormNamePredefined> {
        return this.http.post<FormNamePredefined>(`${this.baseUrl}/form-names`, { name });
    }

    /**
     * Delete a predefined form name
     */
    deleteFormName(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/form-names/${id}`);
    }
}
