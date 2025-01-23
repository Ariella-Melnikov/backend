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
    process.exit(1);
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore(); 