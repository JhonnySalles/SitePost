import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ImageCacheService {
  private platformId = inject(PLATFORM_ID);
  private readonly IMAGE_CACHE_KEY = 'home_page_images';

  async saveImages(files: File[]): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      const dataUrls = await this.filesToDataUrls(files);
      localStorage.setItem(this.IMAGE_CACHE_KEY, JSON.stringify(dataUrls));
    }
  }

  async loadImages(): Promise<File[]> {
    if (isPlatformBrowser(this.platformId)) {
      const savedImages = localStorage.getItem(this.IMAGE_CACHE_KEY);
      if (savedImages) {
        const dataUrls = JSON.parse(savedImages);
        return await this.dataUrlsToFiles(dataUrls);
      }
    }
    return [];
  }

  clearCache(): void {
    // prettier-ignore
    if (isPlatformBrowser(this.platformId))
      localStorage.removeItem(this.IMAGE_CACHE_KEY);
  }

  async filesToDataUrls(files: File[]): Promise<string[]> {
    const dataUrlPromises = files.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });
    });
    return Promise.all(dataUrlPromises);
  }

  private async dataUrlsToFiles(dataUrls: string[]): Promise<File[]> {
    const filePromises = dataUrls.map(async (dataUrl, index) => {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      return new File([blob], `cached-image-${index}.${blob.type.split('/')[1]}`, { type: blob.type });
    });
    return Promise.all(filePromises);
  }
}
