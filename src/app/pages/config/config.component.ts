import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ThemeService } from '../../services/theme.service';
import { FormsModule } from '@angular/forms';

import { AnyCredentials, X, TUMBLR, THREADS, BLUESKY } from '../../shared/models/social-platforms.model';
import { PlatformCardComponent } from '../../shared/components/platform-card/platform-card.component';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatCardModule,
    MatDividerModule,
    FlexLayoutModule,
    PlatformCardComponent,
  ],
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
})
export class ConfigComponent {
  themeService = inject(ThemeService);

  credentials: AnyCredentials[] = [
    {
      platform: X,
      active: true,
    },
    {
      platform: THREADS,
      active: true,
    },
    {
      platform: BLUESKY,
      active: true,
    },
    {
      platform: TUMBLR,
      active: false,
      blogName: 'meu-blog-principal',
      blogs: [
        { name: 'meu-blog-principal', title: 'Blog Principal' },
        { name: 'blog-secundario', title: 'Fotos de Gatos' },
      ],
    },
  ];

  onThemeChange(isDark: boolean): void {
    this.themeService.isDarkTheme.set(isDark);
  }
}
