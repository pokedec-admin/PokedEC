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
      <img src="/Logo_Pokefec_Complet.png" alt="Logo" class="logo">
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
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      background: white;
      text-align: center;
    }
    .logo {
      width: 180px;
      margin-bottom: 20px;
    }
    h2 {
      margin-bottom: 10px;
      color: #2c3e50;
    }
    p {
      color: #7f8c8d;
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
    }
    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-sizing: border-box;
    }
    .btn-submit {
      width: 100%;
      padding: 12px;
      background-color: #3498db;
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
      background-color: #d5f4e6;
      padding: 15px;
      border-radius: 6px;
      color: #27ae60;
    }
    .links {
      margin-top: 25px;
    }
    a {
      color: #3498db;
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
