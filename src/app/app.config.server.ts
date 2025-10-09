import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRouting } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { importProvidersFrom } from '@angular/core';
import { FlexLayoutServerModule } from '@angular/flex-layout/server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRouting(serverRoutes),
    importProvidersFrom(FlexLayoutServerModule),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
