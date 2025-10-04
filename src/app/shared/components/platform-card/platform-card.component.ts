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
  AnyCredentials,
  SOCIAL_PLATFORMS,
  TumblrCredentials,
  TUMBLR,
} from '../../../shared/models/social-platforms.model';
import { ThemeService } from '../../../services/theme.service';

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
  @Input({ required: true }) credential!: AnyCredentials;

  themeService = inject(ThemeService);

  platformDetails: (typeof SOCIAL_PLATFORMS)[number] | undefined;

  tumblrCredential?: TumblrCredentials;

  ngOnInit(): void {
    this.platformDetails = SOCIAL_PLATFORMS.find((p) => p.name === this.credential.platform);

    // prettier-ignore
    if (this.isTumblr())
      this.tumblrCredential = this.credential as TumblrCredentials;
  }

  isTumblr(): boolean {
    return this.credential.platform === TUMBLR;
  }
}
