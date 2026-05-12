import { environment } from '../../environments/environment';

/** True when prod is configured to split traffic by hostname (see `environment.adminHostnames` / `publicHostnames`). */
export function siteHostSplitEnabled(): boolean {
  return (
    environment.adminHostnames.length > 0 ||
    environment.publicHostnames.length > 0
  );
}

export function currentHostname(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.hostname.toLowerCase();
}

export function isAdminHostname(host: string = currentHostname()): boolean {
  if (!siteHostSplitEnabled()) {
    return false;
  }
  return environment.adminHostnames.some((h) => h.toLowerCase() === host);
}

export function isPublicHostname(host: string = currentHostname()): boolean {
  if (!siteHostSplitEnabled()) {
    return false;
  }
  if (environment.publicHostnames.length > 0) {
    return environment.publicHostnames.some((h) => h.toLowerCase() === host);
  }
  return !isAdminHostname(host);
}
