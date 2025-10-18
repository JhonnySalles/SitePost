import { PostType } from './publish.model';
import { PlatformType } from './social-platforms.model';

export interface HistoryImage {
  url: string;
  platforms: PlatformType[];
}

export interface HistoryItem {
  id: number;
  tipo: PostType;
  situacao: 'PENDENTE' | 'PUBLICADO' | 'ERRO';
  text: string;
  data: string; // ISO 8601 Date string
  tags: string[];
  images: HistoryImage[];
}

export interface HistoryResponse {
  pagina: number;
  total: number;
  data: HistoryItem[];
}
