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
	* Create a new chat for a user, or fetch an existing one if relevant.
	*/
	async createNewChat(userId, parameters) {
		try {
			// Reference to the user's chat collection
			const chatsRef = adminDb.collection('users').doc(userId).collection('chats'); // ✅ FIXED: adminDb used

			// Create a new chat document
			const newChatRef = chatsRef.doc(); // Auto-generate chatId
			const chatId = newChatRef.id;

			// Save chat metadata
			await newChatRef.set({
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			// Add parameters to the parameters subcollection
			const paramsRef = newChatRef.collection('parameters').doc();
			await paramsRef.set({
				...parameters,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			console.log(`✅ New chat created for user ${userId} with chatId ${chatId}`);

			return { chatId, userId };
		} catch (error) {
			console.error('🔥 Error creating chat:', error);
			throw new Error('Failed to create chat');
		}
	},

	/**
	* Get the most recent chat for a user.
	*/
	async getLatestChat(userId) {
		try {
			const chatsRef = adminDb.collection('users').doc(userId).collection('chats'); // ✅ FIXED: adminDb used

			// Query the most recent chat
			const latestChatQuery = await chatsRef.orderBy('createdAt', 'desc').limit(1).get();
			if (latestChatQuery.empty) {
				return null;
			}

			const latestChat = latestChatQuery.docs[0];
			return { chatId: latestChat.id, ...latestChat.data() };
		} catch (error) {
			console.error('🔥 Error fetching latest chat:', error);
			throw new Error('Failed to retrieve latest chat');
		}
	},

	/**
	* Get parameters for a specific chat.
	*/
	async getChatParameters(userId, chatId) {
		try {
			const paramsRef = adminDb.collection('users')
				.doc(userId)
				.collection('chats')
				.doc(chatId)
				.collection('parameters')
				.orderBy('createdAt', 'desc')
				.limit(1);

			const paramsSnapshot = await paramsRef.get();
			if (paramsSnapshot.empty) {
				return null;
			}

			return paramsSnapshot.docs[0].data();
		} catch (error) {
			console.error('🔥 Error fetching chat parameters:', error);
			throw new Error('Failed to get chat parameters');
		}
	},
};