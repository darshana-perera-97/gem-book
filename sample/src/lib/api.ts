/**
 * GemBook API client — talks to the self-hosted PHP + MySQL backend.
 * Replaces Firebase entirely. Configure the endpoint with VITE_API_BASE
 * (defaults to `/api`, i.e. the PHP app sitting next to the SPA on cPanel).
 */
import { UserProfile, VendorProfile, GemListing, SocialPost, Comment, Review, Conversation, Message } from '../types';

const BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : undefined,
    ...opts,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data as T;
}

const qs = (params: Record<string, any>) =>
  '?' + Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

// ---- images ----------------------------------------------------------------
/**
 * Compresses then uploads an image, returning its public URL.
 * `path` is kept for call-site compatibility but ignored (the server names files).
 */
export async function uploadImageFile(_path: string, file: File): Promise<string> {
  const { compressImage } = await import('./imageCompression');
  const { file: optimised } = await compressImage(file);
  const form = new FormData();
  form.append('file', optimised, optimised.name);
  const { url } = await req<{ url: string }>('/upload', { method: 'POST', body: form });
  return url;
}

// ---- users -----------------------------------------------------------------
export const getUser = (uid: string) => req<UserProfile | null>(`/users/${encodeURIComponent(uid)}`);
export const findUserByContact = (contact: string) => req<UserProfile | null>(`/users${qs({ contact })}`);
export const saveUser = (data: Partial<UserProfile>) => req<UserProfile>('/users', { method: 'POST', body: JSON.stringify(data) });
export const listUsers = (limit = 200) => req<UserProfile[]>(`/users${qs({ limit })}`);
export const deleteUser = (uid: string) => req(`/users/${encodeURIComponent(uid)}`, { method: 'DELETE' });

// ---- vendors ---------------------------------------------------------------
export const getVendor = (id: string) => req<VendorProfile | null>(`/vendors/${encodeURIComponent(id)}`);
export const getVendorsByIds = (ids: string[]) => (ids.length ? req<VendorProfile[]>(`/vendors${qs({ ids: ids.join(',') })}`) : Promise.resolve([]));
export const listVendors = (limit = 20, offset = 0) => req<VendorProfile[]>(`/vendors${qs({ limit, offset })}`);
export const saveVendor = (data: Partial<VendorProfile>) => req<VendorProfile>('/vendors', { method: 'POST', body: JSON.stringify(data) });
export const deleteVendor = (id: string) => req(`/vendors/${encodeURIComponent(id)}`, { method: 'DELETE' });

// ---- listings --------------------------------------------------------------
export const listListings = (limit = 20, offset = 0) => req<GemListing[]>(`/listings${qs({ limit, offset })}`);
export const getListing = (id: string) => req<GemListing | null>(`/listings/${encodeURIComponent(id)}`);
export const listingsByVendor = (vendorId: string, limit = 48) => req<GemListing[]>(`/listings${qs({ vendorId, limit })}`);
export const createListing = (data: Partial<GemListing>) => req<GemListing>('/listings', { method: 'POST', body: JSON.stringify(data) });
export const deleteListing = (id: string) => req(`/listings/${encodeURIComponent(id)}`, { method: 'DELETE' });

// ---- posts -----------------------------------------------------------------
export const listPosts = (limit = 10, offset = 0) => req<SocialPost[]>(`/posts${qs({ limit, offset })}`);
export const postsByAuthor = (authorId: string, limit = 24) => req<SocialPost[]>(`/posts${qs({ authorId, limit })}`);
export const createPost = (data: Partial<SocialPost>) => req<SocialPost>('/posts', { method: 'POST', body: JSON.stringify(data) });
export const deletePost = (id: string) => req(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const likePost = (postId: string, uid: string, liked: boolean) =>
  req<{ likesCount: number }>('/like', { method: 'POST', body: JSON.stringify({ postId, uid, liked }) });

// ---- comments --------------------------------------------------------------
export const listComments = (postId: string, limit = 20) => req<Comment[]>(`/comments${qs({ postId, limit })}`);
export const createComment = (data: Partial<Comment>) => req<Comment>('/comments', { method: 'POST', body: JSON.stringify(data) });

// ---- reviews ---------------------------------------------------------------
export const listReviews = (targetId: string, limit = 20) => req<Review[]>(`/reviews${qs({ targetId, limit })}`);
export const createReview = (data: Partial<Review>) => req<Review>('/reviews', { method: 'POST', body: JSON.stringify(data) });

// ---- follow ----------------------------------------------------------------
export const followVendor = (uid: string, vendorId: string, following: boolean) =>
  req('/follow', { method: 'POST', body: JSON.stringify({ uid, vendorId, following }) });

// ---- chat ------------------------------------------------------------------
export const listConversations = (userId: string) => req<Conversation[]>(`/conversations${qs({ userId })}`);
export const startConversationApi = (currentUser: any, otherUser: any) =>
  req<{ id: string }>('/conversations', { method: 'POST', body: JSON.stringify({ currentUser, otherUser }) });
export const listMessages = (conversationId: string) => req<Message[]>(`/messages${qs({ conversationId })}`);
export const sendMessageApi = (data: Partial<Message>) => req<Message>('/messages', { method: 'POST', body: JSON.stringify(data) });
export const markConversationRead = (conversationId: string, uid: string) =>
  req(`/messages/${encodeURIComponent(conversationId)}`, { method: 'PATCH', body: JSON.stringify({ uid }) });

// ---- admin / seed ----------------------------------------------------------
export const adminStats = () => req<Record<string, number>>('/stats');
export const seedDatabase = (bundle: any) => req<{ ok: boolean; inserted: Record<string, number> }>('/seed', { method: 'POST', body: JSON.stringify(bundle) });
