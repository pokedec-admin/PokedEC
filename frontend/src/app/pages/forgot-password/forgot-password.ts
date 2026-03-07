import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="forgot-container">
      <img src="/Logo_Pokedec.png" alt="Logo" class="logo">
      <h2>Mot de passe oublié</h2>
      <p>Entrez votre email pour recevoir un lien de réinitialisation.</p>

      <div *ngIf="!submitted">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" [(ngModel)]="email" placeholder="votre@email.com" class="form-control" />
        </div>
        <button (click)="onSubmit()" [disabled]="loading" class="btn-submit">
          {{ loading ? 'Envoi en cours...' : 'Envoyer le lien' }}
        </button>
      </div>

      <div *ngIf="submitted" class="success-message">
        <p>Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.</p>
        <p>Veuillez vérifier votre boîte de réception.</p>
      </div>

      <p class="error" *ngIf="error">{{ error }}</p>

      <div class="links">
        <a routerLink="/login">Retour à la connexion</a>
      </div>
    </div>
  `,
  styles: [`
    .forgot-container {
      max-width: 400px;
      margin: 80px auto;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 20px var(--shadow-color);
      background: var(--card-bg);
      text-align: center;
      border: 1px solid var(--border-color);
    }
    .logo {
      width: 180px;
      margin-bottom: 20px;
    }
    h2 {
      margin-bottom: 10px;
      color: var(--text-color);
    }
    p {
      color: var(--nav-text);
      margin-bottom: 25px;
    }
    .form-group {
      text-align: left;
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: var(--text-color);
    }
    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      box-sizing: border-box;
      background: var(--bg-color);
      color: var(--text-color);
    }
    .btn-submit {
      width: 100%;
      padding: 12px;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s;
    }
    .btn-submit:hover {
      background-color: #2980b9;
    }
    .btn-submit:disabled {
      background-color: #bdc3c7;
    }
    .error {
      color: #e74c3c;
      margin-top: 15px;
    }
    .success-message {
      background-color: rgba(39, 174, 96, 0.1);
      padding: 15px;
      border-radius: 6px;
      color: #27ae60;
      border: 1px solid rgba(39, 174, 96, 0.2);
    }
    .links {
      margin-top: 25px;
    }
    a {
      color: var(--primary-color);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  `]
})
export class ForgotPassword {
  email = '';
  loading = false;
  submitted = false;
  error = '';

  constructor(private authService: AuthService) {}

  onSubmit() {
    if (!this.email) {
      this.error = 'Veuillez entrer votre email.';
      return;
    }
    this.error = '';
    this.loading = true;

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.submitted = true;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || err.message || 'Une erreur est survenue.';
      }
    });
  }
}
