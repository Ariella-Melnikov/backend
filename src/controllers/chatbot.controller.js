import { openAiService } from '../services/openai.service.js';
import { dbService } from '../services/db.service.js';

export const chatbotController = {
    async chat(req, res) {
        try {
            const { messages } = req.body;
            
            // Validate input
            if (!Array.isArray(messages)) {
                return res.status(400).json({ error: 'Messages must be an array' });
            }

            console.log('Processing chat request:', messages);
            const response = await openAiService.chatWithAI(messages);
            console.log('Got response from OpenAI:', response);

            // Save chat history if user is authenticated
            if (req.user?.uid) {
                await dbService.add('chat_history', {
                    userId: req.user.uid,
                    message: messages[messages.length - 1],
                    response: response,
                    timestamp: new Date()
                });
            }

            res.json({
                message: response
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

            const history = await firebaseService.getChatHistory(userId);
            res.json(history);
        } catch (error) {
            console.error('Error fetching chat history:', error);
            res.status(500).json({ error: 'Failed to fetch chat history' });
        }
    }
};