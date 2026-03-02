import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormsModule],
  template: `
    <div class="signup-container">
      <img src="/Logo_Pokedec.png" alt="Logo" class="signup-logo">
      <h2 *ngIf="!successMessage">Créer un compte</h2>
      <h2 *ngIf="successMessage">Vérifiez vos emails</h2>
        
      <form *ngIf="!successMessage" [formGroup]="signupForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="trainer_name">Nom de dresseur Pokémon GO *</label>
          <input id="trainer_name" type="text" formControlName="trainer_name" placeholder="Votre nom de dresseur">
        </div>

        <div class="form-group">
          <label for="team">Équipe Pokémon GO *</label>
          <select id="team" formControlName="team">
            <option value="">Choisissez votre équipe</option>
            <option value="Mystic">🔵 Mystic (Sagesse)</option>
            <option value="Valor">🔴 Valor (Bravoure)</option>
            <option value="Instinct">🟡 Instinct (Intuition)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="email">Email *</label>
          <input id="email" type="email" formControlName="email" placeholder="votre@email.com">
        </div>
        
        <div class="form-group">
          <label for="password">Mot de passe *</label>
          <input id="password" type="password" formControlName="password" placeholder="Minimum 6 caractères">
        </div>

        <div class="form-group">
          <label for="phone">Téléphone (WhatsApp)</label>
          <input id="phone" type="tel" formControlName="phone" placeholder="+33 6 12 34 56 78">
        </div>
        
        <div class="form-group">
          <label for="trade_preference">Comment s'organiser pour faire un échange ? *</label>
          <select id="trade_preference" formControlName="trade_preference">
            <option value="">Choisissez votre préférence</option>
            <option value="Campfire">🔥 Via Campfire</option>
            <option value="WhatsApp">💬 Via WhatsApp</option>
            <option value="Event">📅 Lors du prochain événement</option>
          </select>
        </div>

        <button type="submit" [disabled]="signupForm.invalid || loading">
          {{ loading ? 'Inscription en cours...' : "S'inscrire" }}
        </button>
      </form>

      <p *ngIf="!successMessage">Vous avez déjà un compte ? <a routerLink="/login">Se connecter</a></p>
      
      <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <p class="success" *ngIf="successMessage">{{ successMessage }}</p>
    </div>
  `,
  styles: [`
    .signup-container {
      max-width: 500px;
      margin: 50px auto;
      padding: 30px;
      border: 1px solid #ddd;
      border-radius: 12px;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .signup-logo {
      display: block;
      width: 200px;
      margin: 0 auto 20px auto;
    }
    h2 {
      color: #2c3e50;
      margin-bottom: 25px;
      text-align: center;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #34495e;
    }
    input, select {
      width: 100%;
      padding: 10px;
      box-sizing: border-box;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }
    select {
      cursor: pointer;
      background-color: white;
    }
    input:focus, select:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
    }
    .help-text {
      display: block;
      margin-top: 5px;
      font-size: 0.85rem;
      color: #7f8c8d;
      font-style: italic;
    }
    button {
      width: 100%;
      padding: 12px;
      background-color: #27ae60;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      margin-top: 10px;
      font-size: 16px;
      font-weight: 600;
      transition: background-color 0.3s;
    }
    button:hover:not(:disabled) {
      background-color: #229954;
    }
    button:disabled {
      background-color: #95a5a6;
      cursor: not-allowed;
    }
    p {
      text-align: center;
      margin-top: 20px;
      color: #7f8c8d;
    }
    a {
      color: #3498db;
      text-decoration: none;
      font-weight: 600;
    }
    a:hover {
      text-decoration: underline;
    }
    .error {
      color: #e74c3c;
      background: #fadbd8;
      padding: 10px;
      border-radius: 6px;
      font-weight: 500;
    }
    .success {
      color: #27ae60;
      background: #d5f4e6;
      padding: 10px;
      border-radius: 6px;
      font-weight: 500;
    }

    /* Verification Screen Styles */
    .verification-container {
      text-align: center;
    }

    .email-display {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .email-display p {
      margin: 5px 0;
      color: #7f8c8d;
    }

    .email-value {
      font-weight: bold;
      color: #2c3e50;
      font-size: 1.1em;
    }

    .btn-edit {
      background: none;
      border: none;
      color: #3498db;
      cursor: pointer;
      font-size: 0.9em;
      margin-top: 10px;
      padding: 5px 10px;
    }

    .btn-edit:hover {
      text-decoration: underline;
    }

    .timer-display {
      background: #e8f5e9;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 1.3em;
      font-weight: bold;
      color: #27ae60;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .timer-display.expired {
      background: #ffebee;
      color: #e74c3c;
    }

    .code-input-group {
      margin-bottom: 20px;
    }

    .code-input-group label {
      display: block;
      margin-bottom: 10px;
      font-weight: 600;
      color: #34495e;
    }

    .code-input-group input {
      width: 200px;
      max-width: 100%;
      padding: 20px;
      font-size: 2em;
      text-align: center;
      letter-spacing: 20px;
      font-family: 'Courier New', monospace;
      border: 2px solid #3498db;
      border-radius: 8px;
      margin: 0 auto;
    }

    .code-input-group input:focus {
      outline: none;
      border-color: #2980b9;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
    }

    .btn-verify {
      width: 100%;
      padding: 15px;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
      transition: background-color 0.3s;
      margin-bottom: 20px;
    }

    .btn-verify:hover:not(:disabled) {
      background-color: #2980b9;
    }

    .btn-verify:disabled {
      background-color: #95a5a6;
      cursor: not-allowed;
    }

    .resend-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ecf0f1;
    }

    .resend-section p {
      color: #7f8c8d;
      font-size: 0.95em;
    }

    .btn-resend {
      background: none;
      border: 2px solid #3498db;
      color: #3498db;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-resend:hover:not(:disabled) {
      background: #3498db;
      color: white;
    }

    .btn-resend:disabled {
      border-color: #95a5a6;
      color: #95a5a6;
      cursor: not-allowed;
    }
  `]
})
export class Signup {
  signupForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;
  verificationStep: 'form' | 'verify' = 'form';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      trainer_name: ['', Validators.required],
      team: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: [''],
      trade_preference: ['', Validators.required],
      campfire_name: [''],
      whatsapp_group: ['']
    });
  }

  onSubmit() {
    if (this.signupForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.authService.signup(this.signupForm.value).subscribe({
        next: (res) => {
          this.loading = false;
          this.successMessage = 'Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.';
          // Optional: redirect to login after a few seconds
          setTimeout(() => this.router.navigate(['/login']), 3000);
        },
        error: (err) => {
          this.loading = false;
          console.error('[Signup] Error:', err);
          this.errorMessage = err.message || 'Erreur lors de l\'inscription';
        }
      });
    }
  }
}
