import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

declare global {
  interface Window {
    google: any;
  }
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormsModule],
  template: `
    <div class="login-container">
      <img src="/Logo_Pokedec.png" alt="Logo" class="login-logo">
      <h2>Login to PokedEC</h2>
      
      <div id="google-btn"></div>
      
      <div class="divider">OR</div>

      <form *ngIf="!show2FA" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="trainer_name">Email / Nom de dresseur</label>
          <input id="trainer_name" type="text" formControlName="trainer_name" placeholder="votre@email.com">
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" type="password" formControlName="password" placeholder="Enter your password">
        </div>
        <button type="submit" [disabled]="loginForm.invalid">Login</button>
      </form>

      <div *ngIf="show2FA" class="two-fa-section">
        <h3>Two-Factor Authentication</h3>
        <p>Entrez le code de votre application d'authentification.</p>
        <div class="form-group">
          <label for="otp">Code de sécurité</label>
          <input id="otp" type="text" [(ngModel)]="otpCode" placeholder="000000" maxlength="6">
        </div>
        <button (click)="onVerify2FA()" [disabled]="!otpCode">Vérifier</button>
        <button class="btn-link" (click)="show2FA = false">Retour</button>
      </div>

      <p *ngIf="!show2FA">Don't have an account? <a routerLink="/signup">Sign up here</a></p>
      <p *ngIf="!show2FA"><a routerLink="/forgot-password">Mot de passe oublié ?</a></p>
      <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
    </div>
  `,
  styles: [`
    .login-container {
      max-width: 400px;
      margin: 50px auto;
      padding: 20px;
      border: 1px solid var(--border-color);
      background-color: var(--card-bg);
      border-radius: 8px;
      text-align: center;
      color: var(--text-color);
    }
    .login-logo {
      width: 200px;
      margin-bottom: 20px;
    }
    .form-group {
      margin-bottom: 15px;
      text-align: left;
    }
    label {
      display: block;
      margin-bottom: 5px;
      color: var(--text-color);
    }
    input {
      width: 100%;
      padding: 8px;
      box-sizing: border-box;
      background-color: var(--bg-color);
      color: var(--text-color);
      border: 1px solid var(--border-color);
      border-radius: 4px;
    }
    button {
      width: 100%;
      padding: 10px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:disabled {
      background-color: #ccc;
    }
    .divider {
      margin: 20px 0;
      font-weight: bold;
    }
    .error {
      color: red;
      margin-top: 10px;
    }
    #google-btn {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }
    .btn-link {
      background: none;
      border: none;
      color: #007bff;
      text-decoration: underline;
      cursor: pointer;
      margin-top: 10px;
      font-size: 0.9em;
    }
    .two-fa-section h3 {
      margin-top: 0;
    }
  `]
})
export class Login {
  loginForm: FormGroup;
  errorMessage: string = '';
  show2FA: boolean = false;
  preAuthToken: string = '';
  otpCode: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      trainer_name: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Initialize Google Sign-In
    // Note: In a real app, you need to load the Google Script in index.html
    // and provide a valid Client ID.
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID', // Placeholder
        callback: (response: any) => this.handleGoogleLogin(response)
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'outline', size: 'large' }
      );
    }
  }

  handleGoogleLogin(response: any) {
    // Decode token to get user info (simplified)
    const payload = this.decodeJwt(response.credential);

    this.authService.googleLogin(response.credential, {
      email: payload.email,
      name: payload.name,
      id: payload.sub
    }).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => this.errorMessage = 'Google Login failed'
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.errorMessage = '';
      this.authService.login(this.loginForm.value).subscribe({
        next: (res) => {
          if (res.require_2fa) {
            this.show2FA = true;
            this.preAuthToken = res.preAuthToken;
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (err) => {
          console.error('[Login] Error:', err);
          this.errorMessage = err.error?.error || err.message || 'Login failed. Please check your credentials.';
        }
      });
    }
  }

  onVerify2FA() {
    if (this.otpCode) {
      this.errorMessage = '';
      this.authService.verify2FA(this.preAuthToken, this.otpCode).subscribe({
        next: () => this.router.navigate(['/']),
        error: (err) => {
          this.errorMessage = err.error?.error || 'Code invalide.';
        }
      });
    }
  }

  private decodeJwt(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return {};
    }
  }
}
