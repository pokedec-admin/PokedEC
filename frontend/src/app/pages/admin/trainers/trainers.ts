import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../../services/auth.service';
import { RouterLink } from '@angular/router';

interface EditableUser extends User {
    editing?: boolean;
    newPassword?: string;
    is_active?: boolean;
}

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './users.html',
    styleUrls: ['../admin.css'] // Reuse existing styles
})
export class AdminTrainersComponent implements OnInit {
    users: EditableUser[] = [];
    originalUsers: Map<number | string, EditableUser> = new Map();
    errorMessage = '';
    successMessage = '';

    // New User Form
    newUser = {
        email: '',
        password: '',
        trainer_name: '',
        team: '',
        is_admin: false,
        is_active: true
    };
    showCreateUserForm = false;

    constructor(
        private authService: AuthService,
        private http: HttpClient
    ) { }

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.authService.getAllUsers().subscribe({
            next: (response) => {
                this.users = response.users;
                this.errorMessage = '';
            },
            error: (err) => {
                console.error('Failed to load users', err);
                this.errorMessage = 'Failed to load users. Please try again.';
            }
        });
    }

    startEdit(user: EditableUser) {
        this.originalUsers.set(user.id, { ...user });
        user.editing = true;
    }

    cancelEdit(user: EditableUser) {
        const original = this.originalUsers.get(user.id);
        if (original) {
            Object.assign(user, original);
            this.originalUsers.delete(user.id);
        }
        user.editing = false;
    }

    saveUser(user: EditableUser) {
        const updateData: any = {
            email: user.email,
            trainer_name: user.trainer_name,
            team: user.team,
            phone: user.phone,
            email_verified: user.email_verified
        };

        if (user.newPassword) {
            updateData.password = user.newPassword;
        }

        this.authService.updateUser(user.id, updateData).subscribe({
            next: (response) => {
                user.editing = false;
                user.newPassword = '';
                this.originalUsers.delete(user.id);
                this.successMessage = 'User updated successfully!';
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: (err) => {
                console.error('Failed to update user', err);
                this.errorMessage = 'Failed to update user. Please try again.';
                setTimeout(() => this.errorMessage = '', 3000);
            }
        });
    }

    toggleAdminStatus(user: EditableUser) {
        const newStatus = !user.is_admin;
        this.authService.toggleAdmin(user.id, newStatus).subscribe({
            next: (response) => {
                user.is_admin = newStatus;
                this.successMessage = `User ${newStatus ? 'promoted to' : 'removed from'} admin!`;
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: (err) => {
                console.error('Failed to toggle admin status', err);
                this.errorMessage = 'Failed to update admin status. Please try again.';
                setTimeout(() => this.errorMessage = '', 3000);
            }
        });
    }

    confirmDelete(user: EditableUser) {
        if (confirm(`Are you sure you want to delete user "${user.trainer_name}" (${user.email})? This action cannot be undone.`)) {
            this.deleteUser(user);
        }
    }

    deleteUser(user: EditableUser) {
        this.authService.deleteUser(user.id).subscribe({
            next: () => {
                this.users = this.users.filter(u => u.id !== user.id);
                this.successMessage = 'User deleted successfully!';
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: (err) => {
                console.error('Failed to delete user', err);
                this.errorMessage = 'Failed to delete user. Please try again.';
                setTimeout(() => this.errorMessage = '', 3000);
            }
        });
    }

    toggleActiveStatus(user: EditableUser) {
        if (!confirm(`Voulez-vous vraiment ${user.is_active !== false ? 'désactiver' : 'activer'} cet utilisateur ?`)) return;

        const statusToSend = user.is_active === false ? true : false;

        this.http.put(`/api/admin/trainers/${user.id}/active`, { is_active: statusToSend }).subscribe({
            next: () => {
                user.is_active = statusToSend;
                this.successMessage = `Utilisateur ${statusToSend ? 'activé' : 'désactivé'} avec succès`;
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: (err) => this.errorMessage = 'Erreur lors de la mise à jour du statut actif'
        });
    }

    createUser() {
        if (!this.newUser.email || !this.newUser.password || !this.newUser.trainer_name) {
            this.errorMessage = 'Veuillez remplir les champs obligatoires (Email, Mot de passe, Nom)';
            return;
        }

        this.http.post<any>('/api/admin/trainers', this.newUser).subscribe({
            next: (res) => {
                this.users.unshift({ ...res.user, editing: false });
                this.successMessage = 'Utilisateur créé avec succès';
                this.showCreateUserForm = false;
                this.newUser = { email: '', password: '', trainer_name: '', team: '', is_admin: false, is_active: true };
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: (err) => this.errorMessage = err.error?.error || 'Erreur lors de la création de l\'utilisateur'
        });
    }
}
