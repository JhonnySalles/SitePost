import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { apiKeyInterceptor } from './interceptors/api-key.interceptor';
import { authInterceptor } from './interceptors/auth.interceptor';

import { FlexLayoutModule } from '@angular/flex-layout';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    importProvidersFrom(FlexLayoutModule),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([apiKeyInterceptor, authInterceptor]), withFetch()),
  ],
};
