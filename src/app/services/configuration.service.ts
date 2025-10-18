import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConfiguracaoPlataformaDTO, TumblrBlogDTO } from '../shared/models/configuracao-plataforma.dto';
import { AnyConfigs, Configs, TumblrConfigs, TUMBLR, TumblrBlog } from '../shared/models/social-platforms.model';

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private readonly CONFIG_STORAGE_KEY = 'platform_configurations';

  private configs$ = new BehaviorSubject<AnyConfigs[] | null>(null);

  constructor() {
    this.loadFromStorage();
  }

  getConfigurations(): Observable<AnyConfigs[] | null> {
    return this.configs$.asObservable();
  }

  fetchConfigurations(): Observable<AnyConfigs[]> {
    return this.http.get<ConfiguracaoPlataformaDTO[]>(`${environment.apiPath}/configuration/platforms`).pipe(
      map((configsDto) => this.mapDtoToConfigs(configsDto)),
      tap((credentials) => {
        this.updateStorageAndSubject(credentials);
      }),
    );
  }

  saveConfigurations(configsToSave: AnyConfigs[]): Observable<any> {
    const payload = this.mapConfigsToDtoForUpdate(configsToSave);
    return this.http.put(`${environment.apiPath}/configuration/platforms`, payload).pipe(
      tap(() => {
        this.updateStorageAndSubject(configsToSave);
      }),
    );
  }

  refreshTumblrBlogs(): Observable<TumblrBlog[]> {
    return this.http.get<TumblrBlog[]>(`${environment.apiPath}/platform/tumblr/blogs`).pipe(
      tap((newBlogs) => {
        const currentConfigs = this.configs$.getValue();
        if (currentConfigs) {
          const updatedConfigs = currentConfigs.map((cred) => {
            // prettier-ignore
            if (cred.platform === TUMBLR)
              (cred as TumblrConfigs).blogs = newBlogs;

            return cred;
          });
          this.configs$.next(updatedConfigs);
        }
      }),
    );
  }

  private mapDtoToConfigs(dtos: ConfiguracaoPlataformaDTO[]): AnyConfigs[] {
    return dtos.map((dto) => {
      if (dto.nome.toLowerCase() === TUMBLR && dto.blogs) {
        const tumblrCred: TumblrConfigs = {
          id: dto.id,
          platform: TUMBLR,
          active: dto.ativo,
          blogs: dto.blogs.map((b) => ({ name: b.nome, title: b.titulo, selected: b.selecionado })),
          blogName: dto.blogs.find((b) => b.selecionado)?.nome || '',
        };
        return tumblrCred;
      } else {
        const cred: Configs = {
          id: dto.id,
          platform: dto.nome.toLowerCase() as AnyConfigs['platform'],
          active: dto.ativo,
        };
        return cred;
      }
    });
  }

  private mapConfigsToDtoForUpdate(configs: AnyConfigs[]): any[] {
    return configs.map((cred) => {
      let blogsPayload: TumblrBlogDTO[] | undefined = undefined;

      if (cred.platform === TUMBLR) {
        const tumblrCred = cred as TumblrConfigs;
        blogsPayload = tumblrCred.blogs.map((b) => ({
          nome: b.name,
          titulo: b.title,
          selecionado: b.name === tumblrCred.blogName,
        }));
      }

      return {
        id: cred.id,
        ativo: cred.active,
        blogs: blogsPayload,
      };
    });
  }

  private loadFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const storedCreds = localStorage.getItem(this.CONFIG_STORAGE_KEY);
      // prettier-ignore
      if (storedCreds)
        this.configs$.next(JSON.parse(storedCreds));
    }
  }

  private updateStorageAndSubject(configs: AnyConfigs[]): void {
    this.configs$.next(configs);
    // prettier-ignore
    if (isPlatformBrowser(this.platformId))
      localStorage.setItem(this.CONFIG_STORAGE_KEY, JSON.stringify(configs));
  }
}
