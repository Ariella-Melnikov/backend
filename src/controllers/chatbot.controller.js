import { openAiService } from '../services/openai.service.js'
import { dbService } from '../services/db.service.js'
import { adminAuth } from '../config/firebase-admin.config.js'
import { extractPropertyRequirements, formatRequirementsForConfirmation } from '../services/util.service.js'

export const chatbotController = {
    async chat(req, res) {
        try {
            console.log('🟢 Incoming chat request:', req.body)

            // ✅ Step 1: Authenticate the User
            const authHeader = req.headers.authorization
            if (!authHeader?.startsWith('Bearer ')) {
                return res.json({
                    message: {
                        role: 'assistant',
                        content: 'Please log in to save your property search preferences.',
                    },
                    requiresAuth: true,
                })
            }

            // ✅ Step 2: Verify Token
            const token = authHeader.split('Bearer ')[1]
            let userId
            try {
                const decodedToken = await adminAuth.verifyIdToken(token)
                userId = decodedToken.uid
                console.log('✅ User authenticated:', userId)
            } catch (error) {
                return res.json({
                    message: {
                        role: 'assistant',
                        content: 'Your session has expired. Please log in again.',
                    },
                    requiresAuth: true,
                })
            }

            // ✅ Step 3: Validate Messages
            const { messages } = req.body
            if (!Array.isArray(messages) || messages.some((m) => !m?.content)) {
                return res.status(400).json({ error: 'Invalid messages format' })
            }
            console.log('📩 Messages received:', messages)

            // ✅ Step 4: Get or Create a Chat
            const { chatId, isNewSession } = await dbService.getOrCreateChat(userId)

            // ✅ Step 5: Save User Message
            const userMessage = messages[messages.length - 1]
            await dbService.saveChatMessage(
                userId,
                chatId,
                { role: 'user', content: userMessage.content },
                isNewSession
            )

            // ✅ Step 6: Get Response from OpenAI
            const response = await openAiService.chatWithAI(messages)
            console.log('🤖 OpenAI Response:', response)

            // ✅ Step 7: Save Assistant Message
            await dbService.saveChatMessage(userId, chatId, { role: 'assistant', content: response.content }, false)

            // Check if the response contains a summary (indicating end of conversation)
            const hasSummary = response.content.includes('📌 **Summary of your search preferences:**')

            if (hasSummary) {
                // Only extract parameters if we have a summary
                const propertyRequirements = extractPropertyRequirements(messages, response.content)
                
                return res.json({
                    message: {
                        role: 'assistant',
                        content: response.content,
                    },
                    searchPreferences: propertyRequirements,
                    requiresUserConfirmation: true, // Show the confirmation button
                })
            }

            // Regular response without summary
            return res.json({
                message: {
                    role: 'assistant',
                    content: response.content,
                }
            })
        } catch (error) {
            console.error('❌ Chat Error:', error)
            res.status(500).json({ error: 'Failed to process chat request', details: error.message })
        }
    },

    async getChatHistory(req, res) {
        try {
            const userId = req.user?.uid
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' })
            }

            const history = await dbService.query(`users/${userId}/chats`)
            res.json(history)
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch chat history' })
        }
    },

    async confirmSearch(req, res) {
        try {
            const { userId, chatId, propertyRequirements } = req.body

            if (!userId || !chatId || !propertyRequirements) {
                return res.status(400).json({ error: 'Missing required fields.' })
            }

            console.log('💾 Saving confirmed search parameters:', propertyRequirements)

            await dbService.add(`users/${userId}/chats/${chatId}/parameters`, {
                ...propertyRequirements,
                timestamp: new Date(),
            })

            res.json({ success: true, message: 'Search parameters saved successfully.' })
        } catch (error) {
            console.error('❌ Error confirming search:', error)
            res.status(500).json({ error: 'Failed to confirm search.' })
        }
    },
}
