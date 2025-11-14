import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { EnvironmentService } from '../services/environment.service';

@Injectable({
  providedIn: 'root',
})
export class TagService {
  private envService = inject(EnvironmentService);
  private http = inject(HttpClient);

  private tags$ = new BehaviorSubject<string[]>([]);
  private hasFetched = false;

  getTags(): Observable<string[]> {
    return this.tags$.asObservable();
  }

  fetchTags(): void {
    // prettier-ignore
    if (this.hasFetched)
      return;

    this.http
      .get<string[]>(`${this.envService.environment.apiPath}/tags`)
      .pipe(take(1))
      .subscribe({
        next: (fetchedTags) => {
          this.tags$.next(fetchedTags);
          this.hasFetched = true;
        },
        error: (err) => {
          console.error('Falha ao buscar as tags da API', err);
          this.hasFetched = true;
        },
      });
  }

  addTags(newTags: string[]): void {
    const currentTags = this.tags$.getValue();
    const uniqueNewTags = newTags.filter((tag) => !currentTags.includes(tag));

    // prettier-ignore
    if (uniqueNewTags.length > 0)
      this.tags$.next([...currentTags, ...uniqueNewTags]);
  }
}
