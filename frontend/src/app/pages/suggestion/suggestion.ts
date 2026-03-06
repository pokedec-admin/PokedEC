import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
    selector: 'app-suggestion',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './suggestion.html',
    styles: [`
    .suggestion-container {
        padding: 20px;
        max-width: 600px;
        margin: 0 auto;
    }
    h1 {
        color: #2c3e50;
        margin-bottom: 30px;
        text-align: center;
    }
    .form-card {
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .form-group {
        margin-bottom: 20px;
    }
    label {
        display: block;
        margin-bottom: 8px;
        font-weight: bold;
        color: #2c3e50;
    }
    select, textarea {
        width: 100%;
        padding: 12px;
        border: 2px solid #eee;
        border-radius: 8px;
        font-size: 1rem;
        box-sizing: border-box;
        font-family: inherit;
    }
    select:focus, textarea:focus {
        border-color: #3498db;
        outline: none;
    }
    textarea {
        min-height: 150px;
        resize: vertical;
    }
    .actions {
        display: flex;
        gap: 15px;
        margin-top: 30px;
    }
    button {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.3s;
    }
    .btn-submit {
        background-color: #27ae60;
        color: white;
    }
    .btn-submit:hover {
        background-color: #219150;
    }
    .btn-cancel {
        background-color: #95a5a6;
        color: white;
    }
    .btn-cancel:hover {
        background-color: #7f8c8d;
    }
    .error {
        color: #e74c3c;
        margin-bottom: 15px;
    }
    .success {
        color: #27ae60;
        margin-bottom: 15px;
        text-align: center;
        font-weight: bold;
    }
  `]
})
export class Suggestion {
    type: 'suggestion' | 'bug' = 'suggestion';
    content: string = '';
    email: string = '';
    errorMessage: string = '';
    successMessage: string = '';
    isSubmitting: boolean = false;
    isLoggedIn: boolean = false;

    constructor(private http: HttpClient, private router: Router) {
        this.isLoggedIn = !!localStorage.getItem('token');
    }

    onSubmit() {
        if (!this.isLoggedIn && !this.email.trim()) {
            this.errorMessage = 'Veuillez renseigner votre email pour que nous puissions vous répondre.';
            return;
        }

        this.isSubmitting = true;
        this.errorMessage = '';

        const token = localStorage.getItem('token');
        const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();

        const payload = {
            type: this.type,
            content: this.content,
            email: this.isLoggedIn ? null : this.email
        };

        this.http.post('/api/suggestions', payload, { headers })
            .subscribe({
                next: () => {
                    this.successMessage = 'Merci ! Votre retour a bien été enregistré.';
                    this.content = '';
                    setTimeout(() => this.router.navigate(['/profile']), 2000);
                },
                error: (err) => {
                    console.error(err);
                    this.errorMessage = 'Une erreur est survenue lors de l\'envoi.';
                    this.isSubmitting = false;
                }
            });
    }

    onCancel() {
        this.router.navigate(['/home']);
    }
}
