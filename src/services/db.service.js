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
            console.log('📝 Adding document to path:', collectionName)
            console.log('📄 Document data:', data)

            const collectionRef = adminDb.collection(collectionName)
            const docRef = await collectionRef.add({
                ...data,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            })

            console.log('✅ Document added successfully:', docRef.id)
            return { id: docRef.id, ...data }
        } catch (err) {
            console.error('❌ Failed to add document:', err)
            throw err
        }
    },

    async query(collectionName, filterBy = {}) {
        try {
            console.log('🔍 Querying collection:', collectionName)
            let query = adminDb.collection(collectionName)

            // Add filters if they exist
            Object.keys(filterBy).forEach((key) => {
                if (filterBy[key]) {
                    query = query.where(key, '==', filterBy[key])
                }
            })

            const snapshot = await query.get()
            console.log('📊 Query results count:', snapshot.size)
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
            console.log(`💾 Saving chat message for user: ${userId}, chat: ${chatId}`)
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
            console.log('✅ Message saved successfully')
        } catch (error) {
            console.error('❌ Error saving chat message:', error)
            throw new Error('Failed to save chat message')
        }
    },
    async saveOrUpdateProperties(userId, chatId, properties) {
        try {
          console.log('📦 Checking if properties exist for chat:', chatId);
      
          const propertiesRef = adminDb
            .collection('users')
            .doc(userId)
            .collection('chats')
            .doc(chatId)
            .collection('properties');
      
          const existingPropertiesSnapshot = await propertiesRef.get();
      
          if (!existingPropertiesSnapshot.empty) {
            console.log('🔄 Properties already exist. Updating them...');
      
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
            console.log('🆕 No properties exist. Creating new property documents...');
            
            // Add new properties
            for (const property of properties) {
              await propertiesRef.add({
                ...property,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          }
      
          console.log('✅ Properties successfully saved/updated for chat:', chatId);
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
            console.log('📦 Saving confirmed search parameters:', propertyRequirements);

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

            console.log('✅ Search parameters successfully saved!');
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
            console.log(`🔎 Checking for existing chat for user: ${userId}`)

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
                    console.log('🆕 Starting a new session: Deleting old messages.')
                    await latestChatDoc.ref.update({
                        messages: [],
                        updatedAt: timestamp,
                    })

                    isNewSession = true
                }

                console.log('✅ Found existing chat:', latestChatDoc.id)
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

            console.log('🆕 Created new chat:', newChatRef.id)
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

    async saveOrUpdateUserSearch(userId, searchParams, newProperties) {
        try {
            const userRef = admin.firestore().collection('users').doc(userId)
            const searchRef = userRef.collection('searches').doc('latest')

            const doc = await searchRef.get()
            let updatedProperties = newProperties

            if (doc.exists) {
                const existingData = doc.data()
                console.log('🔄 Existing search found, merging properties...')

                // 🛠 Merge properties (prevent duplicates)
                updatedProperties = mergeProperties(existingData.properties, newProperties)

                // ✅ Update existing search
                await searchRef.update({
                    searchParams,
                    properties: updatedProperties,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                })

                console.log('✅ Search updated for user:', userId)
            } else {
                console.log('🆕 No existing search, creating a new one...')

                // 🆕 Create a new search document
                await searchRef.set({
                    searchParams,
                    properties: updatedProperties,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                })

                console.log('✅ New search saved for user:', userId)
            }

            return searchRef.id // Return the document ID
        } catch (error) {
            console.error('❌ Failed to save or update search:', error)
            throw new Error('Database error while saving user search.')
        }
    },

    async saveScrapedProperties(userId, properties) {
        try {
            console.log('💾 Saving scraped properties under user:', userId);
    
            const propertiesRef = adminDb.collection('users').doc(userId).collection('properties');
    
            for (const property of properties) {
                // Create a new document for every new property (always added)
                const newDoc = await propertiesRef.add({
                    ...property,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(), // Mark when added
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
    
                console.log('✅ Added new property:', newDoc.id);
            }
    
            console.log('🎯 Scraped properties successfully saved and will appear first.');
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
