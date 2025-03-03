import State from './state.js';
import scraperService from '../services/scraper.service.js';

class ScrapeListingsState extends State {
    async handle(context) {
        const { listingUrls } = context;

        try {
            console.log('🔄 Starting property scraping...');
            
            // Pass the listing URLs to scraper
            const properties = await scraperService.scrapeProperties(listingUrls);

            if (properties.length === 0) {
                console.log('⚠️ No valid properties scraped.');
                return context.res.json({ error: "No properties extracted." });
            }

            // Store scraped properties in context
            context.scrapedProperties = properties;
            context.transitionTo(context.savePropertiesState);
            return context.handle();
        } catch (error) {
            console.error('❌ Scraping error:', error);
            return context.res.status(500).json({ error: 'Failed to scrape property listings.' });
        }
    }
}

export default ScrapeListingsState;
