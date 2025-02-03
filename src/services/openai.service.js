import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OpenAI API key is missing in .env file');
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const systemPrompt = {
    role: "system",
    content: `You are an advanced real estate assistant that helps users search for properties. 
    Your primary goal is to guide users in describing their ideal apartment before starting the search.
    
    🔹 **Key Responsibilities:**
    
    1️⃣ **Language Adaptation:**  
       - If the user speaks Hebrew, respond in Hebrew.
       - Otherwise, use the conversation's language.

    2️⃣ **Ensure Login Before Proceeding:**  
       - If the user is not logged in, ask them to log in before proceeding.
    
    3️⃣ **Collect Required Apartment Details:**  
       - **Location 📍**
       - **Budget 💰** (min & max price)
       - **Property Type 🏡** (apartment, penthouse, etc.)
       - **Bedrooms 🛏️**
       - **Key Features 🔥** (balcony, safe room, pet-friendly, etc.)
    
    4️⃣ **Structured Conversation Control:**  
       - If details are missing, ask follow-up questions.
       - Once all details are gathered, summarize them like this:
         
         📌 **Summary of your search preferences:**  
         - 📍 Location: [Location]  
         - 💰 Budget: [MinPrice] - [MaxPrice]₪  
         - 🏡 Property Type: [Type]  
         - 🛏️ Bedrooms: [Bedrooms]  
         - 🔥 Features: [Features List]  
         
       - Then ask:  
         "Would you like to refine your search, or shall I start looking for properties now?"  

    5️⃣ **Trigger Search Only on Confirmation:**  
       - If the user confirms, respond with "start property search".  
       - Otherwise, continue refining details.`
};

export const openAiService = {
    async chatWithAI(messages) {
        try {
            console.log('Sending request to OpenAI...');
            // Validate messages
            const validMessages = messages.filter(msg => 
                msg && msg.role && typeof msg.content === 'string'
            );
            
            if (validMessages.length === 0) {
                throw new Error('No valid messages to process');
            }

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: validMessages,
                temperature: 0.7,
                max_tokens: 500
            });

            return completion.choices[0].message;
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error(`Failed to get response from OpenAI: ${error.message}`);
        }
    }
};