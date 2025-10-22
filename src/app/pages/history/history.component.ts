import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';

import { HistoryService } from '../../services/history.service';
import { HistoryItem } from '../../shared/models/history.model';
import { HistoryCardComponent } from '../../shared/components/history-card/history-card.component';

import type Masonry from 'masonry-layout';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, InfiniteScrollDirective, HistoryCardComponent],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gridContainer') gridContainer!: ElementRef;

  private platformId = inject(PLATFORM_ID);

  private masonry?: Masonry;

  items: HistoryItem[] = [];
  currentPage = 1;
  totalPages = 1;
  isLoading = false;

  constructor(private historyService: HistoryService) {}

  ngOnInit(): void {
    this.loadMore();
  }

  ngAfterViewInit(): void {
    this.initializeMasonry();
  }

  async initializeMasonry(): Promise<void> {
    if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined' && this.gridContainer) {
      const Masonry = (await import('masonry-layout')).default;
      this.masonry = new Masonry(this.gridContainer.nativeElement, {
        itemSelector: '.grid-item',
        gutter: 20,
        fitWidth: true,
      });
    }
  }

  loadMore(): void {
    // prettier-ignore
    if (this.isLoading || this.currentPage > this.totalPages)
      return;

    this.isLoading = true;
    this.historyService.getHistory(this.currentPage).subscribe((response) => {
      this.totalPages = Math.ceil(response.total / 10);

      this.items.push(...response.data);

      this.currentPage++;
      this.isLoading = false;

      setTimeout(() => {
        if (this.masonry) {
          this.masonry.reloadItems?.();
          this.masonry.layout?.();
        }
      }, 150);
    });
  }

  onScroll(): void {
    this.loadMore();
  }

  onItemDeleted(idToDelete: number): void {
    this.items = this.items.filter((item) => item.id !== idToDelete);
    setTimeout(() => this.masonry?.layout?.(), 50);
  }

  ngOnDestroy(): void {
    // prettier-ignore
    this.masonry?.destroy?.();
  }
}
