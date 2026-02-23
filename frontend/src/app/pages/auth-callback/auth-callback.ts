import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="loader"></div>
      <p>Finalisation de la connexion...</p>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      text-align: center;
    }
    .loader {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class AuthCallback implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // AuthService constructor already handles redirection via processAuthRedirectFromUrl
    // but here we can ensure we redirect back to a proper page after session is ready
    this.checkSession();
  }

  async checkSession() {
    // Wait a bit to let the listener or processAuthRedirectFromUrl do its job
    setTimeout(() => {
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['/profile']);
      } else {
        // If not authenticated after 3 seconds, go to login
        setTimeout(() => {
          if (this.authService.isAuthenticated()) {
            this.router.navigate(['/profile']);
          } else {
             this.router.navigate(['/login']);
          }
        }, 2000);
      }
    }, 1000);
  }
}
