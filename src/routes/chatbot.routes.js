import express from 'express';
import { chatbotController } from '../controllers/chatbot.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const chatbotRouter = express.Router();

// Handle chat interaction
chatbotRouter.post('/', chatbotController.chat);

// Get chat history
chatbotRouter.get('/history', authenticateUser, chatbotController.getChatHistory);

chatbotRouter.get('/get-chat-id', authenticateUser, chatbotController.getChatId);

chatbotRouter.post('/save-properties', authenticateUser, chatbotController.saveProperties);

chatbotRouter.post('/confirm-search', authenticateUser, chatbotController.confirmSearch);


export { chatbotRouter };