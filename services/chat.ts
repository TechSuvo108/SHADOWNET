import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    doc,
    setDoc,
    limit,
    deleteDoc,
    updateDoc,
    arrayUnion
} from "firebase/firestore";
import { db } from "./firebase";
import { ChatMessage } from "../types";

const CHATS_COL = "chats";

export const getChatId = (uid1: string, uid2: string) => {
    return [uid1, uid2].sort().join('_');
};

export const sendMessage = async (senderId: string, recipientId: string, text: string) => {
    const chatId = getChatId(senderId, recipientId);
    const chatRef = doc(db, CHATS_COL, chatId);

    // Ensure chat doc exists (for listing chats later if needed)
    await setDoc(chatRef, {
        participants: [senderId, recipientId],
        lastMessage: text,
        lastMessageTime: Date.now()
    }, { merge: true });

    // Add message to subcollection
    await addDoc(collection(chatRef, "messages"), {
        senderId,
        text,
        timestamp: Date.now(),
        read: false
    });
};

export const subscribeToChat = (uid1: string, uid2: string, callback: (msgs: ChatMessage[]) => void) => {
    const chatId = getChatId(uid1, uid2);
    const q = query(
        collection(db, CHATS_COL, chatId, "messages"),
        orderBy("timestamp", "desc"),
        limit(100)
    );

    return onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ChatMessage[];
        callback(msgs);
    });
};

export const unsendMessage = async (senderId: string, recipientId: string, messageId: string) => {
    const chatId = getChatId(senderId, recipientId);
    await deleteDoc(doc(db, CHATS_COL, chatId, "messages", messageId));
};

export const deleteMessageForUser = async (senderId: string, recipientId: string, messageId: string, userId: string) => {
    const chatId = getChatId(senderId, recipientId);
    await updateDoc(doc(db, CHATS_COL, chatId, "messages", messageId), {
        deletedFor: arrayUnion(userId)
    });
};
