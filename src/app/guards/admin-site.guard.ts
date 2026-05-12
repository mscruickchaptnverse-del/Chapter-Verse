import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import {
  isAdminHostname,
  isPublicHostname,
  redirectToCanonicalAdminIfWwwSubdomain,
  siteHostSplitEnabled,
} from '../core/site-host';
import { environment } from '../../environments/environment';

function normalizedPath(url: string): string {
  const path = url.split('?')[0].split('#')[0] || '/';
  const trimmed = path.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/** Allows sign-in/editor/password only on admin hostnames; public host `/sign-in` stays on-site and goes home. */
export const adminSiteGuard: CanActivateFn = (_route, state) => {
  if (!siteHostSplitEnabled()) {
    return true;
  }
  if (redirectToCanonicalAdminIfWwwSubdomain(state.url)) {
    return false;
  }
  if (isAdminHostname()) {
    return true;
  }
  if (isPublicHostname()) {
    if (normalizedPath(state.url) === '/sign-in') {
      void inject(Router).navigate(['/'], { replaceUrl: true });
      return false;
    }
    const admin = environment.adminSiteOrigin?.replace(/\/$/, '');
    if (admin) {
      window.location.assign(admin + state.url);
      return false;
    }
    void inject(Router).navigate(['/']);
    return false;
  }
  const admin = environment.adminSiteOrigin?.replace(/\/$/, '');
  if (admin) {
    window.location.assign(admin + state.url);
    return false;
  }
  void inject(Router).navigate(['/']);
  return false;
};
