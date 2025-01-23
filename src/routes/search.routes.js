import express from 'express';
import { searchProperties, saveSearch, getSavedSearches } from '../controllers/search.js';
import { validateSearchParams } from '../middleware/validation.js';
import { authenticateUser } from '../middleware/auth.js';

export const searchRouter = express.Router();

searchRouter.post('/', validateSearchParams, searchProperties);
searchRouter.post('/save', authenticateUser, saveSearch);
searchRouter.get('/saved', authenticateUser, getSavedSearches);