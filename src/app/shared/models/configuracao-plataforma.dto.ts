export interface TumblrBlogDTO {
  nome: string;
  titulo: string;
  selecionado: boolean;
}

export interface ConfiguracaoPlataformaDTO {
  id: number;
  nome: string;
  ativo: boolean;
  blogs?: TumblrBlogDTO[];
}
