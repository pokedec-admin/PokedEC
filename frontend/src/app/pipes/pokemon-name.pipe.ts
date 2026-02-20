import { Pipe, PipeTransform } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PokemonService } from '../services/pokemon.service';
import { AuthService } from '../services/auth.service';

@Pipe({
    name: 'pokemonName',
    standalone: true
})
export class PokemonNamePipe implements PipeTransform {
    constructor(
        private pokemonService: PokemonService,
        private authService: AuthService
    ) { }

    transform(pokemonId: number): Observable<string> {
        const language = this.authService.getPreferredLanguage();
        return this.pokemonService.getTranslatedName(pokemonId, language);
    }
}
