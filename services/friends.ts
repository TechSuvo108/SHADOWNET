import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    setDoc,
    getDocs,
    limit,
    orderBy,
    startAt,
    endAt
} from "firebase/firestore";
import { db } from "./firebase";
import { FriendRequest, UserProfile } from "../types";

const REQUESTS_COL = "friend_requests";
const USERS_COL = "users";

export const searchUsers = async (searchTerm: string) => {
    if (!searchTerm) return [];
    // Firestore simple prefix search on 'name'
    // Note: This requires case-sensitive matching usually. 
    // Ideally we store a lowercase normalized name field, but we'll try standard query.

    const termLower = searchTerm.toLowerCase();

    // Query 1: New users (case-insensitive)
    const qLower = query(
        collection(db, USERS_COL),
        orderBy("nameLower"),
        startAt(termLower),
        endAt(termLower + '\uf8ff'),
        limit(10)
    );

    // Query 2: Legacy users (case-sensitive fallback)
    const qLegacy = query(
        collection(db, USERS_COL),
        orderBy("name"),
        startAt(searchTerm),
        endAt(searchTerm + '\uf8ff'),
        limit(10)
    );

    const [snapLower, snapLegacy] = await Promise.all([getDocs(qLower), getDocs(qLegacy)]);

    // Merge and Deduplicate
    const results = new Map();
    [...snapLower.docs, ...snapLegacy.docs].forEach(doc => {
        results.set(doc.id, { uid: doc.id, ...doc.data() });
    });

    return Array.from(results.values()) as (UserProfile & { uid: string })[];
};

export const sendFriendRequest = async (fromUid: string, toUid: string, fromName: string, fromDp: string | null) => {
    // Check if request already exists
    // (Skipping strict check for speed, but ideally we query first)

    await addDoc(collection(db, REQUESTS_COL), {
        from: fromUid,
        to: toUid,
        fromName,
        fromDp,
        timestamp: Date.now(),
        status: 'pending'
    });
};

export const subscribeToRequests = (userId: string, callback: (reqs: FriendRequest[]) => void) => {
    const q = query(
        collection(db, REQUESTS_COL),
        where("to", "==", userId),
        where("status", "==", "pending")
    );

    return onSnapshot(q, (snapshot) => {
        const reqs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FriendRequest[];
        callback(reqs);
    });
};

export const respondToRequest = async (requestId: string, fromUid: string, toUid: string, action: 'accept' | 'reject') => {
    const reqRef = doc(db, REQUESTS_COL, requestId);

    if (action === 'accept') {
        // Add to both users' friend lists (subcollection)
        // 1. Add 'from' to 'to's friends
        await setDoc(doc(db, USERS_COL, toUid, "friends", fromUid), {
            friendId: fromUid,
            since: Date.now()
        });

        // 2. Add 'to' to 'from's friends
        await setDoc(doc(db, USERS_COL, fromUid, "friends", toUid), {
            friendId: toUid,
            since: Date.now()
        });

        // Delete request
        await deleteDoc(reqRef);
    } else {
        // Reject - just delete
        await deleteDoc(reqRef);
    }
};

export const subscribeToFriends = (userId: string, callback: (friendIds: string[]) => void) => {
    const q = collection(db, USERS_COL, userId, "friends");
    return onSnapshot(q, (snapshot) => {
        const ids = snapshot.docs.map(doc => doc.id);
        callback(ids);
    });
};

export const checkFriendStatus = async (myUid: string, targetUid: string): Promise<'none' | 'friends' | 'pending_sent' | 'pending_received'> => {
    // Check if friends
    const friendDoc = await getDoc(doc(db, USERS_COL, myUid, "friends", targetUid));
    if (friendDoc.exists()) return 'friends';

    // Check if I sent a request
    // Note: This requires an index usually, so try/catch might fail if not indexed.
    // Index-free way: don't check, or rely on client state. 
    // Let's assume we can query 'pending' requests.

    return 'none';
};

export const removeFriend = async (userId1: string, userId2: string) => {
    // Remove connection from both users
    const ref1 = doc(db, USERS_COL, userId1, "friends", userId2);
    const ref2 = doc(db, USERS_COL, userId2, "friends", userId1);

    await Promise.all([
        deleteDoc(ref1),
        deleteDoc(ref2)
    ]);
};
