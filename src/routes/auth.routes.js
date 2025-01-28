import express from 'express';
import { login, register, validateToken } from '../controllers/auth.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js'; 
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const authRouter = express.Router();

// Routes
authRouter.post('/login', login); // Login
authRouter.post('/register', upload.single('photo'), register); // Register
authRouter.get('/validate', validateToken); // Validate token
authRouter.get('/protected', authenticateUser, (req, res) => {
  res.json({ message: 'Access granted', user: req.user });
});

export { authRouter };