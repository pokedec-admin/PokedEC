import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-container" *ngIf="isLoading" [class.overlay]="overlay">
      <div class="spinner-content">
        <div class="spinner"></div>
        <p class="message" *ngIf="message">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      width: 100%;
    }

    .spinner-container.overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      padding: 0;
    }

    .spinner-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      background: var(--bg-card, #ffffff);
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid #f3f3f3;
      border-top: 5px solid #ff0000;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .message {
      font-weight: 600;
      color: var(--text-primary, #333);
      margin: 0;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    :host-context(.dark-theme) .spinner-content {
      background: #1a1a1a;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }

    :host-context(.dark-theme) .message {
      color: #eee;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() isLoading = false;
  @Input() overlay = false;
  @Input() message = 'Chargement...';
}
