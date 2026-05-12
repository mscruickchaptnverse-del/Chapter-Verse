import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { siteHostSplitEnabled } from '../../core/site-host';

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.component.html'
})
export class SiteFooterComponent {
  constructor(private readonly router: Router) {}

  private currentPath(): string {
    return this.router.url.split('?')[0].split('#')[0];
  }

  /** Hide redundant footer link on the contact page. */
  get hideContactUsLink(): boolean {
    const path = this.currentPath();
    return path === '/contact' || path.startsWith('/contact/');
  }

  /** Hide Admin in the public marketing footer (home + contact). */
  get hideAdminLink(): boolean {
    const path = this.currentPath();
    if (path === '/contact' || path.startsWith('/contact/')) return true;
    return path === '/' || path === '';
  }

  get adminSignInIsExternal(): boolean {
    return siteHostSplitEnabled() && !!environment.adminSiteOrigin?.trim();
  }

  get adminSignInHref(): string {
    const base = environment.adminSiteOrigin?.replace(/\/$/, '');
    if (siteHostSplitEnabled() && base) {
      return `${base}/sign-in`;
    }
    return '/sign-in';
  }
}

