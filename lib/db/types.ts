export interface Profile {
  id: string;
  user_id: string | null;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  theme: Record<string, unknown>;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: string;
  profile_id: string;
  type: 'link' | 'social' | 'contact' | 'video' | 'header';
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
