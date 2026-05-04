import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, updatePassword } from '@angular/fire/auth';

import { AdminUsersService } from '../../core/services/admin-users.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent {
  errorMessage = '';
  successMessage = '';
  submitting = false;

  constructor(
    private readonly auth: Auth,
    private readonly router: Router,
    private readonly adminUsersService: AdminUsersService
  ) {}

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMessage = '';
    this.successMessage = '';
    const form = event.target as HTMLFormElement;
    const password = (form.elements.namedItem('password') as HTMLInputElement | null)?.value ?? '';
    const confirm = (form.elements.namedItem('confirmPassword') as HTMLInputElement | null)?.value ?? '';

    if (password.trim().length < 8) {
      this.errorMessage = 'Password must be at least 8 characters.';
      return;
    }
    if (password !== confirm) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }
    if (!this.auth.currentUser) {
      this.errorMessage = 'You are not signed in.';
      return;
    }

    this.submitting = true;
    try {
      await updatePassword(this.auth.currentUser, password);
      await this.adminUsersService.clearOwnMustChangePassword();
      this.successMessage = 'Password updated.';
      await this.router.navigateByUrl('/editor');
    } catch {
      this.errorMessage = 'Could not update password. Sign in again and retry.';
    } finally {
      this.submitting = false;
    }
  }
}
