import express from 'express';
import { adminAuth } from '../config/firebase-admin.config.js';
import { db } from '../config/firebase-admin.config.js';

const authRouter = express.Router();

// Login route
authRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            console.log('Missing credentials:', { email: !!email, password: !!password });
            return res.status(400).json({ 
                message: 'Email and password are required' 
            });
        }

        console.log('Attempting login for email:', email);
        
        // Get user record
        const userRecord = await adminAuth.getUserByEmail(email);
        
        // Update last login time in Firestore
        await db.collection('users').doc(userRecord.uid).update({
            lastLogin: new Date()
        });

        // Create a custom token
        const customToken = await adminAuth.createCustomToken(userRecord.uid);
        
        // Get user data from Firestore
        const userData = await db.collection('users').doc(userRecord.uid).get();
        
        console.log('Login successful for user:', userRecord.uid);
        
        res.json({
            token: customToken,
            user: {
                ...userData.data(),
                email: userRecord.email,
                uid: userRecord.uid
            }
        });
    } catch (error) {
        console.error('Login error details:', {
            code: error.code,
            message: error.message,
            body: req.body
        });
        
        return res.status(400).json({ 
            message: 'Invalid credentials',
            details: error.message 
        });
    }
});

// Register route
authRouter.post('/register', async (req, res) => {
    try {
        const { email, password, name, photoURL } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Email and password are required' 
            });
        }

        // Create user with Firebase Auth
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
            photoURL: photoURL || null,
            emailVerified: false
        });

        // Save additional user info to Firestore
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: name,
            photoURL: photoURL || null,
            createdAt: new Date(),
            lastLogin: new Date()
        });

        // Create a custom token
        const customToken = await adminAuth.createCustomToken(userRecord.uid);
        
        console.log('User registered successfully:', userRecord.uid);

        res.json({
            token: customToken,
            user: {
                email: userRecord.email,
                uid: userRecord.uid,
                displayName: name,
                photoURL: photoURL || null
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ 
            message: 'Registration failed',
            details: error.message 
        });
    }
});

// Verify token middleware
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decodedToken = await adminAuth.verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Test route to verify authentication
authRouter.get('/verify', verifyToken, (req, res) => {
    res.json({ message: 'Authenticated', user: req.user });
});

// Add this before your routes
authRouter.use((req, res, next) => {
  console.log(`Auth Route accessed: ${req.method} ${req.path}`);
  console.log('Request body:', req.body);
  next();
});

authRouter.post('/logout', async (req, res) => {
  try {
    // Verify the token
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      throw new Error('No token provided');
    }
    
    await adminAuth.verifyIdToken(token);
    // Token is valid, send success response
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Add a route to update user profile
authRouter.put('/profile', verifyToken, async (req, res) => {
    try {
        const { displayName, photoURL } = req.body;
        const uid = req.user.uid;

        // Update Auth profile
        const updateAuthData = {};
        if (displayName) updateAuthData.displayName = displayName;
        if (photoURL) updateAuthData.photoURL = photoURL;
        
        await adminAuth.updateUser(uid, updateAuthData);

        // Update Firestore profile
        const updateData = {
            ...updateAuthData,
            updatedAt: new Date()
        };
        
        await db.collection('users').doc(uid).update(updateData);

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(400).json({ 
            message: 'Failed to update profile',
            details: error.message 
        });
    }
});

export { authRouter as authRoutes }; 