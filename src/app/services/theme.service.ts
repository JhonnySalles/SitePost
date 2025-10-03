import { Injectable, Renderer2, RendererFactory2, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private renderer: Renderer2;
  public isDarkTheme = signal<boolean>(false);

  private readonly THEME_KEY = 'app-theme';

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);

    effect(() => {
      const isDark = this.isDarkTheme();
      localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');

      if (isDark) {
        this.renderer.removeClass(document.body, 'day-theme');
        this.renderer.addClass(document.body, 'dark-theme');
      } else {
        this.renderer.removeClass(document.body, 'dark-theme');
        this.renderer.addClass(document.body, 'day-theme');
      }
    });
  }

  loadThemeOnStartup(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    this.isDarkTheme.set(savedTheme === 'dark');
  }

  toggleTheme() {
    this.isDarkTheme.update((currentValue) => !currentValue);
  }
}
