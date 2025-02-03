import { openAiService } from '../services/openai.service.js'
import { dbService } from '../services/db.service.js'
import { adminAuth } from '../config/firebase-admin.config.js'
import { extractPropertyRequirements, formatRequirementsForConfirmation } from '../services/util.service.js'

export const chatbotController = {
    async chat(req, res) {
        try {
            console.log('🟢 Incoming chat request:', req.body);
    
            // ✅ Step 1: Authenticate the User
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                return res.json({
                    message: {
                        role: 'assistant',
                        content: 'Please log in to save your property search preferences.',
                    },
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
                    message: {
                        role: 'assistant',
                        content: 'Your session has expired. Please log in again.',
                    },
                    requiresAuth: true,
                });
            }
    
            // ✅ Step 3: Validate Messages
            const { messages } = req.body;
            if (!Array.isArray(messages) || messages.some((m) => !m?.content)) {
                return res.status(400).json({ error: 'Invalid messages format' });
            }
            console.log('📩 Messages received:', messages);
    
            // ✅ Step 4: Get Response from OpenAI
            const response = await openAiService.chatWithAI(messages);
            console.log('🤖 OpenAI Response:', response);
    
            // ✅ Step 5: Check If User Confirmed Search
            if (response.content.includes("start property search")) {
                console.log("🚀 User confirmed search! Saving details...");
                
                // Retrieve last stored search parameters
                let latestChat = await dbService.getOrCreateChat(userId);
                
                // Save the confirmed search
                await dbService.confirmSearch(userId, latestChat.chatId, response.propertyRequirements);
    
                return res.json({
                    message: { role: "assistant", content: "Great! I'm starting the search now." },
                    startSearch: true,
                    confirmedRequirements: response.propertyRequirements
                });
            }
    
            // ✅ Step 6: Save Conversation History
            let latestChat = await dbService.getOrCreateChat(userId);
            await dbService.saveChatMessage(userId, latestChat.chatId, {
                role: 'user',
                content: messages[messages.length - 1].content
            });
    
            // ✅ Step 7: Return AI Response to User
            return res.json({
                message: response,
                requiresUserConfirmation: response.requiresUserConfirmation || false
            });
        } catch (error) {
            console.error('Chat Error:', error);
            res.status(500).json({ error: 'Failed to process chat request', details: error.message });
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
            const { userId, chatId, propertyRequirements } = req.body

            if (!userId || !chatId || !propertyRequirements) {
                return res.status(400).json({ error: 'Missing required fields.' })
            }

            console.log('💾 Saving confirmed search parameters:', propertyRequirements)

            await dbService.add(`users/${userId}/chats/${chatId}/parameters`, {
                ...propertyRequirements,
                timestamp: new Date(),
            })

            res.json({ success: true, message: 'Search parameters saved successfully.' })
        } catch (error) {
            console.error('❌ Error confirming search:', error)
            res.status(500).json({ error: 'Failed to confirm search.' })
        }
    },
}
