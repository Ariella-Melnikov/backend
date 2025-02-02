import { openAiService } from '../services/openai.service.js';
import { dbService } from '../services/db.service.js';
import { adminAuth } from '../config/firebase-admin.config.js';
import { extractPropertyRequirements } from '../services/util.service.js';

export const chatbotController = {
    async chat(req, res) {
        try {
            // Check for authentication token
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                return res.json({
                    message: {
                        role: 'assistant',
                        content: "Please log in first to use the chatbot and save your property search preferences. Would you like to sign in or create an account?"
                    },
                    requiresAuth: true
                });
            }

            // Verify the token
            const token = authHeader.split('Bearer ')[1];
            let userId;
            try {
                const decodedToken = await adminAuth.verifyIdToken(token);
                userId = decodedToken.uid;
            } catch (error) {
                return res.json({
                    message: {
                        role: 'assistant',
                        content: "Your session has expired. Please log in again to continue our conversation."
                    },
                    requiresAuth: true
                });
            }

            const { messages } = req.body;
            if (!Array.isArray(messages) || messages.some(m => !m?.content)) {
                return res.status(400).json({ 
                    error: 'Invalid messages format',
                    details: 'Each message must have content'
                });
            }

            // Process user chat request
            const response = await openAiService.chatWithAI(messages);

            // Extract property requirements from the conversation
            const propertyRequirements = extractPropertyRequirements(messages);

            // Check if a chat already exists, otherwise create a new one
            let latestChat = await dbService.getLatestChat(userId);
            if (!latestChat) {
                latestChat = await dbService.createNewChat(userId, propertyRequirements);
            }

            // Save chat history & property requirements in Firestore
            await dbService.add(`users/${userId}/chats/${latestChat.chatId}/parameters`, {
                ...propertyRequirements,
                timestamp: new Date()
            });

            res.json({
                message: response,
                propertyRequirements,
                isAuthenticated: true
            });

        } catch (error) {
            console.error('Chat Error:', error);
            res.status(500).json({ 
                error: 'Failed to process chat request',
                details: error.message 
            });
        }
    },

    async getChatHistory(req, res) {
        try {
            const userId = req.user?.uid;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const history = await dbService.query(`users/${userId}/chats`);
            res.json(history);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch chat history' });
        }
    }
};