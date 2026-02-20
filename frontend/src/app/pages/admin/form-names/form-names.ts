import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminPokemonService, FormNamePredefined } from '../../../services/admin-pokemon.service';

@Component({
    selector: 'app-admin-form-names',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './form-names.html',
    styleUrl: './form-names.css'
})
export class AdminFormNamesComponent implements OnInit {
    formNames: FormNamePredefined[] = [];
    newName: string = '';
    loading = false;
    error: string | null = null;

    constructor(private adminPokemonService: AdminPokemonService) { }

    ngOnInit() {
        this.loadFormNames();
    }

    loadFormNames() {
        this.loading = true;
        this.adminPokemonService.getFormNames().subscribe({
            next: (names) => {
                this.formNames = names;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Erreur lors du chargement des noms de formes';
                this.loading = false;
                console.error(err);
            }
        });
    }

    addFormName() {
        if (!this.newName.trim()) return;

        this.loading = true;
        this.adminPokemonService.createFormName(this.newName.trim()).subscribe({
            next: (newName) => {
                this.formNames.push(newName);
                this.formNames.sort((a, b) => a.name.localeCompare(b.name));
                this.newName = '';
                this.loading = false;
            },
            error: (err) => {
                if (err.status === 409) {
                    alert('Ce nom existe déjà');
                } else {
                    alert('Erreur lors de la création');
                }
                this.loading = false;
            }
        });
    }

    deleteFormName(id: number, name: string) {
        if (!confirm(`Voulez-vous vraiment supprimer le nom "${name}" ?`)) return;

        this.loading = true;
        this.adminPokemonService.deleteFormName(id).subscribe({
            next: () => {
                this.formNames = this.formNames.filter(n => n.id !== id);
                this.loading = false;
            },
            error: (err) => {
                alert('Erreur lors de la suppression');
                this.loading = false;
            }
        });
    }
}
