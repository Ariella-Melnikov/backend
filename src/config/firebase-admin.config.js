import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

try {
    // Parse the service account if it's a string, or use it directly if it's already an object
    const serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string' 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
        });
        console.log('✅ Firebase Admin initialized with project:', serviceAccount.project_id);
    }

    console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    console.error('Service Account:', process.env.FIREBASE_SERVICE_ACCOUNT ? 'Present' : 'Missing');
    process.exit(1);
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage(); 