import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PlatformType } from '../shared/models/social-platforms.model';
import { PublishPayload, SinglePublishPayload } from '../shared/models/publish.model';

@Injectable({
  providedIn: 'root',
})
export class PublishService {
  private http = inject(HttpClient);

  saveAsDraft(postData: PublishPayload): Observable<any> {
    return this.http.post(`${environment.apiPath}/draft`, postData);
  }

  publishPost(postData: PublishPayload): Observable<any> {
    return this.http.post(`${environment.apiPath}/publish`, postData);
  }

  publishToSinglePlatform(platformName: PlatformType, postData: SinglePublishPayload): Observable<any> {
    return this.http.post(`${environment.apiPath}/publish/${platformName}`, postData);
  }
}
