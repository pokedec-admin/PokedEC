import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FailoverService } from '../../services/failover.service';

@Component({
    selector: 'app-failover-status',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="failover-status-widget">
      <div class="status-header">
        <h3>🔄 État du Système</h3>
        <span class="status-badge" [class.backup]="isUsingBackup">
          {{ isUsingBackup ? '☁️ Backup (Supabase)' : '🏠 Primaire (NAS)' }}
        </span>
      </div>
      
      <div class="status-details">
        <p *ngIf="!isUsingBackup" class="status-message success">
          ✅ Le système fonctionne normalement sur le serveur principal.
        </p>
        <p *ngIf="isUsingBackup" class="status-message warning">
          ⚠️ Le système utilise le serveur de secours. Le NAS principal est peut-être indisponible.
        </p>
      </div>

      <div class="actions" *ngIf="isUsingBackup">
        <button class="btn-primary" (click)="switchToPrimary()">
          🔙 Revenir au serveur principal
        </button>
        <p class="hint">Assurez-vous que le NAS est accessible avant de basculer.</p>
      </div>

      <div class="actions" *ngIf="!isUsingBackup">
        <button class="btn-secondary" (click)="testBackup()">
          🧪 Tester le serveur de secours
        </button>
      </div>
    </div>
  `,
    styles: [`
    .failover-status-widget {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px var(--shadow-color);
      margin-bottom: 20px;
      border: 1px solid var(--border-color);
    }

    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .status-header h3 {
      margin: 0;
      color: var(--text-color);
      font-size: 1.2rem;
    }

    .status-badge {
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      background: #27ae60;
      color: white;
    }

    .status-badge.backup {
      background: #f39c12;
    }

    .status-details {
      margin: 15px 0;
    }

    .status-message {
      padding: 12px;
      border-radius: 8px;
      margin: 0;
    }

    .status-message.success {
      background: rgba(39, 174, 96, 0.1);
      color: #27ae60;
      border: 1px solid rgba(39, 174, 96, 0.2);
    }

    .status-message.warning {
      background: rgba(243, 156, 18, 0.1);
      color: #f39c12;
      border: 1px solid rgba(243, 156, 18, 0.2);
    }

    .actions {
      margin-top: 15px;
    }

    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .btn-primary:hover {
      background: #2980b9;
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: var(--nav-text);
      color: white;
      opacity: 0.8;
    }

    .btn-secondary:hover {
      opacity: 1;
    }

    .hint {
      margin-top: 8px;
      font-size: 12px;
      color: var(--nav-text);
      font-style: italic;
    }
  `]
})
export class FailoverStatusComponent implements OnInit {
    isUsingBackup = false;

    constructor(public failoverService: FailoverService) { }

    ngOnInit() {
        this.failoverService.useBackup$.subscribe(useBackup => {
            this.isUsingBackup = useBackup;
        });
    }

    switchToPrimary() {
        if (confirm('Êtes-vous sûr que le serveur principal (NAS) est accessible ?')) {
            this.failoverService.switchToPrimary();
            window.location.reload(); // Recharger pour appliquer le changement
        }
    }

    testBackup() {
        this.failoverService.switchToBackup();
        alert('Basculement vers le serveur de secours effectué. Rechargez la page pour voir l\'effet.');
    }
}
