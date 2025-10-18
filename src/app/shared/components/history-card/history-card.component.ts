import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HistoryImage, HistoryItem } from '../../../shared/models/history.model';
import { SOCIAL_PLATFORMS } from '../../../shared/models/social-platforms.model';

@Component({
  selector: 'app-history-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    FlexLayoutModule,
  ],
  providers: [DatePipe],
  templateUrl: './history-card.component.html',
  styleUrls: ['./history-card.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HistoryCardComponent {
  @Input({ required: true }) item!: HistoryItem;

  get statusClass(): string {
    return `status-${this.item.situacao.toLowerCase()}`;
  }

  getPlatformIcon(platformName: string): string {
    return SOCIAL_PLATFORMS.find((p) => p.name === platformName)?.icon || 'help-outline';
  }

  getUniquePlatforms(images: HistoryImage[]): string[] {
    const allPlatforms = images.flatMap((img) => img.platforms);
    return [...new Set(allPlatforms)];
  }
}
