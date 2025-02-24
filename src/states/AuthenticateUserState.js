import State from './state.js';
import { adminAuth } from '../config/firebase-admin.config.js';

class AuthenticateUserState extends State {
    async handle(context) {
        const authHeader = context.req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            return context.res.json({
                message: { role: 'assistant', content: 'Please log in to save your property search preferences.' },
                requiresAuth: true,
            });
        }

        const token = authHeader.split('Bearer ')[1];

        try {
            const decodedToken = await adminAuth.verifyIdToken(token);
            context.userId = decodedToken.uid;
            console.log('✅ User authenticated:', context.userId);
            context.transitionTo(context.validateMessageState);
            return context.handle();
        } catch (error) {
            return context.res.json({
                message: { role: 'assistant', content: 'Your session has expired. Please log in again.' },
                requiresAuth: true,
            });
        }
    }
}

export default AuthenticateUserState;
