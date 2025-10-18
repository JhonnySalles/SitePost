export const UNKNOW = 'unknow';
export const TWITTER = 'twitter';
export const TUMBLR = 'tumblr';
export const THREADS = 'threads';
export const BLUESKY = 'bluesky';

export const SOCIAL_PLATFORMS = [
  {
    name: TUMBLR,
    icon: 'logo-tumblr',
    limits: 4096,
    color: '#001935',
    darkColor: '#36465D',
  },
  {
    name: TWITTER,
    icon: 'logo-twitter',
    limits: 280,
    color: '#1DA1F2',
    darkColor: '#1DA1F2',
  },
  {
    name: THREADS,
    icon: 'at-sharp',
    limits: 500,
    color: '#000000',
    darkColor: '#000000',
  },
  {
    name: BLUESKY,
    icon: 'chatbubbles-outline',
    limits: 300,
    color: '#0070FF',
    darkColor: '#4C8CFF',
  },
] as const;

export type PlatformType = (typeof SOCIAL_PLATFORMS)[number]['name'] | typeof UNKNOW;

export interface Configs {
  id: number;
  platform: PlatformType;
  active: boolean;
  aditional?: string;
}

export interface TumblrBlog {
  name: string;
  title: string;
  selected: boolean;
}

export interface TumblrConfigs extends Configs {
  platform: typeof TUMBLR;
  blogName: string;
  blogs: TumblrBlog[];
}

export type AnyConfigs = TumblrConfigs | Configs;
