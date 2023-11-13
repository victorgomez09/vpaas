import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'sign-in',
    loadComponent: () =>
      import('./views/sign-in/sign-in.component').then(
        (mod) => mod.SignInComponent
      ),
  },
  {
    path: 'sign-up',
    loadComponent: () =>
      import('./views/sign-up/sign-up.component').then(
        (mod) => mod.SignUpComponent
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./views/dashboard/dashboard.component').then(
        (mod) => mod.DashboardComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'applications',
    loadComponent: () =>
      import('./views/application/application.component').then(
        (mod) => mod.ApplicationComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'applications/new',
    loadComponent: () =>
      import('./views/application/new/new.component').then(
        (mod) => mod.NewComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'services',
    loadComponent: () =>
      import('./views/service/service.component').then(
        (mod) => mod.ServiceComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'services/new',
    loadComponent: () =>
      import('./views/service/new/new.component').then(
        (mod) => mod.NewComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'services/:id',
    loadComponent: () =>
      import('./views/service/id/id.component').then((mod) => mod.IdComponent),
    canActivate: [authGuard],
  },
  {
    path: 'databases',
    loadComponent: () =>
      import('./views/database/database.component').then(
        (mod) => mod.DatabaseComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'databases/new',
    loadComponent: () =>
      import('./views/database/new/new.component').then(
        (mod) => mod.NewComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'databases/:id',
    loadComponent: () =>
      import('./views/database/id/id.component').then((mod) => mod.IdComponent),
    canActivate: [authGuard],
  },
  {
    path: 'destinations',
    loadComponent: () =>
      import('./views/destination/destination.component').then(
        (mod) => mod.DestinationComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'destinations/:id',
    loadComponent: () =>
      import('./views/destination/id/id.component').then(
        (mod) => mod.IdComponent
      ),
    canActivate: [authGuard],
  },
];
