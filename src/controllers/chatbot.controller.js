import { openAiService } from '../services/openai.service.js'
import { dbService } from '../services/db.service.js'
import { adminAuth } from '../config/firebase-admin.config.js'
import { extractPropertyRequirements } from '../services/util.service.js'
import { adminDb } from '../config/firebase-admin.config.js'

export const chatbotController = {
    async chat(req, res) {
        try {
            console.log('🟢 Incoming chat request:', req.body);
    
            // ✅ Step 1: Authenticate the User
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                return res.json({
                    message: { role: 'assistant', content: 'Please log in to save your property search preferences.' },
                    requiresAuth: true,
                });
            }
    
            // ✅ Step 2: Verify Token
            const token = authHeader.split('Bearer ')[1];
            let userId;
            try {
                const decodedToken = await adminAuth.verifyIdToken(token);
                userId = decodedToken.uid;
                console.log('✅ User authenticated:', userId);
            } catch (error) {
                return res.json({
                    message: { role: 'assistant', content: 'Your session has expired. Please log in again.' },
                    requiresAuth: true,
                });
            }
    
            // ✅ Step 3: Validate Messages
            const { messages } = req.body;
            if (!Array.isArray(messages) || messages.some((m) => !m?.content)) {
                return res.status(400).json({ error: 'Invalid messages format' });
            }
            console.log('📩 Messages received:', messages);
    
            // ✅ Step 4: Get or Create a Chat
            const { chatId, isNewSession } = await dbService.getOrCreateChat(userId);
    
            // ✅ Step 5: Save User Message
            const userMessage = messages[messages.length - 1];
            await dbService.saveChatMessage(userId, chatId, { role: 'user', content: userMessage.content }, isNewSession);
    
            // ✅ Step 6: Get Response from OpenAI
            const response = await openAiService.chatWithAI(messages);
            console.log('🤖 OpenAI Response:', response);
    
            // ✅ Step 7: Save Assistant Message
            await dbService.saveChatMessage(userId, chatId, { role: 'assistant', content: response.message.content }, false);
    
            // ✅ Step 8: If summary exists, send it to frontend for confirmation
            if (response.requiresUserConfirmation) {
                console.log('✅ Sending confirmation request to frontend');
    
                return res.json({
                    message: response.message,
                    searchPreferences: response.searchPreferences,
                    requiresUserConfirmation: true, // Show the "Start Search" button
                });
            }
    
            return res.json({ message: response.message });
        } catch (error) {
            console.error('❌ Chat Error:', error);
            res.status(500).json({ error: 'Failed to process chat request', details: error.message });
        }
    },

    async getChatId(req, res) {
        try {
            const userId = req.query.userId; // ✅ Read from query parameters
            if (!userId) {
                return res.status(400).json({ error: 'Missing userId' });
            }
    
            console.log('🔎 Fetching chatId for user:', userId);
    
            // 🔥 Fetch chats from Firestore under `users/${userId}/chats`
            const userChatsRef = adminDb.collection(`users/${userId}/chats`);
            const chatsSnapshot = await userChatsRef.orderBy('timestamp', 'desc').limit(1).get(); // Get the latest chat
    
            if (chatsSnapshot.empty) {
                console.log('⚠️ No existing chat found for user, creating a new one.');
    
                // ✅ Create a new chat if none exist
                const newChatRef = await dbService.add(`users/${userId}/chats`, {
                    timestamp: new Date(),
                    messages: [],
                });
    
                return res.json({ chatId: newChatRef.id, isNewSession: true });
            }
    
            // ✅ Return the most recent chat ID
            const chatDoc = chatsSnapshot.docs[0];
            const chatId = chatDoc.id;
            
            console.log(`✅ Chat ID retrieved: ${chatId}`);
    
            return res.json({ chatId });
        } catch (error) {
            console.error('❌ Error fetching chatId:', error);
            res.status(500).json({ error: 'Failed to fetch chatId' });
        }
    },

    async getChatHistory(req, res) {
        try {
            const userId = req.user?.uid
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' })
            }

            const history = await dbService.query(`users/${userId}/chats`)
            res.json(history)
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch chat history' })
        }
    },

    async confirmSearch(req, res) {
        try {
            const { userId, chatId, propertyRequirements } = req.body;

            console.log('📝 Confirming search:', { userId, chatId, propertyRequirements });

            if (!userId || !chatId || !propertyRequirements) {
                return res.status(400).json({ error: 'Missing required fields.' });
            }

            // ✅ Save search parameters to Firestore BEFORE searching online
            const result = await dbService.confirmSearch(userId, chatId, propertyRequirements);
            console.log('✅ Search parameters saved:', result);

            res.json({ 
                success: true, 
                message: 'Search parameters saved successfully.',
                parametersId: result.id 
            });
        } catch (error) {
            console.error('❌ Error confirming search:', error);
            res.status(500).json({ error: 'Failed to confirm search.' });
        }
    },
    async saveProperties(req, res) {
        try {
          const { userId, chatId, properties } = req.body;
      
          if (!userId || !chatId || !properties) {
            return res.status(400).json({ error: 'Missing required fields.' });
          }
      
          console.log('💾 Saving properties for chat:', chatId);
      
          await dbService.saveOrUpdateProperties(userId, chatId, properties);
      
          return res.json({ success: true, message: 'Properties saved successfully.' });
        } catch (error) {
          console.error('❌ Error saving properties:', error);
          res.status(500).json({ error: 'Failed to save properties.' });
        }
      },
}
