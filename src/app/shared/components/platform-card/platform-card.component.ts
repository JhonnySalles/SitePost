import { Component, Input, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';

import {
  AnyConfigs,
  SOCIAL_PLATFORMS,
  TumblrConfigs,
  TUMBLR,
  TumblrBlog,
} from '../../../shared/models/social-platforms.model';
import { ThemeService } from '../../../services/theme.service';
import { ConfigurationService } from '../../../services/configuration.service';

@Component({
  selector: 'app-platform-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    FlexLayoutModule,
    MatDividerModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './platform-card.component.html',
  styleUrls: ['./platform-card.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PlatformCardComponent implements OnInit {
  @Input({ required: true }) config!: AnyConfigs;

  themeService = inject(ThemeService);
  private configurationService = inject(ConfigurationService);

  platformDetails: (typeof SOCIAL_PLATFORMS)[number] | undefined;

  tumblrConfigs?: TumblrConfigs;
  selectedBlog?: TumblrBlog;

  get tumblrCredential(): TumblrConfigs | null {
    return this.isTumblr() ? (this.config as TumblrConfigs) : null;
  }

  ngOnInit(): void {
    this.platformDetails = SOCIAL_PLATFORMS.find((p) => p.name === this.config.platform);

    if (this.isTumblr()) {
      this.tumblrConfigs = this.config as TumblrConfigs;
      // prettier-ignore
      if (this.tumblrConfigs.blogs && this.tumblrConfigs.blogs.length > 0)
        this.selectedBlog = this.tumblrConfigs.blogs.find(blog => blog.selected);
    }
  }

  isTumblr(): boolean {
    return this.config.platform === TUMBLR;
  }

  onRefreshBlogs(): void {
    this.configurationService.refreshTumblrBlogs().subscribe();
  }

  onBlogSelectionChange(): void {
    if (this.isTumblr() && (this.config as TumblrConfigs).blogs) {
      (this.config as TumblrConfigs).blogs.forEach((blog) => {
        blog.selected = blog.name === this.selectedBlog?.name;
      });
    }
  }
}
