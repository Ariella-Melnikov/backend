import { adminAuth, adminDb, adminStorage } from '../config/firebase-admin.config.js';

import admin from 'firebase-admin';

const FIREBASE_AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`;

export const authService = {
  // Login user
  async loginUser(email, password) {
    try {
      const response = await fetch(FIREBASE_AUTH_URL,{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || 'Invalid credentials');
      }

      // Get user data from Firestore
      const userDoc = await adminDb.collection('users').doc(result.localId).get();
      const userData = userDoc.data() || {};

      // Update last login
      await adminDb.collection('users').doc(result.localId).update({
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        token: result.idToken,
        user: {
          id: result.localId,
          email: result.email,
          username: userData.displayName || '',
          photoURL: userData.photoURL || '',
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Authentication failed');
    }
  },

  // Register user
  async registerUser(email, password, username, photo) {
    try {
      // Use Firebase REST API to create user
      const response = await fetch(FIREBASE_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || 'Registration failed');
      }

      // Upload photo if provided
      let photoURL = '';
      if (photo) {
        const bucket = adminStorage.bucket();
        const filePath = `user_photos/${result.localId}`;
        await bucket.file(filePath).save(photo.buffer);
        photoURL = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      }

      // Save user data to Firestore
      await adminDb.collection('users').doc(result.localId).set({
        uid: result.localId,
        email: result.email,
        displayName: username,
        photoURL,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        token: result.idToken,
        user: {
          id: result.localId,
          email: result.email,
          username,
          photoURL,
        },
      };
    } catch (error) {
      console.error('Registration error:', error.message);
      throw new Error('Registration failed');
    }
  },
  
  // Validate token
  async validateToken(token) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      throw new Error('User data not found');
    }

      const userData = userDoc.data();
      return {
        id: decodedToken.uid,
        email: decodedToken.email,
        username: userData.displayName || '',
        photoURL: userData.photoURL || '',
      };
    } catch (error) {
      console.error('Token validation error:', error.message);
      throw new Error('Invalid token');
    }
  },
};
