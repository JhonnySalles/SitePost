import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, Observable } from 'rxjs';
import { PostUpdate } from '../shared/models/webhook.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private platformId = inject(PLATFORM_ID);
  private socket!: WebSocket;
  private updates$ = new Subject<PostUpdate>();

  constructor() {
    this.connect();
  }

  private connect(): void {
    if (isPlatformBrowser(this.platformId)) {
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = window.location.host;
      this.socket = new WebSocket(`${proto}://${host}`);

      this.socket.onmessage = (event) => {
        const update: PostUpdate = JSON.parse(event.data);
        this.updates$.next(update);
      };

      this.socket.onopen = () => console.log('Conectado ao WebSocket.');
      this.socket.onclose = () => {
        console.log('Desconectado do WebSocket. Tentando reconectar em 5s...');
        setTimeout(() => this.connect(), 5000);
      };
    }
  }

  getUpdates(): Observable<PostUpdate> {
    return this.updates$.asObservable();
  }
}
