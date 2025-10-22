import { PostType } from './publish.model';
import { PlatformType } from './social-platforms.model';

export interface HistoryPlatform {
  plataforma: PlatformType;
  sucesso: boolean;
  erro: string | null;
}

export interface HistoryImage {
  url: string;
  plataformas: PlatformType[] | null;
}

export interface HistoryItem {
  id: number;
  tipo: 'POST' | 'RASCUNHO';
  situacao: 'PENDENTE' | 'PUBLICADO' | 'ERRO';
  text: string;
  data: string; // ISO 8601 Date string
  tags: string[];
  images: HistoryImage[];
  plataformas: HistoryPlatform[];
}

export interface HistoryResponse {
  pagina: number;
  total: number;
  data: HistoryItem[];
}
