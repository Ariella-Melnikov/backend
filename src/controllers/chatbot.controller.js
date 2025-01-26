import { openAiService } from '../services/openai.service.js';
import { dbService } from '../services/db.service.js';
import { adminAuth } from '../config/firebase-admin.config.js';

export const chatbotController = {
    async chat(req, res) {
        try {
            // Check for authentication token
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                return res.json({
                    message: {
                        role: 'assistant',
                        content: "Please log in first to use the chatbot and save your property search preferences. Would you like to sign in or create an account?"
                    },
                    requiresAuth: true
                });
            }

            // Verify the token
            const token = authHeader.split('Bearer ')[1];
            let userId;
            try {
                const decodedToken = await adminAuth.verifyIdToken(token);
                userId = decodedToken.uid;
            } catch (error) {
                return res.json({
                    message: {
                        role: 'assistant',
                        content: "Your session has expired. Please log in again to continue our conversation."
                    },
                    requiresAuth: true
                });
            }

            const { messages } = req.body;
            
            // Validate input
            if (!Array.isArray(messages)) {
                return res.status(400).json({ error: 'Messages must be an array' });
            }

            console.log('Processing chat request for user:', userId);
            const response = await openAiService.chatWithAI(messages);

            // Extract property requirements from the conversation
            const propertyRequirements = extractPropertyRequirements(messages, response.content);

            // Save chat history and property requirements
            await dbService.add('chat_history', {
                userId,
                message: messages[messages.length - 1],
                response: response,
                propertyRequirements,
                timestamp: new Date()
            });

            // If we have enough property details, save them for scraping
            if (isValidForScraping(propertyRequirements)) {
                await dbService.add('scraping_queue', {
                    userId,
                    requirements: propertyRequirements,
                    status: 'pending',
                    created: new Date()
                });
            }

            res.json({
                message: response,
                propertyRequirements,
                isAuthenticated: true
            });

        } catch (error) {
            console.error('Chat Error:', error);
            res.status(500).json({ 
                error: 'Failed to process chat request',
                details: error.message 
            });
        }
    },

    async getChatHistory(req, res) {
        try {
            const userId = req.user?.uid;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const history = await dbService.query('chat_history', { userId });
            res.json(history);
        } catch (error) {
            console.error('Error fetching chat history:', error);
            res.status(500).json({ error: 'Failed to fetch chat history' });
        }
    }
};

// Helper function to extract property requirements from conversation
function extractPropertyRequirements(messages, latestResponse) {
    const requirements = {
        location: null,
        minPrice: null,
        maxPrice: null,
        bedrooms: null,
        bathrooms: null,
        propertyType: null, // apartment, house, etc.
        features: [], // balcony, parking, etc.
        area: null, // in square meters
        floor: null,
        lastUpdated: new Date()
    };

    // Combine all messages to analyze the entire conversation
    const fullConversation = [
        ...messages.map(m => m.content),
        latestResponse
    ].join(' ');

    // Extract location
    const locationMatch = fullConversation.match(/(?:in|at|near)\s+([A-Za-z\s,]+?)(?:\s+with|\s+for|\s+that|\.|$)/i);
    if (locationMatch) requirements.location = locationMatch[1].trim();

    // Extract price range
    const priceMatch = fullConversation.match(/(\d+(?:,\d{3})*)\s*(?:to|\-)\s*(\d+(?:,\d{3})*)/);
    if (priceMatch) {
        requirements.minPrice = parseInt(priceMatch[1].replace(/,/g, ''));
        requirements.maxPrice = parseInt(priceMatch[2].replace(/,/g, ''));
    }

    // Extract number of bedrooms
    const bedroomMatch = fullConversation.match(/(\d+)\s*(?:bedroom|bed|br)/i);
    if (bedroomMatch) requirements.bedrooms = parseInt(bedroomMatch[1]);

    // Extract property type
    const propertyTypes = ['apartment', 'house', 'condo', 'studio', 'penthouse'];
    for (const type of propertyTypes) {
        if (fullConversation.toLowerCase().includes(type)) {
            requirements.propertyType = type;
            break;
        }
    }

    // Extract features
    const features = ['parking', 'balcony', 'elevator', 'storage', 'air conditioning'];
    requirements.features = features.filter(feature => 
        fullConversation.toLowerCase().includes(feature)
    );

    return requirements;
}

// Helper function to check if we have enough information for scraping
function isValidForScraping(requirements) {
    // Minimum requirements for scraping
    return (
        requirements.location && 
        (requirements.minPrice || requirements.maxPrice) &&
        requirements.propertyType
    );
}