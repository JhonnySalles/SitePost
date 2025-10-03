import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule, MatButtonModule, MatIconModule, MatToolbarModule, FlexLayoutModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'sitepost';
  themeService = inject(ThemeService);

  constructor(private router: Router) {
    this.themeService.loadThemeOnStartup();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
