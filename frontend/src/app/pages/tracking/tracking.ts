import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';
import { forkJoin } from 'rxjs';

interface PokemonEntry {
  pokemon_id: number;
  form_name: string;
  name_fr: string;
  image_url: string;
  region_id: number;
  region_name: string;
  [key: string]: any; // User state flags
}

interface RegionGroup {
  name: string;
  id: number;
  pokemon: PokemonEntry[];
  ownedCount: number;
  totalCount: number;
  expanded?: boolean;
}

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tracking-container">
      <div class="header-section">
        <button class="back-button" (click)="goBack()">← Retour</button>
        <h1>{{ categoryIcon }} {{ categoryTitle }}</h1>
        
        <div class="stats-banner" *ngIf="categoryStats">
          <div class="stat-pill">
            <span class="stat-value">{{ categoryStats.owned }} / {{ categoryStats.total }}</span>
            <span class="stat-percentage">({{ getPercentage(categoryStats.owned, categoryStats.total) }}%)</span>
          </div>
        </div>
      </div>

      <div class="content-grid" *ngIf="!isLoading; else loadingTemplate">
        <div *ngFor="let region of regions" class="region-card" [class.region-empty]="region.totalCount === 0">
          <div class="region-header" (click)="toggleRegion(region)">
            <div class="region-info">
              <span class="region-toggle">{{ region.expanded ? '▼' : '▶' }}</span>
              <span class="region-name">{{ region.name }}</span>
            </div>
            <div class="region-stats">
              <span class="count-text">{{ region.ownedCount }} / {{ region.totalCount }}</span>
              <div class="mini-progress">
                <div class="progress-fill" [style.width.%]="getPercentage(region.ownedCount, region.totalCount)"></div>
              </div>
            </div>
          </div>

          <div class="region-pokemon-grid" *ngIf="region.expanded">
            <div *ngFor="let poke of region.pokemon" 
                 class="poke-item" 
                 [class.not-owned]="!isOwned(poke)">
              <div class="poke-image-wrapper">
                <div class="clickable-area" (click)="goToDetail(poke.pokemon_id, poke.form_name)"></div>
                <div class="quick-add" *ngIf="!isOwned(poke)" (click)="quickAdd($event, poke)" title="Ajouter au Pokédex">
                  <span class="plus-icon">+</span>
                </div>
                <img [src]="poke.image_url" [alt]="poke.name_fr" class="poke-img">
                <div class="status-overlay" *ngIf="isOwned(poke)">
                  <span class="check-mark">✓</span>
                </div>
              </div>
              <span class="poke-name">{{ poke.name_fr }}</span>
              <span class="poke-id">#{{ poke.pokemon_id }}</span>
            </div>
          </div>
        </div>

        <div *ngIf="regions.length === 0" class="empty-state">
          <p>Aucun Pokémon trouvé dans cette catégorie.</p>
        </div>
      </div>

      <ng-template #loadingTemplate>
        <div class="loading-state">
          <div class="loader"></div>
          <p>Chargement des données...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .tracking-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      min-height: 100vh;
      color: #333;
    }

    .header-section {
      margin-bottom: 3rem;
      text-align: center;
    }

    .back-button {
      background: rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.1);
      color: #333;
      padding: 0.6rem 1.2rem;
      border-radius: 50px;
      cursor: pointer;
      margin-bottom: 1.5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-weight: 500;
      backdrop-filter: blur(5px);
    }

    .back-button:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: translateX(-5px);
    }

    h1 {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 1rem;
      color: rgba(168, 0, 0, 0.8); /* Rouge foncé avec 20% de transparence (max 50% demandé) */
      text-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    .stats-banner {
      display: flex;
      justify-content: center;
      margin-top: 1.5rem;
    }

    .stat-pill {
      background: #4a4a4a; /* Gris foncé type barre de titre région */
      padding: 1rem 2.5rem;
      border-radius: 100px;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      animation: pulse 2s infinite ease-in-out;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -1px;
      color: #ffcb05; /* Jaune EC */
    }

    .stat-percentage {
      font-size: 1rem;
      font-weight: 600;
      color: #ffcb05;
      opacity: 0.9;
    }

    .region-card {
      background: rgba(30, 30, 45, 0.6);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      margin-bottom: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      color: #fff;
    }

    .region-card:hover {
      background: rgba(40, 40, 60, 0.8);
      border-color: rgba(255, 255, 255, 0.1);
      transform: translateY(-4px);
    }

    .region-header {
      padding: 1.5rem 2rem;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      user-select: none;
    }

    .region-info {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .region-toggle {
      font-size: 0.8rem;
      opacity: 0.5;
    }

    .region-name {
      font-size: 1.4rem;
      font-weight: 700;
    }

    .region-stats {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
    }

    .count-text {
      font-size: 0.9rem;
      font-weight: 600;
      opacity: 0.7;
    }

    .mini-progress {
      width: 120px;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #a855f7);
      border-radius: 10px;
      transition: width 1s ease-out;
    }

    .region-pokemon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 1.5rem;
      padding: 2rem;
      background: rgba(0, 0, 0, 0.2);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .poke-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.3s;
      position: relative;
    }

    .poke-item:hover {
      transform: scale(1.1);
    }

    .poke-image-wrapper {
      position: relative;
      width: 90px;
      height: 90px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.8rem;
    }

    .clickable-area {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      cursor: pointer;
      z-index: 1;
    }

    .quick-add {
      position: absolute;
      top: -10px;
      right: -10px;
      background: #cc0000;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: bold;
      box-shadow: 0 4px 10px rgba(204, 0, 0, 0.4);
      z-index: 10;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .quick-add:hover {
      transform: scale(1.2);
      background: #ff0000;
    }

    .plus-icon {
      line-height: 1;
      margin-top: -2px;
    }

    .poke-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 5px 10px rgba(0,0,0,0.3));
    }

    .poke-item.not-owned .poke-img {
      filter: grayscale(1) opacity(0.3);
    }

    .status-overlay {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #22c55e;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: bold;
      box-shadow: 0 4px 10px rgba(34, 197, 94, 0.4);
    }

    .poke-name {
      font-size: 0.85rem;
      font-weight: 600;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }

    .poke-id {
      font-size: 0.7rem;
      opacity: 0.5;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5rem;
    }

    .loader {
      width: 48px;
      height: 48px;
      border: 3px solid #333;
      border-bottom-color: transparent;
      border-radius: 50%;
      display: inline-block;
      box-sizing: border-box;
      animation: rotation 1s linear infinite;
      margin-bottom: 1.5rem;
    }

    @keyframes rotation {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 640px) {
      h1 { font-size: 2rem; }
      .region-pokemon-grid { grid-template-columns: repeat(2, 1fr); padding: 1rem; }
      .stat-pill { padding: 0.8rem 1.5rem; }
      .region-name { font-size: 1.1rem; }
      .mini-progress { display: none; }
    }
  `]
})
export class TrackingComponent implements OnInit {
  category = '';
  categoryTitle = '';
  categoryIcon = '';
  isLoading = true;
  pokemon: PokemonEntry[] = [];
  regions: RegionGroup[] = [];
  categoryStats: { owned: number, total: number } | null = null;

  private categoryMap: { [key: string]: { title: string, icon: string, flag: string } } = {
    'pokedex': { title: 'Pokédex National', icon: '📖', flag: 'has_normal' },
    'normal': { title: 'Standard', icon: '⭐', flag: 'has_normal' },
    'legendary': { title: 'Légendaires', icon: '⚜️', flag: 'has_normal' },
    'mythical': { title: 'Fabuleux', icon: '✨', flag: 'has_normal' },
    'ultra_beast': { title: 'Ultra-Chimères', icon: '👾', flag: 'has_normal' },
    'regional': { title: 'Régionaux', icon: '📍', flag: 'has_normal' },
    'forms': { title: 'Formes Alternatives', icon: '🔄', flag: 'has_normal' },
    'shiny': { title: 'Shiny', icon: '✨', flag: 'has_shiny' },
    'lucky': { title: 'Chanceux', icon: '🍀', flag: 'has_lucky' },
    'xxl': { title: 'XXL', icon: '📏', flag: 'has_xxl' },
    'xxs': { title: 'XXS', icon: '🤏', flag: 'has_xxs' },
    'gmax': { title: 'Gigamax', icon: '🌋', flag: 'has_gmax' },
    'dynamax': { title: 'Dynamax', icon: '🌀', flag: 'has_dynamax' },
    'mega': { title: 'Méga-Évolutions', icon: '🧬', flag: 'has_mega' },
    'obscure': { title: 'Obscurs', icon: '🌑', flag: 'has_obscure' },
    'purified': { title: 'Purifiés', icon: '☀️', flag: 'has_purified' },
    'perfect': { title: 'Parfaits', icon: '💯', flag: 'has_perfect' }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pokemonService: PokemonService
  ) { }

  ngOnInit() {
    // Check both params and data
    this.route.paramMap.subscribe(params => {
      const cat = params.get('category');
      if (cat) {
        this.category = cat;
        this.setupCategory();
        this.loadData();
      } else {
        // Check static data from routing
        this.route.data.subscribe(data => {
          if (data['category']) {
            this.category = data['category'];
            this.setupCategory();
            this.loadData();
          }
        });
      }
    });
  }

  setupCategory() {
    const config = this.categoryMap[this.category] || { title: 'Tracking', icon: '📊', flag: 'has_normal' };
    this.categoryTitle = config.title;
    this.categoryIcon = config.icon;
  }

  loadData() {
    this.isLoading = true;
    forkJoin({
      list: this.pokemonService.getTrackingCategory(this.category),
      stats: this.pokemonService.getStats()
    }).subscribe({
      next: (data: any) => {
        this.pokemon = data.list;
        this.updateStats(data.stats);
        this.groupByRegion();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load tracking data', err);
        this.isLoading = false;
      }
    });
  }

  updateStats(allStats: any) {
    // Map backend stat keys to category
    const statKeyMap: { [key: string]: { owned: string, total: string } } = {
      'pokedex': { owned: 'pokedex_count', total: 'total_pokedex_available' },
      'normal': { owned: 'normal', total: 'total_normal_available' },
      'legendary': { owned: 'legendary', total: 'total_legendary_available' },
      'mythical': { owned: 'mythical', total: 'total_mythical_available' },
      'ultra_beast': { owned: 'ultra_beast', total: 'total_ultra_beast_available' },
      'regional': { owned: 'regional', total: 'total_regional_available' },
      'forms': { owned: 'forms', total: 'total_forms_available' },
      'shiny': { owned: 'shiny', total: 'total_shiny_available' },
      'lucky': { owned: 'lucky', total: 'total_lucky_available' },
      'xxl': { owned: 'xxl', total: 'total_xxl_available' },
      'xxs': { owned: 'xxs', total: 'total_xxs_available' },
      'gmax': { owned: 'gmax', total: 'total_gmax_available' },
      'dynamax': { owned: 'dynamax', total: 'total_dynamax_available' },
      'mega': { owned: 'mega', total: 'total_mega_available' },
      'obscure': { owned: 'obscure', total: 'total_obscure_available' },
      'purified': { owned: 'purified', total: 'total_purified_available' },
      'perfect': { owned: 'perfect', total: 'total_perfect_available' }
    };

    const keys = statKeyMap[this.category];
    if (keys) {
      this.categoryStats = {
        owned: Number(allStats[keys.owned]),
        total: Number(allStats[keys.total])
      };
    }
  }

  groupByRegion() {
    const groups: { [key: number]: RegionGroup } = {};

    this.pokemon.forEach(p => {
      const regionId = p.region_id || 11;
      const regionName = p.region_name || 'Inconnue';

      if (!groups[regionId]) {
        groups[regionId] = {
          id: regionId,
          name: regionName,
          pokemon: [],
          ownedCount: 0,
          totalCount: 0,
          expanded: true
        };
      }

      groups[regionId].pokemon.push(p);
      groups[regionId].totalCount++;
      if (this.isOwned(p)) {
        groups[regionId].ownedCount++;
      }
    });

    this.regions = Object.values(groups).sort((a, b) => a.id - b.id);
  }

  quickAdd(event: Event, p: PokemonEntry) {
    event.stopPropagation();
    const config = this.categoryMap[this.category];
    const flag = config ? config.flag : 'has_normal';

    this.pokemonService.toggleField(p.pokemon_id, flag, p.form_name).subscribe({
      next: (updated) => {
        // Force refresh all data to update stats and groups
        this.loadData();
      },
      error: (err) => {
        console.error('Failed to quick add pokemon', err);
      }
    });
  }

  isOwned(p: PokemonEntry): boolean {
    const config = this.categoryMap[this.category];
    const flag = config ? config.flag : 'has_normal';
    return !!p[flag];
  }

  toggleRegion(region: RegionGroup) {
    region.expanded = !region.expanded;
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  goToDetail(id: number, form: string) {
    this.router.navigate(['/pokedex', id], { queryParams: { form } });
  }

  getPercentage(c: number, t: number): number {
    if (!t) return 0;
    return Math.round((c / t) * 100);
  }
}
