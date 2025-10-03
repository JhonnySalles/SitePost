import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { ConfigComponent } from './pages/config/config.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'config', component: ConfigComponent },

  { path: '', redirectTo: '/config', pathMatch: 'full' },
  { path: '**', redirectTo: '/config' },
];
