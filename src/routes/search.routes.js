import express from 'express';
import { searchProperties, saveSearch, getSavedSearches } from '../controllers/search.controller.js';
import { validateSearchParams } from '../middleware/validation.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

export const searchRouter = express.Router();

searchRouter.post('/', validateSearchParams, searchProperties);
searchRouter.post('/save', authenticateUser, saveSearch);
searchRouter.get('/saved', authenticateUser, getSavedSearches);