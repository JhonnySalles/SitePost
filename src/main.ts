import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';
import { environment } from './environments/environment';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { defineCustomElements, setNonce } from 'ionicons/loader';

Sentry.init({
  dsn: environment.sentryDsn,
  environment: environment.sentryEnvironment,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
});

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));

defineCustomElements(window, {
  resourcesUrl: 'assets/ionicons/',
});

if (typeof window !== 'undefined') {
  const nonce = (window as any).cspNonce;
  if (nonce) {
    setNonce(nonce);
  }
}
