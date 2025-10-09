import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PublishService {
  private http = inject(HttpClient);

  saveAsDraft(postData: any): Observable<any> {
    console.log(postData);
    return this.http.post(`${environment.apiPath}/draft`, postData);
  }

  publishPost(postData: any): Observable<any> {
    return this.http.post(`${environment.apiPath}/publish`, postData);
  }
}
