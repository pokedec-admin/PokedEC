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
      <h2>🔄 Centre d'Échanges</h2>
      <p class="subtitle">Gérez vos Pokémon à l'échange et découvrez des opportunités avec d'autres dresseurs</p>

      <div class="tabs">
        <button [class.active]="activeTab === 'mine'" (click)="setTab('mine')">
          📦 Mes Offres ({{ myPokemon.length }})
        </button>
        <button [class.active]="activeTab === 'mutual'" (click)="setTab('mutual')">
          🤝 Échanges Mutuels <span class="count-badge" *ngIf="mutualMatches.length > 0">{{ mutualMatches.length }}</span>
        </button>
        <button [class.active]="activeTab === 'all'" (click)="setTab('all')">
          🔍 Toutes les Propositions ({{ allMatches.length }})
        </button>
        <button [class.active]="activeTab === 'history'" (click)="setTab('history')">
          🕒 Historique
        </button>
      </div>

      <!-- MY OFFERS TAB -->
      <div *ngIf="activeTab === 'mine'" class="tab-content animate-in">
        <div class="regions-container" *ngIf="myPokemon.length > 0">
          <div *ngFor="let region of regions" class="region-section">
            <h3 (click)="toggleRegion(region)" class="region-header">
              <span class="toggle-icon">{{ region.expanded ? '▼' : '▶' }}</span>
              {{ region.name }} ({{ region.pokemon.length }})
            </h3>
            <div class="table-wrapper" *ngIf="region.expanded">
              <table class="pokemon-table">
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
                      <span *ngIf="poke.trade_mega" class="badge badge-mega">Méga</span>
                      <span *ngIf="poke.trade_purified" class="badge badge-purified">Purifié</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div *ngIf="myPokemon.length === 0" class="no-data">
          <p>Vous n'avez pas encore marqué de Pokémon pour l'échange.</p>
          <button class="btn-action" (click)="router.navigate(['/pokedex'])">Aller au Pokédex</button>
        </div>
      </div>

      <!-- MUTUAL MATCHES TAB -->
      <div *ngIf="activeTab === 'mutual'" class="tab-content animate-in">
        <div class="matches-grid" *ngIf="mutualMatches.length > 0">
          <div *ngFor="let match of mutualMatches" class="match-card mutual">
            <div class="match-header">
              <span class="user-name">👤 {{ match.trainer_name }}</span>
              <span class="match-badge">Match Mutuel</span>
            </div>
            <div class="match-body">
              <div class="match-column">
                <p class="label">Il a pour vous :</p>
                <div class="pokemon-mini">
                  <img [src]="match.he_has.image_url" [alt]="match.he_has.name_fr">
                  <span>{{ match.he_has.name_fr }}</span>
                </div>
              </div>
              <div class="match-arrow">↔️</div>
              <div class="match-column">
                <p class="label">Vous avez pour lui :</p>
                <div class="pokemon-mini">
                  <img [src]="match.you_have.image_url" [alt]="match.you_have.name_fr">
                  <span>{{ match.you_have.name_fr }}</span>
                </div>
              </div>
            </div>
            <div class="match-footer">
              <button class="btn-contact" (click)="router.navigate(['/trainer', match.trainer_id])">Contacter</button>
            </div>
          </div>
        </div>
        <div *ngIf="mutualMatches.length === 0 && !isLoadingMatches" class="no-data">
          <p>Aucun échange mutuel trouvé pour le moment.</p>
          <p class="hint">Plus vous marquez de Pokémon à l'échange et en mode "recherche", plus vous aurez de chances !</p>
        </div>
        <div *ngIf="isLoadingMatches" class="loading">Recherche de partenaires...</div>
      </div>

      <!-- ALL MATCHES TAB -->
      <div *ngIf="activeTab === 'all'" class="tab-content animate-in">
        <div class="matches-list" *ngIf="allMatches.length > 0">
          <div *ngFor="let match of allMatches" class="match-row">
            <div class="trainer-info">
              <span class="user-name">👤 {{ match.trainer_name }}</span>
            </div>
            <div class="pokes-info">
              <span>A ce que vous cherchez : </span>
              <div class="pokemon-tag">
                <img [src]="match.he_has.image_url" class="tiny-img">
                {{ match.he_has.name_fr }}
              </div>
            </div>
            <button class="btn-view" (click)="router.navigate(['/trainer', match.trainer_id])">Voir Profil</button>
          </div>
        </div>
        <div *ngIf="allMatches.length === 0" class="no-data">
          <p>Aucune proposition d'échange correspondante trouvée.</p>
        </div>
      </div>

      <!-- HISTORY TAB -->
      <div *ngIf="activeTab === 'history'" class="tab-content animate-in">
        <div class="matches-list" *ngIf="tradeHistory.length > 0">
          <div *ngFor="let item of tradeHistory" class="match-row" [style.border-left-color]="item.status === 'rejected' ? '#e74c3c' : '#2ecc71'">
            <div class="trainer-info">
              <span class="date">{{ item.updated_at | date:'short' }}</span>
              <span class="user-name">👤 {{ item.requester_id === currentUserId ? item.target_name : item.requester_name }}</span>
            </div>
            <div class="pokes-info">
              <span class="pokemon-tag">{{ item.pokemon_name }}</span>
              <span class="status-text" [style.color]="item.status === 'rejected' ? '#e74c3c' : '#27ae60'">
                {{ item.status === 'rejected' ? 'Refusé' : 'Accepté/Contacté' }}
              </span>
            </div>
          </div>
        </div>
        <div *ngIf="tradeHistory.length === 0" class="no-data">
          <p>Aucun historique d'échange.</p>
        </div>
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
    .pokemon-table { width: 100%; border-collapse: collapse; margin-top: 10px; background: var(--card-bg); border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border: 1px solid var(--border-color); }
    .pokemon-table th { background-color: #27ae60; color: white; padding: 12px; text-align: left; font-weight: bold; }
    .pokemon-table td { padding: 12px; border-bottom: 1px solid #eee; }
    .clickable-row { cursor: pointer; transition: background 0.2s; }
    .clickable-row:hover { background-color: rgba(46, 204, 113, 0.1); }
    .pokemon-img { width: 50px; height: 50px; object-fit: contain; }
    .empty-region { color: #999; font-style: italic; padding: 10px; }
    .no-pokemon { text-align: center; color: var(--nav-text); font-size: 1.2rem; margin-top: 50px; padding: 40px; background: var(--bg-color); border-radius: 12px; border: 1px solid var(--border-color); }
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

    .tabs { display: flex; gap: 10px; margin-bottom: 25px; border-bottom: 2px solid #eee; padding-bottom: 10px; overflow-x: auto; }
    .tabs button { padding: 12px 20px; border: none; background: none; cursor: pointer; border-radius: 8px; font-weight: bold; color: #666; transition: all 0.2s; position: relative; white-space: nowrap; }
    .tabs button.active { background: #27ae60; color: white; }
    .tabs button:hover:not(.active) { background: #f0f0f0; }
    .count-badge { background: #e74c3c; color: white; border-radius: 50%; padding: 2px 7px; font-size: 0.75rem; margin-left: 5px; }

    .match-card { background: var(--card-bg); border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-left: 5px solid #27ae60; border-top: 1px solid var(--border-color); border-right: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); }
    .match-header { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    .match-badge { background: #27ae60; color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
    .match-body { display: flex; align-items: center; justify-content: space-around; gap: 20px; padding: 10px 0; }
    .match-column { text-align: center; flex: 1; }
    .pokemon-mini { display: flex; flex-direction: column; align-items: center; gap: 10px; background: var(--bg-color); padding: 10px; border-radius: 10px; border: 1px solid var(--border-color); }
    .pokemon-mini img { width: 85px; height: 85px; object-fit: contain; }
    .pokemon-mini span { font-weight: bold; color: #333; }
    .match-arrow { font-size: 2rem; color: #27ae60; }
    .match-footer { margin-top: 15px; text-align: center; pt: 10px; }
    .btn-contact { background: #27ae60; color: white; border: none; padding: 10px 30px; border-radius: 25px; font-weight: bold; cursor: pointer; transition: 0.3s; }
    .btn-contact:hover { background: #2ecc71; transform: scale(1.05); }

    .match-row { display: flex; align-items: center; justify-content: space-between; background: var(--card-bg); padding: 15px 25px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 4px solid #3498db; border-top: 1px solid var(--border-color); border-right: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); }
    .pokemon-tag { display: inline-flex; align-items: center; gap: 8px; background: rgba(52, 152, 219, 0.1); padding: 5px 12px; border-radius: 20px; font-weight: 500; border: 1px solid rgba(52, 152, 219, 0.2); }
    .tiny-img { width: 35px; height: 35px; object-fit: contain; }
    .btn-view { background: #3498db; color: white; border: none; padding: 8px 18px; border-radius: 20px; cursor: pointer; font-size: 0.9rem; }

    .no-data { text-align: center; padding: 60px 20px; background: var(--bg-color); border-radius: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid var(--border-color); }
    .hint { color: #888; font-size: 0.9rem; margin-top: 10px; }
    .btn-action { background: #27ae60; color: white; border: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; margin-top: 20px; cursor: pointer; }
    
    .loading { text-align: center; padding: 50px; font-size: 1.2rem; color: #666; font-style: italic; }
    .animate-in { animation: fadeIn 0.4s ease-out; }
    .date { font-size: 0.8rem; color: #999; display: block; }
    .status-text { font-weight: bold; margin-left: 10px; font-size: 0.9rem; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class Trade implements OnInit {
  myPokemon: PokemonEntry[] = [];
  regions: RegionGroup[] = [];
  activeTab: 'mine' | 'mutual' | 'all' | 'history' = 'mine';
  mutualMatches: any[] = [];
  allMatches: any[] = [];
  tradeHistory: any[] = [];
  isLoadingMatches = false;
  currentUserId: number | null = null;

  constructor(
    private pokemonService: PokemonService,
    private authService: AuthService,
    public router: Router
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) this.currentUserId = user.id;
    });
    this.loadMyPokemon();
    this.loadMatches();
    this.loadHistory();
  }

  loadMyPokemon() {
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

  loadMatches() {
    this.isLoadingMatches = true;
    this.pokemonService.getMutualMatches().subscribe({
      next: (data) => {
        this.mutualMatches = data;
        this.isLoadingMatches = false;
      },
      error: (err) => {
        console.error('Failed to load mutual matches', err);
        this.isLoadingMatches = false;
      }
    });

    this.pokemonService.getTradeMatches().subscribe({
      next: (data) => {
        this.allMatches = data;
      },
      error: (err) => console.error('Failed to load all matches', err)
    });
  }

  loadHistory() {
    this.pokemonService.getTradeHistory().subscribe({
      next: (data) => this.tradeHistory = data,
      error: (err) => console.error('Failed to load trade history', err)
    });
  }

  setTab(tab: 'mine' | 'mutual' | 'all' | 'history') {
    this.activeTab = tab;
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
