import admin from 'firebase-admin'; 
import { adminDb } from '../config/firebase-admin.config.js'; 
import { logger } from './logger.service.js';

export const dbService = {
	async getCollection(collectionName) {
		try {
			const collectionRef = adminDb.collection(collectionName);
			const snapshot = await collectionRef.get();
			return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
		} catch (err) {
			logger.error('Failed to get Firestore collection', err);
			throw err;
		}
	},

	async getById(collectionName, id) {
		try {
			const docRef = adminDb.collection(collectionName).doc(id);
			const docSnap = await docRef.get();
			
			if (docSnap.exists()) {
				return { id: docSnap.id, ...docSnap.data() };
			} else {
				return null;
			}
		} catch (err) {
			logger.error('Failed to get document by id', err);
			throw err;
		}
	},

	async add(collectionName, data) {
		try {
			console.log('📝 Adding document to path:', collectionName);
			console.log('📄 Document data:', data);

			const collectionRef = adminDb.collection(collectionName);
			const docRef = await collectionRef.add({
				...data,
				createdAt: admin.firestore.FieldValue.serverTimestamp()
			});

			console.log('✅ Document added successfully:', docRef.id);
			return { id: docRef.id, ...data };
		} catch (err) {
			console.error('❌ Failed to add document:', err);
			throw err;
		}
	},

	async query(collectionName, filterBy = {}) {
		try {
			console.log('🔍 Querying collection:', collectionName);
			let query = adminDb.collection(collectionName);

			// Add filters if they exist
			Object.keys(filterBy).forEach(key => {
				if (filterBy[key]) {
					query = query.where(key, '==', filterBy[key]);
				}
			});

			const snapshot = await query.get();
			console.log('📊 Query results count:', snapshot.size);
			return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
		} catch (err) {
			console.error('❌ Query failed:', err);
			throw err;
		}
	},

  /**
     * 💬 Save chat messages in real-time as conversation progresses.
     */
  async saveChatMessage(userId, chatId, message) {
	try {
		console.log(`💾 Saving chat message for user: ${userId}, chat: ${chatId}`);

		const messageRef = adminDb.collection('users')
			.doc(userId)
			.collection('chats')
			.doc(chatId)
			.collection('messages')
			.doc();

		await messageRef.set({
			...message,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		console.log("✅ Chat message saved:", message);
	} catch (error) {
		console.error('❌ Error saving chat message:', error);
		throw new Error('Failed to save chat message');
	}
},

/**
 * ✅ Save final search parameters **ONLY on user confirmation**.
 */
async confirmSearch(userId, chatId, propertyRequirements) {
    try {
        console.log("📦 Saving confirmed search parameters:", propertyRequirements);

        await adminDb.collection('users')
            .doc(userId)
            .collection('chats')
            .doc(chatId)
            .collection('parameters')
            .add({
                ...propertyRequirements,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

        console.log("✅ Search parameters successfully saved!");
        return true;
    } catch (error) {
        console.error("🔥 Error saving parameters:", error);
        throw new Error("Failed to save confirmed search parameters.");
    }
},

/**
 * 🆕 Create or retrieve the latest chat for the user.
 */
async getOrCreateChat(userId) {
	try {
		console.log(`🔄 Checking for existing chat for user: ${userId}`);

		const chatsRef = adminDb.collection('users').doc(userId).collection('chats');
		const latestChatQuery = await chatsRef.orderBy('createdAt', 'desc').limit(1).get();

		if (!latestChatQuery.empty) {
			console.log("✅ Found existing chat:", latestChatQuery.docs[0].id);
			return { chatId: latestChatQuery.docs[0].id, ...latestChatQuery.docs[0].data() };
		}

		// No existing chat, create a new one
		const newChatRef = chatsRef.doc();
		await newChatRef.set({
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		console.log("🆕 Created new chat with ID:", newChatRef.id);
		return { chatId: newChatRef.id };
	} catch (error) {
		console.error('❌ Error creating/retrieving chat:', error);
		throw new Error('Failed to get or create chat');
	}
}
};