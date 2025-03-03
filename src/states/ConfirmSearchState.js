import State from './state.js';

class ConfirmSearchState extends State {
    async handle(context) {
        const { dbService } = context.services;
        const { userId, chatId, searchPreferences } = context;

        if (!userId || !chatId) {
            console.error('❌ Missing userId or chatId in ConfirmSearchState');
            return context.res.status(400).json({ error: 'Missing required user information' });
        }

        if (!searchPreferences || Object.keys(searchPreferences).length === 0) {
            console.error('❌ Invalid or empty search preferences in ConfirmSearchState');
            return context.res.status(400).json({ error: 'Invalid search preferences' });
        }

        try {
            console.log('📝 Saving search parameters to Firestore:', JSON.stringify(searchPreferences, null, 2));

            // ✅ Save search preferences before proceeding
            await dbService.confirmSearch(userId, chatId, searchPreferences);

            console.log('✅ Search parameters saved. Transitioning to GoogleSearchState...');
            context.transitionTo(context.googleSearchState);
            return context.handle(); // ✅ Continue to next step
        } catch (error) {
            console.error('❌ Error in ConfirmSearchState:', error);
            return context.res.status(500).json({ error: 'Failed to confirm search' });
        }
    }
}

export default ConfirmSearchState;