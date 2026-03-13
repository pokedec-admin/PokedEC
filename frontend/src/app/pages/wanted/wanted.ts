import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PokemonService } from '../../services/pokemon.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

interface PokemonEntry {
  id: number;
  user_id: number;
  pokemon_id: number;
  name: string;
  image_url: string;
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
  has_legendary: boolean;
  has_mythical: boolean;
  has_ultra_beast: boolean;
  created_at: string;
  name_fr?: string;
  name_en?: string;
  name_de?: string;
  name_it?: string;
  region_name?: string;
  region_id?: number;
  form_name?: string;
}

interface TradeAvailable {
  pokemon_id: number;
  name: string;
  image_url: string;
  username: string;
  email: string;
  has_trade: boolean;
  trade_shiny: boolean;
  trade_legendary: boolean;
  trade_mythical: boolean;
  trade_ultra_beast: boolean;
  trade_xxl: boolean;
  trade_xxs: boolean;
  trade_gmax: boolean;
  trade_dynamax: boolean;
  trade_mega: boolean;
  trade_purified: boolean;
}

interface WantedPokemon {
  pokemon_id: number;
  name: string;
  image_url: string;
  region_id: number;
  region_name: string;
  name_fr?: string;
  name_en?: string;
  name_de?: string;
  name_it?: string;
  missing: { tag: string; availableFrom: string[] }[];
  is_regional?: boolean;
  regional_description?: string;
  form_name?: string;
  [key: string]: any;
}

interface RegionGroup {
  name: string;
  pokemon: WantedPokemon[];
  expanded: boolean;
  stats: any;
  totalStats: any;
}

interface CategoryOption {
  label: string;
  tag: string;
  keyword: string;
  selected: boolean;
}

interface ExportPreset {
  id: string;
  name: string;
  prefix: string;
  suffix: string;
  selectedCategories: string[];
  includeSpecialForms: boolean;
  includeCategoryKeywords: boolean;
  includeUnavailable: boolean;
  showOnlyAvailableForTrade: boolean;
}

@Component({
  selector: 'app-wanted',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wanted-container">
      <div class="hero-section">
        <h1>🔍 Les Recherchés</h1>
        <p class="subtitle">Générez vos listes d'échange et suivez vos manques</p>
      </div>

      <!-- Main Layout -->
      <div class="main-layout">
        
        <!-- Sidebar: Controls -->
        <div class="sidebar">
          
          <!-- Generator Configuration -->
          <div class="glass-panel export-config">
            <h3>⚙️ Configurer l'Export</h3>
            
            <div class="config-group">
              <label>Préfixe de recherche</label>
              <div class="input-wrapper">
                <input type="text" [(ngModel)]="exportPrefix" placeholder="Ex: !4*&" (input)="updateExportString()">
              </div>
              <small class="help-text">Ex: <code>!4*&</code> pour exclure les 100%</small>
            </div>

            <div class="config-group">
              <label>Catégories à inclure</label>
              <div class="bulk-actions">
                <button (click)="toggleAllCategories(true)" class="text-link">Tout cocher</button>
                <button (click)="toggleAllCategories(false)" class="text-link">Tout décocher</button>
              </div>
              <div class="categories-grid">
                <label class="cat-pill" *ngFor="let cat of categories" [class.active]="cat.selected">
                  <input type="checkbox" [(ngModel)]="cat.selected" (change)="onFilterChange()">
                  <span>{{ cat.label }}</span>
                </label>
              </div>
            </div>

            <div class="config-group border-top">
              <label>Options d'affichage</label>
              <div class="toggle-list">
                <label class="toggle-item">
                  <input type="checkbox" [(ngModel)]="includeSpecialForms" (change)="onFilterChange()">
                  <span>Inclure les formes spéciales</span>
                </label>
                <label class="toggle-item">
                  <input type="checkbox" [(ngModel)]="includeCategoryKeywords" (change)="onFilterChange()">
                  <span>Inclure les noms de catégories (ex: <i>chromatique&</i>)</span>
                </label>
                <label class="toggle-item">
                  <input type="checkbox" [(ngModel)]="includeUnavailable" (change)="onFilterChange()">
                  <span>Variantes non-disponibles</span>
                </label>
                <label class="toggle-item">
                  <input type="checkbox" [(ngModel)]="showOnlyAvailableForTrade" (change)="onFilterChange()">
                  <span>Dispo. à l'échange uniquement</span>
                </label>
              </div>
            </div>

            <div class="config-group border-top">
              <label>Suffixe de recherche</label>
              <div class="input-wrapper">
                <input type="text" [(ngModel)]="exportSuffix" placeholder="Ex: &" (input)="updateExportString()">
              </div>
            </div>
          </div>

          <!-- Presets Section -->
          <div class="glass-panel presets-panel">
            <h3>💾 Mes Préréglages</h3>
            
            <div class="save-current mb-4">
              <div class="input-group">
                <input type="text" [(ngModel)]="newPresetName" placeholder="Nom du profil..." class="small-input">
                <button (click)="savePreset()" class="save-btn" [disabled]="!newPresetName">Enregistrer</button>
              </div>
            </div>

            <div class="presets-list" *ngIf="presets.length > 0; else noPresets">
              <div *ngFor="let p of presets" class="preset-item">
                <div class="preset-info" (click)="loadPreset(p)">
                  <span class="preset-name">{{ p.name }}</span>
                </div>
                <button (click)="deletePreset(p.id)" class="delete-btn" title="Supprimer">🗑️</button>
              </div>
            </div>
            <ng-template #noPresets>
              <p class="empty-hint">Aucun préréglage enregistré</p>
            </ng-template>
          </div>

          <!-- Live Preview -->
          <div class="glass-panel preview-panel">
            <div class="preview-header">
              <h3>📱 Chaîne de Recherche</h3>
              <button class="copy-btn" (click)="copyToClipboard()" [class.success]="copySuccess">
                {{ copySuccess ? '✅ Copié !' : '📋 Copier' }}
              </button>
            </div>
            <div class="preview-content" *ngIf="generatedSearchString; else emptyPreview">
              <code>{{ generatedSearchString }}</code>
            </div>
            <ng-template #emptyPreview>
              <div class="preview-content empty">
                 <span class="placeholder">Aucun Pokémon sélectionné</span>
              </div>
            </ng-template>
            <p class="preview-footer">Prêt à être collé dans Pokémon GO</p>
          </div>
        </div>

        <!-- Main Content: Stats & Regions -->
        <div class="content-area">
          
          <!-- Global Stats Cards -->
          <div class="stats-overview">
            <div class="stat-bubble total">
              <span class="bubble-val">{{ globalStats.total }}</span>
              <span class="bubble-lab">Total manquant</span>
            </div>
            <ng-container *ngFor="let cat of categories">
              <div class="stat-bubble" *ngIf="cat.selected && globalStats[cat.tag] > 0">
                <span class="bubble-val">{{ globalStats[cat.tag] }}</span>
                <span class="bubble-lab">{{ cat.label }}</span>
              </div>
            </ng-container>
          </div>

          <!-- Regions List -->
          <div class="regions-list">
            <div *ngFor="let region of filteredRegions" class="region-section" [class.collapsed]="!region.expanded">
              <div class="region-header" (click)="toggleRegion(region)">
                <div class="region-info">
                  <span class="toggle-chevron"></span>
                  <h2>{{ region.name }}</h2>
                </div>
                <div class="region-badge">{{ region.pokemon.length }} Pokémon</div>
              </div>
              
              <div class="region-content">
                <div class="pokemon-grid">
                  <div *ngFor="let poke of region.pokemon" 
                       class="poke-row-card" 
                       (click)="goToDetail(poke.pokemon_id)">
                    <div class="poke-main">
                      <img [src]="poke.image_url" [alt]="getPokemonName(poke)" class="poke-img">
                      <div class="poke-meta">
                        <span class="poke-name">{{ getPokemonName(poke) }}</span>
                        <span class="poke-id">#{{ poke.pokemon_id }}</span>
                      </div>
                    </div>
                    <div class="poke-tags">
                      <div *ngFor="let item of poke.missing" 
                           class="wanted-tag" 
                           [class.available]="item.availableFrom.length > 0">
                        {{ item.tag }}
                        <div class="tag-hover" *ngIf="item.availableFrom.length > 0 || (item.tag === 'Régional' && poke.regional_description)">
                          <span *ngIf="item.tag === 'Régional' && poke.regional_description">📍 {{ poke.regional_description }}</span>
                          <span *ngIf="item.availableFrom.length > 0">🤝 Dispo chez : {{ item.availableFrom.join(', ') }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="filteredRegions.length === 0" class="complete-state">
            <div class="complete-icon">🏆</div>
            <h2>Collection Complète !</h2>
            <p>Vous avez obtenu toutes les variantes sélectionnées.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { --accent: #ef4444; --glass: rgba(255, 255, 255, 0.8); --text: #1e293b; }

    .wanted-container { padding: 40px; max-width: 1600px; margin: 0 auto; color: var(--text-color); background: var(--bg-color); min-height: 100vh; }
    
    .hero-section { margin-bottom: 40px; }
    .hero-section h1 { font-size: 3rem; font-weight: 800; margin-bottom: 8px; color: #0f172a; }
    .subtitle { font-size: 1.1rem; color: #64748b; }

    .main-layout { display: grid; grid-template-columns: 380px 1fr; gap: 40px; }

    /* Sidebar Styles */
    .sidebar { display: flex; flex-direction: column; gap: 24px; position: sticky; top: 40px; max-height: calc(100vh - 80px); }
    
    .glass-panel { background: var(--glass); backdrop-filter: blur(12px); border-radius: 24px; border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 10px 30px rgba(0,0,0,0.05); padding: 24px; }
    
    .export-config h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 20px; color: #334155; }
    
    .config-group { margin-bottom: 24px; }
    .config-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    
    .input-wrapper input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-color); font-family: monospace; font-size: 1rem; transition: all 0.2s; }
    .input-wrapper input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1); }
    
    .help-text { display: block; margin-top: 6px; font-size: 0.75rem; color: #94a3b8; }
    .help-text code { padding: 2px 4px; background: var(--border-color); border-radius: 4px; color: var(--text-color); }

    .bulk-actions { margin-bottom: 12px; display: flex; gap: 12px; }
    .text-link { background: none; border: none; font-size: 0.75rem; font-weight: 600; color: var(--accent); cursor: pointer; padding: 0; }
    .text-link:hover { text-decoration: underline; }

    .categories-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .cat-pill { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-color); font-size: 0.8rem; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
    .cat-pill:hover { border-color: var(--accent); }
    .cat-pill.active { background: rgba(239, 68, 68, 0.1); border-color: var(--accent); color: var(--accent); }
    .cat-pill input { display: none; }

    .border-top { border-top: 1px solid #e2e8f0; padding-top: 24px; }
    .toggle-list { display: flex; flex-direction: column; gap: 12px; }
    .toggle-item { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; font-weight: 500; color: #475569; cursor: pointer; }

    /* Preview Panel */
    .preview-panel { background: #1e293b; color: white; }
    .preview-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .preview-header h3 { font-size: 1rem; color: #94a3b8; margin: 0; }
    
    .copy-btn { padding: 8px 16px; border-radius: 10px; border: none; background: var(--accent); color: white; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: transform 0.2s; }
    .copy-btn:active { transform: scale(0.95); }
    .copy-btn.success { background: #10b981; }

    .preview-content { background: rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; font-family: monospace; word-break: break-all; max-height: 150px; overflow-y: auto; font-size: 0.95rem; line-height: 1.4; color: #f1f5f9; border: 1px solid rgba(255,255,255,0.1); min-height: 60px; display: flex; align-items: center; justify-content: center; }
    .preview-content.empty { color: #64748b; }
    .preview-content code { width: 100%; }
    
    .preview-footer { margin-top: 12px; font-size: 0.75rem; color: #64748b; text-align: center; }

    /* Content Area Styles */
    .stats-overview { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 32px; }
    .stat-bubble { background: var(--card-bg); padding: 12px 20px; border-radius: 16px; display: flex; flex-direction: column; align-items: center; min-width: 100px; border: 1px solid var(--border-color); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .stat-bubble.total { background: var(--accent); color: white; border: none; }
    .bubble-val { font-size: 1.5rem; font-weight: 800; }
    .bubble-lab { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.8; }

    .region-section { background: var(--card-bg); border-radius: 20px; margin-bottom: 20px; border: 1px solid var(--border-color); overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .region-header { padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; }
    .region-header:hover { background: rgba(128, 128, 128, 0.1); }
    
    .region-info { display: flex; align-items: center; gap: 20px; }
    .region-info h2 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0; }
    
    .toggle-chevron { width: 12px; height: 12px; border-right: 3px solid #64748b; border-bottom: 3px solid #64748b; transform: rotate(45deg); transition: transform 0.3s; margin-top: -6px; pointer-events: none; }
    .collapsed .toggle-chevron { transform: rotate(-45deg); margin-top: 0; }
    
    .region-badge { background: var(--bg-color); padding: 6px 16px; border-radius: 100px; font-size: 0.85rem; font-weight: 700; color: var(--text-color); border: 1px solid var(--border-color); }

    .region-content { max-height: 5000px; transition: all 0.5s ease-in-out; }
    .collapsed .region-content { max-height: 0; padding-bottom: 0; visibility: hidden; }

    .pokemon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; padding: 0 32px 32px; }
    
    .poke-row-card { background: var(--bg-color); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 16px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.2s; color: var(--text-color); }
    .poke-row-card:hover { transform: translateY(-3px); border-color: var(--accent); background: var(--card-bg); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    
    .poke-main { display: flex; align-items: center; gap: 16px; }
    .poke-img { width: 60px; height: 60px; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
    .poke-meta { display: flex; flex-direction: column; }
    .poke-name { font-size: 1rem; font-weight: 700; color: #1e293b; }
    .poke-id { font-size: 0.8rem; font-weight: 600; color: #94a3b8; }

    .poke-tags { display: flex; gap: 8px; flex-wrap: wrap; }
    .wanted-tag { background: var(--bg-color); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; color: var(--text-color); position: relative; }
    .wanted-tag.available { background: rgba(22, 163, 74, 0.1); border-color: rgba(22, 163, 74, 0.3); color: #2ecc71; }
    
    .tag-hover { visibility: hidden; opacity: 0; position: absolute; bottom: 100%; left: 0; transform: translateY(-8px); width: 200px; padding: 12px; background: #1e293b; color: white; border-radius: 12px; font-size: 0.7rem; line-height: 1.4; z-index: 100; transition: all 0.2s; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); pointer-events: none; }
    .tag-hover span { display: block; margin-bottom: 4px; }
    .wanted-tag:hover .tag-hover { visibility: visible; opacity: 1; transform: translateY(-4px); }

    .complete-state { text-align: center; padding: 100px 40px; }
    .complete-icon { font-size: 4rem; margin-bottom: 24px; animation: bounce 2s infinite; }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }

    @media (max-width: 1200px) {
      .main-layout { grid-template-columns: 1fr; }
      .sidebar { position: static; max-height: none; }
    }

    .presets-panel h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 16px; color: #334155; }
    .input-group { display: flex; gap: 8px; }
    .small-input { flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.85rem; }
    .save-btn { background: #3b82f6; color: white; border: none; padding: 8px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
    .save-btn:disabled { background: #94a3b8; cursor: not-allowed; }
    
    .presets-list { display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; padding-right: 4px; }
    .preset-item { display: flex; align-items: center; background: var(--card-bg); padding: 8px 12px; border-radius: 10px; border: 1px solid var(--border-color); color: var(--text-color); transition: all 0.2s; }
    .preset-item:hover { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
    .preset-info { flex: 1; cursor: pointer; }
    .preset-name { font-size: 0.85rem; font-weight: 600; color: #475569; }
    .delete-btn { background: none; border: none; padding: 4px; cursor: pointer; opacity: 0.4; transition: opacity 0.2s; }
    .delete-btn:hover { opacity: 1; }
    .empty-hint { font-size: 0.8rem; color: #94a3b8; font-style: italic; text-align: center; margin: 10px 0; }
    .mb-4 { margin-bottom: 16px; }
  `]
})
export class Wanted implements OnInit {
  wantedPokemon: WantedPokemon[] = [];
  pokemonMasterList: any[] = [];
  regions: RegionGroup[] = [];
  filteredRegions: RegionGroup[] = [];
  tradeAvailableMap: Map<string, TradeAvailable[]> = new Map();

  // Controls
  exportPrefix: string = '';
  exportSuffix: string = '';
  includeUnavailable: boolean = false;
  showOnlyAvailableForTrade: boolean = false;
  includeSpecialForms: boolean = true;
  includeCategoryKeywords: boolean = true;

  categoryAvailability: { [key: number]: any } = {};
  globalStats: any = { total: 0 };
  copySuccess: boolean = false;
  generatedSearchString: string = '';

  // Presets
  presets: ExportPreset[] = [];
  newPresetName: string = '';

  categories: CategoryOption[] = [
    { label: 'Normal', tag: 'Pokédex', keyword: '', selected: true },
    { label: 'Légendaire', tag: 'Légendaire', keyword: 'legendaire', selected: true },
    { label: 'Fabuleux', tag: 'Fabuleux', keyword: 'fabuleux', selected: true },
    { label: 'Ultra-Chimères', tag: 'Ultra-Chimères', keyword: 'ultra-chimere', selected: true },
    { label: 'Shiny', tag: 'Shiny', keyword: 'chromatique', selected: true },
    { label: 'Lucky', tag: 'Lucky', keyword: 'chanceux', selected: true },
    { label: 'XXL', tag: 'XXL', keyword: 'xxl', selected: true },
    { label: 'XXS', tag: 'XXS', keyword: 'xxs', selected: true },
    { label: 'G-MAX', tag: 'Gigamax', keyword: 'gmax', selected: true },
    { label: 'Dynamax', tag: 'Dynamax', keyword: 'dynamax', selected: true },
    { label: 'Méga', tag: 'Méga', keyword: 'mega', selected: true },
    { label: 'Obscure', tag: 'Obscure', keyword: 'obscur', selected: true },
    { label: 'Purifié', tag: 'Purifié', keyword: 'purifie', selected: true },
    { label: 'Parfait', tag: 'Parfait', keyword: '4*', selected: true },
    { label: 'Formes', tag: 'Formes', keyword: '', selected: true },
    { label: 'Régional', tag: 'Régional', keyword: '', selected: true }
  ];

  constructor(
    private pokemonService: PokemonService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadData();
    this.loadPresets();
  }

  loadData() {
    forkJoin({
      myPokedex: this.pokemonService.getMyPokedex(),
      tradeAvailable: this.pokemonService.getTradeAvailable(),
      availability: this.pokemonService.getCategoryAvailability(),
      allPokemon: this.pokemonService.getAllPokemonMaster()
    }).subscribe({
      next: (data) => {
        this.categoryAvailability = data.availability;
        this.pokemonMasterList = data.allPokemon;
        this.buildTradeAvailableMap(data.tradeAvailable);
        this.calculateWantedPokemon(data.myPokedex);
        this.groupByRegion();
        this.applyFilters();
      }
    });
  }

  buildTradeAvailableMap(tradeAvailable: TradeAvailable[]) {
    this.tradeAvailableMap.clear();
    tradeAvailable.forEach(item => {
      const key = `${item.pokemon_id}`;
      if (!this.tradeAvailableMap.has(key)) this.tradeAvailableMap.set(key, []);
      this.tradeAvailableMap.get(key)!.push(item);
    });
  }

  calculateWantedPokemon(myPokedex: PokemonEntry[]) {
    const list: WantedPokemon[] = [];
    this.pokemonMasterList.forEach(master => {
      const id = master.pokemon_id;
      const form = master.form_name || 'Normal';
      const existing = myPokedex.find(p => p.pokemon_id === id && (p.form_name || 'Normal') === form);
      const trades = this.tradeAvailableMap.get(`${id}`) || [];
      const missing: { tag: string; availableFrom: string[] }[] = [];

      this.categories.forEach(cat => {
        if (!this.isCategoryAvailable(id, this.mapTagToKey(cat.tag))) return;

        let isMissing = false;
        if (cat.tag === 'Pokédex') {
          if (form === 'Normal' && (!existing || !existing.has_normal)) isMissing = true;
        } else if (cat.tag === 'Formes') {
          if (form !== 'Normal' && (!existing || !existing.has_normal)) isMissing = true;
        } else {
          if (!existing) isMissing = true;
          else if (cat.tag === 'Légendaire' && !existing.has_legendary) isMissing = true;
          else if (cat.tag === 'Fabuleux' && !existing.has_mythical) isMissing = true;
          else if (cat.tag === 'Ultra-Chimères' && !existing.has_ultra_beast) isMissing = true;
          else if (cat.tag === 'Shiny' && !existing.has_shiny) isMissing = true;
          else if (cat.tag === 'Lucky' && !existing.has_lucky) isMissing = true;
          else if (cat.tag === 'XXL' && !existing.has_xxl) isMissing = true;
          else if (cat.tag === 'XXS' && !existing.has_xxs) isMissing = true;
          else if (cat.tag === 'Gigamax' && !existing.has_gmax) isMissing = true;
          else if (cat.tag === 'Dynamax' && !existing.has_dynamax) isMissing = true;
          else if (cat.tag === 'Méga' && !existing.has_mega) isMissing = true;
          else if (cat.tag === 'Obscure' && !existing.has_obscure) isMissing = true;
          else if (cat.tag === 'Purifié' && !existing.has_purifie) isMissing = true;
          else if (cat.tag === 'Parfait' && !existing.has_parfait) isMissing = true;
          else if (cat.tag === 'Régional' && master.is_regional && (!existing || !existing.has_normal)) isMissing = true;
        }

        if (isMissing) {
          missing.push({
            tag: cat.tag,
            availableFrom: trades.filter(t => this.isTradeAvailableFor(t, cat.tag)).map(t => t.username || t.email)
          });
        }
      });

      if (missing.length > 0) {
        list.push({
          pokemon_id: id,
          name: master.name_fr,
          image_url: master.image_url,
          region_id: master.region_id,
          region_name: master.region_name || 'Inconnue',
          name_fr: master.name_fr,
          name_en: master.name_en,
          name_de: master.name_de,
          name_it: master.name_it,
          is_regional: master.is_regional,
          regional_description: master.regional_description,
          form_name: master.form_name,
          missing: missing
        });
      }
    });
    this.wantedPokemon = list;
  }

  isTradeAvailableFor(trade: TradeAvailable, tag: string): boolean {
    if (tag === 'Pokédex') return trade.has_trade;
    if (tag === 'Légendaire') return trade.trade_legendary;
    if (tag === 'Fabuleux') return trade.trade_mythical;
    if (tag === 'Ultra-Chimères') return trade.trade_ultra_beast;
    if (tag === 'Shiny') return trade.trade_shiny;
    if (tag === 'XXL') return trade.trade_xxl;
    if (tag === 'XXS') return trade.trade_xxs;
    if (tag === 'Gigamax') return trade.trade_gmax;
    if (tag === 'Dynamax') return trade.trade_dynamax;
    if (tag === 'Méga') return trade.trade_mega;
    if (tag === 'Purifié') return trade.trade_purified;
    return false;
  }

  mapTagToKey(tag: string): string {
    const map: any = { 'Pokédex': 'normal', 'Légendaire': 'legendary', 'Fabuleux': 'mythical', 'Ultra-Chimères': 'ultra_beast', 'Shiny': 'shiny', 'Lucky': 'lucky', 'XXL': 'xxl', 'XXS': 'xxs', 'Gigamax': 'gmax', 'Dynamax': 'dynamax', 'Méga': 'mega', 'Obscure': 'obscure', 'Purifié': 'purified', 'Parfait': 'parfait', 'Régional': 'regional', 'Formes': 'forms' };
    return map[tag];
  }

  isCategoryAvailable(id: number, key: string): boolean {
    if (this.includeUnavailable) return true;
    const entry = this.categoryAvailability[id];
    if (entry) {
      const fieldName = `can_be_${key === 'parfait' ? 'perfect' : key}`;
      return entry[fieldName];
    }
    return ['regional', 'forms', 'normal'].includes(key);
  }

  groupByRegion() {
    const groups: { [key: number]: RegionGroup } = {};
    this.wantedPokemon.forEach(p => {
      if (!groups[p.region_id]) {
        groups[p.region_id] = { name: p.region_name, pokemon: [], expanded: true, stats: {}, totalStats: {} };
      }
      groups[p.region_id].pokemon.push(p);
    });
    const sortedGroups = Object.values(groups).sort((a, b) => {
      const idA = this.wantedPokemon.find(p => p.region_name === a.name)?.region_id || 99;
      const idB = this.wantedPokemon.find(p => p.region_name === b.name)?.region_id || 99;
      return idA - idB;
    });
    this.regions = sortedGroups;
  }

  applyFilters() {
    const selectedTags = this.categories.filter(c => c.selected).map(c => c.tag);
    this.filteredRegions = this.regions.map(region => {
      let filtered = region.pokemon.filter(p => p.missing.some(m => selectedTags.includes(m.tag)));

      // Filter special forms if needed
      if (!this.includeSpecialForms) {
        filtered = filtered.filter(p => !p.form_name || p.form_name === 'Normal');
      }

      if (this.showOnlyAvailableForTrade) {
        filtered = filtered.filter(p => p.missing.some(m => selectedTags.includes(m.tag) && m.availableFrom.length > 0));
      }
      return { ...region, pokemon: filtered, expanded: region.expanded, stats: region.stats, totalStats: region.totalStats };
    }).filter(r => r.pokemon.length > 0);

    this.calculateGlobalStats();
    this.updateExportString();
  }

  calculateGlobalStats() {
    this.globalStats = { total: 0 };
    this.categories.forEach(c => this.globalStats[c.tag] = 0);
    this.filteredRegions.forEach(r => {
      r.pokemon.forEach(p => {
        const uniqueTags = new Set(p.missing.filter(m => this.categories.find(c => c.tag === m.tag && c.selected)).map(m => m.tag));
        uniqueTags.forEach(tag => {
          this.globalStats.total++;
          if (this.globalStats[tag] !== undefined) this.globalStats[tag]++;
        });
      });
    });
  }

  toggleAllCategories(val: boolean) {
    this.categories.forEach(c => c.selected = val);
    this.applyFilters();
  }

  updateExportString() {
    const selected = this.categories.filter(c => c.selected);
    if (selected.length === 0) {
      this.generatedSearchString = '';
      return;
    }

    if (!this.includeCategoryKeywords) {
      // Single list of IDs
      const allIds = new Set<number>();
      this.filteredRegions.forEach(r => {
        r.pokemon.forEach(p => allIds.add(p.pokemon_id));
      });
      const sortedIds = Array.from(allIds).sort((a, b) => a - b);
      this.generatedSearchString = sortedIds.length > 0 ? `${this.exportPrefix}${sortedIds.join(',')}${this.exportSuffix}` : '';
      return;
    }

    // Detailed list with category keywords
    const parts: string[] = [];
    const sortedCategories = [...selected].sort((a, b) => {
      const priorityA = (a.label === 'Normal' || a.label === 'Lucky' || a.label === 'Méga' || a.label === 'Parfait') ? 0 : 1;
      const priorityB = (b.label === 'Normal' || b.label === 'Lucky' || b.label === 'Méga' || b.label === 'Parfait') ? 0 : 1;
      return priorityA - priorityB;
    });

    sortedCategories.forEach(cat => {
      const ids = new Set<number>();
      this.filteredRegions.forEach(r => {
        r.pokemon.forEach(p => {
          if (p.missing.some(m => m.tag === cat.tag)) {
            ids.add(p.pokemon_id);
          }
        });
      });

      const sortedIds = Array.from(ids).sort((a, b) => a - b);
      if (sortedIds.length > 0) {
        if (cat.keyword) {
          parts.push(`${cat.keyword}&${sortedIds.join(',')}`);
        } else {
          parts.push(sortedIds.join(','));
        }
      }
    });

    this.generatedSearchString = parts.length > 0 ? `${this.exportPrefix}${parts.join(', ')}${this.exportSuffix}` : '';
  }

  copyToClipboard() {
    if (!this.generatedSearchString) return;
    navigator.clipboard.writeText(this.generatedSearchString).then(() => {
      this.copySuccess = true;
      setTimeout(() => this.copySuccess = false, 2000);
    });
  }

  getPokemonName(p: WantedPokemon): string {
    const lang = this.authService.getPreferredLanguage();
    const base = p[`name_${lang}`] || p.name_fr || p.name || 'Inconnu';
    return (p.form_name && p.form_name !== 'Normal') ? `${base} (${p.form_name})` : base;
  }

  toggleRegion(r: RegionGroup) { r.expanded = !r.expanded; }
  onFilterChange() { this.applyFilters(); }
  goToDetail(id: number) { this.router.navigate(['/pokedex', id]); }

  // Preset Methods
  loadPresets() {
    const saved = localStorage.getItem('pokedec-wanted-presets');
    if (saved) {
      try {
        this.presets = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading presets', e);
        this.presets = [];
      }
    }
  }

  savePresetsToStorage() {
    localStorage.setItem('pokedec-wanted-presets', JSON.stringify(this.presets));
  }

  savePreset() {
    if (!this.newPresetName.trim()) return;

    const newPreset: ExportPreset = {
      id: Date.now().toString(),
      name: this.newPresetName.trim(),
      prefix: this.exportPrefix,
      suffix: this.exportSuffix,
      selectedCategories: this.categories.filter(c => c.selected).map(c => c.tag),
      includeSpecialForms: this.includeSpecialForms,
      includeCategoryKeywords: this.includeCategoryKeywords,
      includeUnavailable: this.includeUnavailable,
      showOnlyAvailableForTrade: this.showOnlyAvailableForTrade
    };

    this.presets.push(newPreset);
    this.savePresetsToStorage();
    this.newPresetName = '';
  }

  loadPreset(p: ExportPreset) {
    this.exportPrefix = p.prefix;
    this.exportSuffix = p.suffix;
    this.includeSpecialForms = p.includeSpecialForms;
    this.includeCategoryKeywords = p.includeCategoryKeywords;
    this.includeUnavailable = p.includeUnavailable;
    this.showOnlyAvailableForTrade = p.showOnlyAvailableForTrade;

    this.categories.forEach(cat => {
      cat.selected = p.selectedCategories.includes(cat.tag);
    });

    this.applyFilters();
  }

  deletePreset(id: string) {
    this.presets = this.presets.filter(p => p.id !== id);
    this.savePresetsToStorage();
  }
}
