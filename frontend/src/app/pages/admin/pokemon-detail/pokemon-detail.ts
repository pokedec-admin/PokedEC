import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AdminPokemonService, PokemonMaster, Classification, Region, PokemonType } from '../../../services/admin-pokemon.service';

@Component({
    selector: 'app-pokemon-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './pokemon-detail.html',
    styleUrl: './pokemon-detail.css'
})
export class PokemonDetailComponent implements OnInit, OnDestroy {
    pokemonId!: number; // Pokemon species ID (e.g., 38 for Feunard)
    currentFormName: string = 'Normal';
    pokemon: PokemonMaster | null = null;
    availableForms: PokemonMaster[] = []; // All forms for this species

    // Reference data
    classifications: Classification[] = [];
    regions: Region[] = [];
    types: PokemonType[] = [];
    predefinedFormNames: any[] = [];

    // Modal state
    showAddFormModal = false;
    selectedPredefinedName: string = '';
    customFormName: string = '';

    loading = false;
    saving = false;
    error: string | null = null;
    lastSaved: Date | null = null;

    // New region form
    showNewRegionForm = false;
    newRegion = { name_fr: '', name_en: '', name_key: '' };

    // Auto-save
    private updateSubject = new Subject<void>();
    private updateSubscription: Subscription;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private adminPokemonService: AdminPokemonService
    ) {
        // Setup auto-save debounce
        this.updateSubscription = this.updateSubject.pipe(
            debounceTime(1000)
        ).subscribe(() => {
            this.save();
        });
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            const idParam = params['id'];
            const formParam = params['form'];

            // Parse pokemon_id
            this.pokemonId = +idParam;
            if (isNaN(this.pokemonId)) {
                this.error = 'ID invalide';
                this.loading = false;
                return;
            }

            // Get form name from route or default to 'Normal'
            this.currentFormName = formParam || 'Normal';

            this.loadData();
        });
    }

    ngOnDestroy() {
        if (this.updateSubscription) {
            this.updateSubscription.unsubscribe();
        }
    }

    loadData() {
        this.loading = true;
        this.error = null;

        // Load reference data only once
        if (this.classifications.length === 0) {
            this.adminPokemonService.getClassifications().subscribe({
                next: (data) => this.classifications = data,
                error: (err) => console.error('Failed to load classifications', err)
            });
        }

        if (this.regions.length === 0) {
            this.adminPokemonService.getRegions().subscribe({
                next: (data) => this.regions = data,
                error: (err) => console.error('Failed to load regions', err)
            });
        }

        if (this.types.length === 0) {
            this.adminPokemonService.getTypes().subscribe({
                next: (data) => this.types = data,
                error: (err) => console.error('Failed to load types', err)
            });
        }

        this.adminPokemonService.getFormNames().subscribe({
            next: (names) => this.predefinedFormNames = names,
            error: (err) => console.error('Failed to load form names', err)
        });

        // Load all forms for this species
        this.adminPokemonService.getAllFormsForSpecies(this.pokemonId).subscribe({
            next: (forms) => {
                this.availableForms = forms;

                // Find the current form
                const currentForm = forms.find(f => f.form_name === this.currentFormName);
                if (currentForm) {
                    this.pokemon = currentForm;
                } else if (forms.length > 0) {
                    // Fallback to first form (usually Normal)
                    this.pokemon = forms[0];
                    this.currentFormName = forms[0].form_name;
                }

                this.loading = false;
            },
            error: (err) => {
                this.error = `Erreur: ${err.error?.error || err.message}`;
                this.loading = false;
            }
        });
    }

    switchForm(formName: string) {
        if (formName === this.currentFormName) return;

        // Update URL without reloading
        if (formName === 'Normal') {
            this.router.navigate(['/admin/pokemon', this.pokemonId], { replaceUrl: true });
        } else {
            this.router.navigate(['/admin/pokemon', this.pokemonId, formName], { replaceUrl: true });
        }

        // Update current form
        this.currentFormName = formName;
        const newForm = this.availableForms.find(f => f.form_name === formName);
        if (newForm) {
            this.pokemon = newForm;
        }
    }

    triggerAutoSave() {
        this.saving = true; // Show immediate feedback
        this.updateSubject.next();
    }

    save() {
        if (!this.pokemon) return;

        this.saving = true;
        this.error = null;

        const updateData: Partial<PokemonMaster> = {
            name_fr: this.pokemon.name_fr,
            name_en: this.pokemon.name_en,
            name_de: this.pokemon.name_de,
            name_it: this.pokemon.name_it,
            is_available: this.pokemon.is_available,
            classification_id: this.pokemon.classification_id,
            region_id: this.pokemon.region_id,
            type_primary_id: this.pokemon.type_primary_id,
            type_secondary_id: this.pokemon.type_secondary_id,
            trade_status: this.pokemon.trade_status,
            image_url: this.pokemon.image_url,
            // Category flags
            can_be_normal: this.pokemon.can_be_normal,
            can_be_shiny: this.pokemon.can_be_shiny,
            can_be_lucky: this.pokemon.can_be_lucky,
            can_be_xxl: this.pokemon.can_be_xxl,
            can_be_xxs: this.pokemon.can_be_xxs,
            can_be_gmax: this.pokemon.can_be_gmax,
            can_be_dynamax: this.pokemon.can_be_dynamax,
            can_be_mega: this.pokemon.can_be_mega,
            can_be_obscure: this.pokemon.can_be_obscure,
            can_be_purified: this.pokemon.can_be_purified,
            can_be_perfect: this.pokemon.can_be_perfect,
            is_regional: this.pokemon.is_regional,
            regional_description: this.pokemon.regional_description
        };

        this.adminPokemonService.updatePokemon(this.pokemon.id, updateData).subscribe({
            next: (updated) => {
                // Don't replace the object to avoid UI flicker, just update properties if needed
                // But usually we just keep user input. 
                // However, `updated` might contain sanitized data. 
                // For smooth typing, we might prefer not to overwrite `this.pokemon` fully 
                // OR we accept that auto-save effectively confirms the data.
                // Let's just update the timestamp.
                this.saving = false;
                this.lastSaved = new Date();
                // Update the form in the list
                const formIndex = this.availableForms.findIndex(f => f.id === this.pokemon!.id);
                if (formIndex !== -1) {
                    this.availableForms[formIndex] = { ...this.availableForms[formIndex], ...updateData };
                }
            },
            error: (err) => {
                this.error = `❌ Erreur: ${err.error?.error || err.message}`;
                this.saving = false;
            }
        });
    }

    createNewRegion() {
        if (!this.newRegion.name_fr || !this.newRegion.name_en || !this.newRegion.name_key) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        this.adminPokemonService.createRegion(this.newRegion).subscribe({
            next: (region) => {
                this.regions.push(region);
                if (this.pokemon) {
                    this.pokemon.region_id = region.id;
                    this.triggerAutoSave();
                }
                this.showNewRegionForm = false;
                this.newRegion = { name_fr: '', name_en: '', name_key: '' };
            },
            error: (err) => {
                alert(`Erreur: ${err.error?.error || err.message}`);
            }
        });
    }

    cancel() {
        this.router.navigate(['/admin/pokemon']);
    }

    goToNext() {
        this.router.navigate(['/admin/pokemon', this.pokemonId + 1]);
    }

    goToPrevious() {
        if (this.pokemonId > 1) {
            this.router.navigate(['/admin/pokemon', this.pokemonId - 1]);
        }
    }

    onFileSelected(event: any) {
        if (!this.pokemon) return;

        const file = event.target.files[0];
        if (!file) return;

        this.saving = true;
        this.adminPokemonService.uploadImage(this.pokemon.pokemon_id, this.pokemon.form_name, file).subscribe({
            next: (res) => {
                if (this.pokemon) {
                    // Update image URl with timestamp to force reload cache
                    this.pokemon.image_url = res.imageUrl + '?t=' + new Date().getTime();

                    // Also update the form list item if it exists
                    const formIndex = this.availableForms.findIndex(f => f.id === this.pokemon!.id);
                    if (formIndex !== -1) {
                        this.availableForms[formIndex].image_url = this.pokemon.image_url;
                    }

                    // Persist the new URL (in case extension changed or it was null)
                    this.save();
                }
                this.saving = false;
            },
            error: (err) => {
                this.error = `Erreur upload: ${err.error?.error || err.message}`;
                this.saving = false;
            }
        });
    }

    addForm() {
        this.showAddFormModal = true;
        this.selectedPredefinedName = '';
        this.customFormName = '';
    }

    onPredefinedNameChange() {
        if (this.selectedPredefinedName !== 'OTHER') {
            this.customFormName = this.selectedPredefinedName;
        } else {
            this.customFormName = '';
        }
    }

    canConfirmAddForm(): boolean {
        return !!this.customFormName.trim();
    }

    confirmAddForm() {
        const formName = this.customFormName.trim();
        if (!formName) return;

        this.showAddFormModal = false;
        this.loading = true;
        this.adminPokemonService.createForm(this.pokemonId, formName).subscribe({
            next: () => {
                this.router.navigate(['/admin/pokemon', this.pokemonId, formName]);
            },
            error: (err) => {
                this.loading = false;
                this.error = `Erreur: ${err.error?.error || err.message}`;
            }
        });
    }

    deleteForm() {
        if (!this.pokemon || this.currentFormName === 'Normal') return;

        const confirmMessage = `⚠️ ATTENTION ⚠️\n\n` +
            `Vous êtes sur le point de SUPPRIMER la forme "${this.currentFormName}" pour ${this.pokemon.name_fr}.\n\n` +
            `CONSÉQUENCES :\n` +
            `1. Cette forme sera définitivement supprimée de la base de données.\n` +
            `2. TOUTES les données de cette forme dans les Pokédex des utilisateurs seront PERDUES.\n` +
            `3. L'image associée sera supprimée du serveur.\n\n` +
            `Voulez-vous vraiment continuer ?`;

        if (window.confirm(confirmMessage)) {
            const secondConfirm = window.confirm(`Êtes-vous ABSOLUMENT sûr ? Cette action est irréversible.`);
            if (!secondConfirm) return;

            this.loading = true;
            this.adminPokemonService.deleteForm(this.pokemonId, this.currentFormName).subscribe({
                next: () => {
                    // Update available forms list locally
                    this.availableForms = this.availableForms.filter(f => f.form_name !== this.currentFormName);

                    // Navigate back to the Normal form and refresh data
                    this.router.navigate(['/admin/pokemon', this.pokemonId]).then(() => {
                        this.loadData(); // Force reload to sync flags
                    });
                },
                error: (err) => {
                    this.loading = false;
                    this.alertError(`Erreur lors de la suppression: ${err.error?.error || err.message}`);
                }
            });
        }
    }

    onCategoryToggle(category: 'mega' | 'gmax' | 'dynamax', event: any) {
        if (!this.pokemon) return;

        const isChecked = event.target.checked;
        if (!isChecked) {
            // Find forms to delete
            let formsToDelete: string[] = [];
            if (category === 'mega') {
                formsToDelete = this.availableForms
                    .filter(f => f.form_name.startsWith('Méga') || f.form_name.startsWith('Mega'))
                    .map(f => f.form_name);
            } else if (category === 'gmax') {
                formsToDelete = this.availableForms.filter(f => f.form_name === 'Gigamax').map(f => f.form_name);
            } else if (category === 'dynamax') {
                formsToDelete = this.availableForms.filter(f => f.form_name === 'Dynamax').map(f => f.form_name);
            }

            if (formsToDelete.length > 0) {
                const confirm = window.confirm(`Désélectionner cette catégorie supprimera définitivement les formes suivantes : ${formsToDelete.join(', ')}. Continuer ?`);
                if (!confirm) {
                    // Rollback UI
                    event.target.checked = true;
                    if (category === 'mega') this.pokemon.can_be_mega = true;
                    if (category === 'gmax') this.pokemon.can_be_gmax = true;
                    if (category === 'dynamax') this.pokemon.can_be_dynamax = true;
                    return;
                }

                // Delete forms
                formsToDelete.forEach(fn => {
                    this.adminPokemonService.deleteForm(this.pokemonId, fn).subscribe({
                        next: () => {
                            this.availableForms = this.availableForms.filter(f => f.form_name !== fn);
                        },
                        error: (err) => console.error(`Failed to delete form ${fn}`, err)
                    });
                });
            }

            this.triggerAutoSave();
            return;
        }

        // Box was checked. 
        // If it's the Normal form, we might want to auto-create the corresponding specialized form
        let formToCreate = '';
        if (category === 'mega') formToCreate = 'Méga';
        if (category === 'gmax') formToCreate = 'Gigamax';
        if (category === 'dynamax') formToCreate = 'Dynamax';

        if (!formToCreate) {
            this.triggerAutoSave();
            return;
        }

        // Check if this form already exists in availableForms
        const existing = this.availableForms.find(f =>
            f.form_name === formToCreate ||
            (category === 'mega' && (f.form_name.startsWith('Méga') || f.form_name.startsWith('Mega')))
        );

        if (!existing) {
            console.log(`Auto-creating form: ${formToCreate} for pokemon ${this.pokemonId}`);
            this.adminPokemonService.createForm(this.pokemonId, formToCreate).subscribe({
                next: (newForm) => {
                    this.availableForms.push(newForm);
                    this.availableForms.sort((a, b) => a.form_name.localeCompare(b.form_name));
                    this.triggerAutoSave();
                },
                error: (err) => {
                    console.error(`Failed to auto-create form ${formToCreate}`, err);
                    this.triggerAutoSave();
                }
            });
        } else {
            this.triggerAutoSave();
        }
    }

    private alertError(msg: string) {
        this.error = msg;
        window.alert(msg);
    }
}
