import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OpenAI API key is missing in .env file');
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = {
    role: 'system',
    content: `You are an advanced real estate assistant that helps users search for properties. 
    Your goal is to **help users define their search criteria** before searching.  
⚠️ **You must NOT suggest a specific apartment** unless you are retrieving **real listings** from the database.  

    🔹 **Key Responsibilities:**
    
    1️⃣ **Language Adaptation:**  
       - If the user speaks Hebrew, respond in Hebrew.
       - Otherwise, use the conversation's language.

    2️⃣ **Ensure Login Before Proceeding:**  
       - If the user is not logged in, ask them to log in before proceeding.

    3️⃣ **Conversation Flow:**  
       - Ask for missing details if not provided
       - Keep track of what information you already have
       - Once ALL required details are collected (location, budget, type, bedrooms, features):
         1. Present a summary using EXACTLY this format:

    📌 **Summary of your search preferences:**
    - 📍 Location: [Location]
    - 💰 Maximum Budget: [MaxPrice]₪
    - 🏡 Property Type: [Type]
    - 🛏️ Bedrooms: [Bedrooms]
    - 🔥 Features: [Features List]

         2. SILENTLY add the following system tag (user will not see this):
            <search_params>
            {
                "location": "[Location]",
                "maxPrice": [MaxPrice],
                "propertyType": "[Type]",
                "bedrooms": [Bedrooms],
                "features": ["feature1", "feature2"]
            }
            </search_params>
            
         3. Then ask: "Are these details correct? Click 'Start Search' to find matching properties, or let me know if you'd like to make any changes."
       
       - If the user wants changes, update the relevant details and show the summary again
       
    4️⃣ **Important:**
       - Only show the summary when you have ALL required details
       - Always maintain a helpful and patient tone
       - If details are unclear, ask for clarification`,
};

/**
 * 🛠 Extracts structured search parameters from OpenAI's response.
 */
const extractSearchParams = (responseMessage) => {
    console.log('🔍 Raw response message:', responseMessage);

    // ✅ Updated regex to detect summaries properly
    const summaryRegex = /📌\s*\*\*(?:Summary of your search preferences|סיכום של העדפות החיפוש שלך):\*\*/i;
    const locationMatch = responseMessage.match(/📍\s*(?:Location|מיקום):\s*([^\n]+)/i);
    const priceMatch = responseMessage.match(/💰\s*(?:Maximum Budget|תקציב מרבי):\s*([\d,]+)/i);
    const typeMatch = responseMessage.match(/🏡\s*(?:Property Type|סוג נכס):\s*([^\n]+)/i);
    const bedroomsMatch = responseMessage.match(/🛏️\s*(?:Bedrooms|מספר חדרים):\s*([\d]+)/i);
    const featuresMatch = responseMessage.match(/🔥\s*(?:Features|תכונות):\s*([^\n]+)/i);

    if (summaryRegex.test(responseMessage)) {
        console.log('✅ Found summary section');
        
        if (locationMatch && priceMatch && typeMatch && bedroomsMatch && featuresMatch) {
            const propertyRequirements = {
                location: locationMatch[1].trim(),
                maxPrice: parseInt(priceMatch[1].replace(',', '')),  // Handle commas
                propertyType: typeMatch[1].trim(),
                bedrooms: parseInt(bedroomsMatch[1]),
                features: featuresMatch[1].split(/[,\s]ו/).map(f => f.trim())  // Handle Hebrew 'ו' (and)
            };

            console.log('✅ Extracted parameters:', propertyRequirements);
            return propertyRequirements;
        } else {
            console.log('⚠️ Could not extract all required fields from summary', {
                location: !!locationMatch,
                price: !!priceMatch,
                type: !!typeMatch,
                bedrooms: !!bedroomsMatch,
                features: !!featuresMatch
            });
        }
    } else {
        console.log('⚠️ No summary section found in response');
    }

    return null;
};

export const openAiService = {
    async chatWithAI(messages) {
        try {
            console.log('Sending request to OpenAI...');

            const messagesWithSystem = [
                systemPrompt,
                ...messages.filter((msg) => msg && msg.role && typeof msg.content === 'string'),
            ];

            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: messagesWithSystem,
                temperature: 0.7,
                max_tokens: 500,
            });

            const responseMessage = completion.choices[0].message.content;
            console.log('🤖 OpenAI Response:', responseMessage);

            // Extract search parameters if present
            const propertyRequirements = extractSearchParams(responseMessage);
            const hasSummary = !!propertyRequirements;

            console.log('🔍 Extracted search parameters:', {
                hasParameters: hasSummary,
                parameters: propertyRequirements
            });

            return {
                message: {
                    role: 'assistant',
                    content: responseMessage,
                },
                searchPreferences: propertyRequirements,
                requiresUserConfirmation: hasSummary,
            };
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error(`Failed to get response from OpenAI: ${error.message}`);
        }
    },
};