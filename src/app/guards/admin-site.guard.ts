import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPublicHostname, siteHostSplitEnabled } from '../core/site-host';
import { environment } from '../../environments/environment';

/** Allows sign-in/editor/password only on the admin host; public host is redirected to the admin URL. */
export const adminSiteGuard: CanActivateFn = (_route, state) => {
  if (!siteHostSplitEnabled()) {
    return true;
  }
  if (!isPublicHostname()) {
    return true;
  }
  const admin = environment.adminSiteOrigin?.replace(/\/$/, '');
  if (admin) {
    window.location.assign(admin + state.url);
    return false;
  }
  void inject(Router).navigate(['/']);
  return false;
};
