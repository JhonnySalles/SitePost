import { Injectable, Renderer2, RendererFactory2, signal, effect, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private renderer: Renderer2;
  public isDarkTheme = signal<boolean>(false);

  private readonly THEME_KEY = 'app-theme';

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);

    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const isDark = this.isDarkTheme();
        localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');

        if (isDark) {
          this.renderer.removeClass(document.body, 'day-theme');
          this.renderer.addClass(document.body, 'dark-theme');
        } else {
          this.renderer.removeClass(document.body, 'dark-theme');
          this.renderer.addClass(document.body, 'day-theme');
        }
      }
    });
  }

  loadThemeOnStartup(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem(this.THEME_KEY);
      this.isDarkTheme.set(savedTheme === 'dark');
    }
  }

  toggleTheme() {
    this.isDarkTheme.update((currentValue) => !currentValue);
  }
}
