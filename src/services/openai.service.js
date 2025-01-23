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

export const openAiService = {
    async chatWithAI(messages) {
        try {
            console.log('Sending request to OpenAI...');
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful real estate assistant. Help users find their ideal home by asking relevant questions about their preferences, budget, location, and requirements."
                    },
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