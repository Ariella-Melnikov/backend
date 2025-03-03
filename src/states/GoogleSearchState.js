import State from './state.js';

class GoogleSearchState extends State {
    async handle(context) {
        const { googleSearchService } = context.services;
        const { searchPreferences } = context;

        try {
            console.log('🌍 Searching for property listings via Google...');

            if (!searchPreferences) {
                console.error('❌ Error: No search preferences provided.');
                return context.res.status(400).json({ error: 'No search preferences found.' });
            }

            // Fetch property listing URLs
            const listingUrls = await googleSearchService.fetchListingUrls(searchPreferences);

            if (!listingUrls || listingUrls.length === 0) {
                console.log('⚠️ No listings found.');
                return context.res.json({ error: "No properties found." });
            }

            // Store URLs in context and move to scraping state
            context.listingUrls = listingUrls;
            context.transitionTo(context.scrapeListingsState);
            return context.handle();
        } catch (error) {
            console.error('❌ Error in Google search:', error);
            return context.res.status(500).json({ error: 'Failed to perform Google search.' });
        }
    }
}

export default GoogleSearchState;