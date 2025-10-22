import { PlatformType } from './social-platforms.model';

export const POST = 'POST';
export const DRAFT = 'DRAFT';

export type PostType = typeof POST | typeof DRAFT;

interface MultiPlatformImage {
  base64: string;
  platforms: PlatformType[];
}

export interface PublishPayload {
  id?: number;
  platforms: PlatformType[];
  text: string;
  tags: string[];
  images: MultiPlatformImage[];
  platformOptions?: {
    [key: string]: any;
  };
}

interface SinglePlatformImage {
  base64: string;
}

export interface SinglePublishPayload {
  id?: number;
  text: string;
  tags: string[];
  images: SinglePlatformImage[];
  platformOptions?: {
    [key: string]: any;
  };
}
