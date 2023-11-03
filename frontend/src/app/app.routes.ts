import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'sign-in',
        loadComponent: () => import('./views/sign-in/sign-in.component').then(mod => mod.SignInComponent)
    },
    {
        path: 'sign-up',
        loadComponent: () => import('./views/sign-up/sign-up.component').then(mod => mod.SignUpComponent)
    },
    {
        path: '',
        loadComponent: () => import('./views/dashboard/dashboard.component').then(mod => mod.DashboardComponent),
        canActivate: [authGuard]
    },
    {
        path: 'destinations',
        loadComponent: () => import('./views/destination/destination.component').then(mod => mod.DestinationComponent),
        canActivate: [authGuard]
    },
    {
        path: 'destinations/:id',
        loadComponent: () => import('./views/destination/id/id.component').then(mod => mod.IdComponent),
        canActivate: [authGuard]
    }
];
