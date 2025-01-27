import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

try {
    // Parse the service account JSON from environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    console.error('Make sure FIREBASE_SERVICE_ACCOUNT is properly set in .env');
    process.exit(1);
}

// Export both auth and Firestore db instances
export const adminAuth = admin.auth();
export const db = admin.firestore(); 