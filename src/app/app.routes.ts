import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { ConfigComponent } from './pages/config/config.component';
import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.guard';
import { HistoryComponent } from './pages/history/history.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'configuracoes', component: ConfigComponent, canActivate: [authGuard] },
  { path: 'historico', component: HistoryComponent, canActivate: [authGuard] },

  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', component: NotFoundComponent },
];
