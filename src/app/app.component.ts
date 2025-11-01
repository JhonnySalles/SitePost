import { Component } from '@angular/core';
import { NavigationEnd, RouterOutlet, Router, RouterModule } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { AuthService } from './services/auth.service';
import { TagService } from './services/tag.service';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    FlexLayoutModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  isFullScreenRoute = false;
  title = 'sitepost';

  constructor(
    private router: Router,
    private themeService: ThemeService,
    public authService: AuthService,
    private tagService: TagService,
    private notificationService: NotificationService,
  ) {
    this.themeService.loadThemeOnStartup();
    this.authService.tryAutoRefreshToken();

    // prettier-ignore
    if (this.authService.isLoggedIn())
      this.tagService.fetchTags();

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event: any) => {
      const fullScreenRoutes = ['/login', '/not-found'];
      this.isFullScreenRoute = fullScreenRoutes.includes(event.urlAfterRedirects);
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout();
  }
}
