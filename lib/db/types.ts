/** Fonte da página pública — pilhas do sistema, sem webfont (ver THEME_FONTS). */
export type ThemeFont = 'sans' | 'serif' | 'mono' | 'rounded';

/** Formato do botão dos blocos. */
export type ThemeButtonShape = 'square' | 'rounded' | 'pill';

export interface ThemeConfig {
  name: string;
  bg: string;
  btnBg: string;
  btnText: string;
  font: ThemeFont;
  buttonShape: ThemeButtonShape;
  /**
   * Blocos sociais pintados com a cor oficial da marca em vez da cor do tema —
   * o catálogo de botões de marca pedido na Fase 1 do roadmap.
   */
  useBrandColors: boolean;
}

export type BlockType = 'link' | 'social' | 'contact' | 'video' | 'header';

export interface Profile {
  id: string;
  user_id: string | null;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  theme: ThemeConfig;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: string;
  profile_id: string;
  type: BlockType;
  label: string | null;
  url: string | null;
  config: Record<string, unknown>;
  position: number;
  visible_from: string | null;
  visible_until: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ProfileWithBlocks extends Profile {
  blocks: Block[];
}
