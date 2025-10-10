import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  OnDestroy,
  NgZone,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { map, startWith } from 'rxjs/operators';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PublishService } from '../../services/publish.service';
import { TagService } from '../../services/tag.service';
import { ImageCacheService } from '../../services/image-cache.service';
import { SOCIAL_PLATFORMS, X, BLUESKY, TUMBLR } from '../../shared/models/social-platforms.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    FlexLayoutModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatButtonModule,
    NgxDropzoneModule,
    MatSnackBarModule,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeComponent implements OnInit, OnDestroy {
  // --- Injeções ---
  private publishService = inject(PublishService);
  private tagService = inject(TagService);
  private imageCacheService = inject(ImageCacheService);
  private snackBar = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;
  announcer = inject(LiveAnnouncer);

  @ViewChild('postTextarea', { read: MatInput })
  postTextarea!: MatInput;

  // --- Propriedades do Formulário ---
  isExpanded = false;
  postTextCtrl = new FormControl('');
  tagCtrl = new FormControl('');
  tags: string[] = [];
  allTags: string[] = [];
  filteredTags$!: Observable<string[]>;
  uploadedFiles: File[] = [];
  separatorKeysCodes: number[] = [ENTER, COMMA];

  // --- Constantes e Lógica de UI ---
  platforms = SOCIAL_PLATFORMS;
  private hoverTimer: any;
  private valueChangesSub!: Subscription;
  private tagsSub!: Subscription;
  private readonly DRAFT_STORAGE_KEY = 'home_page_draft';

  onSelectFiles(event: { addedFiles: any }) {
    this.uploadedFiles.push(...event.addedFiles);
    this.imageCacheService.saveImages(this.uploadedFiles);
  }

  onRemoveFile(event: File) {
    this.uploadedFiles.splice(this.uploadedFiles.indexOf(event), 1);
    this.imageCacheService.saveImages(this.uploadedFiles);
  }

  constructor(private zone: NgZone) {
    this.filteredTags$ = this.tagCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) => (tag ? this._filter(tag) : this.allTags.slice())),
    );
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.tags.push(value);
    }
    event.chipInput!.clear();
    this.tagCtrl.setValue(null);
  }

  remove(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
      this.announcer.announce(`Removed ${tag}`);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.tags.push(event.option.viewValue);
    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allTags.filter((tag) => tag.toLowerCase().includes(filterValue));
  }

  getRemainingCharacters(platform: (typeof SOCIAL_PLATFORMS)[number]): number {
    const postText = this.postTextCtrl.value || '';
    const limit = platform.limits || 0;
    let tagsLength = 0;

    if (this.tags.length > 0) {
      switch (platform.name) {
        case X:
        case BLUESKY:
          const tagsAsHashtags = this.tags.map((tag) => `#${tag.replace(/ /g, '')}`).join(' ');
          tagsLength = tagsAsHashtags.length + (postText.length > 0 ? 1 : 0);
          break;
      }
    }

    return limit - postText.length - tagsLength;
  }

  onPanelMouseEnter(): void {
    this.hoverTimer = setTimeout(() => {
      this.zone.run(() => {
        this.isExpanded = true;
      });
    }, 2000);
  }

  onPanelMouseLeave(): void {
    clearTimeout(this.hoverTimer);
    this.isExpanded = false;
  }

  private loadStateFromCache(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedState = localStorage.getItem(this.DRAFT_STORAGE_KEY);
      if (savedState) {
        const state = JSON.parse(savedState);
        this.postTextCtrl.setValue(state.text || '');
        this.tags = state.tags || [];
      }
    }
  }

  private setupStateSaving(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.valueChangesSub = this.postTextCtrl.valueChanges
        .pipe(debounceTime(500))
        .subscribe(() => this.saveStateToCache());
    }
  }

  private saveStateToCache(): void {
    if (isPlatformBrowser(this.platformId)) {
      const state = {
        text: this.postTextCtrl.value,
        tags: this.tags,
      };
      localStorage.setItem(this.DRAFT_STORAGE_KEY, JSON.stringify(state));
    }
  }

  private clearCache(): void {
    // prettier-ignore
    if (isPlatformBrowser(this.platformId))
      localStorage.removeItem(this.DRAFT_STORAGE_KEY);
  }

  private async submitPost(type: 'draft' | 'publish'): Promise<void> {
    const imagesPayload = await this.formatImagesForApi();

    const payload = {
      platforms: this.platforms.map((p) => p.name),
      text: this.postTextCtrl.value || '',
      tags: this.tags,
      images: imagesPayload,
      platformOptions: {
        [TUMBLR]: {
          blogName: 'meu-blog-exemplo',
        },
      },
    };

    const request$ =
      type === 'draft' ? this.publishService.saveAsDraft(payload) : this.publishService.publishPost(payload);

    request$.subscribe({
      next: () => {
        this.tagService.addTags(payload.tags);
        const message = type === 'draft' ? 'Rascunho salvo!' : 'Publicado!';
        this.snackBar.open(message, 'OK', { duration: 3000 });
        this.onCancel();
      },
      error: (err) => {
        this.snackBar.open('Erro ao enviar. Tente novamente.', 'Fechar', { duration: 3000 });
        console.error(err);
      },
    });
  }

  private async formatImagesForApi(): Promise<{ base64: string }[]> {
    // prettier-ignore
    if (!isPlatformBrowser(this.platformId))
      return [];
    else {
      const dataUrls = await this.imageCacheService.filesToDataUrls(this.uploadedFiles);
      return dataUrls.map(dataUrl => ({ base64: dataUrl }));
    }
  }

  onCancel(): void {
    this.postTextCtrl.setValue('');
    this.uploadedFiles = [];
    this.clearCache();
    this.imageCacheService.clearCache();
    this.snackBar.open('Formulário limpo.', 'Fechar', { duration: 2000 });
  }

  onSaveAsDraft(): void {
    this.submitPost('draft');
  }

  onPublish(): void {
    try {
      this.validate();
      this.submitPost('publish');
    } catch (error) {
      console.warn('Publicação interrompida por falha na validação.', error);
    }
  }

  private validate(): void {
    const failingPlatform = this.platforms.find((platform) => this.getRemainingCharacters(platform) < 0);

    if (failingPlatform) {
      this.snackBar.open(
        `Limite de caracteres excedido para: ${failingPlatform.name}. Por favor, ajuste o texto.`,
        'Fechar',
        { duration: 4000 },
      );
      this.postTextarea.focus();
      throw new Error(`Validation failed: Character limit exceeded for ${failingPlatform.name}`);
    }
  }

  ngOnInit(): void {
    this.loadStateFromCache();
    this.setupStateSaving();

    this.tagsSub = this.tagService.getTags().subscribe((tagsFromService) => {
      this.allTags = tagsFromService;
    });

    this.imageCacheService.loadImages().then((files) => {
      this.uploadedFiles = files;
    });

    this.filteredTags$ = this.tagCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) => (tag ? this._filter(tag) : this.allTags.slice())),
    );
  }

  ngOnDestroy(): void {
    // prettier-ignore
    if (this.valueChangesSub)
      this.valueChangesSub.unsubscribe();

    // prettier-ignore
    if (this.tagsSub)
      this.tagsSub.unsubscribe();
  }
}
