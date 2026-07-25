export type UserRole = 'USER' | 'VENDOR' | 'ADMIN';

export interface UserProfile {
  uid: string;
  displayName: string;
  /** Primary identity key in the auth-less model. */
  contactNumber?: string;
  email?: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  bio?: string;
  followersCount: number;
  followingCount: number;
  /** Vendor ids this user follows. */
  following?: string[];
  createdAt: string;
  lastActive: string;
}

export type VerificationLevel = 'NONE' | 'NIC' | 'BLUE' | 'GREEN' | 'GOLD';

export interface VendorProfile {
  id: string;
  userId: string;
  companyName: string;
  logo?: string;
  coverImage?: string;
  description?: string;
  location: string;
  rating: number;
  reviewCount: number;
  followersCount: number;
  verified: boolean;
  verificationLevel: VerificationLevel;
  contactEmail: string;
  phone?: string;
  website?: string;
  social?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  createdAt: string;
}

export type ListingStatus = 'ACTIVE' | 'SOLD' | 'PENDING';

export interface GemListing {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  status: ListingStatus;
  featured?: boolean;
  createdAt: any;
}

export type PostType = 'DISCUSSION' | 'STORY' | 'NEWS' | 'EVENT';

export interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorType: 'USER' | 'VENDOR';
  content: string;
  media?: string[];
  likesCount: number;
  likes?: string[]; // User UIDs
  ratingsCount?: number;
  averageRating: number;
  commentsCount: number;
  sharesCount?: number;
  type: PostType;
  category?: string;
  createdAt: any;
}

export type Post = SocialPost; // Alias for consistency

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: string[]; // User UIDs
  participantNames: Record<string, string>; // UID -> Name mapping
  participantAvatars: Record<string, string>; // UID -> Avatar mapping
  lastMessage?: string;
  lastSenderId?: string;
  lastUpdatedAt: any;
  unreadCount: Record<string, number>; // UID -> count mapping
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  readBy: string[]; // User UIDs
}

export interface NewsArticle {
  id: string;
  title: string;
  author: string;
  content: string;
  coverImage: string;
  tags: string[];
  category: string;
  createdAt: string;
}

export interface IndustryEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  location: string;
  organizerId: string;
  attendeesCount: number;
  coverImage: string;
  createdAt: string;
}

export type FeedItem =
  | { type: 'post'; data: SocialPost }
  | { type: 'listing'; data: GemListing }
  | { type: 'vendor'; data: VendorProfile };

export interface Review {
  id: string;
  /** Id of the vendor being reviewed. Stored as `targetId` in Firestore. */
  targetId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  content: string;
  /** Optional per-category breakdown; the simple flow only captures an overall rating. */
  categoryRatings?: {
    authenticity: number;
    communication: number;
    trustworthiness: number;
    professionalism: number;
    delivery: number;
  };
  createdAt: any;
}
