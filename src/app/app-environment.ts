import { InjectionToken } from '@angular/core';

export interface AppEnvironment {
  production: boolean;
  apiBaseUrl: string;
  apiPath: string;
  authPath: string;
  apiKey: string;
  sentryDsn: string;
  sentryEnvironment: string;
}

export const APP_ENVIRONMENT = new InjectionToken<AppEnvironment>('APP_ENVIRONMENT');
