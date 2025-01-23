import express from 'express';
import { chatbotController } from '../controllers/chatbot.controller.js';
import { authenticateUser } from '../middleware/auth.js';

export const chatbotRouter = express.Router();

chatbotRouter.post('/', chatbotController.chat);
chatbotRouter.get('/history', authenticateUser, chatbotController.getChatHistory);