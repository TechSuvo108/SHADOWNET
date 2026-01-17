export enum AppTab {
  FEED = 'FEED',
  FRIENDS = 'FRIENDS',
  ENCODER = 'ENCODER',
  DECODER = 'DECODER',
  USER = 'USER'
}

export interface UserProfile {
  name: string;
  bio: string;
  dp: string | null;
  agentId: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface StegoImage {
  id: string;
  src: string;
  alt?: string;
  user?: string;
  ownerId?: string;
  userDp?: string | null;
  caption?: string;
  timestamp: number;
  // Security Meta
  maxViews?: number;
  currentViews: number;
  expiresAt?: number;
  hasHiddenMessage: boolean;
  // Social
  likes?: string[]; // Array of user IDs
  comments?: Comment[];
}

export enum GeminiModel {
  TEXT_SEARCH = 'gemini-3-flash-preview',
  IMAGE_GEN = 'gemini-3-pro-image-preview',
  IMAGE_EDIT = 'gemini-2.5-flash-image',
  IMAGE_ANALYSIS = 'gemini-3-pro-preview'
}


export interface FriendRequest {
  id: string;
  from: string; // User ID
  fromName: string;
  fromDp: string | null;
  to: string; // User ID
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  read: boolean;
  deletedFor?: string[];
}

export interface ChatSession {
  id: string; // Typically sorted userIds
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: number;
}