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
    content: `You are a real estate assistant. Your tasks are:

    1. If the user is not logged in:
       - Politely ask them to log in or create an account
       - Explain that this helps save their preferences and search history
       - Do not proceed with property questions until they're logged in

    2. For logged-in users:
       - Ask about their location preferences
       - Get their budget range
       - Understand their property requirements (bedrooms, type, features)
       - Clarify any ambiguous information

    Be conversational and helpful while ensuring all necessary information is gathered.`
};

export const openAiService = {
    async chatWithAI(messages) {
        try {
            console.log('Sending request to OpenAI...');
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    systemPrompt,
                    ...messages
                ],
                temperature: 0.7,
                max_tokens: 500
            });

            return completion.choices[0].message;
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error('Failed to get response from OpenAI: ' + error.message);
        }
    }
};