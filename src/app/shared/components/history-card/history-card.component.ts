import { Component, Input, Output, EventEmitter, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HistoryItem } from '../../../shared/models/history.model';
import { SOCIAL_PLATFORMS } from '../../../shared/models/social-platforms.model';
import { HistoryService } from '../../../services/history.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PostEditorService } from '../../../services/post-editor.service';

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
  @Output() itemDeleted = new EventEmitter<number>();

  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  private historyService = inject(HistoryService);
  private postEditorService = inject(PostEditorService);

  get typeClass(): string {
    return `status-${this.item.tipo.toLowerCase()}`;
  }

  getPlatformIcon(platformName: string): string {
    return SOCIAL_PLATFORMS.find((p) => p.name === platformName)?.icon || 'help-outline';
  }

  onEdit(): void {
    this.postEditorService.setPostToEdit(this.item);
    this.router.navigate(['/home']);
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este item do histórico?')) {
      this.historyService.deleteHistoryItem(this.item.id).subscribe({
        next: () => {
          this.snackBar.open('Item excluído com sucesso!', 'OK', { duration: 3000 });
          this.itemDeleted.emit(this.item.id);
        },
        error: (err) => {
          this.snackBar.open('Falha ao excluir o item.', 'Fechar', { duration: 3000 });
          console.error(err);
        },
      });
    }
  }
}
