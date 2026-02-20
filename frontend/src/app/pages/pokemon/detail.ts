import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-pokemon-detail',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './detail.html',
    styleUrls: ['./detail.css']
})
export class PokemonDetail implements OnInit {
    pokemon: any = null;
    userPokemon: any = null;
    translatedName: string = '';
    currentLang: string = 'fr';
    loading = true;
    formName: string = 'Normal';
    availableForms: any[] = [];

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private pokemonService = inject(PokemonService);
    private authService = inject(AuthService);

    private translations: any = {
        fr: {
            shiny: 'Chromatique',
            lucky: 'Chanceux',
            trade: 'Échange',
            xxl: 'XXL',
            xxs: 'XXS',
            gmax: 'G-MAX',
            dynamax: 'Dynamax',
            mega: 'Méga',
            obscure: 'Obscur',
            purified: 'Purifié',
            perfect: 'Parfait',
            back: 'Retour au Pokédex',
            collection_status: 'État de la collection'
        },
        en: {
            shiny: 'Shiny',
            lucky: 'Lucky',
            trade: 'Trade',
            xxl: 'XXL',
            xxs: 'XXS',
            gmax: 'G-MAX',
            dynamax: 'Dynamax',
            mega: 'Mega',
            obscure: 'Shadow',
            purified: 'Purified',
            perfect: 'Perfect',
            back: 'Back to Pokedex',
            collection_status: 'Collection Status'
        },
        de: {
            shiny: 'Schillernd',
            lucky: 'Glücks',
            trade: 'Tausch',
            xxl: 'XXL',
            xxs: 'XXS',
            gmax: 'G-MAX',
            dynamax: 'Dynamax',
            mega: 'Mega',
            obscure: 'Crypto',
            purified: 'Erlöst',
            perfect: 'Perfekt',
            back: 'Zurück zum Pokédex',
            collection_status: 'Sammlungsstatus'
        },
        it: {
            shiny: 'Cromatico',
            lucky: 'Fortunato',
            trade: 'Scambio',
            xxl: 'XXL',
            xxs: 'XXS',
            gmax: 'G-MAX',
            dynamax: 'Dynamax',
            mega: 'Mega',
            obscure: 'Ombra',
            purified: 'Purificato',
            perfect: 'Perfetto',
            back: 'Torna al Pokédex',
            collection_status: 'Stato della collezione'
        }
    };

    incomingRequests: any[] = [];

    ngOnInit() {
        this.authService.currentUser$.subscribe(user => {
            this.currentLang = user?.preferred_language || 'fr';
        });

        this.route.params.subscribe(params => {
            const id = params['id'];
            if (id) {
                this.route.queryParams.subscribe(queryParams => {
                    const formName = queryParams['form'] || 'Normal';
                    this.loadPokemonData(id, formName);
                });
            }
        });
    }

    loadIncomingRequests() {
        this.pokemonService.getIncomingTradeRequests().subscribe({
            next: (requests) => {
                // Filter requests for THIS pokemon
                this.incomingRequests = requests.filter(r => r.pokemon_id === this.pokemon.id);
            },
            error: (err) => console.error('Failed to load trade requests', err)
        });
    }

    respondToRequest(request: any, status: string) {
        if (confirm(`Confirmer la réponse : ${status === 'rejected' ? 'Pas intéressé' : 'Contacter via ' + status.split('_')[1]} ?`)) {
            this.pokemonService.respondToTradeRequest(request.id, status).subscribe({
                next: () => {
                    // Remove from list
                    this.incomingRequests = this.incomingRequests.filter(r => r.id !== request.id);
                    alert('Réponse envoyée !');
                },
                error: (err) => alert('Erreur lors de l\'envoi de la réponse')
            });
        }
    }

    switchForm(newForm: string) {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { form: newForm },
            queryParamsHandling: 'merge'
        });
    }

    getLabel(key: string): string {
        return this.translations[this.currentLang]?.[key] || this.translations['en'][key];
    }

    loadPokemonData(id: string, formName: string = 'Normal') {
        this.loading = true;
        this.formName = formName;

        // 1. Fetch static data from PokeAPI
        this.pokemonService.getPokemon(id, formName).subscribe({
            next: (data) => {
                this.pokemon = data;

                // 2. Fetch translated name
                this.pokemonService.getTranslatedName(data.id, this.currentLang, formName).subscribe(name => {
                    this.translatedName = name;
                });

                // 3. Fetch available forms for this species
                this.pokemonService.getAvailableForms(data.id).subscribe({
                    next: (forms) => {
                        this.availableForms = forms;

                        // 4. Fetch user specific data from backend (NOW INSIDE FORMS SUBSCRIPTION)
                        this.pokemonService.getUserPokemon(data.id, formName).subscribe({
                            next: (userData) => {
                                if (!userData || !userData.id) {
                                    // User hasn't collected it yet, find metadata in availableForms
                                    const formMeta = this.availableForms.find(f => f.form_name === formName) || {};

                                    this.userPokemon = {
                                        pokemon_id: data.id,
                                        form_name: formName,
                                        name: data.name,
                                        // Metadata from master data to avoid UI disappearing
                                        classification_name: formMeta.classification_name,
                                        region_name: formMeta.region_name,
                                        type_primary_name: formMeta.type_primary_name,
                                        type_primary_color: formMeta.type_primary_color,
                                        type_secondary_name: formMeta.type_secondary_name,
                                        type_secondary_color: formMeta.type_secondary_color,
                                        is_regional: formMeta.is_regional,
                                        regional_description: formMeta.regional_description,
                                        // Availability flags
                                        can_be_shiny: formMeta.can_be_shiny,
                                        can_be_lucky: formMeta.can_be_lucky,
                                        can_be_gmax: formMeta.can_be_gmax,
                                        can_be_mega: formMeta.can_be_mega,
                                        can_be_obscure: formMeta.can_be_obscure,
                                        can_be_purified: formMeta.can_be_purified,
                                        can_be_xxl: formMeta.can_be_xxl,
                                        can_be_xxs: formMeta.can_be_xxs,
                                        can_be_legendary: formMeta.can_be_legendary,
                                        can_be_mythical: formMeta.can_be_mythical,
                                        can_be_ultra_beast: formMeta.can_be_ultra_beast,
                                        can_be_normal: formMeta.can_be_normal,
                                        // Initialize user flags to false
                                        has_normal: false,
                                        has_shiny: false,
                                        has_lucky: false,
                                        has_trade: false,
                                        has_xxl: false,
                                        has_xxs: false,
                                        has_gmax: false,
                                        has_dynamax: false,
                                        has_mega: false,
                                        has_obscure: false,
                                        has_purifie: false,
                                        has_parfait: false
                                    };
                                } else {
                                    this.userPokemon = userData;
                                }
                                this.loading = false;
                                this.loadIncomingRequests();
                            },
                            error: (err) => {
                                console.error('Error fetching user pokemon data', err);
                                this.loading = false;
                            }
                        });
                    },
                    error: (err) => {
                        console.error('Error fetching forms', err);
                        this.loading = false;
                    }
                });
            },
            error: (err) => {
                console.error('Error fetching pokemon details', err);
                this.loading = false;
            }
        });
    }

    ensurePokemonInDb(callback: () => void) {
        // If we already have an ID from backend (meaning it's in DB), proceed
        if (this.userPokemon.id) {
            callback();
            return;
        }

        // Otherwise add it first
        this.pokemonService.addToPokedex(this.pokemon, this.formName).subscribe({
            next: (newEntry) => {
                // Merge with existing userPokemon if we had some metadata (like availability)
                this.userPokemon = { ...this.userPokemon, ...newEntry };
                callback();
            },
            error: (err) => {
                // If it says "already in pokedex" (race condition), just fetch it
                if (err.status === 200 || err.status === 409) {
                    this.pokemonService.getUserPokemon(this.pokemon.id, this.formName).subscribe(data => {
                        this.userPokemon = data;
                        callback();
                    });
                } else {
                    console.error('Failed to add pokemon to DB', err);
                }
            }
        });
    }

    addToPokedex() {
        this.ensurePokemonInDb(() => {
            // Just ensuring it's in DB is enough
        });
    }

    removeFromPokedex() {
        if (confirm('Voulez-vous vraiment supprimer ce Pokémon (cette forme) de votre Pokédex ?')) {
            this.pokemonService.removeFromPokedex(this.pokemon.id, this.formName).subscribe({
                next: () => {
                    // Reset user data in UI
                    this.userPokemon = {
                        pokemon_id: this.pokemon.id,
                        has_normal: false,
                        has_shiny: false,
                        has_lucky: false,
                        has_trade: false
                    };
                },
                error: (err) => alert('Erreur lors de la suppression')
            });
        }
    }

    getTradeStatus(): string {
        return this.userPokemon?.master_trade_status || 'YES';
    }

    toggleNormal() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleNormal(this.pokemon.id, this.formName).subscribe(updated => {
                this.userPokemon = { ...this.userPokemon, ...updated };
                // If untoggling normal, also untoggle normal trade
                if (!updated.has_normal && updated.has_trade) {
                    this.pokemonService.toggleField(this.pokemon.id, 'has_trade', this.formName).subscribe(u => this.userPokemon = { ...this.userPokemon, ...u });
                }
            });
        });
    }

    toggleShiny() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleShiny(this.pokemon.id, this.formName).subscribe(updated => {
                this.userPokemon = { ...this.userPokemon, ...updated };
                // If untoggling shiny, also untoggle shiny trade
                if (!updated.has_shiny && updated.trade_shiny) {
                    this.pokemonService.toggleField(this.pokemon.id, 'trade_shiny', this.formName).subscribe(u => this.userPokemon = { ...this.userPokemon, ...u });
                }
            });
        });
    }

    toggleTradeShiny() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'trade_shiny', this.formName).subscribe(updated => this.userPokemon = { ...this.userPokemon, ...updated });
        });
    }

    toggleLucky() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleLucky(this.pokemon.id, this.formName).subscribe(updated => {
                this.userPokemon = { ...this.userPokemon, ...updated };
            });
        });
    }

    toggleTrade() {
        if (!this.userPokemon || this.getTradeStatus() === 'NO') return;
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'has_trade', this.formName).subscribe(updated => {
                this.userPokemon = { ...this.userPokemon, ...updated };
            });
        });
    }

    toggleXXL() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'has_xxl', this.formName).subscribe(updated => {
                this.userPokemon = { ...this.userPokemon, ...updated };
                if (!updated.has_xxl && updated.trade_xxl) {
                    this.pokemonService.toggleField(this.pokemon.id, 'trade_xxl', this.formName).subscribe(u => this.userPokemon = { ...this.userPokemon, ...u });
                }
            });
        });
    }

    toggleTradeXXL() {
        if (!this.userPokemon || this.getTradeStatus() === 'NO') return;
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'trade_xxl', this.formName).subscribe(updated => this.userPokemon = { ...this.userPokemon, ...updated });
        });
    }

    toggleXXS() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'has_xxs', this.formName).subscribe(updated => {
                this.userPokemon = { ...this.userPokemon, ...updated };
                if (!updated.has_xxs && updated.trade_xxs) {
                    this.pokemonService.toggleField(this.pokemon.id, 'trade_xxs', this.formName).subscribe(u => this.userPokemon = { ...this.userPokemon, ...u });
                }
            });
        });
    }

    toggleTradeXXS() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'trade_xxs', this.formName).subscribe(updated => this.userPokemon = { ...this.userPokemon, ...updated });
        });
    }

    toggleGMax() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'has_gmax', this.formName).subscribe(updated => {
                this.userPokemon = { ...this.userPokemon, ...updated };

                // Also handle the 'Gigamax' form
                if (updated.has_gmax) {
                    const gmaxForm = this.availableForms.find(f => f.form_name === 'Gigamax');
                    if (gmaxForm) {
                        this.pokemonService.addToPokedex(this.pokemon, gmaxForm.form_name).subscribe();
                    }
                } else {
                    // Remove if untoggled
                    this.pokemonService.removeFromPokedex(this.pokemon.id, 'Gigamax').subscribe();
                }

                if (!updated.has_gmax && updated.trade_gmax) {
                    this.pokemonService.toggleField(this.pokemon.id, 'trade_gmax', this.formName).subscribe(u => this.userPokemon = { ...this.userPokemon, ...u });
                }
            });
        });
    }

    toggleTradeGMax() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'trade_gmax', this.formName).subscribe(updated => this.userPokemon = { ...this.userPokemon, ...updated });
        });
    }

    toggleDynamax() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'has_dynamax', this.formName).subscribe(updated => {
                this.userPokemon = { ...this.userPokemon, ...updated };

                // Also handle the 'Dynamax' form
                if (updated.has_dynamax) {
                    const dmaxForm = this.availableForms.find(f => f.form_name === 'Dynamax');
                    if (dmaxForm) {
                        this.pokemonService.addToPokedex(this.pokemon, dmaxForm.form_name).subscribe();
                    }
                } else {
                    // Remove if untoggled
                    this.pokemonService.removeFromPokedex(this.pokemon.id, 'Dynamax').subscribe();
                }

                if (!updated.has_dynamax && updated.trade_dynamax) {
                    this.pokemonService.toggleField(this.pokemon.id, 'trade_dynamax', this.formName).subscribe(u => this.userPokemon = { ...this.userPokemon, ...u });
                }
            });
        });
    }

    toggleTradeDynamax() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'trade_dynamax', this.formName).subscribe(updated => this.userPokemon = { ...this.userPokemon, ...updated });
        });
    }

    toggleMega() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'has_mega', this.formName).subscribe(updated => {
                this.userPokemon = { ...this.userPokemon, ...updated };

                // Also handle 'Mega' forms
                if (updated.has_mega) {
                    const megaForms = this.availableForms.filter(f => f.form_name.startsWith('Méga') || f.form_name.startsWith('Mega'));
                    megaForms.forEach(f => {
                        this.pokemonService.addToPokedex(this.pokemon, f.form_name).subscribe();
                    });
                } else {
                    // Remove all Mega forms if untoggled
                    const megaForms = this.availableForms.filter(f => f.form_name.startsWith('Méga') || f.form_name.startsWith('Mega'));
                    megaForms.forEach(f => {
                        this.pokemonService.removeFromPokedex(this.pokemon.id, f.form_name).subscribe();
                    });
                }

                if (!updated.has_mega && updated.trade_mega) {
                    this.pokemonService.toggleField(this.pokemon.id, 'trade_mega', this.formName).subscribe(u => this.userPokemon = { ...this.userPokemon, ...u });
                }
            });
        });
    }

    toggleTradeMega() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'trade_mega', this.formName).subscribe(updated => this.userPokemon = { ...this.userPokemon, ...updated });
        });
    }

    toggleObscure() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'has_obscure', this.formName).subscribe(updated => {
                this.userPokemon = { ...this.userPokemon, ...updated };
            });
        });
    }

    togglePurifie() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'has_purifie', this.formName).subscribe(updated => {
                this.userPokemon = { ...this.userPokemon, ...updated };
                if (!updated.has_purifie && updated.trade_purified) {
                    this.pokemonService.toggleField(this.pokemon.id, 'trade_purified', this.formName).subscribe(u => this.userPokemon = { ...this.userPokemon, ...u });
                }
            });
        });
    }

    toggleTradePurified() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'trade_purified', this.formName).subscribe(updated => this.userPokemon = { ...this.userPokemon, ...updated });
        });
    }

    toggleParfait() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'has_parfait', this.formName).subscribe(updated => {
                this.userPokemon = { ...this.userPokemon, ...updated };
            });
        });
    }

    // Mutually exclusive categories
    toggleLegendary() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'has_legendary', this.formName).subscribe(updated => {
                this.userPokemon = { ...this.userPokemon, ...updated };
                if (!updated.has_legendary && updated.trade_legendary) {
                    this.pokemonService.toggleField(this.pokemon.id, 'trade_legendary', this.formName).subscribe(u => this.userPokemon = { ...this.userPokemon, ...u });
                }
            });
        });
    }

    toggleTradeLegendary() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'trade_legendary', this.formName).subscribe(updated => this.userPokemon = { ...this.userPokemon, ...updated });
        });
    }

    toggleMythical() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'has_mythical', this.formName).subscribe(updated => {
                this.userPokemon = { ...this.userPokemon, ...updated };
                if (!updated.has_mythical && updated.trade_mythical) {
                    this.pokemonService.toggleField(this.pokemon.id, 'trade_mythical', this.formName).subscribe(u => this.userPokemon = { ...this.userPokemon, ...u });
                }
            });
        });
    }

    toggleTradeMythical() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'trade_mythical', this.formName).subscribe(updated => this.userPokemon = { ...this.userPokemon, ...updated });
        });
    }

    toggleUltraBeast() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleField(this.pokemon.id, 'has_ultra_beast', this.formName).subscribe(updated => {
                this.userPokemon = { ...this.userPokemon, ...updated };
                if (!updated.has_ultra_beast && updated.trade_ultra_beast) {
                    this.pokemonService.toggleField(this.pokemon.id, 'trade_ultra_beast', this.formName).subscribe(u => this.userPokemon = { ...this.userPokemon, ...u });
                }
            });
        });
    }

    toggleTradeUltraBeast() {
        this.ensurePokemonInDb(() => {
            this.pokemonService.toggleTrade(this.pokemon.id).subscribe(updated => this.userPokemon = { ...this.userPokemon, ...updated });
        });
    }

    goBack() {
        this.router.navigate(['/pokedex']);
    }

    goToPrevious() {
        if (this.pokemon && this.pokemon.id > 1) {
            this.router.navigate(['/pokedex', this.pokemon.id - 1]);
        }
    }

    goToNext() {
        if (this.pokemon && this.pokemon.id < 1025) {
            this.router.navigate(['/pokedex', this.pokemon.id + 1]);
        }
    }
}
