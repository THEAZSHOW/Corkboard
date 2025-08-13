
export enum ItemType {
  Note = 'NOTE',
  Image = 'IMAGE',
  Video = 'VIDEO',
  Emoji = 'EMOJI',
}

export interface BoardItemData {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  content: string;
  color?: string;
  fontSize?: number;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
}

export interface CorkboardData {
  name: string;
  items: BoardItemData[];
  connections: Connection[];
}

export type Theme = 'white' | 'dark' | 'orange';

export interface CorkboardMeta {
  id: string;
  name: string;
}