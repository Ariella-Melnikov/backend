import express from 'express';
import { chatbotController } from '../controllers/chatbot.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const chatbotRouter = express.Router();

// Handle chat interaction
chatbotRouter.post('/', chatbotController.chat);

// Get chat history
chatbotRouter.get('/history', authenticateUser, chatbotController.getChatHistory);

export { chatbotRouter };