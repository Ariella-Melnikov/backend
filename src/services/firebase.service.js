import { db } from '../config/firebase.config.js';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';

export const firebaseService = {
    async saveChatMessage(userId, message) {
        try {
            const chatRef = collection(db, 'chats');
            await addDoc(chatRef, {
                userId,
                message,
                timestamp: new Date(),
            });
        } catch (error) {
            console.error('Error saving chat message:', error);
            throw error;
        }
    },

    async getChatHistory(userId) {
        try {
            const chatRef = collection(db, 'chats');
            const q = query(
                chatRef,
                where('userId', '==', userId),
                orderBy('timestamp', 'asc')
            );
            
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting chat history:', error);
            throw error;
        }
    }
}; 