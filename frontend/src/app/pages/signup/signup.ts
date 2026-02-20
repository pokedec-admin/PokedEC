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
      <img src="/Logo_Pokefec_Complet.png" alt="Logo" class="signup-logo">
      <h2>{{ verificationStep === 'form' ? 'Créer un compte' : 'Vérification Email' }}</h2>
      
      <!-- Step 1: Registration Form -->
      <form *ngIf="verificationStep === 'form'" [formGroup]="signupForm" (ngSubmit)="onSubmit()">
        
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
          <small class="help-text">Vous recevrez un code de vérification à cette adresse</small>
        </div>
        
        <div class="form-group">
          <label for="password">Mot de passe *</label>
          <input id="password" type="password" formControlName="password" placeholder="Minimum 6 caractères">
        </div>

        <div class="form-group">
          <label for="phone">Téléphone (WhatsApp)</label>
          <input id="phone" type="tel" formControlName="phone" placeholder="+33 6 12 34 56 78">
          <small class="help-text">Optionnel - Pour être contacté via WhatsApp</small>
        </div>

        <div class="form-group">
          <label for="campfire_name">Nom Campfire</label>
          <input id="campfire_name" type="text" formControlName="campfire_name" placeholder="Votre nom/pseudonyme sur Campfire">
          <small class="help-text">Optionnel - Votre identifiant dans la communauté Campfire</small>
        </div>

        <div class="form-group">
          <label for="whatsapp_group">Groupe WhatsApp</label>
          <input id="whatsapp_group" type="text" formControlName="whatsapp_group" placeholder="Nom de votre groupe/communauté WhatsApp">
          <small class="help-text">Optionnel - Nom de votre groupe/communauté WhatsApp</small>
        </div>

        <button type="submit" [disabled]="signupForm.invalid">S'inscrire</button>
      </form>

      <!-- Step 2: Email Verification -->
      <div *ngIf="verificationStep === 'verify'" class="verification-container">
        <div class="email-display">
          <p>Code envoyé à :</p>
          <p class="email-value">{{ registeredEmail }}</p>
          <button type="button" class="btn-edit" (click)="editEmail()">✏️ Modifier l'email</button>
        </div>

        <div class="timer-display" [class.expired]="isTimerExpired()">
          <span class="timer-icon">⏱️</span>
          <span class="timer-text">{{ getTimerDisplay() }}</span>
        </div>

        <div class="code-input-group">
          <label for="code">Entrez le code à 4 chiffres</label>
          <input 
            type="text" 
            id="code" 
            [(ngModel)]="verificationCode" 
            (input)="onCodeInput()"
            maxlength="4" 
            placeholder="0000"
            pattern="[0-9]*"
            inputmode="numeric"
            autocomplete="one-time-code"
            autofocus>
          <small class="help-text">Vérifiez votre boîte mail et votre dossier spam</small>
        </div>

        <button 
          type="button" 
          class="btn-verify" 
          (click)="verifyCode()" 
          [disabled]="verificationCode.length !== 4 || verifyingCode || isTimerExpired()">
          {{ verifyingCode ? 'Vérification...' : 'Vérifier et créer le compte' }}
        </button>

        <div class="resend-section">
          <p>Vous n'avez pas reçu le code ?</p>
          <button 
            type="button" 
            class="btn-resend" 
            (click)="resendCode()" 
            [disabled]="resendingCode">
            {{ resendingCode ? 'Envoi en cours...' : 'Renvoyer le code' }}
          </button>
        </div>
      </div>

      <p *ngIf="verificationStep === 'form'">Vous avez déjà un compte ? <a routerLink="/login">Se connecter</a></p>
      
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

  // Email verification state
  verificationStep: 'form' | 'verify' = 'form';
  verificationCode: string = '';
  registeredEmail: string = '';
  resendingCode: boolean = false;
  verifyingCode: boolean = false;
  timeRemaining: number = 300; // 5 minutes in seconds
  timerInterval: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.signupForm = this.fb.group({
      trainer_name: ['', Validators.required],
      team: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: [''],
      campfire_name: [''],
      whatsapp_group: ['']
    });
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  // Step 1: Request verification code
  onSubmit() {
    if (this.signupForm.valid) {
      this.errorMessage = '';
      const formData = this.signupForm.value;

      this.http.post<any>('/api/auth/request-verification', formData).subscribe({
        next: (res) => {
          this.registeredEmail = formData.email;
          this.verificationStep = 'verify';
          this.startTimer();
          this.successMessage = 'Code de vérification envoyé à votre email';
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Erreur lors de l\'envoi du code';
        }
      });
    }
  }

  // Step 2: Verify code and create account
  verifyCode() {
    if (!this.verificationCode || this.verificationCode.length !== 4) {
      this.errorMessage = 'Veuillez entrer un code à 4 chiffres';
      return;
    }

    this.verifyingCode = true;
    this.errorMessage = '';

    const verificationData = {
      ...this.signupForm.value,
      code: this.verificationCode
    };

    this.http.post<any>('/api/auth/verify-code', verificationData).subscribe({
      next: (res) => {
        this.verifyingCode = false;
        // Store token and user data
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));

        this.successMessage = 'Compte créé avec succès !';
        this.stopTimer();

        // Redirect to home
        setTimeout(() => this.router.navigate(['/']), 1500);
      },
      error: (err) => {
        this.verifyingCode = false;
        this.errorMessage = err.error?.error || 'Code de vérification invalide';
      }
    });
  }

  // Resend verification code
  resendCode() {
    this.resendingCode = true;
    this.errorMessage = '';

    this.http.post<any>('/api/auth/resend-verification', { email: this.registeredEmail }).subscribe({
      next: (res) => {
        this.resendingCode = false;
        this.successMessage = 'Nouveau code envoyé !';
        this.verificationCode = '';
        this.resetTimer();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.resendingCode = false;
        this.errorMessage = err.error?.error || 'Erreur lors du renvoi du code';
      }
    });
  }

  // Edit email (go back to form)
  editEmail() {
    this.verificationStep = 'form';
    this.verificationCode = '';
    this.stopTimer();
  }

  // Timer management
  startTimer() {
    this.timeRemaining = 300; // 5 minutes
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.stopTimer();
      }
    }, 1000);
  }

  resetTimer() {
    this.stopTimer();
    this.startTimer();
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  getTimerDisplay(): string {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  isTimerExpired(): boolean {
    return this.timeRemaining <= 0;
  }

  // Auto-submit when 4 digits entered
  onCodeInput() {
    if (this.verificationCode.length === 4) {
      setTimeout(() => this.verifyCode(), 300);
    }
  }
}
