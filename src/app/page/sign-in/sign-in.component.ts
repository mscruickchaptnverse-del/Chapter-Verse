import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html'
})
export class SignInComponent {
  errorMessage = '';
  submitting = false;

  constructor(
    private readonly auth: Auth,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef
  ) {}

  onSubmitForm(event: Event): void {
    event.preventDefault();
    const form = (event.target as HTMLElement | null)?.closest('form');
    if (form) {
      void this.signIn(form);
    }
  }

  onSignInClick(form: HTMLFormElement): void {
    void this.signIn(form);
  }

  private async signIn(form: HTMLFormElement): Promise<void> {
    this.errorMessage = '';
    this.cdr.markForCheck();

    const rawEmail = (form.elements.namedItem('email') as HTMLInputElement | null)?.value ?? '';
    const rawPassword = (form.elements.namedItem('password') as HTMLInputElement | null)?.value ?? '';
    const address = rawEmail.trim();
    const secret = rawPassword;

    if (!address || !secret) {
      this.errorMessage = 'Enter your email and password.';
      this.cdr.detectChanges();
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    try {
      await this.zone.run(() =>
        signInWithEmailAndPassword(this.auth, address, secret)
      );
      const signedInUser = this.auth.currentUser;
      const tokenResult = signedInUser ? await signedInUser.getIdTokenResult(true) : null;
      const mustChangePassword = tokenResult?.claims['mustChangePassword'] === true;
      const returnUrl = this.safeReturnUrl(
        this.route.snapshot.queryParamMap.get('returnUrl')
      );
      if (mustChangePassword) {
        await this.router.navigateByUrl('/change-password');
        return;
      }
      await this.router.navigateByUrl(returnUrl);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as { code?: unknown }).code === 'string'
          ? (err as { code: string }).code
          : '';
      if (code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        this.errorMessage = 'Invalid email or password.';
      } else if (code === 'auth/too-many-requests') {
        this.errorMessage = 'Too many attempts. Try again later.';
      } else if (code === 'auth/invalid-email') {
        this.errorMessage = 'Enter a valid email address.';
      } else if (
        code === 'auth/network-request-failed' ||
        code === 'auth/internal-error'
      ) {
        this.errorMessage =
          'Network error. Check your connection and Firebase configuration.';
      } else if (code === 'auth/api-key-not-valid') {
        this.errorMessage = 'Firebase API key is not valid for this project.';
      } else {
        this.errorMessage =
          code !== '' ? `Sign-in failed (${code}).` : 'Could not sign in. Please try again.';
      }
    } finally {
      this.submitting = false;
      this.cdr.detectChanges();
    }
  }

  private safeReturnUrl(raw: string | null): string {
    if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
      return '/editor';
    }
    return raw;
  }
}
