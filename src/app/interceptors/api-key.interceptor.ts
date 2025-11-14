import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EnvironmentService } from '../services/environment.service';

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const envService = inject(EnvironmentService);
  const apiKey = envService.environment.apiKey;
  const clonedReq = req.clone({
    headers: req.headers.set('X-API-KEY', apiKey),
  });
  return next(clonedReq);
};
