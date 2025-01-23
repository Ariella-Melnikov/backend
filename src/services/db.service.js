import { db } from '../config/firebase.config.js';
import { collection, getDocs, query, where, addDoc, doc, getDoc } from 'firebase/firestore';
import { logger } from './logger.service.js';

export const dbService = {
	async getCollection(collectionName) {
		try {
			const collectionRef = collection(db, collectionName);
			const snapshot = await getDocs(collectionRef);
			return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
		} catch (err) {
			logger.error('Failed to get Firestore collection', err);
			throw err;
		}
	},

	async getById(collectionName, id) {
		try {
			const docRef = doc(db, collectionName, id);
			const docSnap = await getDoc(docRef);
			
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
			const collectionRef = collection(db, collectionName);
			const docRef = await addDoc(collectionRef, data);
			return { id: docRef.id, ...data };
		} catch (err) {
			logger.error('Failed to add document', err);
			throw err;
		}
	},

	async query(collectionName, filterBy = {}) {
		try {
			const collectionRef = collection(db, collectionName);
			let q = collectionRef;

			// Add filters if they exist
			Object.keys(filterBy).forEach(key => {
				if (filterBy[key]) {
					q = query(q, where(key, '==', filterBy[key]));
				}
			});

			const snapshot = await getDocs(q);
			return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
		} catch (err) {
			logger.error('Failed to query collection', err);
			throw err;
		}
	}
};