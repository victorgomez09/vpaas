import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { catchError, map, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { userStore } from '../stores/user.store';

export const authGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  if (!sessionStorage.getItem(environment.accessToken)) {
    router.navigate(["/sign-in"], {
      queryParams: { loggedOut: true, origUrl: state.url }
    });

    return of(false);
  }

  return userService.getMe().pipe(
    map(data => {
      userStore.setUser(data);

      return true;
    }),
    catchError(() => {
      router.navigate(["/sign-in"], {
        queryParams: { loggedOut: true, origUrl: state.url }
      });

      return of(false);
    })
  )

  // return userService.getMe().pipe(
  //   map(loggedIn => loggedIn ? true : router.createUrlTree([router.parseUrl("sign-in")], {
  //     queryParams: { loggedOut: true, origUrl: state.url }
  //   })),
  //   catchError((err) => {
  //     router.navigate(["/sign-in"], {
  //       queryParams: { loggedOut: true, origUrl: state.url }
  //     });
  //     return of(false);
  //   })
  // )
};
