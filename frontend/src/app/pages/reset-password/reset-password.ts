import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reset-container">
      <h2>Réinitialiser le mot de passe</h2>
      <p>Entrez votre nouveau mot de passe ci‑dessous.</p>
      <input type="password" [(ngModel)]="password" placeholder="Nouveau mot de passe" />
      <input type="password" [(ngModel)]="passwordConfirm" placeholder="Confirmer le mot de passe" />
      <button (click)="onSubmit()" [disabled]="loading">{{ loading ? 'En cours...' : 'Changer le mot de passe' }}</button>
      <p class="error" *ngIf="error">{{ error }}</p>
      <p class="success" *ngIf="success">{{ success }}</p>
    </div>
  `
})
export class ResetPassword {
  password = '';
  passwordConfirm = '';
  loading = false;
  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router) {}

  async onSubmit() {
    this.error = '';
    this.success = '';
    if (!this.password || this.password.length < 6) {
      this.error = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }
    if (this.password !== this.passwordConfirm) {
      this.error = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.loading = true;
    try {
      await this.auth.updatePassword(this.password);
      this.success = 'Mot de passe changé avec succès. Vous êtes maintenant connecté.';
      // navigate to home after short delay
      setTimeout(() => this.router.navigate(['/home']), 1400);
    } catch (err: any) {
      console.error('Reset failed', err);
      this.error = err?.message || 'Échec de la réinitialisation';
    } finally {
      this.loading = false;
    }
  }
}
