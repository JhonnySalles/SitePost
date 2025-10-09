import { HttpClient } from '@angular/common/http';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private platformId = inject(PLATFORM_ID);

  private readonly TOKEN_KEY = 'auth_token';
  private readonly LAST_REFRESH_KEY = 'last_refresh_attempt';

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(environment.loginPath, credentials).pipe(tap((response) => this.saveTokens(response)));
  }

  saveTokens(response: any): void {
    if (isPlatformBrowser(this.platformId)) {
      // prettier-ignore
      if (response?.authorisation?.access_token)
        localStorage.setItem(this.TOKEN_KEY, JSON.stringify(response.authorisation));
    }
  }

  getAccessToken(): string | null {
    const authData = this.getAuthData();
    return authData ? authData.access_token : null;
  }

  isLoggedIn(): boolean {
    // prettier-ignore
    if (!isPlatformBrowser(this.platformId))
      return false;

    const authData = this.getAuthData();

    // prettier-ignore
    if (!authData || !authData.expires_in)
      return false;

    return new Date().getTime() < authData.expires_in * 1000;
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      this.router.navigate(['/login']);
    }
  }

  private getAuthData(): any {
    if (isPlatformBrowser(this.platformId)) {
      const authDataString = localStorage.getItem(this.TOKEN_KEY);
      // prettier-ignore
      if (!authDataString)
        return null;

      return JSON.parse(authDataString);
    }
    return null;
  }

  tryAutoRefreshToken(): void {
    // prettier-ignore
    if (!isPlatformBrowser(this.platformId))
      return;

    const today = new Date().toISOString().split('T')[0];
    const lastAttempt = localStorage.getItem(this.LAST_REFRESH_KEY);

    if (lastAttempt !== today) {
      const authData = this.getAuthData();

      if (authData?.refresh_token) {
        this.refreshToken(authData.refresh_token).subscribe({
          next: () => {
            localStorage.setItem(this.LAST_REFRESH_KEY, today);
            console.log('Token renovado com sucesso.');
          },
          error: () => {
            console.log('Falha ao renovar o token. Deslogando...');
            this.logout();
          },
        });
      }
    }
  }

  private refreshToken(refreshToken: string): Observable<any> {
    const payload = { refresh_token: refreshToken };

    return this.http.post(`${environment.loginPath}/refresh`, payload).pipe(
      tap((response) => this.saveTokens(response)),
      catchError((error) => {
        throw error;
      }),
    );
  }
}
