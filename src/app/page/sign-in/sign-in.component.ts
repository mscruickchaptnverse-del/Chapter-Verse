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
  ) {
    console.log('[SignIn] component ready', { hasAuth: !!this.auth });
  }

  onSubmitForm(event: Event): void {
    console.log('[SignIn] onSubmitForm (e.g. Enter in field)', { type: event.type });
    event.preventDefault();
    const form = (event.target as HTMLElement | null)?.closest('form');
    if (form) {
      void this.signIn(form);
    } else {
      console.warn('[SignIn] onSubmitForm: no form found from event.target');
    }
  }

  onSignInClick(form: HTMLFormElement): void {
    console.log('[SignIn] onSignInClick (button)');
    void this.signIn(form);
  }

  private async signIn(form: HTMLFormElement): Promise<void> {
    console.log('[SignIn] signIn() started');
    this.errorMessage = '';
    this.cdr.markForCheck();

    const rawEmail = (form.elements.namedItem('email') as HTMLInputElement | null)?.value ?? '';
    const rawPassword = (form.elements.namedItem('password') as HTMLInputElement | null)?.value ?? '';
    const address = rawEmail.trim();
    const secret = rawPassword;

    console.log('[SignIn] form values read', {
      emailLength: address.length,
      passwordLength: secret.length,
      emailPreview: address ? `${address.slice(0, 2)}…@${address.split('@')[1] ?? '?'}` : '(empty)'
    });

    if (!address || !secret) {
      console.warn('[SignIn] validation failed: missing email or password');
      this.errorMessage = 'Enter your email and password.';
      this.cdr.detectChanges();
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();
    console.log('[SignIn] calling signInWithEmailAndPassword…');

    try {
      await this.zone.run(() =>
        signInWithEmailAndPassword(this.auth, address, secret)
      );
      console.log('[SignIn] Firebase sign-in succeeded');
      const returnUrl = this.safeReturnUrl(
        this.route.snapshot.queryParamMap.get('returnUrl')
      );
      console.log('[SignIn] navigating', { returnUrl, rawReturnUrl: this.route.snapshot.queryParamMap.get('returnUrl') });
      await this.router.navigateByUrl(returnUrl);
      console.log('[SignIn] navigateByUrl resolved');
    } catch (err: unknown) {
      console.error('[SignIn] Firebase sign-in error', err);
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
      console.log('[SignIn] user-facing errorMessage set', { code, errorMessage: this.errorMessage });
    } finally {
      this.submitting = false;
      this.cdr.detectChanges();
      console.log('[SignIn] finally: submitting=', this.submitting);
    }
  }

  private safeReturnUrl(raw: string | null): string {
    if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
      return '/editor';
    }
    return raw;
  }
}
