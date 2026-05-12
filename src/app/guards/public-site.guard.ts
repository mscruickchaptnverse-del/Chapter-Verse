import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isAdminHostname, siteHostSplitEnabled } from '../core/site-host';
import { environment } from '../../environments/environment';

/** Allows home/contact only on the public marketing host; admin host is sent to the public site or sign-in. */
export const publicSiteGuard: CanActivateFn = (_route, state) => {
  if (!siteHostSplitEnabled()) {
    return true;
  }
  if (!isAdminHostname()) {
    return true;
  }
  const router = inject(Router);
  const path = state.url.split('?')[0] || '/';
  if (path === '/' || path === '') {
    void router.navigate(['/sign-in'], { replaceUrl: true });
    return false;
  }
  const pub = environment.publicSiteOrigin?.replace(/\/$/, '');
  if (pub) {
    window.location.assign(pub + path);
    return false;
  }
  void router.navigate(['/sign-in'], { replaceUrl: true });
  return false;
};
