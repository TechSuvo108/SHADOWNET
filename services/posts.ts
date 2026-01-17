import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  getDoc,
  increment
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { StegoImage } from "../types";

const COLLECTION = "posts";

export const subscribeToPosts = (callback: (posts: StegoImage[]) => void) => {
  const q = query(collection(db, COLLECTION), orderBy("timestamp", "desc"));

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as StegoImage[];
    callback(posts);
  }, (error) => {
    console.error("Error subscribing to posts:", error);
  });
};

export const createPost = async (post: Omit<StegoImage, "id">) => {
  if (!auth.currentUser) throw new Error("Must be logged in");

  // Clean undefined values for Firestore
  const data = JSON.parse(JSON.stringify(post));

  // Use server timestamp for consistency
  data.timestamp = Date.now(); // We can use serverTimestamp() but keeping number for consistent types in frontend for now

  return addDoc(collection(db, COLLECTION), data);
};

export const deletePost = async (postId: string) => {
  if (!auth.currentUser) throw new Error("Must be logged in");
  const postRef = doc(db, COLLECTION, postId);
  // Ideally we check ownership here or in security rules, assuming rules handle it for now
  return deleteDoc(postRef);
};

// Placeholder for future comment/like implementation
export const likePost = async (postId: string, userId: string) => {
  const postRef = doc(db, COLLECTION, postId);
  // We can't easily toggle in one atomic op without knowing current state, but arrayUnion/Remove works well if we know intention.
  // For now, let's assume valid toggle from UI or just try both? 
  // Better: Transaction or just two helper functions. Let's make toggle.
  // Actually, simple implementation: just arrayUnion. If it exists, we'd need to remove. 
  // Let's implement toggle. But we need to know if we are liking or unliking.
  // Let's just export toggleLike which reads first? No, slow.
  // Let's rely on UI to call the right one? 
  // Standard approach: arrayUnion to like. arrayRemove to unlike.
  // We'll export both.
};

export const toggleLike = async (postId: string, userId: string, isLiked: boolean) => {
  const postRef = doc(db, COLLECTION, postId);
  if (isLiked) {
    await updateDoc(postRef, {
      likes: arrayRemove(userId)
    });
  } else {
    await updateDoc(postRef, {
      likes: arrayUnion(userId)
    });
  }
};

export const addComment = async (postId: string, comment: any) => {
  const postRef = doc(db, COLLECTION, postId);
  await updateDoc(postRef, {
    comments: arrayUnion(comment)
  });
};

export const deleteComment = async (postId: string, comment: any) => {
  const postRef = doc(db, COLLECTION, postId);
  await updateDoc(postRef, {
    comments: arrayRemove(comment)
  });
};

export const incrementPostView = async (postId: string) => {
  const postRef = doc(db, COLLECTION, postId);

  // Transactional update would be safer for race conditions, but standard update is faster for UI responsiveness.
  // We fetch first to check maxViews.
  const snap = await getDoc(postRef);
  if (!snap.exists()) return;

  const data = snap.data() as StegoImage;
  const newViews = (data.currentViews || 0) + 1;

  // Check View Limit
  // Note: If maxViews is undefined or 0/null, this check is skipped (unlimited)
  if (data.maxViews && newViews >= data.maxViews) {
    await deletePost(postId);
    return 'deleted';
  } else {
    await updateDoc(postRef, {
      currentViews: increment(1)
    });
    return 'updated';
  }
};
