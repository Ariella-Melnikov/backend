import OpenAI from 'openai'
import dotenv from 'dotenv'
import { extractPropertyRequirements } from './util.service.js'

dotenv.config()

if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OpenAI API key is missing in .env file')
    process.exit(1)
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

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
            
         2. Then ask: "Are these details correct? Click 'Start Search' to find matching properties, or let me know if you'd like to make any changes."
       
       - If the user wants changes, update the relevant details and show the summary again
       
    4️⃣ **Important:**
       - Only show the summary when you have ALL required details
       - Always maintain a helpful and patient tone
       - If details are unclear, ask for clarification`,
}

export const openAiService = {
    async chatWithAI(messages) {
        try {
            console.log('Sending request to OpenAI...')

            const messagesWithSystem = [
                systemPrompt,
                ...messages.filter((msg) => msg && msg.role && typeof msg.content === 'string'),
            ]

            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: messagesWithSystem,
                temperature: 0.7,
                max_tokens: 500,
                response_format: { type: "text" }
            })

            const responseMessage = completion.choices[0].message.content
            console.log('🤖 OpenAI Response:', responseMessage)

            // 🔍 Detect if response includes a summary
            const summaryRegex =
                /📌 \*\*(?:Summary of your search preferences|סיכום העדפות החיפוש שלך|סיכום של קריטריוני החיפוש שלך):\*\*/i
            const hasSummary = summaryRegex.test(responseMessage) // ✅ FIXED HERE

            let propertyRequirements = null

            if (hasSummary) {
                console.log('🔍 Extracting search parameters...')
                propertyRequirements = extractPropertyRequirements(messages, responseMessage)
            }

            return {
                message: {
                    role: 'assistant',
                    content: responseMessage,
                },
                searchPreferences: propertyRequirements,
                requiresUserConfirmation: hasSummary, // Only show confirmation button if summary exists
            }
        } catch (error) {
            console.error('OpenAI API Error:', error)
            throw new Error(`Failed to get response from OpenAI: ${error.message}`)
        }
    },
}
