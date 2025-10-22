import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HistoryItem } from '../shared/models/history.model';

@Injectable({
  providedIn: 'root',
})
export class PostEditorService {
  private postToEdit$ = new BehaviorSubject<HistoryItem | null>(null);

  setPostToEdit(item: HistoryItem): void {
    this.postToEdit$.next(item);
  }

  getPostToEdit(): Observable<HistoryItem | null> {
    return this.postToEdit$.asObservable();
  }

  clearPostToEdit(): void {
    this.postToEdit$.next(null);
  }
}
