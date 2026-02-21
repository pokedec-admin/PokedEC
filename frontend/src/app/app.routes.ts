import { Routes } from '@angular/router';
import { Profile } from './pages/profile/profile';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { Pokedex } from './pages/pokedex/pokedex';
import { PokemonDetail } from './pages/pokemon/detail';
import { Shiny } from './pages/shiny/shiny';
import { Trade } from './pages/trade/trade';
import { Lucky } from './pages/lucky/lucky';
import { XXL } from './pages/xxl/xxl';
import { XXS } from './pages/xxs/xxs';
import { GMax } from './pages/gmax/gmax';
import { Mega } from './pages/mega/mega';
import { Obscure } from './pages/obscure/obscure';
import { Purifie } from './pages/purifie/purifie';
import { Parfait } from './pages/parfait/parfait';
import { Wanted } from './pages/wanted/wanted';
import { Dynamax } from './pages/dynamax/dynamax';
import { Regional } from './pages/regional/regional';
import { Admin } from './pages/admin/admin';
import { Suggestion } from './pages/suggestion/suggestion';
import { Forms } from './pages/forms/forms';
import { authGuard } from './guards/auth.guard';

import { CreditsComponent } from './pages/credits/credits';

export const routes: Routes = [

    { path: 'login', component: Login },
    { path: 'signup', component: Signup },
    { path: 'pokedex', component: Pokedex, canActivate: [authGuard] },
    { path: 'wanted', component: Wanted, canActivate: [authGuard] },
    { path: 'pokedex/:id', component: PokemonDetail, canActivate: [authGuard] },
    { path: 'regional', loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent), data: { category: 'regional' }, canActivate: [authGuard] },
    { path: 'forms', loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent), data: { category: 'forms' }, canActivate: [authGuard] },
    { path: 'shiny', loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent), data: { category: 'shiny' }, canActivate: [authGuard] },
    { path: 'trade', component: Trade, canActivate: [authGuard] },
    { path: 'lucky', loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent), data: { category: 'lucky' }, canActivate: [authGuard] },
    { path: 'xxl', loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent), data: { category: 'xxl' }, canActivate: [authGuard] },
    { path: 'xxs', loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent), data: { category: 'xxs' }, canActivate: [authGuard] },
    { path: 'gmax', loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent), data: { category: 'gmax' }, canActivate: [authGuard] },
    { path: 'mega', loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent), data: { category: 'mega' }, canActivate: [authGuard] },
    { path: 'dynamax', loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent), data: { category: 'dynamax' }, canActivate: [authGuard] },
    { path: 'obscure', loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent), data: { category: 'obscure' }, canActivate: [authGuard] },
    { path: 'purifie', loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent), data: { category: 'purified' }, canActivate: [authGuard] },
    { path: 'parfait', loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent), data: { category: 'perfect' }, canActivate: [authGuard] },
    // New category tracking routes
    { path: 'tracking/pokedex', loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent), data: { category: 'pokedex' }, canActivate: [authGuard] },
    { path: 'tracking/normal', loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent), data: { category: 'normal' }, canActivate: [authGuard] },
    { path: 'tracking/legendary', loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent), data: { category: 'legendary' }, canActivate: [authGuard] },
    { path: 'tracking/mythical', loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent), data: { category: 'mythical' }, canActivate: [authGuard] },
    { path: 'tracking/ultra-beast', loadComponent: () => import('./pages/tracking/tracking').then(m => m.TrackingComponent), data: { category: 'ultra_beast' }, canActivate: [authGuard] },
    { path: 'home', component: Home },
    { path: 'profile', component: Profile, canActivate: [authGuard] },
    { path: 'suggestion', component: Suggestion, canActivate: [authGuard] },
    { path: 'admin', component: Admin, canActivate: [authGuard] },
    {
        path: 'admin/users',
        loadComponent: () => import('./pages/admin/users/users').then(m => m.AdminUsersComponent),
        canActivate: [authGuard]
    },
    {
        path: 'admin/suggestions',
        loadComponent: () => import('./pages/admin/suggestions/suggestions').then(m => m.AdminSuggestionsComponent),
        canActivate: [authGuard]
    },
    {
        path: 'admin/import',
        loadComponent: () => import('./pages/admin/import/import').then(m => m.AdminImportComponent),
        canActivate: [authGuard]
    },
    {
        path: 'admin/pokemon',
        loadComponent: () => import('./pages/admin/pokemon-list/pokemon-list').then(m => m.AdminPokemonListComponent),
        canActivate: [authGuard]
    },
    {
        path: 'admin/pokemon-categories',
        loadComponent: () => import('./pages/admin/pokemon-categories/pokemon-categories').then(m => m.PokemonCategoriesComponent),
        canActivate: [authGuard]
    },
    {
        path: 'admin/pokemon/:id/:form',
        loadComponent: () => import('./pages/admin/pokemon-detail/pokemon-detail').then(m => m.PokemonDetailComponent),
        canActivate: [authGuard]
    },
    {
        path: 'admin/pokemon/:id',
        loadComponent: () => import('./pages/admin/pokemon-detail/pokemon-detail').then(m => m.PokemonDetailComponent),
        canActivate: [authGuard]
    },
    {
        path: 'admin/schema-help',
        loadComponent: () => import('./pages/admin/schema-help/schema-help').then(m => m.SchemaHelpComponent),
        canActivate: [authGuard]
    },
    {
        path: 'admin/form-names',
        loadComponent: () => import('./pages/admin/form-names/form-names').then(m => m.AdminFormNamesComponent),
        canActivate: [authGuard]
    },
    { path: 'credits', component: CreditsComponent },
    { path: 'help', loadComponent: () => import('./pages/help/help').then(m => m.HelpComponent) },
    { path: 'reset-password', loadComponent: () => import('./pages/reset-password/reset-password').then(m => m.ResetPassword) },
    { path: '', redirectTo: '/home', pathMatch: 'full' }
];
