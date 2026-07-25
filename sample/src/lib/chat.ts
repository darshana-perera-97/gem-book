import { UserProfile } from '../types';
import { startConversationApi } from './api';

/** Starts (or reuses) a 1:1 conversation and returns its id. */
export const startConversation = async (
  currentUser: UserProfile,
  otherUser: { uid: string; displayName: string; photoURL?: string }
): Promise<string> => {
  if (currentUser.uid === otherUser.uid) throw new Error('You cannot message yourself');
  const { id } = await startConversationApi(
    { uid: currentUser.uid, displayName: currentUser.displayName, photoURL: currentUser.photoURL || '' },
    { uid: otherUser.uid, displayName: otherUser.displayName, photoURL: otherUser.photoURL || '' }
  );
  return id;
};
