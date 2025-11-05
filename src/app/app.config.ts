import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom, ErrorHandler } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

import * as Sentry from '@sentry/angular';
import { Router } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { apiKeyInterceptor } from './interceptors/api-key.interceptor';
import { authInterceptor } from './interceptors/auth.interceptor';

import { FlexLayoutModule } from '@angular/flex-layout';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: true,
      }),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(withEventReplay()),
    importProvidersFrom(FlexLayoutModule),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([apiKeyInterceptor, authInterceptor]), withFetch()),
  ],
};
