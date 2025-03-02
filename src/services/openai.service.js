import OpenAI from 'openai';
import dotenv from 'dotenv';
import util from 'util';

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

    const searchParamsMatch = responseMessage.match(/<search_params>(.*?)<\/search_params>/s);
    if (searchParamsMatch) {
        try {
            const searchParamsJson = searchParamsMatch[1].trim();
            const parameters = JSON.parse(searchParamsJson);
            
            const formattedParams = {
                location: {
                    hebrew: parameters.location,
                    english: ''
                },
                priceRange: {
                    min: 0,
                    max: parameters.maxPrice
                },
                propertyType: {
                    hebrew: parameters.propertyType,
                    english: ''
                },
                rooms: parseInt(parameters.bedrooms),
                features: Array.isArray(parameters.features) 
                    ? parameters.features.map(feature => ({
                        hebrew: feature.trim(), 
                        english: ''
                    })) 
                    : []  // Ensure it's always an array
            };

            console.log('🏠 Formatted search parameters:', JSON.stringify(formattedParams, null, 2));

            return {
                hasParameters: true,
                parameters: formattedParams,
                requiresUserConfirmation: true
            };
        } catch (error) {
            console.error('Error parsing search parameters:', error);
            return {
                hasParameters: false,
                parameters: null,
                requiresUserConfirmation: false
            };
        }
    } else {
        console.log('⚠️ No search parameters found in response');
        return {
            hasParameters: false,
            parameters: null,
            requiresUserConfirmation: false
        };
    }
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
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful assistant for apartment searching. 
                          When you identify search parameters, include them in XML-like tags 
                          <search_params>{json}</search_params> but show the user only a clean 
                          Hebrew summary without the technical details.`
                    },
                    ...messagesWithSystem
                ],
                temperature: 0.7,
            });

            const response = completion.choices[0].message.content;
            // Extract search params but clean the message for user
            const cleanMessage = response.replace(/<search_params>.*?<\/search_params>/s, '').trim();
            
            const searchParamsResult = extractSearchParams(response);

            return {
                message: { 
                    role: 'assistant', 
                    content: cleanMessage 
                },
                searchPreferences: searchParamsResult.parameters,
                requiresUserConfirmation: searchParamsResult.requiresUserConfirmation
            };
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw error;
        }
    },
};