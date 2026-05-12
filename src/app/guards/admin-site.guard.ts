import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import {
  isAdminHostname,
  isPublicHostname,
  redirectToCanonicalAdminIfWwwSubdomain,
  siteHostSplitEnabled,
} from '../core/site-host';
import { environment } from '../../environments/environment';

/** Allows sign-in/editor/password only on admin hostnames; other hosts are sent to the canonical admin origin. */
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
