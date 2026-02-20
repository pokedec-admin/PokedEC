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
  has_trade: boolean;
  trade_shiny: boolean;
  trade_xxl: boolean;
  trade_xxs: boolean;
  trade_gmax: boolean;
  trade_mega: boolean;
  trade_purified: boolean;
  trade_dynamax?: boolean;
  trade_legendary?: boolean;
  trade_mythical?: boolean;
  trade_ultra_beast?: boolean;
  name_fr?: string;
  name_en?: string;
  name_de?: string;
  name_it?: string;
  region_name?: string;
  region_id?: number;
  is_regional?: boolean;
  regional_description?: string;
}

interface RegionGroup {
  name: string;
  id: number;
  pokemon: PokemonEntry[];
  expanded?: boolean;
}

@Component({
  selector: 'app-trade',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="trade-container">
      <h2>🔄 Mes Pokémon à l'Échange</h2>
      <p class="subtitle">Pokémon disponibles pour vos échanges avec d'autres dresseurs</p>

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
                  <th>Catégories d'Échange</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let poke of region.pokemon" (click)="goToDetail(poke.pokemon_id)" class="clickable-row">
                  <td><img [src]="poke.image_url" [alt]="getPokemonName(poke)" class="pokemon-img"></td>
                  <td>{{ getPokemonName(poke) }}</td>
                  <td>#{{ poke.pokemon_id }}</td>
                  <td class="badges-cell">
                    <span *ngIf="poke.has_trade" class="badge badge-normal">Standard</span>
                    <span *ngIf="poke.trade_shiny" class="badge badge-shiny">Shiny</span>
                    <span *ngIf="poke.trade_xxl" class="badge badge-xxl">XXL</span>
                    <span *ngIf="poke.trade_xxs" class="badge badge-xxs">XXS</span>
                    <span *ngIf="poke.trade_gmax" class="badge badge-gmax">G-MAX</span>
                    <span *ngIf="poke.trade_dynamax" class="badge badge-dynamax">Dynamax</span>
                    <span *ngIf="poke.trade_mega" class="badge badge-mega">Méga</span>
                    <span *ngIf="poke.trade_purified" class="badge badge-purified">Purifié</span>
                    <span *ngIf="poke.trade_legendary" class="badge badge-legendary">Légendaire</span>
                    <span *ngIf="poke.trade_mythical" class="badge badge-mythical">Fabuleux</span>
                    <span *ngIf="poke.trade_ultra_beast" class="badge badge-ub">Ultra-Chimère</span>
                    <span *ngIf="poke.is_regional" class="badge badge-regional" [title]="poke.regional_description || ''">Régional</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p *ngIf="region.pokemon.length === 0" class="empty-region">Aucun Pokémon à l'échange de {{ region.name }} pour le moment.</p>
        </div>
      </div>

      <div *ngIf="myPokemon.length === 0" class="no-pokemon">
        <p>Aucun Pokémon marqué pour l'échange.</p>
        <p><small>Allez dans le Pokédex et cochez les cases d'échange !</small></p>
      </div>
    </div>
  `,
  styles: [`
    .trade-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
    .subtitle { color: #666; margin-bottom: 20px; }
    .region-section { margin-bottom: 30px; }
    .region-header { 
      color: #27ae60; 
      border-bottom: 2px solid #27ae60; 
      padding: 10px 0; 
      cursor: pointer; 
      display: flex; 
      align-items: center; 
      user-select: none;
      transition: all 0.2s;
    }
    .region-header:hover { color: #2ecc71; background: #f0f9f4; }
    .toggle-icon { margin-right: 15px; font-weight: bold; }
    .pokemon-table { width: 100%; border-collapse: collapse; margin-top: 10px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .pokemon-table th { background-color: #27ae60; color: white; padding: 12px; text-align: left; font-weight: bold; }
    .pokemon-table td { padding: 12px; border-bottom: 1px solid #eee; }
    .clickable-row { cursor: pointer; transition: background 0.2s; }
    .clickable-row:hover { background-color: #eafaf1; }
    .pokemon-img { width: 50px; height: 50px; object-fit: contain; }
    .empty-region { color: #999; font-style: italic; padding: 10px; }
    .no-pokemon { text-align: center; color: #999; font-size: 1.2rem; margin-top: 50px; padding: 40px; background: #f9f9f9; border-radius: 12px; }
    .badges-cell { display: flex; gap: 5px; flex-wrap: wrap; }
    .badge { padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; color: white; font-weight: bold; }
    .badge-normal { background-color: #95a5a6; }
    .badge-shiny { background-color: #f1c40f; color: #333; }
    .badge-xxl { background-color: #e74c3c; }
    .badge-xxs { background-color: #3498db; }
    .badge-gmax { background-color: #9b59b6; }
    .badge-dynamax { background-color: #2980b9; }
    .badge-mega { background-color: #e67e22; }
    .badge-purified { background-color: #ecf0f1; color: #333; border: 1px solid #bdc3c7; }
    .badge-legendary { background-color: #f39c12; }
    .badge-mythical { background-color: #9b59b6; }
    .badge-ub { background-color: #e74c3c; }
    .badge-regional { background-color: #d35400; cursor: help; }
  `]
})
export class Trade implements OnInit {
  myPokemon: PokemonEntry[] = [];
  regions: RegionGroup[] = [];

  constructor(
    private pokemonService: PokemonService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.pokemonService.getMyPokedex().subscribe({
      next: (data: PokemonEntry[]) => {
        this.myPokemon = data.filter(p =>
          p.has_trade || p.trade_shiny || p.trade_xxl || p.trade_xxs ||
          p.trade_gmax || p.trade_mega || p.trade_purified || p.trade_dynamax ||
          p.trade_legendary || p.trade_mythical || p.trade_ultra_beast
        );
        this.groupByRegion();
      },
      error: (err: any) => console.error('Failed to load trade pokemon', err)
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
