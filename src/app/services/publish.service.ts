import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EnvironmentService } from '../services/environment.service';
import { PlatformType } from '../shared/models/social-platforms.model';
import { PublishPayload, SinglePublishPayload } from '../shared/models/publish.model';

@Injectable({
  providedIn: 'root',
})
export class PublishService {
  private envService = inject(EnvironmentService);
  private http = inject(HttpClient);

  saveAsDraft(postData: PublishPayload): Observable<any> {
    return this.http.post(`${this.envService.environment.apiPath}/draft`, postData);
  }

  publishPost(postData: PublishPayload): Observable<any> {
    return this.http.post(`${this.envService.environment.apiPath}/publish`, postData);
  }

  publishToSinglePlatform(platformName: PlatformType, postData: SinglePublishPayload): Observable<any> {
    return this.http.post(`${this.envService.environment.apiPath}/publish/${platformName}`, postData);
  }
}
