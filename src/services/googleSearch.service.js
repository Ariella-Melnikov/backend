import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_CSE_ID;

export const googleSearchService = {
    async fetchListingUrls(searchParams) {
        try {
            // 🔍 Build query string dynamically
            const query = [
                searchParams.location?.hebrew || searchParams.location?.english,
                searchParams.propertyType?.hebrew || searchParams.propertyType?.english,
                searchParams.rooms ? `${searchParams.rooms} חדרים` : '',
                searchParams.has_parking ? 'חניה' : '',
                searchParams.has_saferoom ? 'ממ"ד' : '',
                searchParams.allows_pets ? 'ידידותי לחיות מחמד' : '',
                searchParams.is_furnished ? 'מרוהטת' : ''
            ]
                .filter(Boolean)
                .join(' ');

            console.log('🔍 Google Search Query:', query);

            const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}`
                + `&key=${GOOGLE_API_KEY}`
                + `&cx=${SEARCH_ENGINE_ID}`
                + `&num=5` // Limit to 5 results
                + `&lr=lang_iw` // Ensure Hebrew language results
                + `&gl=il` // Prefer Israeli listings
                + `&siteSearch=yad2.co.il`
                + `&orTerms=madlan.co.il homeless.co.il`; // Include multiple sites

            console.log('🌐 API URL:', url);

            const response = await fetch(url);
            const data = await response.json();

            if (!data.items) {
                console.log('⚠️ No listings found.');
                return [];
            }

            // ✅ Extract URLs from results
            const urls = data.items.map((item) => ({
                title: item.title,
                link: item.link,
                snippet: item.snippet,
            }));

            console.log('🔗 Found Listings:', urls);
            return urls.map((item) => item.link);

        } catch (error) {
            console.error('❌ Google Search API Error:', error);
            return [];
        }
    }
};