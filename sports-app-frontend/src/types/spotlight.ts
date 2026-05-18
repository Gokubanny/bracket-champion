// src/types/spotlight.ts
export type SportType = "football" | "basketball" | "tennis" | "volleyball" | "cricket" | "badminton";

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  sport: SportType;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  heroImage: string;
  playerImage?: string;
  createdAt: string;
  updatedAt: string;
  readTime: number;
  tags: string[];
  featured: boolean;
  viewCount: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface CreatePostInput {
  title: string;
  excerpt: string;
  content: string;
  sport: SportType;
  heroImage: string;
  playerImage?: string;
  tags: string[];
  featured: boolean;
}