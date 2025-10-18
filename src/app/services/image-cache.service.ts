import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PlatformImage } from '../pages/home/home.component';
import { PlatformType } from '../shared/models/social-platforms.model';

interface CachedImage {
  dataUrl: string;
  platforms: PlatformType[];
  name: string;
  type: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImageCacheService {
  private platformId = inject(PLATFORM_ID);
  private readonly IMAGE_CACHE_KEY = 'home_page_images';

  async saveImages(images: PlatformImage[]): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      const cachedImages: CachedImage[] = await this.platformImagesToCacheFormat(images);
      localStorage.setItem(this.IMAGE_CACHE_KEY, JSON.stringify(cachedImages));
    }
  }

  async loadImages(): Promise<PlatformImage[]> {
    if (isPlatformBrowser(this.platformId)) {
      const savedData = localStorage.getItem(this.IMAGE_CACHE_KEY);
      if (savedData) {
        const cachedImages: CachedImage[] = JSON.parse(savedData);
        return await this.cacheFormatToPlatformImages(cachedImages);
      }
    }
    return [];
  }

  private async platformImagesToCacheFormat(images: PlatformImage[]): Promise<CachedImage[]> {
    const promises = images.map(async (image) => {
      const dataUrl = await this.fileToDataUrl(image.file);
      return {
        dataUrl,
        platforms: image.platforms,
        name: image.file.name,
        type: image.file.type,
      };
    });
    return Promise.all(promises);
  }

  private async cacheFormatToPlatformImages(cachedImages: CachedImage[]): Promise<PlatformImage[]> {
    const promises = cachedImages.map(async (cachedImage) => {
      const file = await this.dataUrlToFile(cachedImage.dataUrl, cachedImage.name, cachedImage.type);
      return {
        file,
        platforms: cachedImage.platforms,
      };
    });
    return Promise.all(promises);
  }

  clearCache(): void {
    // prettier-ignore
    if (isPlatformBrowser(this.platformId))
      localStorage.removeItem(this.IMAGE_CACHE_KEY);
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  private async dataUrlToFile(dataUrl: string, name: string, type: string): Promise<File> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], name, { type });
  }
}
