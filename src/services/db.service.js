import admin from 'firebase-admin'
import { adminDb } from '../config/firebase-admin.config.js'
import { logger } from './logger.service.js'

export const dbService = {
    async getCollection(collectionName) {
        try {
            const collectionRef = adminDb.collection(collectionName)
            const snapshot = await collectionRef.get()
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        } catch (err) {
            logger.error('Failed to get Firestore collection', err)
            throw err
        }
    },

    async getById(collectionName, id) {
        try {
            const docRef = adminDb.collection(collectionName).doc(id)
            const docSnap = await docRef.get()

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() }
            } else {
                return null
            }
        } catch (err) {
            logger.error('Failed to get document by id', err)
            throw err
        }
    },

    async add(collectionName, data) {
        try {

            const collectionRef = adminDb.collection(collectionName)
            const docRef = await collectionRef.add({
                ...data,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            })

            return { id: docRef.id, ...data }
        } catch (err) {
            console.error('❌ Failed to add document:', err)
            throw err
        }
    },

    async query(collectionName, filterBy = {}) {
        try {
            let query = adminDb.collection(collectionName)

            // Add filters if they exist
            Object.keys(filterBy).forEach((key) => {
                if (filterBy[key]) {
                    query = query.where(key, '==', filterBy[key])
                }
            })

            const snapshot = await query.get()
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        } catch (err) {
            console.error('❌ Query failed:', err)
            throw err
        }
    },
    /**
     * ✅ Save Message to Chat
     * - If it's a new conversation, overwrite messages.
     * - If it's an ongoing conversation, append new messages.
     */
    async saveChatMessage(userId, chatId, message, isNewSession) {
        try {
            const chatRef = adminDb.collection(`users`).doc(userId).collection('chats').doc(chatId)
            const timestamp = new Date().toISOString()  // Use ISO string timestamp

            if (isNewSession) {
                await chatRef.update({
                    messages: [
                        {
                            role: message.role,
                            content: message.content,
                            timestamp: timestamp,
                        },
                    ],
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                })
            } else {
                await chatRef.update({
                    messages: admin.firestore.FieldValue.arrayUnion({
                        role: message.role,
                        content: message.content,
                        timestamp: timestamp,
                    }),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                })
            }
        } catch (error) {
            console.error('❌ Error saving chat message:', error)
            throw new Error('Failed to save chat message')
        }
    },
    async saveOrUpdateProperties(userId, chatId, properties) {
        try {
      
          const propertiesRef = adminDb
            .collection('users')
            .doc(userId)
            .collection('chats')
            .doc(chatId)
            .collection('properties');
      
          const existingPropertiesSnapshot = await propertiesRef.get();
      
          if (!existingPropertiesSnapshot.empty) {
      
            // Update each property document
            for (const property of properties) {
              const existingDoc = existingPropertiesSnapshot.docs.find(doc => doc.id === property.id);
      
              if (existingDoc) {
                await propertiesRef.doc(existingDoc.id).update({
                  ...property,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
              } else {
                // Add new property
                await propertiesRef.add({
                  ...property,
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
              }
            }
          } else {            
            // Add new properties
            for (const property of properties) {
              await propertiesRef.add({
                ...property,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          }
      
        } catch (error) {
          console.error('❌ Error saving properties:', error);
          throw new Error('Failed to save or update properties.');
        }
      },
    /**
     * ✅ Save final search parameters **ONLY on user confirmation**.
     */
    async confirmSearch(userId, chatId, propertyRequirements) {
        try {

            const parametersRef = adminDb
                .collection('users')
                .doc(userId)
                .collection('chats')
                .doc(chatId)
                .collection('parameters');

            // Check if parameters already exist
            const existingParams = await parametersRef.get();
            let result;

            if (!existingParams.empty) {
                // Update existing parameters
                const docId = existingParams.docs[0].id;
                await parametersRef.doc(docId).update({
                    ...propertyRequirements,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                result = { id: docId };
            } else {
                // Create new parameters
                const newDoc = await parametersRef.add({
                    ...propertyRequirements,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                result = { id: newDoc.id };
            }

            return result;
        } catch (error) {
            console.error('🔥 Error saving parameters:', error);
            throw new Error('Failed to save confirmed search parameters.');
        }
    },

    /**
     * 🆕 Create or retrieve the latest chat for the user.
     */
    async getOrCreateChat(userId) {
        try {

            const chatsRef = adminDb.collection(`users`).doc(userId).collection('chats')
            const latestChatQuery = await chatsRef.orderBy('createdAt', 'desc').limit(1).get()
            const timestamp = new Date().toISOString()
            let isNewSession = false

            if (!latestChatQuery.empty) {
                const latestChatDoc = latestChatQuery.docs[0]
                const chatData = latestChatDoc.data()

                // Add safety checks for updatedAt field
                const lastUpdated = chatData.updatedAt && chatData.updatedAt.toDate ? 
                    chatData.updatedAt.toDate() : 
                    new Date(chatData.updatedAt || Date.now())
                
                const now = new Date()
                const timeDiff = now - lastUpdated // Difference in milliseconds

                const THRESHOLD = 30 * 60 * 1000 // 30 minutes threshold

                if (timeDiff > THRESHOLD) {
                    await latestChatDoc.ref.update({
                        messages: [],
                        updatedAt: timestamp,
                    })

                    isNewSession = true
                }

                return { 
                    chatId: latestChatDoc.id, 
                    isNewSession, 
                    ...chatData,
                    updatedAt: lastUpdated // Return the parsed date
                }
            }

            // Create a new chat if none exists
            const newChatRef = chatsRef.doc()
            await newChatRef.set({
                createdAt: timestamp,
                updatedAt: timestamp,
                messages: [],
            })

            return { 
                chatId: newChatRef.id, 
                isNewSession: true, 
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date()
            }
        } catch (error) {
            console.error('❌ Error creating/retrieving chat:', error)
            throw new Error('Failed to get or create chat')
        }
    },


    async saveScrapedProperties(userId, properties) {
        try {
            if (!userId) {
                console.error('❌ Error: Missing userId when saving properties.');
                throw new Error('UserId is required.');
            }
    
            if (!Array.isArray(properties) || properties.length === 0) {
                console.error('⚠️ No properties provided for saving.');
                return;
            }
    
            console.log(`💾 Saving ${properties.length} properties for user: ${userId}`);
    
            const propertiesRef = adminDb.collection('users').doc(userId).collection('properties');
    
            for (const property of properties) {
                await propertiesRef.add({
                    ...property,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
    
            console.log('🎯 Scraped properties successfully saved.');
        } catch (error) {
            console.error('❌ Error saving scraped properties:', error);
            throw new Error('Failed to save scraped properties.');
        }
    },

}

/**
 * ✅ Merges new and existing properties, preventing duplicates.
 */
function mergeProperties(existing, newResults) {
    const existingMap = new Map(existing.map((p) => [p.source_url, p]))

    newResults.forEach((property) => {
        if (!existingMap.has(property.source_url)) {
            existingMap.set(property.source_url, property)
        }
    })

    return Array.from(existingMap.values())
}
