import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

/** Redirects to `/sign-in` with `returnUrl` when not signed in. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  return user(auth).pipe(
    take(1),
    map((u): boolean | UrlTree => {
      if (u) {
        console.log('[AuthGuard] allowed', { path: state.url, uid: u.uid });
        return true;
      }
      const tree = router.createUrlTree(['/sign-in'], {
        queryParams: { returnUrl: state.url }
      });
      console.log('[AuthGuard] redirect to sign-in', {
        attempted: state.url,
        returnUrlQuery: state.url
      });
      return tree;
    })
  );
};
