import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { AppEnvironment } from '../app-environment';

@Injectable({
  providedIn: 'root',
})
export class EnvironmentService {
  private readonly env: AppEnvironment;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // prettier-ignore
    if (isPlatformBrowser(this.platformId))
      this.env = (window as any).__APP_ENV__;
    else
      this.env = (process.env as any) as AppEnvironment;
  }

  public get environment(): AppEnvironment {
    return this.env;
  }
}
