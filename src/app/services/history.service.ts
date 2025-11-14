import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EnvironmentService } from '../services/environment.service';
import { HistoryResponse } from '../shared/models/history.model';

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  private http = inject(HttpClient);
  private envService = inject(EnvironmentService);

  getHistory(page: number, size = 20): Observable<HistoryResponse> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http.get<HistoryResponse>(`${this.envService.environment.apiPath}/history`, { params });
  }

  deleteHistoryItem(id: number): Observable<any> {
    return this.http.delete(`${this.envService.environment.apiPath}/history/${id}`);
  }
}
