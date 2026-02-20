import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';
import { AuthService } from '../../services/auth.service';

interface PokemonEntry {
  id: number;
  user_id: number;
  pokemon_id: number;
  image_url: string;
  has_shiny: boolean;
  name_fr?: string;
  name_en?: string;
  name_de?: string;
  name_it?: string;
  region_name?: string;
  region_id?: number;
}

interface RegionGroup {
  name: string;
  id: number;
  pokemon: PokemonEntry[];
  expanded?: boolean;
}

@Component({
  selector: 'app-shiny',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="shiny-container">
      <h2>✨ Mes Pokémon Chromatiques (Shiny)</h2>
      <p class="subtitle">Pokémon Shiny collectés</p>

      <div class="regions-container">
        <div *ngFor="let region of regions" class="region-section">
          <h3 (click)="toggleRegion(region)" class="region-header">
            <span class="toggle-icon">{{ region.expanded ? '▼' : '▶' }}</span>
            {{ region.name }} ({{ region.pokemon.length }})
          </h3>
          <div class="table-wrapper" *ngIf="region.expanded">
            <table *ngIf="region.pokemon.length > 0" class="pokemon-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Nom</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let poke of region.pokemon" (click)="goToDetail(poke.pokemon_id)" class="clickable-row">
                  <td><img [src]="poke.image_url" [alt]="getPokemonName(poke)" class="pokemon-img"></td>
                  <td>{{ getPokemonName(poke) }}</td>
                  <td>#{{ poke.pokemon_id }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p *ngIf="region.pokemon.length === 0" class="empty-region">Aucun Pokémon Shiny de {{ region.name }} pour le moment.</p>
        </div>
      </div>

      <div *ngIf="myPokemon.length === 0" class="no-pokemon">
        <p>Aucun Pokémon Shiny pour le moment.</p>
        <p><small>Allez dans le Pokédex et cochez la case "Shiny" !</small></p>
      </div>
    </div>
  `,
  styles: [`
    .shiny-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
    .subtitle { color: #666; margin-bottom: 20px; }
    .region-section { margin-bottom: 30px; }
    .region-header { 
      color: #ffd700; 
      border-bottom: 2px solid #ffd700; 
      padding: 10px 0; 
      cursor: pointer; 
      display: flex; 
      align-items: center; 
      user-select: none;
      transition: all 0.2s;
    }
    .region-header:hover { color: #e6c200; background: #fffdf5; }
    .toggle-icon { margin-right: 15px; font-weight: bold; }
    .pokemon-table { width: 100%; border-collapse: collapse; margin-top: 10px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .pokemon-table th { background-color: #ffd700; color: #333; padding: 12px; text-align: left; font-weight: bold; }
    .pokemon-table td { padding: 12px; border-bottom: 1px solid #eee; }
    .clickable-row { cursor: pointer; transition: background 0.2s; }
    .clickable-row:hover { background-color: #fffde7; }
    .pokemon-img { width: 50px; height: 50px; object-fit: contain; }
    .empty-region { color: #999; font-style: italic; padding: 10px; }
    .no-pokemon { text-align: center; color: #999; font-size: 1.2rem; margin-top: 50px; padding: 40px; background: #f9f9f9; border-radius: 12px; }
  `]
})
export class Shiny implements OnInit {
  myPokemon: PokemonEntry[] = [];
  regions: RegionGroup[] = [];

  constructor(
    private pokemonService: PokemonService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.pokemonService.getShinyPokemon().subscribe({
      next: (data: PokemonEntry[]) => {
        this.myPokemon = data.filter(p => p.has_shiny);
        this.groupByRegion();
      },
      error: (err: any) => console.error('Failed to load Shiny pokemon', err)
    });
  }

  getPokemonName(pokemon: PokemonEntry): string {
    const language = this.authService.getPreferredLanguage();
    const nameField = `name_${language}` as keyof PokemonEntry;
    return (pokemon[nameField] as string) || pokemon.name_fr || 'Inconnu';
  }

  groupByRegion() {
    const groups: { [key: number]: RegionGroup } = {};

    this.myPokemon.forEach(p => {
      const regionId = p.region_id || 11; // 11 is Unknown
      const regionName = p.region_name || 'Inconnue';

      if (!groups[regionId]) {
        groups[regionId] = {
          id: regionId,
          name: regionName,
          pokemon: []
        };
      }
      groups[regionId].pokemon.push(p);
    });

    this.regions = Object.values(groups).sort((a, b) => a.id - b.id);
  }

  toggleRegion(region: RegionGroup) {
    region.expanded = !region.expanded;
  }

  goToDetail(pokemonId: number) {
    this.router.navigate(['/pokedex', pokemonId]);
  }
}
