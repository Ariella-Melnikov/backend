import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_CSE_ID;

async function testGoogleSearch() {
  try {
    const searchParams = {
      location: { hebrew: 'תל אביב' },
      propertyType: { hebrew: 'דירה' },
      priceRange: { min: 4000, max: 10000 },
      rooms: 3,
      has_parking: true,
      allows_pets: true,
    };

    // 🟡 Build Hebrew search query (optimized)
    const query = `${searchParams.location.hebrew} `
  + `${searchParams.propertyType.hebrew} `
  + `${searchParams.rooms ? searchParams.rooms + ' חדרים' : ''} `
  + `${searchParams.has_parking ? 'חניה' : ''} `
  + `${searchParams.allows_pets ? 'ידידותי לחיות מחמד' : ''} `
  + `"דירה להשכרה" `
  + `(site:yad2.co.il OR site:madlan.co.il OR site:homeless.co.il)`;

console.log('🔍 Google Search Query (Hebrew):', query);

const url = `https://www.googleapis.com/customsearch/v1`
  + `?q=${encodeURIComponent(query)}`
  + `&key=${GOOGLE_API_KEY}`
  + `&cx=${SEARCH_ENGINE_ID}`
  + `&num=5`
  + `&gl=il`
  + `&hl=iw`
  + `&lr=lang_iw`
  + `&safe=off`;

console.log('🌐 API URL:', url);

    // 🚀 Make API Call
    const response = await fetch(url);
    const data = await response.json();

    // 🛑 Print Full Response for Debugging
    console.log('📝 Full API Response:', JSON.stringify(data, null, 2));

    // 🚨 Handle Errors
    if (data.error) {
      console.error('❌ Google API Error:', data.error);
      return;
    }

    // 🚨 Handle No Results
    if (!data.items || data.items.length === 0) {
      console.warn('⚠️ No results found. Possible CSE configuration issue.');
      return;
    }

    // ✅ Print Top Results
    console.log('✅ Top Results (Hebrew):');
    data.items.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`);
      console.log(`   URL: ${item.link}`);
      console.log(`   Snippet: ${item.snippet}`);
      console.log('---------------------');
    });

  } catch (error) {
    console.error('❌ Error fetching Google Search results:', error);
  }
}

// 🚀 Run the Test
testGoogleSearch();

