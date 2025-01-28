import { authService } from '../services/auth.service.js';

// Login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const response = await authService.loginUser(email, password);
    res.json(response);
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// Register controller
export const register = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const photo = req.file;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const response = await authService.registerUser(email, password, username, photo);
    res.json(response);
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// Validate token controller
export const validateToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const user = await authService.validateToken(token);
    res.json({ user });
  } catch (error) {
    console.error('Token validation error:', error.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};
