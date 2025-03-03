import State from './state.js';

class SavePropertiesState extends State {
    async handle(context) {
        const { dbService } = context.services;
        const { userId, scrapedProperties } = context;

        try {
            console.log('💾 Saving scraped properties...');

            // 🛠 Validate userId before proceeding
            if (!userId) {
                console.error('❌ Error: Missing userId when saving properties.');
                return context.res.status(400).json({ error: 'Missing userId.' });
            }

            if (!scrapedProperties || scrapedProperties.length === 0) {
                console.error('⚠️ No properties to save.');
                return context.res.status(400).json({ error: 'No properties extracted to save.' });
            }

            // 🔥 Fix: Ensure properties are saved under the correct user
            await dbService.saveScrapedProperties(userId, scrapedProperties);

            return context.res.json({ 
                success: true, 
                properties: scrapedProperties,
                message: 'Properties saved successfully'
            });
        } catch (error) {
            console.error('❌ Error saving properties:', error);
            return context.res.status(500).json({ error: 'Failed to save properties' });
        }
    }
}

export default SavePropertiesState;