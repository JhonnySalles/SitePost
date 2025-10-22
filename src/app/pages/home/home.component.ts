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
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
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
import { ConfigurationService } from '../../services/configuration.service';
import { AnyConfigs, TumblrConfigs } from '../../shared/models/social-platforms.model';
import { SOCIAL_PLATFORMS, TWITTER, BLUESKY, TUMBLR, PlatformType } from '../../shared/models/social-platforms.model';
import { DRAFT, POST, PostType, PublishPayload, SinglePublishPayload } from '../../shared/models/publish.model';
import { PostEditorService } from '../../services/post-editor.service';
import { HistoryImage, HistoryItem } from '../../shared/models/history.model';
import { take } from 'rxjs';

export interface PlatformImage {
  file: File;
  platforms: PlatformType[];
}

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
    DragDropModule,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeComponent implements OnInit, OnDestroy {
  // --- Injeções ---
  private publishService = inject(PublishService);
  private postEditorService = inject(PostEditorService);
  private tagService = inject(TagService);
  private imageCacheService = inject(ImageCacheService);
  private configurationService = inject(ConfigurationService);
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
  uploadedFiles: PlatformImage[] = [];
  separatorKeysCodes: number[] = [ENTER, COMMA];

  // --- Constantes e Lógica de UI ---
  platforms = SOCIAL_PLATFORMS;
  platformConfigs: AnyConfigs[] = [];

  private editingPostId: number | null = null;
  private hoverTimer: any;
  private valueChangesSub!: Subscription;
  private tagsSub!: Subscription;
  private readonly DRAFT_STORAGE_KEY = 'home_page_draft';
  private longPressTimer: any;
  private readonly LONG_PRESS_DURATION_MS = 800;

  onSelectFiles(event: { addedFiles: any }) {
    const newImages: PlatformImage[] = event.addedFiles.map((file: any) => ({
      file: file,
      platforms: [],
    }));
    this.uploadedFiles.push(...newImages);
    this.recalculatePlatformAssignments();
    this.imageCacheService.saveImages(this.uploadedFiles);
  }

  onRemoveFile(fileToRemove: File) {
    this.uploadedFiles = this.uploadedFiles.filter((img) => img.file !== fileToRemove);
    this.recalculatePlatformAssignments();
    this.imageCacheService.saveImages(this.uploadedFiles);
  }

  private recalculatePlatformAssignments(): void {
    const activeConfigs = this.platformConfigs.filter((c) => c.active);
    const limitedPlatforms = [TWITTER, BLUESKY];

    const activeLimited = activeConfigs
      .filter((c) => limitedPlatforms.includes(c.platform as typeof TWITTER | typeof BLUESKY))
      .map((c) => c.platform);

    const activeUnlimited = activeConfigs
      .filter((c) => !limitedPlatforms.includes(c.platform as typeof TWITTER | typeof BLUESKY))
      .map((c) => c.platform);

    this.uploadedFiles.forEach((image, index) => {
      let platformsForThisImage: PlatformType[] = [...activeUnlimited];

      // pretty-ignore
      if (index < 4) platformsForThisImage.push(...activeLimited);

      image.platforms = [...new Set(platformsForThisImage)];
    });
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
        case TWITTER:
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

  onImageDrop(event: CdkDragDrop<PlatformImage[]>): void {
    moveItemInArray(this.uploadedFiles, event.previousIndex, event.currentIndex);
    this.recalculatePlatformAssignments();
    this.imageCacheService.saveImages(this.uploadedFiles);
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

  private loadPostForEditing(): void {
    this.postEditorService
      .getPostToEdit()
      .pipe(take(1))
      .subscribe(async (itemToEdit) => {
        if (itemToEdit) {
          this.postTextCtrl.setValue(itemToEdit.text);
          this.tags = [...itemToEdit.tags];
          this.editingPostId = itemToEdit.id;
          this.uploadedFiles = await this.urlsToPlatformImages(itemToEdit.images);
          this.postEditorService.clearPostToEdit();
        }
      });
  }

  private async urlsToPlatformImages(images: HistoryImage[]): Promise<PlatformImage[]> {
    const promises = images.map(async (img) => {
      const response = await fetch(img.url);
      const blob = await response.blob();
      const file = new File([blob], 'history-image.jpg', { type: blob.type });
      return {
        file,
        platforms: img.plataformas || [],
      };
    });
    return Promise.all(promises);
  }

  private async submitPost(type: PostType): Promise<void> {
    const payload = await this.buildMultiPlatformPayload();

    const request$ =
      type === DRAFT ? this.publishService.saveAsDraft(payload) : this.publishService.publishPost(payload);

    request$.subscribe({
      next: () => {
        this.tagService.addTags(payload.tags);
        const message = type === DRAFT ? 'Rascunho salvo!' : 'Publicado!';
        this.snackBar.open(message, 'OK', { duration: 3000 });
        this.onCancel();
      },
      error: (err) => {
        this.snackBar.open('Erro ao enviar. Tente novamente.', 'Fechar', { duration: 3000 });
        console.error(err);
      },
    });
  }

  private async formatImagesForApi(filterByPlatform: PlatformType): Promise<{ base64: string }[]>;
  private async formatImagesForApi(): Promise<{ base64: string; platforms: PlatformType[] }[]>;

  private async formatImagesForApi(
    filterByPlatform?: PlatformType,
  ): Promise<{ base64: string; platforms?: PlatformType[] }[]> {
    // prettier-ignore
    if (!isPlatformBrowser(this.platformId) || this.uploadedFiles.length === 0)
      return [];

    let imagesToProcess = this.uploadedFiles;

    // prettier-ignore
    if (filterByPlatform)
      imagesToProcess = this.uploadedFiles.filter(image =>
        image.platforms.includes(filterByPlatform)
      );

    const imagePromises = imagesToProcess.map(async (image) => {
      const dataUrl = await this.fileToDataUrl(image.file);

      // prettier-ignore
      if (filterByPlatform)
        return { base64: dataUrl };
      else
        return {
          base64: dataUrl,
          platforms: image.platforms,
        };
    });

    return Promise.all(imagePromises);
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  isPlatformActive(platformName: string): boolean {
    const config = this.platformConfigs.find((c) => c.platform === platformName);
    return config ? config.active : false;
  }

  get activePlatforms(): AnyConfigs[] {
    return this.platformConfigs.filter((c) => c.active);
  }

  getPlatformIcon(platformName: string): string {
    return this.platforms.find((p) => p.name === platformName)?.icon || '';
  }

  isPlatformSelectedForImage(image: PlatformImage, platformName: PlatformType): boolean {
    return image.platforms.includes(platformName);
  }

  toggleImagePlatform(image: PlatformImage, platformName: PlatformType): void {
    const index = image.platforms.indexOf(platformName);
    // prettier-ignore
    if (index > -1)
      image.platforms.splice(index, 1);
    else
      image.platforms.push(platformName);

    this.imageCacheService.saveImages(this.uploadedFiles);
  }

  private validate(platformNameToValidate?: PlatformType): void {
    let platformsToValidate = this.activePlatforms.map((p) => p.platform);

    // prettier-ignore
    if (platformNameToValidate) {
      platformsToValidate = [platformNameToValidate];
    }

    for (const platformName of platformsToValidate) {
      const platform = this.platforms.find((p) => p.name === platformName);
      if (platform && this.getRemainingCharacters(platform) < 0) {
        this.snackBar.open(
          `Limite de caracteres excedido para: ${platform.name}. Por favor, ajuste o texto.`,
          'Fechar',
          { duration: 4000 },
        );
        this.postTextarea.focus();
        throw new Error(`Validation failed: Character limit exceeded for ${platform.name}`);
      }
    }

    if (!this.postTextCtrl.value && this.uploadedFiles.length === 0) {
      this.snackBar.open('Você precisa adicionar um texto ou uma imagem para postar.', 'Fechar', { duration: 3000 });
      throw new Error('Validation failed: Post content is empty.');
    }
  }

  private async buildMultiPlatformPayload(): Promise<PublishPayload> {
    const tumblrConfig = this.platformConfigs.find((c) => c.platform === TUMBLR) as TumblrConfigs | undefined;

    return {
      id: this.editingPostId ?? undefined,
      platforms: this.activePlatforms.map((p) => p.platform),
      text: this.postTextCtrl.value || '',
      tags: this.tags,
      images: await this.formatImagesForApi(),
      platformOptions: {
        [TUMBLR]: { blogName: tumblrConfig?.blogName || '' },
      },
    };
  }

  private async buildSinglePlatformPayload(platformName: PlatformType): Promise<SinglePublishPayload> {
    if (platformName === TUMBLR) {
      const tumblrConfig = this.platformConfigs.find((c) => c.platform === TUMBLR) as TumblrConfigs | undefined;

      return {
        id: this.editingPostId ?? undefined,
        text: this.postTextCtrl.value || '',
        tags: this.tags,
        images: await this.formatImagesForApi(platformName),
        platformOptions: {
          [TUMBLR]: { blogName: tumblrConfig?.blogName || '' },
        },
      };
    } else
      return {
        text: this.postTextCtrl.value || '',
        tags: this.tags,
        images: await this.formatImagesForApi(platformName),
      };
  }

  onCancel(): void {
    this.postTextCtrl.setValue('');
    this.uploadedFiles = [];
    this.clearCache();
    this.imageCacheService.clearCache();
    this.editingPostId = null;
    this.snackBar.open('Formulário limpo.', 'Fechar', { duration: 2000 });
  }

  onSaveAsDraft(): void {
    this.submitPost(DRAFT);
  }

  onPublish(): void {
    try {
      this.validate();
      this.submitPost(POST);
    } catch (error) {
      console.warn('Publicação interrompida por falha na validação.', error);
    }
  }

  onPlatformPress(platformName: PlatformType): void {
    this.longPressTimer = setTimeout(() => {
      this.handleLongPress(platformName);
    }, this.LONG_PRESS_DURATION_MS);
  }

  onPlatformRelease(): void {
    clearTimeout(this.longPressTimer);
  }

  private async handleLongPress(platformName: PlatformType): Promise<void> {
    if (!this.isPlatformActive(platformName)) {
      this.snackBar.open(`Plataforma '${platformName}' não está ativa.`, 'Fechar', { duration: 3000 });
      return;
    }

    try {
      this.validate(platformName);

      this.snackBar.open(`Publicando em ${platformName}...`, '', { duration: 1500 });
      const payload = await this.buildSinglePlatformPayload(platformName);
      this.publishService.publishToSinglePlatform(platformName, payload).subscribe({
        next: () => {
          this.snackBar.open(`Publicado com sucesso em ${platformName}!`, 'OK', { duration: 3000 });
        },
        error: (err) => {
          this.snackBar.open(`Erro ao publicar em ${platformName}.`, 'Fechar', { duration: 3000 });
          console.error(err);
        },
      });
    } catch (error) {
      console.warn(`Publicação em ${platformName} interrompida por falha na validação.`, error);
    }
  }

  ngOnInit(): void {
    this.loadPostForEditing();
    this.loadStateFromCache();
    this.setupStateSaving();

    this.tagsSub = this.tagService.getTags().subscribe((tagsFromService) => {
      this.allTags = tagsFromService;
    });

    this.imageCacheService.loadImages().then((images) => {
      this.uploadedFiles = images;
    });

    this.filteredTags$ = this.tagCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) => (tag ? this._filter(tag) : this.allTags.slice())),
    );

    this.configurationService.getConfigurations().subscribe((configs) => {
      // prettier-ignore
      if (configs)
        this.platformConfigs = configs;
    });
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
