import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  currentEnvName = 'Défaut';
  currentApiUrl = environment.apiUrl;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/home']);
      return;
    }

    const override = localStorage.getItem('pokedec_env_url');
    if (override) {
      this.currentApiUrl = override;
      if (override.includes('localhost')) this.currentEnvName = 'DEV';
      else if (override.includes('192.168')) this.currentEnvName = 'BLUE/GREEN';
      else this.currentEnvName = 'CLOUD';
    } else {
      if (this.currentApiUrl.includes('localhost')) this.currentEnvName = 'DEV';
      else if (this.currentApiUrl.includes('render')) this.currentEnvName = 'CLOUD';
      else this.currentEnvName = 'BLUE/GREEN';
    }
  }

  setEnvironment(name: string, url: string) {
    if (url === environment.apiUrl) {
      localStorage.removeItem('pokedec_env_url');
    } else {
      localStorage.setItem('pokedec_env_url', url);
    }
    window.location.reload();
  }
}
